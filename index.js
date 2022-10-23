const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration')
const bodyParser = require('body-parser');

const app = express();

//Serve static files
app.use(express.static('assets'));
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

app.get("/courses/:id", async (req, res) => {
  const course = await Course.findOne({name: req.params.id});
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
          const progress = await Progress.findOne({lesson: lesson._id}, {progress: 1, length: 1});
          lessonWithProgress = {
            "_id": lesson._id,
            "name": lesson.name,
            "path": lesson.path,
            "chapter": lesson.chapter,
            "length": progress.length,
            "progress": progress.progress
          }
          lessonsWithProgress.push(lessonWithProgress);
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
app.get("/video/:path", async (req, res) => {
  const range = req.headers.range;
  if (!range) {
      res.status(400).send("Requires Range header");
  }
  const videoPath = req.params.path;
  console.log(videoPath);
  const videoSize = fs.statSync(videoPath.path).size;
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
        });

        //add progress to database
        const newProgress = new Progress({
          lesson: newLesson._id,
          length: await getVideoDurationInSeconds('./assets/courses/' + course + "/" + chapter + "/" + lesson),
          progress: 0
        });

        //Save the lesson to the database and link it to the chapter
        newLesson.save();
        newProgress.save();
        await Chapter.findByIdAndUpdate(newChapter._id, {$push: {"lessons": newLesson._id}})
      });
    });
  })
  
  res.redirect("/courses");
});

app.get("/progress", async (req, res) => {
  const progress = await Progress.find({});

  res.send(progress);
})

app.post("/progress", async (req, res) => {
  const lesson = req.body.lesson;
  const progress = req.body.progress;

  await Progress.findOneAndUpdate({lesson: lesson}, {progress: progress});

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

app.get("/progress", async (req, res) => {
  res.send(req.query);
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
});