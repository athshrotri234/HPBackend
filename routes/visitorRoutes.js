const express = require("express");
const router = express.Router();

const {
  createVisitor,
  getAllVisitors,
  deleteVisitor,
} = require("../controllers/visitorController");

router.post("/", createVisitor);
router.get("/", getAllVisitors);
router.delete("/:id", deleteVisitor);

module.exports = router;
