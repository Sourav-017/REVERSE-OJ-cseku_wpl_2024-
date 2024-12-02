const express = require("express");
// const bcrypt = require("bcrypt");
const db = require("../db"); // Update with your DB connection logic
const router = express.Router();

// Render the login and signup pages
router.get("/login", (req, res) => res.render("user_login"));
router.get("/signup", (req, res) => res.render("user_signup"));

// Signup Route
router.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  // Ensure Name, Email, and password are provided
  if (!username || !email || !password) {
    return res.status(400).send("Please provide all required fields.");
  }

  // First, check if the username already exists
  const checkUsernameQuery = "SELECT * FROM user WHERE Name = ?";

  db.query(checkUsernameQuery, [username], (err, result) => {
    if (err) {
      console.error("Error during signup:", err);
      return res.status(500).send("Signup failed");
    }

    if (result.length > 0) {
      // If username is found, send an error message
      return res
        .status(400)
        .send("Username already taken, please choose another.");
    }

    // If the username is available, insert the new user
    const query = "INSERT INTO user (Name, Email, Password) VALUES (?, ?, ?)";

    db.query(query, [username, email, password], (err, result) => {
      if (err) {
        console.error("Error during signup:", err);
        return res.status(500).send("Signup failed");
      }

      // Redirect to login page after successful signup
      res.redirect("/auth/login");
    });
  });
});

// Login Route
// Login Route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM user WHERE Name = ?", [username], (err, rows) => {
    if (err) {
      console.error("Error during login:", err);
      return res.status(500).send("Login failed");
    }

    console.log("Rows: ", rows); // Log the result to inspect the data

    // Check if no user is found
    if (rows.length === 0) {
      return res.status(400).send("Invalid username or password");
    }

    const user = rows[0];

    // Directly compare the plain text password with the one stored in the database
    if (password !== user.Password) {
      console.log(password);
      console.log(user.Password);
      return res.status(400).send("Invalid username or password");
    }

    // Save the user session
    req.session.user = { id: user.id, username: user.Name };
    console.log(req.session.user); // Log session data

    // Redirect to the home/dashboard page after successful login
    res.redirect("/");
  });
});

// Logout Route
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Logout failed");
    }
    res.redirect("/login"); // Redirect to login page after logout
  });
});

module.exports = router;
