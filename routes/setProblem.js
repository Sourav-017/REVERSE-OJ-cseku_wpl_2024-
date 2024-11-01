const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const router = express.Router();

// Route to serve the form for setting a problem
router.get("/", (req, res) => {
  res.render("SetProblem.ejs");
});

// Route to handle file uploads for setting a problem
router.post("/", (req, res) => {
  const { problemName } = req.body;

  // Get the uploaded files from multer
  const problemStatement = req.files["problemStatement"][0];
  const inputFile = req.files["inputFile"][0];
  const outputFile = req.files["outputFile"][0];

  // Check if files were uploaded
  if (!problemStatement || !inputFile || !outputFile) {
    return res.status(400).send("Please upload all required files.");
  }

  // Save problem statement PDF in MySQL as binary data
  const problemStatementData = fs.readFileSync(problemStatement.path);

  // Define directory for saving the input and output files
  const inputDir = path.join(__dirname, "../files/Input/");
  const outputDir = path.join(__dirname, "../files/Output/");

  // Ensure directories exist
  // fs.mkdirSync(inputDir, { recursive: true });
  // fs.mkdirSync(outputDir, { recursive: true });

  // Define paths for saving the input and output files
  const inputFilePath = path.join(inputDir, inputFile.originalname);
  const outputFilePath = path.join(outputDir, outputFile.originalname);
  console.log(inputFilePath);
  // Save the input and output files to their respective directories
  fs.renameSync(inputFile.path, inputFilePath);
  fs.renameSync(outputFile.path, outputFilePath);

  // Prepare values for saving in the database
  const query = "INSERT INTO problems SET ?";
  const values = {
    name: problemName,
    problemStatementPDF: problemStatementData,
    // inputFilePath: inputFilePath, // Save the input file path
    // outputFilePath: outputFilePath, // Save the output file path
  };

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error saving problem in the database:", err);
      return res.status(500).send("Database error.");
    }

    res.status(200).send("Problem and files uploaded successfully.");
  });
});

module.exports = router;
