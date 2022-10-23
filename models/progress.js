const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  length: Number,
  progress: Number
  //If the video is finished then its progress is -1
});

module.exports = mongoose.model('Progress', progressSchema);