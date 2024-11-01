const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const multer = require("multer");
const session = require("express-session");
const createError = require("http-errors");

const db = require("./db");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const problemsRouter = require("./routes/problems");
const setProblemRouter = require("./routes/setProblem");
const adminRouter = require("./routes/admin");
const admin_loginRouter = require("./routes/admin_login");

const app = express();

app.use(
  session({
    secret: "06172833",
    resave: false,
    saveUninitialized: false,
  })
);

// Set up storage for file uploads

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folders = {
      problemStatement: "./files/pdf/",
      inputFile: "./files/Input/",
      outputFile: "./files/Output/",
    };
    cb(null, folders[file.fieldname]);
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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "files")));

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/problems", problemsRouter);
app.use("/admin_login", admin_loginRouter);

app.use(
  "/admin",
  (req, res, next) => {
    if (!req.session.isAdmin) {
      return res.redirect("/admin_login");
    }
    next();
  },
  adminRouter
);

app.use(
  "/setProblem",
  (req, res, next) => {
    if (!req.session.isAdmin) {
      return res.redirect("/admin_login");
    }
    next();
  },
  upload.fields([
    { name: "problemStatement", maxCount: 1 },
    { name: "inputFile", maxCount: 1 },
    { name: "outputFile", maxCount: 1 },
  ]),
  setProblemRouter
);

// Error Handling
app.use((req, res, next) => next(createError(404)));

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500).render("error");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));

module.exports = app;
