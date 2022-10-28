//Sets the video source to the given path
function setSource(src){
  //Fetch lesson data
  fetch("/lesson/" + src.split("/")[src.split("/").length - 1])
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    console.log(data);
  });

  var source = document.getElementById("videoSource");
  var video = document.getElementById("video");
  var sourceText = document.getElementById("sourceText");
  var videoTitle = document.getElementById("videoTitle");
  videoSource.setAttribute("src", src);
  videoSource.setAttribute('type', 'video/mp4');
  video.load();
  video.play();
  videoTitle.innerHTML = data.lesson.name;
}

function updateProgress(){
  //send post request to /progress with the given progress
  const videoSource = document.getElementById("videoSource").src;

  if (videoSource != ""){
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

const interval = setInterval(updateProgress, 5000);