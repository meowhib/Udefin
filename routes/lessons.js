const express = require("express");
const router = express.Router();

const Course = require("../models/course");
const Chapter = require("../models/chapter");
const Lesson = require("../models/lesson");

//Provides information about the lesson (name, length, progress)
router.get("/:id", async (req, res) => {
    const lesson = await Lesson.findById(req.params.id);
    if (lesson) {
      res.status(200).send(lesson);
    } else {
      res.status(404).send("Lesson not found");
    }
});

//Updates the progress of a lesson
router.post("/progress", async (req, res) => {
  const lessonId = req.query.lessonId;
  const newProgress = req.query.progress;
  const lesson = await Lesson.findById(lessonId);
  const course = await Course.findById(lesson.course);

  try {
    //Added try catch because it was throwing an error when the progress was zero
    await Lesson.findByIdAndUpdate(lessonId, {progress: newProgress});

    //Update the overall progress when the lesson is completed
    if (newProgress >= lesson.length - 15){
      const lessons = await Lesson.find({course: course.id});
      const completedLessonsCount = lessons.filter(lesson => lesson.progress >= lesson.length - 15).length;

      //Calculate percentage of finished lessons
      const percentage = Math.round((completedLessonsCount / lessons.length) * 100);

      //Update the overall progress of the course
      await Course.findByIdAndUpdate(course.id, {overAllProgress: percentage});
      return res.status(200).send("Progress updated");
    }
  } catch {
    res.status(500).send("Failed to update progress");
  }
});

//Updates the progress of a lesson
router.post("/progress", async (req, res) => {
  const lessonId = req.query.lessonId;
  const newProgress = req.query.progress;
  const lesson = await Lesson.findById(lessonId);
  const course = await Course.findById(lesson.course);

  try {
    //Added try catch because it was throwing an error when the progress was zero
    await Lesson.findByIdAndUpdate(lessonId, {progress: newProgress});

    //Update the overall progress when the lesson is completed
    if (newProgress >= lesson.length - 15){
      const lessons = await Lesson.find({course: course.id});
      const completedLessonsCount = lessons.filter(lesson => lesson.progress >= lesson.length - 15).length;

      //Calculate percentage of finished lessons
      const percentage = Math.round((completedLessonsCount / lessons.length) * 100);

      //Update the overall progress of the course
      await Course.findByIdAndUpdate(course.id, {overAllProgress: percentage});
      return res.status(200).send("Progress updated");
    }
  } catch {
      return res.status(500).send("Failed to update progress");
  }
});

module.exports = router;