//Sets the video source to the given path
function setSource(src){
  console.log("CHANGING SOURCE TO " + src);
  var source = document.getElementById("videoSource");
  var video = document.getElementById("video");
  var sourceText = document.getElementById("sourceText");
  videoSource.setAttribute("src", src);
  videoSource.setAttribute('type', 'video/mp4');
  video.load();
  video.play();
}