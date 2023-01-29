const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const cors = require("cors");

const Course = require("../models/course")
const Chapter = require("../models/chapter")
const Lesson = require("../models/lesson")

router.use(cors());

//Renders courses page
router.get("/", async (req, res) => {
  //find all the courses and project only the names and ids
  let courses = await Course.find({}).populate({ path: "chapters", model: "Chapter", populate: { path: "lessons", model: "Lesson" } });

  for (let i = 0; i < courses.length; i++) {
    courses[i] = {
      _id: courses[i]._id,
      name: courses[i].name,
      chapters: courses[i].chapters,
      lessons: courses[i].chapters.reduce((acc, cur) => acc + cur.lessons.length, 0),
      completedLessons: courses[i].chapters.reduce((acc, cur) => acc + cur.lessons.filter(lesson => lesson.progress >= lesson.length - 15).length, 0)
    }
  }

  // res.render('coursesPage', {courses});
  return res.send(courses);
});

//Renders course page
router.get("/:id", async (req, res) => {
  try {
    //Returns the course with all its chapters, lessons and resources
    const course = await Course.findById(req.params.id).populate({
      path: "chapters",
      model: "Chapter",
      populate: [{
        path: "lessons",
        model: "Lesson",
        populate: {
          path: "resources",
          model: "Resource"
        }
      }, {
        path: "resources",
        model: "Resource"
      }]
    });
    if (!course) {
      return res.status(404).send("Course not found");
    } else {
      // return res.render('coursePage', {course});
      return res.send(course);
    }
  } catch (err) {
    return res.status(500).send("Something went wrong");
  }
});

//Renders course edit page
router.put("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).send("Course not found");
    }
  } catch (err) {
    return res.status(500).send("Something went wrong");
  }

  course.name = req.body.name;
  course.topic = req.body.topic;
  
  await course.save();

  return res.redirect("/courses");
});

router.delete("/:id", async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).send("Course not found");
      }
    } catch (err){
      return res.status(500).send("Something went wrong");
    }

    await Course.deleteOne({ _id: req.params.id });
    return res.status(200).send("Course deleted");
});

module.exports = router;