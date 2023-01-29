const express = require("express");
const router = express.Router();

const resourcesController = require("../controllers/resources");

//Get all resources
router.get("/", async (req, res) => resourcesController.getResources(req, res));

//Get a specific resource
router.get("/:id", async (req, res) => resourcesController.getResource(req, res));

//Get all resources for a specific lesson
router.get("/lesson/:id", async (req, res) => resourcesController.getResourcesForLesson(req, res));

router.delete("/:id", async (req, res) => resourcesController.deleteResource(req, res));

module.exports = router;