const Lesson = require('../models/lesson');

exports.getLessons = async (req, res) => {
  let lessons = await Lesson.find({}).populate({ path: 'resources', model: 'Resource' });

  return res.send(lessons);
};

exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({ path: 'resources', model: 'Resource' });
    if (!lesson) {
      return res.status(404).send('Lesson not found');
    } else {
      return res.send(lesson);
    }
  } catch (err) {
    return res.status(500).send('Something went wrong');
  }
};

exports.editLesson = async (req, res) => {
  const lessonId = req.params.id;
  //Update all the fields of the lesson if they are provided
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'length', 'progress'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  } else {
    try {
      //Find the lesson and update it
      await Lesson.findByIdAndUpdate({ _id: lessonId }, req.body);
      return res.status(200).send('Lesson updated');
    } catch (err) {
      return res.status(500).send('Something went wrong');
    }
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).send('Lesson not found');
    } else {
      return res.status(200).send('Lesson deleted');
    }
  } catch (err) {
    return res.status(500).send('Something went wrong');
  }
};