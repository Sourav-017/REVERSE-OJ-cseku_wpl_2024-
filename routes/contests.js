const express = require("express");
const router = express.Router();
const db = require("../db");
const moment = require("moment"); 
// Fetch the list of contests
router.get("/", (req, res) => {
  const userId = req.session.user.id;
  console.log(userId);
  if (!userId) {
    return res
      .status(403)
      .send("<h1 align='center'>You must be logged in to view contests.</h1>");
  }

  // Fetch all contests
  db.execute("SELECT * FROM contests", (error, contests) => {
    if (error) {
      return res.status(500).send("An error occurred while fetching contests.");
    }

    // Fetch contests the user is registered for
    db.execute(
      "SELECT contest_id FROM contest_participants WHERE user_id = ?",
      [userId],
      (error, registered) => {
        if (error) {
          return res
            .status(500)
            .send("An error occurred while checking registration status.");
        }

        // Create an array of contest IDs the user is registered for
        const registeredContests = registered.map((row) => row.contest_id);

        // Render contests with registration data
        res.render("contestList", {
          contests,
          registeredContests,
          session: req.session,
        });
      }
    );
  });
});

router.post("/register", (req, res) => {
  const contestId = req.body.contestId;
  const userId = req.session.user.id; // Assuming session management is set up
  console.log(contestId);
  console.log(userId);

  if (!userId) {
    return res
      .status(403)
      .send("<h1 align='center'>You must be logged in to register.</h1>");
  }

  // Check if the user is already registered
  db.execute(
    `
      SELECT * FROM contest_participants 
      WHERE contest_id = ? AND user_id = ?
    `,
    [contestId, userId],
    (error, results) => {
      if (error) {
        return res.status(500).send("An error occurred during registration.");
      }
      if (results.length > 0) {
        return res
          .status(409)
          .send(
            "<h1 align='center'>You are already registered for this contest.</h1>"
          );
      }

      // Insert registration entry
      db.execute(
        `
          INSERT INTO contest_participants (contest_id, user_id) 
          VALUES (?, ?)
        `,
        [contestId, userId],
        (error) => {
          if (error) {
            return res
              .status(500)
              .send("An error occurred while registering for the contest.");
          }
          res.redirect("/contests");
        }
      );
    }
  );
});
router.get("/:id", (req, res) => {
  const contestId = req.params.id;

  db.execute(
    `
      SELECT id, name, start_time, end_time, status 
      FROM contests 
      WHERE id = ?
    `,
    [contestId],
    (error, contestDetails) => {
      if (error) {
        console.error("Error fetching contest details:", error);
        return res.status(500).send("Failed to fetch contest details");
      }

      if (contestDetails.length === 0) {
        return res.status(404).send("Contest not found");
      }

      const contest = contestDetails[0];
      const currentTime = new Date();

      // Check if the contest has started or is over
      if (currentTime < new Date(contest.start_time)) {
        return res
          .status(403)
          .send("<h1 align = 'center'>Contest has not started yet.</h1>");
      }

      db.execute(
        `
          SELECT problem_id, problem_order 
          FROM contest_problems 
          WHERE contest_id = ?
          ORDER BY problem_order
        `,
        [contestId],
        (error, contestProblems) => {
          if (error) {
            console.error("Error fetching contest problems:", error);
            return res.status(500).send("Failed to fetch contest problems");
          }

          const problemIds = contestProblems.map((cp) => cp.problem_id);

          if (problemIds.length === 0) {
            return res.render("contestDetails", {
              contest: contest,
              problems: [],
              session: req.session,
            });
          }

          const placeholders = problemIds.map(() => "?").join(",");

          db.execute(
            `
              SELECT id, name 
              FROM problems 
              WHERE id IN (${placeholders})
            `,
            problemIds,
            (error, problems) => {
              if (error) {
                console.error("Error fetching problems:", error);
                return res.status(500).send("Failed to fetch problem details");
              }

              res.render("contestDetails", {
                contest: contest,
                problems: problems,
                session: req.session,
              });
            }
          );
        }
      );
    }
  );
});

// Register user for a contest
router.get("/:id/register", (req, res) => {
  console.log("Entered to reg.");
  const contestId = req.params.id;
  const userId = req.session.userId;

  if (!userId) {
    return res
      .status(403)
      .send(
        "<h1 align = 'center'> You must be logged in to register for a contest.</h1>"
      );
  }

  db.execute(
    `
      INSERT INTO contest_participants (contest_id, user_id, registration_time)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE registration_time = NOW()
    `,

    [contestId, userId],
    (error) => {
      if (error) {
        console.error("Error registering for contest:", error);
        return res.status(500).send("Failed to register for contest");
      }

      res.redirect(`/contests/${contestId}`);
    }
  );
});

router.get("/:contest_id/problems/:problem_id", (req, res) => {
  const contestId = req.params.contest_id;
  const problemId = req.params.problem_id;
  const userId = req.session.user?.id; // Use optional chaining to avoid crashes if `user` is undefined

  // Check if the user is logged in
  if (!userId) {
    return res
      .status(403)
      .send("<h1 align='center'>You must be logged in.</h1>");
  }

  // Check if the user is registered for the contest
  db.execute(
    `
      SELECT * FROM contest_participants 
      WHERE contest_id = ? AND user_id = ?
    `,
    [contestId, userId],
    (error, results) => {
      if (error || results.length === 0) {
        return res.status(403).send("You are not registered for this contest.");
      }

      // Fetch the problem details
      db.query(
        "SELECT * FROM problems WHERE id = ?",
        [problemId],
        (err, problemResults) => {
          if (err) {
            console.error("Error fetching problem:", err);
            return res.status(500).send("Database error.");
          }
          if (problemResults.length === 0) {
            return res.status(404).send("Problem not found.");
          }

          const problem = problemResults[0];

          // Assuming `problemStatementPDF` is stored as a buffer or needs to be loaded
          const pdfBuffer = problem.problemStatementPDF || null; // Ensure we handle missing PDFs

          // Render the contest problem page
          res.render("contestProblem.ejs", {
            contestId, // Pass contest ID to the template
            problem,
            pdfBuffer,
            session: req.session, // Include session details for user info
          });
        }
      );
    }
  );
});

// Submission route for contest problems
router.post("/:contest_id/problems/:problem_id/submit", (req, res) => {
  const contestId = req.params.contest_id;
  const problemId = req.params.problem_id;
  const userId = req.session.userId;
  const { code } = req.body;

  if (!userId) {
    return res.status(403).send("You must be logged in to submit a solution.");
  }

  // Check if user is registered and contest is active

  db.execute(
    `
      SELECT * FROM contests 
      WHERE id = ? AND NOW() BETWEEN start_time AND end_time
    `,
    [contestId],
    (error, contests) => {
      if (error || contests.length === 0) {
        return res.status(403).send("Contest is not active or not found.");
      }

      // Save submission to contest_submissions table
      db.execute(
        `
          INSERT INTO contest_submissions (contest_id, problem_id, user_id, code, submission_time)
          VALUES (?, ?, ?, ?, NOW())
        `,
        [contestId, problemId, userId, code],
        (error) => {
          if (error) {
            console.error("Error saving submission:", error);
            return res.status(500).send("Failed to submit solution");
          }

          res.redirect(`/contests/${contestId}`);
        }
      );
    }
  );
});

module.exports = router;
