const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const cors = require("cors");

//Require controller modules
const coursesController = require("../controllers/courses");

//Renders courses page
router.get("/", async (req, res) => coursesController.getCourses(req, res));

//Renders course page
router.get("/:id", async (req, res) => coursesController.getCourse(req, res));

//Renders course edit page
router.put("/:id", async (req, res) => coursesController.editCourse(req, res));

//Deletes course
router.delete("/:id", async (req, res) => coursesController.deleteCourse(req, res));

module.exports = router;