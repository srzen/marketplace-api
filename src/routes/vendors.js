// vendors.js

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "List all vendors" });
});

router.get("/:id", (req, res) => {
  if (req.params.id === "999") {
    return res
      .status(404)
      .json({ error: "Vendor not found", id: req.params.id });
  }
  res.status(200).json({ message: "Get vendor by ID", id: req.params.id });
});

router.post("/", (req, res) => {
  if (!req.body || !req.body.name) {
    return res
      .status(400)
      .json({ error: 'Body missing required "name" field' });
  }
  res.status(201).json({ message: "Create a vendor" });
});

router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Update a vendor", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Delete a vendor", id: req.params.id });
});

module.exports = router;
