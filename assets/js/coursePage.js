var video = document.getElementById("video");

//Changes the video based on the given lessonId
function setSource(src){
  //Fetch lesson data
  fetch("/lesson/" + src.split("/")[src.split("/").length - 1])
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    var source = document.getElementById("videoSource");
    var video = document.getElementById("video");
    var sourceText = document.getElementById("sourceText");
    var videoTitle = document.getElementById("videoTitle");
    videoSource.setAttribute("src", src);
    videoSource.setAttribute('type', 'video/mp4');
    video.load();
    video.play();
    videoTitle.innerHTML = data.lesson.name;
    video.currentTime = data.progress.progress;
  });
}

function updateProgress(){
  //send post request to /progress with the given progress
  const videoSource = document.getElementById("videoSource").src;

  //Only send progress if the video is playing
  if (videoSource != "" && isPlaying(document.getElementById("video"))){
    const video = document.getElementById("video");
    const lessonId = videoSource.split("/")[videoSource.split("/").length - 1];
    const currentTime = Math.round(video.currentTime);
    
    //Send the progress to the server
    fetch("/progress?lessonId=" + lessonId + "&progress=" + currentTime, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"

      },
      body: JSON.stringify({
        progress: currentTime
      })
    })
  }
}

//Checls if the video is playing
function isPlaying(video) {
  return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
}

//Updates the progress when the video position changes
video.addEventListener("timeupdate", updateProgress);