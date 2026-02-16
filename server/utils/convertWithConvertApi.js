// server/utils/convertWithConvertApi.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const CONVERTAPI_TOKEN = process.env.CONVERTAPI_SECRET;

async function convertPdfToDocxUsingConvertApi(srcPath) {
    if (!CONVERTAPI_TOKEN) throw new Error('Missing ConvertAPI token (CONVERTAPI_SECRET)');

    const url = 'https://v2.convertapi.com/convert/pdf/to/docx';
    const fd = new FormData();
    fd.append('File', fs.createReadStream(srcPath));
    fd.append('StoreFile', 'true'); // get a downloadable URL in response

    const headers = {
        ...fd.getHeaders(),
        Authorization: `Bearer ${CONVERTAPI_TOKEN}`,
        Accept: 'application/json'
    };

    const resp = await axios.post(url, fd, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000
    });

    // resp.data should contain Files array with Url for the converted file
    return resp.data;
}

/**
 * Downloads a remote URL to local path (stream).
 * returns Promise which resolves when done.
 */
async function downloadFileTo(url, destPath) {
    const writer = fs.createWriteStream(destPath);
    const resp = await axios.get(url, { responseType: 'stream', timeout: 120000 });
    resp.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

module.exports = { convertPdfToDocxUsingConvertApi, downloadFileTo };
