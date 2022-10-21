const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  name: String,
  path: String,
  progress: {
    type: Number,
    default: 0
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }
});

module.exports = mongoose.model('Lesson', lessonSchema);