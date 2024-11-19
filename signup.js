const express = require("express");
const router = express.Router();
const db = require("../db"); 
const bcrypt = require("bcryptjs"); 

// GET route to render the signup page
router.get("/", (req, res) => {
  res.render("signup", { errorMessage: "" }); 
});

// POST route to handle signup form submission
router.post("/", (req, res) => {
  const { username, email, password } = req.body;
  console.log("Username entered:", username);
  console.log("Email entered:", email);
  console.log("Password entered:", password);

  // Check if the username or email already exists in the database
  const checkUserSql = "SELECT * FROM user WHERE name = ? OR email = ?";
  db.query(checkUserSql, [username, email], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.render("signup", { errorMessage: "Error during sign-up. Please try again." });
    }

    if (results.length > 0) {
      return res.render("signup", { errorMessage: "Username or email already taken" });
    }

    // Insert the new user with username, email, and password
    const insertUserSql = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
    db.query(insertUserSql, [username, email, password], (err, result) => {
      if (err) {
        console.error("Database insertion error:", err);
        return res.render("signup", { errorMessage: "Error during sign-up. Please try again." });
      }
      
      return res.send("Sign-up successful! You can now log in.");
    });
  });
});

module.exports = router;
