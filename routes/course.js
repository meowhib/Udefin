const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Course = require("../models/course")

// Serve all available courses
// Should return a list of scanned and unscanned courses
// Gets a list of folders and compare them to the ones in the databse
router.get("/", async (req, res) => {
    try {
        const courses = await Course.find({});

        res.status(200).send(courses);
    } catch (e) {
        res.status(500).send("Server error!")
    }
});

// Rescans a course given its name (folder name)
router.post("/:name/rescan", (req, res) => {

});

// Edits a course by its name (folder name)
router.put("/:name/update", (req, res) => {

});

// Deletes a course (folder) given its name (folder name)
router.delete("/:name/delete", (req, res) => {

});

module.exports = router;