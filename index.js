const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration')
const bodyParser = require('body-parser');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');

const app = express();

//Serve static files
app.use(express.static('assets'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

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

//App
app.get('/', (req, res) => {
  res.redirect("/courses");
});

//Renders courses page
app.get("/courses", async (req, res) => {
  const courses = await Course.find({});
  
  res.render('coursesPage', {courses});
});

//Renders course edit page
app.put("/courses/:id", async (req, res) => {
  const course = await Course.findById(req.params.id);
  course.name = req.body.name;
  course.topic = req.body.topic;
  await course.save();
  console.log("Course updated");
  res.redirect("/courses");
});

//Renders course page
app.get("/courses/:id", async (req, res) => {
  const course = await Course.findOne({id: req.params.id});
  
  if (!course) {
    return res.redirect("/courses");
  }

  let chapters = await Chapter.find({course: course._id}).sort({index: 1});
  let lessons = [];
  let chapterLessons = null;

  //Constructs a JSON object to facilitate the rendering of the lessons
  for (let chapter of chapters){
    chapterLessons = {
      "chapter": chapter.name,
      "lessons": await Lesson.find({ chapter: { $in: chapter._id }}).sort({index: 1})
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
  const startTime = new Date().getTime();

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
      name: course,
      path: "/courses/" + course,
      chapters: [],
      overAllProgress: 0
    });

    await newCourse.save();
    console.log("📁 Added " + course + " to the database");
  }

  const courses = await Course.find({});
  
  for (let course of courses){
    console.log("🔍 Scanning for chapters in " + course.name + "...");
    const chapters = fs.readdirSync("./assets" + course.path, { withFileTypes: true})
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
    console.log("Found " + chapters.length + " chapters");

    for (let chapter of chapters){
      console.log(chapter);
      const newChapter = new Chapter({
        index: chapter.match(/\d+/) ? parseInt(chapter.match(/\d+/)[0]) : 0,
        name: chapter,
        path: course.path + "/" + chapter,
        lessons: [],
        course: course._id
      });

      await newChapter.save();
      await Course.updateOne({name: course.name}, {$push: {chapters: newChapter._id}});
      console.log("📁 Added " + chapter + " to the database");
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
          index: lesson.match(/\d+/) ? parseInt(lesson.match(/\d+/)[0]) : 0,
          name: lesson,
          path: chapter.path + "/" + lesson,
          course: course._id,
          chapter: chapter._id
        });
        
        //Saving the lesson to the database
        await newLesson.save();
        await Chapter.updateOne({name: chapter.name}, {$push: {lessons: newLesson._id}});
        console.log("📜 Added " + lesson + " to the database");

        let newProgress = null;

        try {
          newProgress = new Progress({
            course: course.id,
            lesson: newLesson._id,
            length: await getVideoDurationInSeconds("./assets" + newLesson.path),
            progress: 0
          });
        } catch (error) {
          newProgress = new Progress({
            course: course.id,
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

  const endTime = new Date().getTime();
  console.log("🚀 Scanning complete!");
  console.log("🕒 Took " + (endTime - startTime) / 1000 + " seconds");
  res.redirect("/courses");
});

//Provides information about the lesson (name, length, progress)
app.get("/lesson/:id", async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  const progress = await Progress.findOne({lesson: lesson._id});

  res.send({
    lesson: lesson,
    progress: progress
  });
});

app.get("/progress/:courseid", async (req, res) => {
  const course = await Course.findById(req.params.courseid);
  const chapters = await Chapter.find({course: course._id});
  let progress = 0;
  let total = 0;

  for (let chapter of chapters){
    const lessons = await Lesson.find({chapter: chapter._id});
    for (let lesson of lessons){
      const lessonProgress = await Progress.findOne({lesson: lesson._id});
      if (lessonProgress.length > 0){
        progress += lessonProgress.progress;
        total += lessonProgress.length;
      }
    }
  }

  res.send({
    progress: progress,
    total: total,
    percentage: Math.round(progress / total * 100)
  });
});

//Updates the progress of a lesson
app.post("/progress", async (req, res) => {
  const lessonId = req.query.lessonId;
  const newProgress = req.query.progress;
  const lesson = await Lesson.findById(lessonId);
  const progress = await Progress.findOne({lesson: lesson.id});
  const course = await Course.findById(lesson.course);

  try {
    //Added try catch because it was throwing an error when the progress was zero
    await Progress.findOneAndUpdate({lesson: lessonId}, {progress: newProgress});
    console.log("📊 Updated progress for " + lesson.name + " to " + newProgress + " out of " + progress.length);

    //Update the overall progress when the lesson is completed
    if (newProgress >= progress.length - 15){
      //Find all lessons with a progress that is equal or length - 15 seconds
      //of the lessons length
      const finishedLessons = await Progress.find({course: course.id, progress: {$gte: progress.length - 15}});
      console.log(finishedLessons)
      const lessons = await Lesson.find({course: course.id});

      //Calculate percentage of finished lessons
      console.log("📊 " + finishedLessons.length + " out of " + lessons.length + " lessons are finished");
      const percentage = Math.round((finishedLessons.length / lessons.length) * 100);

      console.log("Percentage of finished lessons: " + percentage + "%");

      //Update the overall progress of the course
      await Course.findOneAndUpdate({id: course.id}, {overAllProgress: percentage});
      console.log("📊 " + lesson.name + " completed!");
      console.log("------------------------------------");
    }
  } catch {
    console.log("Failed to update progress");
  }

  res.send("Progress updated");
});

//Rescans everything
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

app.listen(PORT, () => {
  console.log(`Udefin app listening at http://localhost:${PORT}`)
});