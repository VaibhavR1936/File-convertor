const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    originalName: String,
    storedName: String,
    outputName: String,
    size: Number,
    category: { type: String, default: 'document' },
    inputFormat: String,
    outputFormat: String,
    status: { type: String, enum: ['pending', 'converting', 'completed', 'failed'], default: 'pending' },
    progress: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
