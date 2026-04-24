const express = require("express");
require("dotenv").config();
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.json({ message: "server is running" });
});

app.listen(process.env.PORT);

