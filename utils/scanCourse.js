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
  
      //Exit if no lessons
      if (!lessons.length) {
        console.log('No lessons found in ' + chapterPath);
        return;
      }
  
      let subtitles = getFiles(chapterPath, ['vtt']);
      console.log("Got subtitles")
      let indexedSubtitles = {};
      
      if (subtitles){
        for (let subtitle of subtitles){
          indexedSubtitles[getIndex(subtitle)] = "/" + chapterPath.split("/").slice(2).join("/") + '/' + subtitle;
        }
      }
      console.log(indexedSubtitles);
  
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