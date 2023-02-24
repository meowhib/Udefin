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
  length: Number,
  progress: {
    type: Number,
    default: 0
  },
  subtitlePath: {
    type: String,
    default: ""
  },
  resources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
});

module.exports = mongoose.model('Lesson', lessonSchema);