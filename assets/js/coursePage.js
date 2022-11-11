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
    // videoTitle.innerHTML = data.lesson.name;
    console.log(data.progress.progress);
    video.currentTime = data.progress.progress;
    video.focus();
  });
}

function fullscreen(){
  const video = document.getElementById("video");
  video.fullscreen();
}

function pause(){
  const video = document.getElementById("video");
  video.pause();
}

function play(){
  const video = document.getElementById("video");
  video.play();
}

function forward5Seconds(){
  const video = document.getElementById("video");
  video.currentTime += 10;
}

function backward5Seconds(){
  const video = document.getElementById("video");
  video.currentTime -= 10;
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
        progress: currentTime,
      })
    })
  }
}

//Checls if the video is playing
function isPlaying(video) {
  return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
}

//Event listeners

//Updates the progress when the video position changes
video.addEventListener("timeupdate", updateProgress);

//Fast forward
body.addEventListener("keydown", function(e){
  //If the user presses the right arrow key
  if (e.keyCode == 39){
    console.log("Right arrow key pressed");
    forward5Seconds();
  }
  //If the user presses the left arrow key
  else if (e.keyCode == 37){
    backward5Seconds();
  }
  else if (e.keyCode == 70 || e.keyCode == 102) {
    fullscreen();
  }
  //If the user presses the space key
  else if (e.keyCode == 32){
    e.preventDefault();
    if (isPlaying(document.getElementById("video"))){
      pause();
    } else{
      play();
    }
  }
});

var myModal = document.getElementById('myModal')
var myInput = document.getElementById('myInput')

myModal.addEventListener('shown.bs.modal', function () {
  myInput.focus()
})