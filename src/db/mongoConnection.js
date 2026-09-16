// mongoConnection.js

const mongoose = require("mongoose");

const conn = mongoose.connection;

conn.on("connected", () => {
  console.log("[DB] MongoDB connection successfully established");
});

conn.on("error", (err) => {
  console.error(
    `[DB] MongoDB connection-related error occurred: ${err.message}`,
  );
});

conn.on("disconnected", () => {
  console.warn("[DB] MongoDB connection was lost/disconnected");
});

async function connectMongo() {
  await mongoose.connect(process.env.MONGO_URI);
}

module.exports = connectMongo;
