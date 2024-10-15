// In your routes/users.js
var express = require("express");
var router = express.Router();
const db = require("../db"); // Import the MySQL connection

// Route to get all users
router.get("/", (req, res) => {
  const sql = "SELECT * FROM user";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send("Error fetching users");
    }
    res.render("users", { users: results }); // Send the fetched users as JSON
    // console.log(results);
  });
});
module.exports = router;
