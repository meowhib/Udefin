const express = require("express");
const router = express.Router();
const fs = require("fs");

const Lesson = require("../models/lesson");

//Serve the video
router.get("/:lessonid", async (req, res) => {
  const lessonPath = await Lesson.findOne({_id: req.params.lessonid});
  const range = req.headers.range;
  if (!range) {
    return res.status(400).send("Requires Range header" + "\n" + lessonPath.path);
  }

  const videoPath = lessonPath.path;
  const videoSize = fs.statSync(videoPath).size;
  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

module.exports = router;