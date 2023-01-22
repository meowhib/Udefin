var video = document.getElementById("video");

//Changes the video based on the given lessonId
function setSource(src){
  //Fetch lesson data
  fetch("/lessons/" + src.split("/")[src.split("/").length - 1])
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    var video = document.getElementById("video");
    var videoTitle = document.getElementById("videoTitle");
    var videoTrack = document.getElementById("myTrack");

    videoSource.setAttribute("src", src);
    videoSource.setAttribute('type', 'video/mp4');
    video.load();
    video.play();
    videoTitle.innerHTML = data.name;
    videoTrack.setAttribute("src", data.subtitlePath);
    console.log(data.progress);
    video.currentTime = data.progress;
    video.focus();
  });
}

function fullscreen(){
  const video = document.getElementById("video");

  if (video.requestFullscreen) {
    video.requestFullscreen();
  } else if (video.webkitRequestFullscreen) { /* Safari */
    video.webkitRequestFullscreen();
  } else if (video.msRequestFullscreen) { /* IE11 */
    video.msRequestFullscreen();
  }
}

function closeFullscreen(){
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
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
    console.log(lessonId);
    const currentTime = Math.round(video.currentTime);
    
    //Send the progress to the server
    fetch("/lessons/progress?lessonId=" + lessonId + "&progress=" + currentTime, {
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

//Checks if the video is playing
function isPlaying(video) {
  return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
}

//Event listeners

//Updates the progress when the video position changes
video.addEventListener("timeupdate", updateProgress);

//Pause the video when the user presses the spacebar
document.addEventListener("keydown", function(e){
  if (e.keyCode == 32 && document.activeElement != video){
    if (isPlaying(video)){
      pause();
    } else {
      play();
    }
  }

  if (e.keyCode == 37 && document.activeElement != video){
    e.preventDefault();
    backward5Seconds();
  }

  if (e.keyCode == 39 && document.activeElement != video){
    e.preventDefault();
    forward5Seconds();
  }

  if (e.keyCode == 70){
    fullscreen();
  }
});