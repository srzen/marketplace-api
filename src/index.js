// index.js: Express application setup and middleware/route registration.

require("dotenv").config();

const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const app = express();
const port = process.env.PORT || 3000;
const pool = require("./db/pool");
const connectMongo = require("./db/mongoConnection");

const vendorRoutes = require("./routes/vendors");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");

app.use(express.json());

app.get("/api/health", function (req, res) {
  res.status(200).send({
    status: "ok",
  });
});

app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

// No route matched
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Unexpected errors
app.use(errorHandler);

// Try to verify the database connection
async function connectDatabase() {
  await pool.query("SELECT 1");
  console.log("[DB] Connected to MySQL database");
}

// Start the server if the DB connection is verified.
async function startServer() {
  try {
    await connectDatabase();
    await connectMongo();
    app.listen(port, function () {
      console.log("[SERVER] Listening on port", port);
    });
  } catch (error) {
    console.error("[SERVER] Server couldn't start correctly", error);
    process.exit(1);
  }
}

startServer();
