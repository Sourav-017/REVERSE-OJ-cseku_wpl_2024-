const express = require("express");
const db = require("../db"); // Database connection
const router = express.Router();

// Route to render the main Admin dashboard page
router.get("/", (req, res) => {
  db.query("SELECT * FROM user", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).send("Database error.");
    }
    console.log(results); // Debugging: Ensure data is retrieved
    res.render("admin_dashboard.ejs", { users: results });
  });
});

// Update user details
router.post("/update-user/:id", (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;

  db.query(
    "UPDATE user SET Name = ?, Email = ? WHERE id = ?",
    [name, email, userId],
    (err, result) => {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).send("Database error.");
      }
      res.redirect("/admin");
    }
  );
});

// Delete user
router.post("/delete-user/:id", (req, res) => {
  const userId = req.params.id;

  db.query("DELETE FROM user WHERE id = ?", [userId], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).send("Database error.");
    }
    res.redirect("/admin");
  });
});

router.post("/hide-problem/:id", (req, res) => {
  const problemId = req.params.id;

  // Update the problem status in the database
  const query = "UPDATE problems SET Status = ? WHERE id = ?";
  db.query(query, [0, problemId], (err, result) => {
    if (err) {
      console.error("Error updating problem status:", err);
      return res.status(500).json({ message: "Failed to hide problem." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Problem not found." });
    }
    res.status(200).json({ message: "Problem hidden successfully." });
  });
});

router.post("/unhide-problem/:id", (req, res) => {
  const problemId = req.params.id;

  // Update the problem status in the database
  const query = "UPDATE problems SET Status = ? WHERE id = ?";
  db.query(query, [1, problemId], (err, result) => {
    if (err) {
      console.error("Error updating problem status:", err);
      return res.status(500).json({ message: "Failed to hide problem." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Problem not found." });
    }
    res.status(200).json({ message: "Problem hidden successfully." });
  });
});
// In your login route (e.g., in routes/auth.js)
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM admin WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) {
        console.error("Error logging in:", err);
        return res.status(500).send("Database error.");
      }

      if (results.length === 0) {
        return res.status(401).send("Invalid credentials.");
      }

      const user = results[0];

      req.session.userId = user.id;
      req.session.username = user.username;

      // Redirect based on role
      res.redirect("/admin");
    }
  );
});

// Route to manage users
router.get("/users", (req, res) => {
  db.query("SELECT * FROM user", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).send("Database error.");
    }
    res.render("UserManagement.ejs", { users: results });
  });
});

// Route to manage contests
router.get("/contests", (req, res) => {
  db.query("SELECT * FROM contests", (err, results) => {
    if (err) {
      console.error("Error fetching contests:", err);
      return res.status(500).send("Database error.");
    }

    res.render("contestManagement", { contests: results });
  });
});

router.get("/contests/new", (req, res) => {
  db.query("SELECT id, name FROM problems", (err, problems) => {
    if (err) {
      console.error("Error fetching problems:", err);
      return res.status(500).send("Failed to fetch problems.");
    }
    console.log(problems);
    res.render("newContest", { problems });
  });
});

