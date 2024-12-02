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

  // Check if all required files are uploaded
  if (!problemStatement || !inputFile || !outputFile) {
    return res.status(400).send("Please upload all required files.");
  }

  const problemStatementData = fs.readFileSync(problemStatement.path);

  // Insert problem into the database and get the problem ID
  const query = "INSERT INTO problems SET ?";
  const values = {
    name: problemName,
    problemStatementPDF: problemStatementData,
    Status: 0,
  };

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error saving problem in the database:", err);
      return res.status(500).send("Database error.");
    }

    const problemId = result.insertId; // Get the auto-generated problem ID

    // Define file paths with problem ID
    const tmpDir = path.join(__dirname, "../temp/");
    const inputFilePath = path.join(tmpDir, `input_${problemId}.txt`);
    const outputFilePath = path.join(tmpDir, `output_${problemId}.txt`);

    // Ensure the tmp directory exists
    fs.mkdirSync(tmpDir, { recursive: true });

    // Move the input and output files to their respective paths
    fs.renameSync(inputFile.path, inputFilePath);
    fs.renameSync(outputFile.path, outputFilePath);

    // Respond with success
    res.status(200).send("Problem and files uploaded successfully.");
  });
});

module.exports = router;
