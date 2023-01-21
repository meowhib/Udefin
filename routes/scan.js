const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const { getVideoDurationInSeconds } = require('get-video-duration')

const router = express.Router();

//Models
const Course = require("../models/course");
const Chapter = require("../models/chapter");
const Lesson = require("../models/lesson");
const { runInContext } = require("vm");

//Consts
const coursesPath = './assets/courses';

//Functions
//Scans a course
async function scanCourse(courseName){
    const startTime = new Date().getTime();
  
    //Get the course path
    let coursePath = coursesPath + '/' + courseName;
  
    //Check if the course already exists in the database
    const course = await Course.findOne({ name: courseName });

    if (course){
      console.log("Course already exists. [" + courseName + "]");
      return;
    }

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
  
      //Exit if no lessons
      if (!lessons.length) {
        console.log('No lessons found in ' + chapterPath);
        return;
      }
  
      let subtitles = getFiles(chapterPath, ['vtt']);
      let indexedSubtitles = {};
      
      if (subtitles){
        for (let subtitle of subtitles){
          indexedSubtitles[getIndex(subtitle)] = "/" + chapterPath.split("/").slice(2).join("/") + '/' + subtitle;
        }
      }

      lessons.forEach(async lesson => {
        let lessonPath = chapterPath + '/' + lesson;
        let newLesson = null;
        let lessonSubtitle = indexedSubtitles[getIndex(lesson)]
  
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
              subtitlePath: lessonSubtitle ? lessonSubtitle : ""
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
            subtitlePath: lessonSubtitle ? lessonSubtitle : ""
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

//Get index of a file
function getIndex(string){
    try {
        return string.match(/(\d+\.?)+/g)[0];
    } catch (error) {
        return 0;
    }
}

//Get extension of a file
function getExtension(string){
    return string.split('.').pop();
}

//Gets a list of folders in a folder
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

//Routes
//Scans all courses unless a course name is passed
router.get("/", (req, res) => {
    //if no parametes
    if (Object.keys(req.query).length === 0) {
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

    } else {
        scanCourse(req.query.name)
        .then((course) => {
            res.status(200).redirect("/courses");
        })
        .catch((err) => {
            res.status(500).redirect("/courses");
        });
    }
});

//Rescans everything
router.get("/rescan", async (req, res) => {
  //Delete database for rescanning
  await Course.deleteMany({});
  await Chapter.deleteMany({});
  await Lesson.deleteMany({});

  res.redirect("/scan");
});

//Delete all courses
router.get("/delete", (req, res) => {
    Course.deleteMany({}, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).redirect("/courses");
        } else {
            res.status(200).redirect("/courses");
        }
    }); 
})

module.exports = router