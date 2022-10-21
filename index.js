const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();

app.set('view engine', 'ejs');

//Conntect to MongoDB
mongoose.connect('mongodb://localhost:27017/Udefin', {useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');
});

//Models
const Course = require('./models/course');
const Chapter = require('./models/chapter');
const Lesson = require('./models/lesson');

//Constants
const PORT = 3000;
const coursesPath = './assets/courses';

//Functions
const urlFriendly = (value) => {
  return value.replace(/[^a-z0-9 _-]/gi, '-').toLowerCase();
}

const capitalize = (value) => {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

//App
app.get('/', (req, res) => {
  res.redirect("/courses");
});

app.get("/courses", async (req, res) => {
  const courses = await Course.find({});
  
  console.log(courses);
  res.render('courses', {courses});
});

app.get("/courses/:id", async (req, res) => {
  const course = await Course.findOne({name: req.params.id});
  const chapters = await Chapter.find({course: course._id});
  const lessons = await Lesson.find({course: course._id});

  if (course) {
    res.status(200).render("course", {chapters});
  } else {
    res.status(404).send("Course not found");
  }
});

app.get("/courses/:id/chapters", async (req, res) => {
  const course = await Course.findOne({name: req.params.id}, {name: 1, path: 1});

  if (course) {
    const chapters = await Chapter.find({course: course._id}, {name: 1, path: 1});
    res.status(200).send(chapters);
  } else {
    res.status(404).send("Course not found");
  }
});

app.get("/scan", async (req, res) => {
  //Return a list of folders in the courses folder
  const courses = fs.readdirSync(coursesPath, { withFileTypes: true})
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);
  
  //Loop through the courses and add them to the database
  courses.forEach(course => {
    const newCourse = new Course({
      name: urlFriendly(course),
      path: "/courses/" + course,
      chapters: []
    });
    
    //Save the course to the database
    newCourse.save();
    
    //Get a list of chapters in the course folder
    const chapters = fs.readdirSync('./assets/courses/' + course, { withFileTypes: true})
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

    chapters.forEach(async chapter => {
      const newChapter = new Chapter({
        name: capitalize(urlFriendly(chapter.replace(/^[0-9- \.]+/, '').replace(".mp4", ""))),
        path: "/courses/" + course + "/" + chapter,
        course: newCourse._id,
        lessons: []
      });
      
      //Save the chapter to the database and link it to the course
      newChapter.save();
      await Course.findByIdAndUpdate(newCourse._id, {$push: {"chapters": newChapter._id}});

      //Get a list of lessons in the chapter folder
      const lessons = fs.readdirSync('./assets/courses/' + course + "/" + chapter, { withFileTypes: true})
      .filter(dirent => dirent.isFile())
      .filter(dirent => dirent.name.endsWith(".mp4"))
      .map(dirent => dirent.name);

      //Loop through the lessons and add them to the database
      lessons.forEach(async lesson => {
        const newLesson = new Lesson({
          name: capitalize(urlFriendly(lesson.replace(/^[0-9- \.]+/, '').replace(".mp4", ""))),
          path: "/courses/" + course + "/" + chapter + "/" + lesson,
          chapter: newChapter._id,
          progress: 0
        });
        
        //Save the lesson to the database and link it to the chapter
        newLesson.save();
        await Chapter.findByIdAndUpdate(newChapter._id, {$push: {"lessons": newLesson._id}});
      });
    });
  });

  res.redirect("/courses");
});

app.get("/rescan", async (req, res) => {
  //Delete database for rescanning
  //!WARNING! This will also destroy the progress in each course
  await Course.deleteMany({});
  await Chapter.deleteMany({});
  await Lesson.deleteMany({});
  res.redirect("/scan");
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
});