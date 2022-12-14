const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  index: Number,
  name: String,
  path: String,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }]
});

module.exports = mongoose.model('Chapter', chapterSchema);