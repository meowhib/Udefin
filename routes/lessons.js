const express = require("express");
const router = express.Router();

const lessonsController = require("../controllers/lessons");

router.get("/", async (req, res) => lessonsController.getLessons(req, res));

//Provides information about the lesson (name, length, progress)
router.get("/:id", async (req, res) => lessonsController.getLesson(req, res));

//Update the progress of the lesson
router.put("/:id", async (req, res) => lessonsController.editLesson(req, res));

router.delete("/:id", async (req, res) => lessonsController.deleteLesson(req, res));

module.exports = router;