const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    index: Number,
    path: String,
    type: String,
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }
});

module.exports = mongoose.model('Resource', resourceSchema);