var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const multer = require("multer"); // Import multer

const db = require("./db");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var problemsRouter = require("./routes/problems");
var setProblemRouter = require("./routes/setProblem");

var app = express();

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "problemStatement") {
      cb(null, "./files/pdf/");
    } else if (file.fieldname === "inputFile") {
      cb(null, "./files/Input/");
    } else if (file.fieldname === "outputFile") {
      cb(null, "./files/Output/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Multer middleware for file uploads
const upload = multer({ storage });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "files")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/problems", problemsRouter);

// Pass multer to the setProblemRouter
app.use(
  "/setProblem",
  upload.fields([
    { name: "problemStatement", maxCount: 1 },
    { name: "inputFile", maxCount: 1 },
    { name: "outputFile", maxCount: 1 },
  ]),
  setProblemRouter
);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Running on port ${port}`);
});

module.exports = app;
