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

//Constants
const PORT = 3000;
const coursesPath = './assets/courses';

//Functions
function getIndex(string){
  try {
    return string.match(/(\d+\.?)+/g)[0];
  } catch (error) {
    return 0;
  }
}

function getExtension(string){
  return string.split('.').pop();
}

function getFolders(coursePath) {
  return fs.readdirSync(coursePath, { withFileTypes: true})
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);
}

//Gets a list of files in a folder (an arugment can be passed to filter by extension)
function getFiles(path, extension = null) {
  //If extension is an array
  if (Array.isArray(extension)) {
    return fs.readdirSync(path, { withFileTypes: true})
    .filter(dirent => dirent.isFile())
    .filter(dirent => extension ? extension.includes(getExtension(dirent.name)) : true)
    .map(dirent => dirent.name);
  }
  
  return fs.readdirSync(path, { withFileTypes: true})
  .filter(dirent => dirent.isFile())
  .filter(dirent => extension ? getExtension(dirent.name) : true)
  .map(dirent => dirent.name);
}

function scanCourse(courseName){
  const startTime = new Date().getTime();

  //Get the course path
  let coursePath = coursesPath + '/' + courseName;

  //Check if the course already exists in the database
  const course = Course.findOne({ name: courseName });

  const newCourse = new Course({
    name: courseName,
    path: coursePath,
    chapters: [],
  });

  //Get a list of chapters
  let chapters = getFolders(coursePath);
  
  chapters.forEach(chapter => {
    let chapterPath = coursePath + '/' + chapter;
    
    const newChapter = new Chapter({
      index: getIndex(chapter),
      name: chapter,
      path: chapterPath,
      course: newCourse._id,
      lessons: [],
    });

    //Get a list of lessons
    let lessons = getFiles(chapterPath, ['mp4', 'webm', 'ogg', "mkv"]);

    lessons.forEach(async lesson => {
      let lessonPath = chapterPath + '/' + lesson;
      let newLesson = null;

      //Get the duration of the video
      try {
        await getVideoDurationInSeconds(lessonPath).then((duration) => {
          newLesson = new Lesson({
            index: getIndex(lesson),
            name: lesson,
            path: lessonPath,
            course: newCourse._id,
            chapter: newChapter._id,
            length: duration,
          }).save()

          newChapter.lessons.push(newLesson._id);
        });
      } catch (error) {
        console.log("❌ Couldn't get the duration of the video: " + lessonPath);
        newLesson = new Lesson({
          index: getIndex(lesson),
          name: lesson,
          path: lessonPath,
          course: newCourse._id,
          chapter: newChapter._id,
          length: -1,
        }).save()

        newChapter.lessons.push(newLesson._id);
      }
    });

    newChapter.save();
    newCourse.chapters.push(newChapter._id);
  });

  newCourse.save();
  const endTime = new Date().getTime();
  console.log("🚀 Scanning complete! Took " + (endTime - startTime) / 1000 + " seconds");
}

//App
app.get('/', (req, res) => {
  res.redirect("/courses");
});

//Renders courses page
app.get("/courses", async (req, res) => {
  const courses = await Course.find({});
  
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
  }

  res.render('coursesPage', {courses});
});

//Renders course edit page
app.put("/courses/:id", async (req, res) => {
  const course = await Course.findById(req.params.id);

  course.name = req.body.name;
  course.topic = req.body.topic;
  
  await course.save();

  res.redirect("/courses");
});

//Renders course page
app.get("/courses/:id", async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.redirect("/courses");
  }

  let chapters = await Chapter.find({ course: req.params.id }).sort({ index: 1 });
  let lessons = [];
  let chapterLessons = null;

  //Constructs a JSON object to facilitate the rendering of the lessons
  for (let chapter of chapters){
    chapterLessons = await Lesson.find({ chapter: chapter.id }).sort({ index: 1 });

    lessons.push({
      "chapter": chapter.name,
      "lessons": chapterLessons,
      "completedLessons": chapterLessons.filter(lesson => {
        if (lesson.progress >= lesson.length - 15){
          return lesson;
        }
      }).length
    });
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

  const videoPath = lessonPath.path;
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

  //Get a list of courses
  let courses = getFolders(coursesPath);

  //Scan each course
  courses.forEach(course => {
    scanCourse(course);
  });
  
  const endTime = new Date().getTime();
  console.log("🚀 Scanning complete! Took " + (endTime - startTime) / 1000 + " seconds");
  return res.redirect("/courses");
});

//Provides information about the lesson (name, length, progress)
app.get("/lesson/:id", async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (lesson) {
    res.status(200).send(lesson);
  } else {
    res.status(404).send("Lesson not found");
  }
});

app.get("/foldercontent", async (req, res) => {
  return res.send(getFolders(coursesPath));
});

//Updates the progress of a lesson
app.post("/progress", async (req, res) => {
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

  res.redirect("/scan");
});

app.get("/scancourse/:name", (req, res) => {  
  //Delete database for rescanning
  Course.deleteMany({name: req.params.name}, (err) => {
    if (err) console.log(err);
    console.log("Deleted " + req.params.name + " from the database");
  });
  scanCourse(req.params.name);
  res.redirect("/courses");
})

app.listen(PORT, () => {
  console.log(`Udefin app listening at http://localhost:${PORT}`)
});