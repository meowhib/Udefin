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
    const courses = await Course.find({}).populate({ path: "chapters", model: "Chapter", populate: { path: "lessons", model: "Lesson" } });

    for (let i = 0; i < courses.length; i++){
      let lessons = await Lesson.find({course: courses[i].id});
      let lessonsCount = lessons.length;
      let completedLessonsCount = 0;
      
      for (let lesson of lessons){
        if (lesson.length && lesson.progress >= lesson.length - 15){
          completedLessonsCount++;
        }
      }
  
      courses[i].completedLessonsCount = completedLessonsCount;
      courses[i].lessonsCount = lessonsCount;
      console.log("CHanging")
    }
    
    console.log("Sending")
    // res.render('coursesPage', {courses});
    return res.send(courses);
});

router.get("/all", (req, res) => {
    const courses = Course.find({});

    res.send(courses);
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

  // const course = await Course.findById(req.params.id);

  // if (!course) {
  //     return res.redirect("/courses");
  // }

  // let chapters = await Chapter.find({ course: req.params.id }).sort({ index: 1 });
  // let lessons = [];
  // let chapterLessons = null;

  // //Constructs a JSON object to facilitate the rendering of the lessons
  // for (let chapter of chapters){
  //     chapterLessons = await Lesson.find({ chapter: chapter.id }).sort({ index: 1 });

  //     lessons.push({
  //     "chapter": chapter.name,
  //     "lessons": chapterLessons,
  //     "completedLessons": chapterLessons.filter(lesson => {
  //         if (lesson.progress >= lesson.length - 15){
  //         return lesson;
  //         }
  //     }).length
  //     });
  // }

  // if (course) {
  //     res.status(200).render("coursePage", { course, lessons });
  // } else {
  //     res.status(404).send("Course not found");
  // }
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