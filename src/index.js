// index.js

require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/api/health", function (req, res) {
  res.status(200).send({
    status: "ok",
  });
});

app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
