const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const db = require("../db"); // Assuming db setup is in a separate module

// Temporary directory to store files
const tempDir = path.join(__dirname, "../temp");

// Route to fetch contest standings
router.get("/:contest_id/standings", async (req, res) => {
  const contestId = req.params.contest_id;

  const query = `
    SELECT 
        u.id AS user_id, 
        u.name AS user_name,
        COUNT(DISTINCT s.problem_id) AS unique_problems_solved,
        SUM(s.execution_time) AS total_execution_time,
        COUNT(s.problem_id) AS total_submissions
    FROM 
        submissions s
    JOIN 
        users u ON s.user_id = u.id
    WHERE 
        s.contest_id = ? AND s.status = 'AC'
    GROUP BY 
        u.id
    ORDER BY 
        unique_problems_solved DESC, total_execution_time ASC
  `;

  // Execute the query to get standings
  db.query(query, [contestId], (err, results) => {
    if (err) {
      console.error("Error fetching standings:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log("Standings data:",results);

    // Check if results is an array and has data
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).send("No standings found for this contest.");
    }

    // Fetch contest details to pass to the view
    db.query('SELECT * FROM contests WHERE id = ?', [contestId], (err, contestData) => {
      if (err) {
        return res.status(500).send("Error fetching contest data.");
      }

      if (!contestData.length) {
        return res.status(404).send("Contest not found.");
      }

      const contest = contestData[0]; // Assuming contestData returns an array

      // Pass contest details and standings to the view
      res.render("editContest", {
        contest: contest, // Now passing the actual contest details
        standings: results,
        problems: problems,
        assignedProblemsIds: assignedProblemsIds,

      });
    });
  });
});

// Route to handle problem submissions
router.post("/:contest_id/problems/:problem_id/submit", (req, res) => {
  const contestId = req.params.contest_id;
  const problemId = req.params.problem_id;
  const userId = req.session.user.id; // Assuming user is authenticated

  // Check if user is logged in
  if (!userId) {
    return res.status(403).send("You must be logged in to submit a solution.");
  }

  const { language, submission } = req.body;
  console.log("Submission Data:", req.body);

  // Get paths for input and expected output files
  const inputFilePath = path.join(tempDir, `input_${problemId}.txt`);
  const expectedOutputPath = path.join(tempDir, `output_${problemId}.txt`);
  const userOutputPath = path.join(tempDir, "user_output.txt");

  const fileExtension = language === "python" ? "py" : "cpp";
  const submissionFilePath = path.join(tempDir, `submission.${fileExtension}`);

  // Save the submission code to a temporary file
  fs.writeFile(submissionFilePath, submission, (err) => {
    if (err) {
      console.error("Error writing submission file:", err);
      return res.status(500).send("Failed to save submission.");
    }

    // Determine the command based on the language
    let command;
    if (language === "python") {
      command = `python3 ${submissionFilePath} < ${inputFilePath} > ${userOutputPath}`;
    } else if (language === "cpp") {
      command = `g++ ${submissionFilePath} -o ${tempDir}/submission && ${tempDir}/submission < ${inputFilePath} > ${userOutputPath}`;
    } else {
      command = `gcc ${submissionFilePath} -o ${tempDir}/submission && ${tempDir}/submission < ${inputFilePath} > ${userOutputPath}`;
    }

    // Execute the command to run the submission
    exec(command, { timeout: 2000 }, async (error, stdout, stderr) => {
      let statusMessage = "";
      let statusCode = "";

      if (error) {
        if (error.killed) {
          // Execution time limit exceeded
          console.error("Execution time limit exceeded.");
          statusMessage = "Time Limit Exceeded";
          statusCode = "TLE";
          cleanUp([submissionFilePath, userOutputPath]);
          return res
            .status(400)
            .send("<h1 align='center'>Time Limit Exceeded</h1>");
        }
        console.error("Execution error:", stderr);
        statusMessage = "Compilation Error";
        statusCode = "CE";
        cleanUp([submissionFilePath, userOutputPath]);
        return res
          .status(400)
          .send("<h1 align='center'>Compilation Error</h1>");
      }

      try {
        const userOutput = (
          await fs.promises.readFile(userOutputPath, "utf-8")
        ).trim();
        const expectedOutput = (
          await fs.promises.readFile(expectedOutputPath, "utf-8")
        ).trim();

        // Check if the output matches
        if (userOutput === expectedOutput) {
          statusMessage = "Accepted";
          statusCode = "AC";
          // Save the submission in the database with status as "Accepted"
          db.execute(
            `INSERT INTO submissions (contest_id, problem_id, user_id, status, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [contestId, problemId, userId, statusCode],
            (error) => {
              if (error) {
                console.error("Error saving submission:", error);
                return res.status(500).send("Failed to submit solution");
              }

              res.send("<h1 align='center'>Accepted</h1>");
            }
          );
        } else {
          statusMessage = "Wrong Answer";
          statusCode = "WA";
          // Save the submission in the database with status as "Wrong Answer"
          db.execute(
            `INSERT INTO submissions (contest_id, problem_id, user_id, status, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [contestId, problemId, userId, statusCode],
            (error) => {
              if (error) {
                console.error("Error saving submission:", error);
                return res.status(500).send("Failed to submit solution");
              }

              res.send("<h1 align='center'>Wrong Answer</h1>");
            }
          );
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

// Helper function to clean up temporary files
function cleanUp(files) {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

module.exports = router;
