const mongoose = require("mongoose");
const config = require("../utils/config");

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  try {
    const conn = await mongoose.connect(config.MONGO_URI);

    if (process.env.NODE_ENV !== "test") {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;