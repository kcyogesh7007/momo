const express = require("express");
const app = express();
const connectDB = require("./database/database");
const authRoute = require("./routes/authRoute");

require("dotenv").config();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("", authRoute);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
