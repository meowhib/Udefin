const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  index: Number,
  name: String,
  path: String,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
});

module.exports = mongoose.model('Lesson', lessonSchema);