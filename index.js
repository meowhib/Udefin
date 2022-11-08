const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration')
const bodyParser = require('body-parser');
const ejsMate = require('ejs-mate');

const app = express();

//Serve static files
app.use(express.static('assets'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//Conntect to MongoDB
mongoose.connect('mongodb://localhost:27017/Udefin', {useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');
});

//Models
const Course = require('./models/course');
const Chapter = require('./models/chapter');
const Lesson = require('./models/lesson');
const Progress = require('./models/progress');

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
  
  res.render('coursesPage', {courses});
});

app.get("/courses/:id/edit", async (req, res) => {
  
});

app.get("/courses/:id", async (req, res) => {
  const course = await Course.findOne({name: req.params.id});
  
  if (!course) {
    return res.redirect("/courses");
  }

  const chapters = await Chapter.find({course: course._id}).sort({path: 1});

  var lessons = [];
  let chapterLessons = null;

  //Constructs a JSON object to facilitate the rendering of the lessons
  for (let chapter of chapters){
    chapterLessons = {
      "chapter": chapter.name,
      "lessons": await Lesson.find({ chapter: { $in: chapter._id }}).sort({path: 1})
      .then(async (lessons) => {
        let lessonsWithProgress = [];
        let lessonWithProgress = null;

        for (let lesson of lessons){
          const progress = await Progress.findOne({lesson: lesson._id}, {progress: 1, length: 1})
          .then((progress) => {
            if (progress){
              lessonWithProgress = {
                "_id": lesson._id,
                "name": lesson.name,
                "path": lesson.path,
                "chapter": lesson.chapter,
                "length": progress.length,
                "progress": progress.progress
              }
              lessonsWithProgress.push(lessonWithProgress);
            } else {
              lessonWithProgress = {
                "_id": lesson._id,
                "name": lesson.name,
                "path": lesson.path,
                "chapter": lesson.chapter,
                "length": 0,
                "progress": 0
              }
              lessonsWithProgress.push(lessonWithProgress);
            }
          })
        }
        return lessonsWithProgress;
      })
    }

    lessons.push(chapterLessons);
  }

  if (course) {
    res.status(200).render("coursePage", { course, lessons });
  } else {
    res.status(404).send("Course not found");
  }

  // res.send(lessons);
});

//Serve the video
app.get("/video/:lessonid", async (req, res) => {
  const lessonPath = await Lesson.findOne({_id: req.params.lessonid});
  const range = req.headers.range;
  if (!range) {
    return res.status(400).send("Requires Range header" + "\n" + lessonPath.path);
  }

  const videoPath = "./assets" + lessonPath.path;
  const videoSize = fs.statSync(videoPath).size;
  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

app.get("/scan", async (req, res) => {
  //Create courses folder if it doesn't exist
  if (!fs.existsSync(coursesPath)){
    fs.mkdirSync(coursesPath);
  }

  //Return a list of folders in the courses folder
  console.log("Scanning for courses...");
  const foundCourses = fs.readdirSync(coursesPath, { withFileTypes: true})
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);
  console.log("Found " + foundCourses.length + " courses");
  
  //Loop through the foundCourses and add them to the database
  for (let course of foundCourses){
    console.log("🔍 Scanning " + course + "...");
    const newCourse = new Course({
      name: urlFriendly(course),
      path: "/courses/" + course,
      chapters: [],
      overAllProgress: 0
    });

    //Check if the course already exists in the database
    const courseExists = await Course.findOne({name: newCourse.name});
    if (!courseExists){
      await newCourse.save();
      console.log("📁 Added " + course + " to the database");
    } else {
      console.log("📁 " + course + " already exists in the database");
    }
  }

  
  const courses = await Course.find({});
  
  for (let course of courses){
    console.log("🔍 Scanning for chapters in " + course.name + "...");
    const chapters = fs.readdirSync("./assets" + course.path, { withFileTypes: true})
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
    console.log("Found " + chapters.length + " chapters");
    
    //TODO: Check if the chapter & lesson begin with a number then a dot
    //TODO: In that case, add a zero in the front for better sorting.

    for (let chapter of chapters){
      const newChapter = new Chapter({
        name: capitalize(urlFriendly(chapter.replace(/^[0-9- \.]+/, ''))),
        path: course.path + "/" + chapter,
        lessons: [],
        course: course._id
      });

      const chapterExists = await Chapter.findOne({name: newChapter.name});
      if (!chapterExists){
        //Save chapter to the database and add its id to the course chapters array
        await newChapter.save();
        await Course.updateOne({name: course.name}, {$push: {chapters: newChapter._id}});
        console.log("📁 Added " + chapter + " to the database");
      } else {
        console.log("📁 " + chapter + " already exists in the database");
      }
    }
  }

  for (let course of courses){
    console.log("🔍 Scanning for lessons in " + course.name + "...");
    const chapters = await Chapter.find({course: course._id});
    for (let chapter of chapters){
      const lessons = fs.readdirSync("./assets" + chapter.path, { withFileTypes: true})
      .filter(dirent => dirent.isFile())
      .filter(dirent => dirent.name.endsWith(".mp4"))
      .map(dirent => dirent.name);
      console.log("Found " + lessons.length + " lessons");

      for (let lesson of lessons){
        const newLesson = new Lesson({
          name: capitalize(urlFriendly(lesson.replace(/^[0-9- \.]+/, '').replace(".mp4", ""))),
          path: chapter.path + "/" + lesson,
          chapter: chapter._id
        });
        
        const lessonExists = await Lesson.findOne({name: newLesson.name});
        if (!lessonExists){
          await newLesson.save();
          await Chapter.updateOne({name: chapter.name}, {$push: {lessons: newLesson._id}});
          console.log("📜 Added " + lesson + " to the database");
        } else {
          console.log("📜 " + lesson + " already exists in the database");
        }

        let newProgress = null;

        try {
          newProgress = new Progress({
            lesson: newLesson._id,
            length: await getVideoDurationInSeconds("./assets" + newLesson.path),
            progress: 0
          });
        } catch (error) {
          newProgress = new Progress({
            lesson: newLesson._id,
            length: -1,
            progress: 0
          });
          console.log("❌ Couldn't get the duration of " + newLesson.name);
        }

        const progressExists = await Progress.findOne({lesson: newLesson._id});
        if (!progressExists){
          await newProgress.save();
          console.log("📊 Added progress for " + lesson);
        } else {
          console.log("📊 Progress for " + lesson + " already exists");
        }
      }
    }
  }

  console.log("🚀 Scanning complete!");
  res.redirect("/courses");
});

app.get("/progress", async (req, res) => {
  const progress = await Progress.find({});

  res.send(progress);
})

app.post("/progress", async (req, res) => {
  const lesson = req.query.lessonId;
  const progress = req.query.progress;

  try {
    //Added try catch because it was throwing an error when the progress was zero
    await Progress.findOneAndUpdate({lesson: lesson}, {progress: progress});
  } catch {
    console.log("Failed to update progress");
  }

  console.log("Progress updated! " + lesson + " " + progress);
  res.send("Progress updated");
});

app.get("/rescan", async (req, res) => {
  //Delete database for rescanning
  await Course.deleteMany({});
  await Chapter.deleteMany({});
  await Lesson.deleteMany({});

  //Progress deletion is optional
  if (req.query.progress == "true"){
    await Progress.deleteMany({});
  }
  res.redirect("/scan");
});

app.get("/lesson/:id", async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  const progress = await Progress.findOne({lesson: lesson._id});

  res.send({
    lesson: lesson,
    progress: progress
  });
});

app.get("/progress", async (req, res) => {
  res.send(req.query);
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
});