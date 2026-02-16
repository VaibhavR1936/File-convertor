// server/utils/convertDoc.js
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Returns the path to the LibreOffice executable.
 * You can optionally set LIBREOFFICE_PATH in .env
 * e.g. "C:\\Program Files\\LibreOffice\\program\\soffice.exe"
 */
function getSofficePath() {
    return process.env.LIBREOFFICE_PATH || 'soffice';
}

/**
 * Generic document conversion using LibreOffice.
 *
 * @param {string} inputPath   Absolute path to source file (e.g. uploads/abc.docx)
 * @param {string} outDir      Output directory (e.g. converted/)
 * @param {string} outFmt      Target format extension, e.g. 'pdf', 'docx'
 * @returns {Promise<string>}  Resolves with absolute path of converted file.
 */
function convertDocGeneric(inputPath, outDir, outFmt) {
    const targetExt = (outFmt || 'pdf').toLowerCase();
    const soffice = getSofficePath();

    return new Promise((resolve, reject) => {
        const args = [
            '--headless',
            '--convert-to',
            targetExt,        // 'pdf' or 'docx'
            '--outdir',
            outDir,
            inputPath
        ];

        execFile(soffice, args, (error, stdout, stderr) => {
            if (error) {
                return reject(
                    new Error(
                        `LibreOffice failed: ${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`
                    )
                );
            }

            const base = path.basename(inputPath, path.extname(inputPath));

            // LibreOffice sometimes writes .pdf or .PDF (or .docx / .DOCX)
            const candidateLower = path.join(outDir, `${base}.${targetExt}`);
            const candidateUpper = path.join(outDir, `${base}.${targetExt.toUpperCase()}`);

            let outPath = null;
            if (fs.existsSync(candidateLower)) outPath = candidateLower;
            else if (fs.existsSync(candidateUpper)) outPath = candidateUpper;

            if (!outPath) {
                return reject(
                    new Error(
                        `Converted file not found. LibreOffice stdout:\n${stdout}\nstderr:\n${stderr}`
                    )
                );
            }

            resolve(outPath);
        });
    });
}

module.exports = { convertDocGeneric };
