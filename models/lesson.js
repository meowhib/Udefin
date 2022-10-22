const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  name: String,
  path: String,
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }
});

module.exports = mongoose.model('Lesson', lessonSchema);