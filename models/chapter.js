const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: String,
  path: String,
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }]
});

module.exports = mongoose.model('Chapter', chapterSchema);