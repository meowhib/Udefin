const Course = require("../models/course");

exports.getCourses = async (req, res) => {
  //find all the courses and project only the names and ids
  let courses = await Course.find({}).populate({
    path: "chapters",
    model: "Chapter",
    populate: [{
      path: "lessons",
      model: "Lesson",
      option: { sort: { index: 1 } },
      populate: {
        path: "resources",
        model: "Resource"
      },
      options: { sort: { index: 1 } },
    }, {
      path: "resources",
      model: "Resource"
    }],
    options: { sort: { index: 1 } },
  });

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
}

exports.getCourse = async (req, res) => {
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
        },
        options: { sort: { index: 1 } },
      }, {
        path: "resources",
        model: "Resource"
      }],
      options: { sort: { index: 1 } } 
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
};

exports.editCourse = async (req, res) => {
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
};

exports.deleteCourse = async (req, res) => {
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
};