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
  const video = document.getElementById("video");

  if (e.keyCode == 32 && document.activeElement != video){
    //Prevent the default action of the spacebar
    e.preventDefault();

    // if video is not in focus
    if (document.activeElement != video){
      //Focus the video
      video.focus();
      //If the video is playing, pause it
      if (isPlaying(video)){
        pause();
      } else {
        play();
      }
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
    if (document.fullscreenElement){
      closeFullscreen();
    } else {
      fullscreen();
    }
  }

  //If the user presses the escape key, close the fullscreen
  if (e.keyCode == 27){
    closeFullscreen();
  }

  //If the user presses the up arrow key, increase the volume
  if (e.keyCode == 38){
    video.volume += 0.1;
  }

  //If the user presses the down arrow key, decrease the volume
  if (e.keyCode == 40){
    video.volume -= 0.1;
  }

  //If the user presses a number key, jump to that part of the video
  if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105){
    var number = e.keyCode >= 48 && e.keyCode <= 57 ? e.keyCode - 48 : e.keyCode - 96;
    var duration = video.duration;
    var time = duration * (number / 10);
    video.currentTime = time; 
  }

  //If the user presses the m key, mute the video
  if (e.keyCode == 77){
    video.muted = !video.muted;
  }
});