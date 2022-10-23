function setSource(){
  var source = document.getElementById("videoSource");
  var video = document.getElementById("video");
  var sourceText = document.getElementById("sourceText");
  sourceText.innerHTML = source.value;
}