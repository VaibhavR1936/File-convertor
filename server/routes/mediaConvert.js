// server/routes/mediaConvert.js
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

function safeUnlink(p) {
    fs.unlink(p, err => {
        if (err) console.warn('unlink failed', p, err.message);
    });
}

router.post('/audio', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outExt = (req.body.outputFormat || 'mp3').toLowerCase();
    const baseName = req.file.originalname.replace(/\.[^.]+$/, '');
    const outPath = `${inputPath}.${outExt}`;

    ffmpeg(inputPath)
        .toFormat(outExt)
        .on('end', () => {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${baseName}.${outExt}"`
            );
            const stream = fs.createReadStream(outPath);
            stream.pipe(res);
            stream.on('close', () => {
                safeUnlink(inputPath);
                safeUnlink(outPath);
            });
        })
        .on('error', (err) => {
            console.error('audio convert error', err);
            safeUnlink(inputPath);
            safeUnlink(outPath);
            res.status(500).send('Audio conversion failed');
        })
        .save(outPath);
});

router.post('/video', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outExt = (req.body.outputFormat || 'mp4').toLowerCase();
    const baseName = req.file.originalname.replace(/\.[^.]+$/, '');
    const outPath = `${inputPath}.${outExt}`;

    let command = ffmpeg(inputPath);

    if (outExt === 'mp4') {
        command = command
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions(['-preset veryfast', '-b:a 128k']);
    } else {
        command = command
            .videoCodec('libvpx')
            .audioCodec('libvorbis')
            .outputOptions(['-b:v 1M']);
    }

    command
        .on('end', () => {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${baseName}.${outExt}"`
            );
            const stream = fs.createReadStream(outPath);
            stream.pipe(res);
            stream.on('close', () => {
                safeUnlink(inputPath);
                safeUnlink(outPath);
            });
        })
        .on('error', (err) => {
            console.error('video convert error', err);
            safeUnlink(inputPath);
            safeUnlink(outPath);
            res.status(500).send('Video conversion failed');
        })
        .save(outPath);
});

module.exports = router;
