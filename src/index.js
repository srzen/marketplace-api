// index.js

require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const vendorRoutes = require("./routes/vendors");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

app.use(express.json());

app.get("/api/health", function (req, res) {
  res.status(200).send({
    status: "ok",
  });
});

app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.listen(port, function () {
  console.log("Server listening on PORT", port);
});
