const express = require("express");
const db = require("../db");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const router = express.Router();

//  temp

const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

//  list  problems
router.get("/", (req, res) => {
  db.query("SELECT * FROM problems", (err, results) => {
    if (err) {
      console.error("Error fetching problems:", err);
      return res.status(500).send("Database error.");
    }
    res.render("ProblemList.ejs", { problems: results });
  });
});

//
router.get("/problem/:id", (req, res) => {
  const problemId = req.params.id;
  db.query(
    "SELECT * FROM problems WHERE id = ?",
    [problemId],
    (err, results) => {
      if (err) {
        console.error("Error fetching problem:", err);
        return res.status(500).send("Database error.");
      }
      if (results.length === 0) {
        return res.status(404).send("Problem not found.");
      }

      const problem = results[0];
      const pdfBuffer = problem.problemStatementPDF;

      res.render("ProblemStatement.ejs", { problem, pdfBuffer });
    }
  );
});

router.post("/submit", (req, res) => {
  const { language, submission } = req.body;
  const problemId = req.query.id;
  console.log(req.body);
  //

  const inputFilePath = path.join(tempDir, `input_${problemId}.txt`);
  const expectedOutputPath = path.join(tempDir, `output_${problemId}.txt`);
  const userOutputPath = path.join(tempDir, "user_output.txt");

  const fileExtension = language === "python" ? "py" : "cpp";
  const submissionFilePath = path.join(tempDir, `submission.${fileExtension}`);

  console.log("Submission Data:", submission);

  fs.writeFile(submissionFilePath, submission, (err) => {
    if (err) {
      console.error("Error writing submission file:", err);
      return res.status(500).send("Failed to save submission.");
    }

    const command =
      language === "python"
        ? `python3 ${submissionFilePath} < ${inputFilePath} > ${userOutputPath}`
        : `g++ ${submissionFilePath} -o ${tempDir}/submission && ${tempDir}/submission < ${inputFilePath} > ${userOutputPath}`;
    // execute in bash

    exec(command, { timeout: 2000 }, async (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          // The process was terminated due to exceeding the time limit
          console.error("Execution time limit exceeded.");
          cleanUp([submissionFilePath, userOutputPath]);
          return res
            .status(400)
            .send("<h1 align='center'>Time Limit Exceed</h1>");
        }
        console.error("Execution error:", stderr);
        const message = stderr || "Compilation Error";
        cleanUp([submissionFilePath, userOutputPath]);
        return res.status(400).send(`<h1 align='center'>${message}</h1>`);
      }

      try {
        const userOutput = (
          await fs.promises.readFile(userOutputPath, "utf-8")
        ).trim();
        const expectedOutput = (
          await fs.promises.readFile(expectedOutputPath, "utf-8")
        ).trim();

        if (userOutput === expectedOutput) {
          res.send("<h1 align='center'>Accepted</h1>");
        } else {
          res.send("<h1 align='center'>Wrong Answer</h1>");
        }
      } catch (fileError) {
        console.error("Error reading output files:", fileError);
        res.status(500).send("<h1 align='center'>Internal Server Error</h1>");
      } finally {
        cleanUp([submissionFilePath, userOutputPath]);
      }
    });
  });
});

function cleanUp(files) {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

module.exports = router;
