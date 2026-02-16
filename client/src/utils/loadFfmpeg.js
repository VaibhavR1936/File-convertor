// client/src/utils/loadFfmpeg.js

// Small helper used by audio + video converters.
export async function loadFfmpegHelpers() {
    const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
    return { createFFmpeg, fetchFile };
}
