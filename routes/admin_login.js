const express = require("express");
const db = require("../db");
const router = express.Router();

// Render login page
router.get("/", (req, res) => {
  res.render("admin_login");
});

// Handle login form submission
router.post("/", (req, res) => {
  const { username, password } = req.body;
  console.log({ username, password });
  // Query to authenticate the admin
  const query = "SELECT * FROM admins WHERE username = ? AND password = ?";

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Database error.");
    }

    if (results.length > 0) {
      // If admin is authenticated, save session info
      req.session.isAdmin = true;
      req.session.adminUser = results[0]; // Save admin info if needed
      res.redirect("/admin"); // Redirect to admin dashboard
    } else {
      // Authentication failed
      res.status(401).send("Invalid username or password.");
    }
  });
});

// Handle logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/admin_login");
  });
});

module.exports = router;
