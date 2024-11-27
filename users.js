/*// In your routes/users.js
var express = require("express");
var router = express.Router();
const db = require("../db");

// Route to get all users
router.get("/", (req, res) => {
  const sql = "SELECT * FROM user";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send("Error fetching users");
    }
    res.render("users", { users: results, session: req.session });
    // console.log(results);
  });
});
module.exports = router;*/


// Route to render the Edit Profile page for a specific user
router.get("/edit/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT * FROM user WHERE id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).send("Error fetching user data");
    }
    if (results.length === 0) {
      return res.status(404).send("User not found");
    }
    res.render("editProfile", { user: results[0], session: req.session });
  });
});

// Route to handle profile updates
router.post("/edit/:id", (req, res) => {
  const userId = req.params.id;
  const { name, email, otherField } = req.body; // Replace 'otherField' with actual fields
  const sql = "UPDATE user SET name = ?, email = ?, other_field = ? WHERE id = ?";
  db.query(sql, [name, email, otherField, userId], (err) => {
    if (err) {
      return res.status(500).send("Error updating user profile");
    }
    res.redirect("/users"); // Redirect to the users list or user's profile
  });
});

