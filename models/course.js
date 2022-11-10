const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: String,
  path: String,
  category: String,
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  overAllProgress: {
    type: Number,
    default: 0
  },
  topic: {
    type: String,
    default: "Unassigned"
  }
});

module.exports = mongoose.model('Course', courseSchema);