const express = require("express");
const db = require("../db"); // Database connection
const router = express.Router();

// Route to render the main Admin dashboard page
router.get("/", (req, res) => {
  res.render("admin_dashboard.ejs");
});

// In your login route (e.g., in routes/auth.js)
// router.post("/login", (req, res) => {
//   const { username, password } = req.body;

//   db.query(
//     "SELECT * FROM users WHERE username = ? AND password = ?",
//     [username, password],
//     (err, results) => {
//       if (err) {
//         console.error("Error logging in:", err);
//         return res.status(500).send("Database error.");
//       }

//       if (results.length === 0) {
//         return res.status(401).send("Invalid credentials.");
//       }

//       const user = results[0];

//       // Check if the user is an admin
//       if (user.role === "admin") {
//         req.session.isAdmin = true; // Set admin session
//       }

//       req.session.userId = user.id;
//       req.session.username = user.username;

//       // Redirect based on role
//       return user.role === "admin"
//         ? res.redirect("/admin")
//         : res.redirect("/home");
//     }
//   );
// });

// Route to manage users
router.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
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
    res.render("ContestManagement.ejs", { contests: results });
  });
});

// Route to manage problems
router.get("/problems", (req, res) => {
  db.query("SELECT * FROM problems", (err, results) => {
    if (err) {
      console.error("Error fetching problems:", err);
      return res.status(500).send("Database error.");
    }
    res.render("ProblemManagement.ejs", { problems: results });
  });
});

// Route to view and monitor submissions
router.get("/submissions", (req, res) => {
  db.query("SELECT * FROM submissions", (err, results) => {
    if (err) {
      console.error("Error fetching submissions:", err);
      return res.status(500).send("Database error.");
    }
    res.render("Submissions.ejs", { submissions: results });
  });
});

// Route to view system statistics
router.get("/stats", (req, res) => {
  // Fetch statistics like total users, contests, and submissions
  db.query("SELECT ...", (err, results) => {
    // Adjust SQL query as needed
    if (err) {
      console.error("Error fetching statistics:", err);
      return res.status(500).send("Database error.");
    }
    res.render("Statistics.ejs", { stats: results });
  });
});

module.exports = router;
