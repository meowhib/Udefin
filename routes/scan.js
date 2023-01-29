const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const { getVideoDurationInSeconds } = require('get-video-duration')

const router = express.Router();

//Models
const Course = require("../models/course");
const Chapter = require("../models/chapter");
const Lesson = require("../models/lesson");
const Resource = require("../models/resource");

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
      return;
    }

    const newCourse = new Course({
      name: courseName,
      path: coursePath,
      chapters: [],
    });

    await newCourse.save();
    
    //Get a list of chapters
    const chapters = getFolders(coursePath);

    //Loop through chapters
    for (let i = 0; i < chapters.length; i++) {
      const chapterPath = coursePath + '/' + chapters[i];
      const chapterName = chapters[i];
      const chapterIndex = getIndex(chapterName);

      //Create a new chapter
      const newChapter = new Chapter({
        name: chapterName,
        path: chapterPath,
        index: chapterIndex,
        lessons: [],
      });

      await newChapter.save();
      await Course.findByIdAndUpdate(newCourse._id, { $push: { chapters: newChapter._id } });

      //Get a list of lessons
      const lessons = getFiles(chapterPath, ['mp4']);
      let subtitles = getFiles(chapterPath, ["srt"]);
      let resources = getFiles(chapterPath, ["pdf", "html"]); 
      
      //Loop through lessons
      for (let j = 0; j < lessons.length; j++) {
        //Contains all the ids of the resources that belong to this lesson
        let lessonResourcesIDs = [];

        // Filter out the resources that start with a number until a dot
        let lessonResources = resources.filter(resource => resource.startsWith(getIndex(lessons[j])));

        resources = resources.filter(resource => !resource.startsWith(getIndex(lessons[j])));

        //Loop through resources
        for (let k = 0; k < lessonResources.length; k++) {
          const newResource = new Resource({
            index: getIndex(lessonResources[k]),
            name: lessonResources[k],
            path: chapterPath + lessonResources[k],
            type: getExtension(lessonResources[k]),
          });

          await newResource.save();
          lessonResourcesIDs.push(newResource._id);
        }

        //Get the subtitle that corresponds to this lesson
        let lessonSubtitle = subtitles.find(subtitle => subtitle.startsWith(getIndex(lessons[j])));

        //Remove the filtered subtitle from the subtitles array
        subtitles = subtitles.filter(subtitle => !subtitle.startsWith(getIndex(lessons[j])));

        //Get the lesson path
        const lessonPath = chapterPath + '/' + lessons[j];
        const lessonName = lessons[j];
        const lessonIndex = getIndex(lessonName);

        //Get the lesson duration
        const lessonDuration = await getVideoDurationInSeconds(lessonPath)
          .then((duration) => {
            return duration;
          })
          .catch((error) => {
            return -1;
          });

        //Create a new lesson
        const newLesson = new Lesson({
          index: lessonIndex,
          name: lessonName,
          path: lessonPath,
          course: newCourse._id,
          chapter: newChapter._id,
          length: lessonDuration,
          progress: 0,
          subtitlePath: lessonSubtitle ? chapterPath + '/' + lessonSubtitle : null,
          resources: lessonResourcesIDs,
        });

        await newLesson.save();

        //Assign remaining resources to the chapter
        if (resources.length > 0) {
          for (let k = 0; k < resources.length; k++) {
            const newResource = new Resource({
              index: getIndex(resources[k]),
              name: resources[k],
              path: chapterPath + resources[k],
              type: getExtension(resources[k]),
            });

            await newResource.save();
            await Chapter.findByIdAndUpdate(newChapter._id, { $push: { resources: newResource._id } });
          }
        }

        //Add the lesson to the chapter
        await Chapter.findByIdAndUpdate(newChapter._id, { $push: { lessons: newLesson._id } });
      }
    }

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
            res.status(500).redirect("/courses");
        } else {
            res.status(200).redirect("/courses");
        }
    }); 
});

module.exports = router