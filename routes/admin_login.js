const express = require("express");
const db = require("../db");
const router = express.Router();

// Render login page
router.get("/", (req, res) => {
  res.render("login");
});

// Handle login form submission
router.post("/", (req, res) => {
  const { username, password } = req.body;

  // Example: Replace this with your actual authentication logic
  //   db
  //     .query
  // "SELECT * FROM admins WHERE username = ? AND password = ?",
  // [username, password],
  // (err, results) => {
  //   if (err) {
  //     console.error("Database error:", err);
  //     return res.status(500).send("Database error.");
  //   }

  //   if (results.length > 0) {
  //     // Authentication successful

  // res.redirect("/admin/dashboard");
  //   } else {
  //     // Authentication failed
  //     res.status(401).send("Invalid username or password.");
  //   }
  // }
  req.session.isAdmin = true;
  res.redirect("/admin");
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
