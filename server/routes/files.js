// server/routes/files.js
const { convertPdfToDocxUsingConvertApi, downloadFileTo } = require('../utils/convertWithConvertApi');
const { convertDocGeneric } = require('../utils/convertDoc');
const axios = require('axios');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileModel = require('../models/File');
const { v4: uuidv4 } = require('uuid');


const uploadDir = path.join(__dirname, '..', 'uploads');
const convertedDir = path.join(__dirname, '..', 'converted');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});
const upload = multer({ storage });

/* Upload route (multipart 'files' field) */
router.post('/upload', upload.array('files'), async (req, res) => {
    try {
        const saved = [];
        for (const f of req.files) {
            const doc = new FileModel({
                originalName: f.originalname,
                storedName: f.filename,
                size: f.size,
                inputFormat: path.extname(f.originalname).replace('.', '').toUpperCase(),
                outputFormat: (req.body.outputFormat || 'PDF').toUpperCase(),
                category: req.body.category || 'document',
                status: 'pending',
                progress: 0
            });
            await doc.save();
            saved.push(doc);
        }
        return res.json({ success: true, files: saved });
    } catch (err) {
        console.error('upload error', err);
        return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
    }
});

/* LIST all files — route your client polls */
router.get('/', async (req, res) => {
    try {
        const list = await FileModel.find().sort({ createdAt: -1 }).limit(200);
        res.json(list);
    } catch (err) {
        console.error('list error', err);
        res.status(500).json({ message: 'Cannot list files' });
    }
});

/* GET single file metadata */
router.get('/:id', async (req, res) => {
    try {
        const f = await FileModel.findById(req.params.id);
        if (!f) return res.status(404).json({ message: 'Not found' });
        res.json(f);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

/* Start conversion */
router.post('/:id/start', async (req, res) => {
    try {
        const id = req.params.id;
        const file = await FileModel.findById(id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        if (file.status === 'converting' || file.status === 'completed') {
            return res.json({ ok: true, status: file.status });
        }

        // quick response so UI is not blocked
        file.status = 'converting';
        file.progress = 5;
        await file.save();
        res.json({ ok: true });

        // background conversion
        (async () => {
            try {
                const src = path.join(uploadDir, file.storedName);
                if (!fs.existsSync(src)) {
                    file.status = 'failed';
                    file.progress = 0;
                    await file.save();
                    return;
                }

                const inFmt = (file.inputFormat || '').toLowerCase();
                const outFmt = (file.outputFormat || 'pdf').toLowerCase();
                let convertedPath = null;

                // Case 1: PDF -> DOCX using ConvertAPI
                if (inFmt === 'pdf' && outFmt === 'docx') {
                    try {
                        const apiResp = await convertPdfToDocxUsingConvertApi(src); // returns response JSON
                        // ConvertAPI returns Files array; pick first file URL
                        const filesArr = (apiResp && apiResp.Files) || (apiResp && apiResp.files);
                        if (!filesArr || !filesArr[0] || !filesArr[0].Url) {
                            throw new Error('ConvertAPI did not return a file URL');
                        }
                        const remoteUrl = filesArr[0].Url;
                        // download the file to convertedDir
                        const outName = `${file._id}.docx`;
                        const outPath = path.join(convertedDir, outName);
                        await downloadFileTo(remoteUrl, outPath);
                        convertedPath = outPath;
                    } catch (err) {
                        console.error('ConvertAPI conversion error:', err && (err.response ? err.response.data : err.message || err));
                        // mark failed
                        const f2 = await FileModel.findById(id);
                        if (f2) { f2.status = 'failed'; f2.progress = 0; await f2.save(); }
                        return;
                    }
                } else {
                    // For other combos (DOCX->PDF, DOCX->DOCX, PDF->PDF etc) use LibreOffice
                    try {
                        convertedPath = await convertDocGeneric(src, convertedDir, outFmt);
                    } catch (err) {
                        console.error('LibreOffice conversion error:', err && err.message ? err.message : err);
                        const f2 = await FileModel.findById(id);
                        if (f2) { f2.status = 'failed'; f2.progress = 0; await f2.save(); }
                        return;
                    }
                }

                // success: write DB fields
                const outFileName = path.basename(convertedPath);
                file.outputName = outFileName;
                file.status = 'completed';
                file.progress = 100;
                await file.save();
                console.log('Conversion finished for id', id, '->', outFileName);
            } catch (err) {
                console.error('Conversion background error for id', id, err && err.message ? err.message : err);
                try {
                    const f2 = await FileModel.findById(id);
                    if (f2) { f2.status = 'failed'; f2.progress = 0; await f2.save(); }
                } catch (e) { }
            }
        })();

    } catch (err) {
        console.error('start error', err);
        res.status(500).json({ message: 'Cannot start conversion', error: err.message });
    }
});


/* Download converted file */
router.get('/:id/download', async (req, res) => {
    try {
        const f = await FileModel.findById(req.params.id);
        if (!f) return res.status(404).json({ message: 'Not found' });
        if (f.status !== 'completed' || !f.outputName) {
            return res.status(400).json({ message: 'File not ready' });
        }

        const filePath = path.join(convertedDir, f.outputName);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Converted file missing' });

        const downloadName = f.originalName.replace(path.extname(f.originalName), path.extname(f.outputName));
        res.download(filePath, downloadName);
    } catch (err) {
        console.error('download error', err);
        res.status(500).json({ message: 'Download failed' });
    }
});

module.exports = router;
