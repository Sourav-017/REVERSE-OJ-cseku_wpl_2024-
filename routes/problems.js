const express = require("express");
const db = require("../db");
const router = express.Router();

// Route to list all problems
router.get("/", (req, res) => {
  db.query("SELECT * FROM problems", (err, results) => {
    if (err) {
      console.error("Error fetching problems:", err);
      return res.status(500).send("Database error.");
    }
    res.render("ProblemList.ejs", { problems: results });
  });
});

// Add a route for viewing a specific problem statement
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

      // Pass the BLOB file along with the problem details
      const problem = results[0];
      const pdfBuffer = problem.problemStatementPDF; // Assuming your BLOB column is named `problemStatementPDF`

      res.render("ProblemStatement.ejs", { problem, pdfBuffer });
    }
  );
});

module.exports = router;
