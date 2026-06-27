require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const recordsRouter = require("./routes/records");
const uploadRouter = require("./routes/upload");
const formRouter = require("./routes/form");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/records", recordsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/form", formRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