// Route to handle new contest creation
// Route to create a new contest
// Create a new contest (POST)
router.post("/contests/new", (req, res) => {
  const { contest_name, status, start_time, end_time, problems } = req.body;

  // Make sure problems is an array
  const problemArray = Array.isArray(problems) ? problems : [problems];

  // Insert contest into database
  const query = `
    INSERT INTO contests (name, status, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    query,
    [contest_name, status, start_time, end_time],
    (err, result) => {
      if (err) {
        console.error("Error creating contest:", err);
        return res.status(500).send("Database error.");
      }

      const contestId = result.insertId;

      // Add selected problems to the contest
      problemArray.forEach((problemId) => {
        db.query(
          "INSERT INTO contest_problems (contest_id, problem_id) VALUES (?, ?)",
          [contestId, problemId],
          (err) => {
            if (err) console.error("Error adding problem to contest:", err);
          }
        );
      });

      res.redirect("/admin/contests");
    }
  );
});

// Display the edit contest page (GET)
router.get("/contests/:id/edit", (req, res) => {
  const contestId = req.params.id;

  // Get contest details
  db.query(
    "SELECT * FROM contests WHERE id = ?",
    [contestId],
    (err, results) => {
      if (err || results.length === 0) {
        console.error("Error fetching contest:", err);
        return res.status(500).send("Database error.");
      }

      const contest = results[0];

      // Format dates to 'YYYY-MM-DDTHH:mm'
      const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
      };

      contest.start_time = formatDate(contest.start_time);
      contest.end_time = formatDate(contest.end_time);

      // Get the list of available problems
      db.query("SELECT * FROM problems", (err, problemResults) => {
        if (err) {
          console.error("Error fetching problems:", err);
          return res.status(500).send("Database error.");
        }

        // Get the problems already assigned to the contest
        db.query(
          "SELECT problem_id FROM contest_problems WHERE contest_id = ?",
          [contestId],
          (err, contestProblems) => {
            if (err) {
              console.error("Error fetching contest problems:", err);
              return res.status(500).send("Database error.");
            }

            const assignedProblemIds = contestProblems.map(
              (cp) => cp.problem_id
            );

            // Get the list of registered users for the contest
            db.query(
              `SELECT user.id, user.Name 
               FROM user 
               JOIN contest_participants ON user.id = contest_participants.user_id 
               WHERE contest_participants.contest_id = ?`,
              [contestId],
              (err, userResults) => {
                if (err) {
                  console.error("Error fetching registered users:", err);
                  return res.status(500).send("Database error.");
                }

                // Pass the contest, problems, assigned problems, and registered users to the view
                // console.log(contest);
                // console.log(problemResults);
                // console.log(userResults);

                res.render("editContest", {
                  contest,
                  problems: problemResults,
                  assignedProblemIds,
                  registeredUsers: userResults,
                });
              }
            );
          }
        );
      });
    }
  );
});

// Handle updating the contest (POST)
router.post("/contests/:id/edit", (req, res) => {
  const contestId = req.params.id;
  const { contest_name, status, start_time, end_time, problems } = req.body;

  // Update contest details
  const query = `
    UPDATE contests 
    SET name = ?, status = ?, start_time = ?, end_time = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [contest_name, status, start_time, end_time, contestId],
    (err) => {
      if (err) {
        console.error("Error updating contest:", err);
        return res.status(500).send("Database error.");
      }

      // Update problems associated with the contest
      // First, delete the existing problems
      db.query(
        "DELETE FROM contest_problems WHERE contest_id = ?",
        [contestId],
        (err) => {
          if (err) {
            console.error("Error removing contest problems:", err);
            return res.status(500).send("Database error.");
          }

          // Then, add the new selected problems
          if (problems) {
            problems.forEach((problemId) => {
              db.query(
                "INSERT INTO contest_problems (contest_id, problem_id) VALUES (?, ?)",
                [contestId, problemId],
                (err) => {
                  if (err)
                    console.error("Error adding problem to contest:", err);
                }
              );
            });
          }

          res.redirect("/admin/contests");
        }
      );
    }
  );
});

// Route to manage problems
// Fetch all problems and render problem management page
router.get("/problems", (req, res) => {
  db.query("SELECT * FROM problems", (err, results) => {
    if (err) {
      console.error("Error fetching problems:", err);
      return res.status(500).send("Database error.");
    }
    res.render("ProblemManagement.ejs", { problems: results });
  });
});

// Delete a specific problem
router.post("/delete-problem/:id", (req, res) => {
  const problemId = req.params.id;

  db.query("DELETE FROM problems WHERE id = ?", [problemId], (err, result) => {
    if (err) {
      console.error("Error deleting problem:", err);
      return res.status(500).send("Database error.");
    }
    res.redirect("/admin/problems");
  });
});

// Route to add an existing problem to a specific contest
router.post("/contests/:contestId/problems/add", (req, res) => {
  const { contestId } = req.params;
  const { problem_id } = req.body;

  const query = `
    INSERT INTO contest_problems (contest_id, problem_id)
    VALUES (?, ?)
  `;

  db.query(query, [contestId, problem_id], (err) => {
    if (err) {
      console.error("Error associating problem with contest:", err);
      return res.status(500).send("Failed to add problem to contest.");
    }
    res.redirect(`/admin/contests`);
  });
});

module.exports = router;
