const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("SetProblem.ejs");
});

router.post("/", (req, res) => {
  const { problemName } = req.body;

  const problemStatement = req.files["problemStatement"][0];
  const inputFile = req.files["inputFile"][0];
  const outputFile = req.files["outputFile"][0];

  //  file uploaded

  if (!problemStatement || !inputFile || !outputFile) {
    return res.status(400).send("Please upload all required files.");
  }

  const problemStatementData = fs.readFileSync(problemStatement.path);
  
  const inputDir = path.join(__dirname, "../files/Input/");
  const outputDir = path.join(__dirname, "../files/Output/");

  // Ensure directories exist
  // fs.mkdirSync(inputDir, { recursive: true });
  // fs.mkdirSync(outputDir, { recursive: true });

  const inputFilePath = path.join(inputDir, inputFile.originalname);
  const outputFilePath = path.join(outputDir, outputFile.originalname);
  console.log(inputFilePath);
  // Save the input and output files to their respective directories
  fs.renameSync(inputFile.path, inputFilePath);
  fs.renameSync(outputFile.path, outputFilePath);

  const query = "INSERT INTO problems SET ?";
  const values = {
    name: problemName,
    problemStatementPDF: problemStatementData,
    // inputFilePath: inputFilePath, 
    // outputFilePath: outputFilePath, 
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
