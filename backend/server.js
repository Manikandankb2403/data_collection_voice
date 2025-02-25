require("dotenv").config(); // Load environment variables

const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("📁 Server initialized. Data and uploads folders are set up.");

// Routes
const textRoutes = require("./routes/textRoutes");
const audioRoutes = require("./routes/audioRoutes");

app.use("/texts", textRoutes);
app.use("/audio", audioRoutes);

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});