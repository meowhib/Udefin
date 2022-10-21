const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: String,
  path: String,
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  overAllProgress: {
    type: Number,
    default: 0
  },
});

module.exports = mongoose.model('Course', courseSchema);