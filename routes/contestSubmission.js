const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const db = require("../db"); // Assuming db setup is in a separate module

// Temporary directory to store files
const tempDir = path.join(__dirname, "../temp");

router.get("/:contest_id/standings", async (req, res) => {
  const contestId = req.params.contest_id;

  const query = `
    SELECT 
        cp.user_id,
        u.name AS user_name,
        COALESCE(COUNT(DISTINCT s.problem_id), 0) AS unique_problems_solved,
        COALESCE(SUM(s.status = 'AC'), 0) AS score,
        COALESCE(COUNT(s.problem_id), 0) AS total_submissions,
        GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') AS solved_problems
    FROM 
        contest_participants cp
    LEFT JOIN 
        user u ON cp.user_id = u.id
    LEFT JOIN 
        submissions s ON cp.user_id = s.user_id AND s.contest_id = ? AND s.status = 'AC'
    LEFT JOIN 
        problems p ON s.problem_id = p.id
    WHERE 
        cp.contest_id = ?
    GROUP BY 
        cp.user_id
    ORDER BY 
        unique_problems_solved DESC, 
        score DESC, 
        u.name
  `;

  // Execute the query to get standings
  db.query(query, [contestId, contestId], (err, results) => {
    if (err) {
      console.error("Error fetching standings:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).send("No standings found for this contest.");
    }

    // Render standings with contest and participant data
    res.render("contest_standings", {
      contest: { id: contestId, name: "" }, // Replace with actual contest data if available
      standings: results,
    });
  });
});

// Submission queue

// Queue to hold submission requests
const submissionQueue = [];
let isProcessing = false;

// Function to process a single submission
async function processSubmission(submissionData) {
  const { contestId, problemId, userId, language, submissionCode, res } =
    submissionData;

  try {
    // Ensure temp directory exists
    await fs.promises.mkdir(tempDir, { recursive: true });

    const fileExtension = language === "python" ? "py" : "cpp";
    const submissionFilePath = path.join(
      tempDir,
      `submission_${userId}.${fileExtension}`
    );
    const inputFilePath = path.join(tempDir, `input_${problemId}.txt`);
    const expectedOutputPath = path.join(tempDir, `output_${problemId}.txt`);
    const userOutputPath = path.join(tempDir, `user_output_${userId}.txt`);

    // Save the submission code to a temporary file
    await fs.promises.writeFile(submissionFilePath, submissionCode);

    // Prepare the command based on the language
    let command;
    if (language === "python") {
      command = `timeout 3s python3 ${submissionFilePath} < ${inputFilePath} > ${userOutputPath}`;
    } else if (language === "cpp") {
      command = `g++ ${submissionFilePath} -o ${tempDir}/submission_${userId} && timeout 3s ${tempDir}/submission_${userId} < ${inputFilePath} > ${userOutputPath}`;
    } else {
      throw new Error("Unsupported language");
    }

    // Execute the command to run the submission
    exec(command, { timeout: 2000 }, async (error, stdout, stderr) => {
      let statusMessage = "";
      let statusCode = "";

      if (error) {
        if (error.killed) {
          console.error("Execution time limit exceeded.");
          statusMessage = "Time Limit Exceeded";
          statusCode = "TLE";
        } else {
          console.error("Execution error:", stderr);
          statusMessage = "Runtime Error";
          statusCode = "RTE";
        }

        // Save the TLE or RTE result in the database
        await saveSubmissionResult(
          contestId,
          problemId,
          userId,
          statusCode,
          res,
          `<h1 align='center'>${statusMessage}</h1>`
        );
        return;
      }

      try {
        const userOutput = (
          await fs.promises.readFile(userOutputPath, "utf-8")
        ).trim();
        const expectedOutput = (
          await fs.promises.readFile(expectedOutputPath, "utf-8")
        ).trim();

        if (userOutput === expectedOutput) {
          statusMessage = "Accepted";
          statusCode = "AC";
        } else {
          statusMessage = "Wrong Answer";
          statusCode = "WA";
        }

        // Save the submission result in the database
        await saveSubmissionResult(
          contestId,
          problemId,
          userId,
          statusCode,
          res,
          `<h1 align='center'>${statusMessage}</h1>`
        );
      } catch (fileError) {
        console.error("Error reading output files:", fileError);
        res.status(500).send("<h1 align='center'>Internal Server Error</h1>");
      } finally {
        // Clean up temporary files
        await Promise.all([
          fs.promises.unlink(submissionFilePath),
          fs.promises.unlink(userOutputPath).catch(() => {}),
        ]);
      }
    });
  } catch (err) {
    console.error("Error processing submission:", err);
    res.status(500).send("Internal Server Error");
  }
}

// Function to save submission results in the database
async function saveSubmissionResult(
  contestId,
  problemId,
  userId,
  statusCode,
  res,
  responseMessage
) {
  try {
    await db.execute(
      `
      INSERT INTO submissions (contest_id, problem_id, user_id, status, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `,
      [contestId, problemId, userId, statusCode]
    );
    res.send(responseMessage);
  } catch (error) {
    console.error("Error saving submission:", error);
    res
      .status(500)
      .send("<h1 align='center'>Failed to save submission result</h1>");
  }
}

// Function to process the queue
async function processQueue() {
  if (isProcessing || submissionQueue.length === 0) {
    return;
  }

  isProcessing = true;

  const currentSubmission = submissionQueue.shift();
  await processSubmission(currentSubmission);

  isProcessing = false;
  processQueue(); // Process the next submission
}

// Endpoint for submitting a solution
router.post("/:contest_id/problems/:problem_id/submit", (req, res) => {
  const contestId = req.params.contest_id;
  const problemId = req.params.problem_id;
  const userId = req.session.user.id; // Assuming user is authenticated

  if (!userId) {
    return res.status(403).send("You must be logged in to submit a solution.");
  }

  const { language, submission } = req.body;

  // Add the submission to the queue
  submissionQueue.push({
    contestId,
    problemId,
    userId,
    language,
    submissionCode: submission,
    res,
  });

  processQueue(); // Trigger queue processing
});

function cleanUp(files) {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

module.exports = router;
