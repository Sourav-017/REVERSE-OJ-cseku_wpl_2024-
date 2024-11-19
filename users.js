// In your routes/users.js
var express = require("express");
var router = express.Router();
const db = require("../db"); // Import the MySQL connection

// Route to get all users
router.get("/", (req, res) => {
  const sql = "SELECT name, email FROM user"; // Retrieve username and email columns
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send("Error fetching users");
    }
    res.render("users", { users: results }); // Pass the users data to the template
  });
});

module.exports = router;
