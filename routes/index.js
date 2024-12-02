var express = require("express");
var router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  console.log(req.session);
  res.render("index", { session: req.session });
});

router.get("/profile/:id", (req, res) => {
  const userId = req.params.id;
  console.log(req.session);
  if (userId != req.session.user.id) {
    return res
      .status(403)
      .send(
        "<h1 align='center'>No cheating. You are not authorized to view this profile.</h1>"
      );
  }
  console.log(userId);
  db.query("SELECT * FROM user WHERE id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).send("Database error.");
    }
    if (results.length > 0) {
      console.log(results[0]);
      res.render("profile", { user: results[0], session: req.session });
    } else {
      res.status(404).send("User not found.");
    }
  });
});

router.post("/profile/:id", (req, res) => {
  const userId = req.params.id;
  const { username, email, password } = req.body;

  const query = `
    UPDATE user
    SET Name = ?, Email = ?, Password = ?
    WHERE id = ?
  `;

  // Execute the query
  db.query(query, [username, email, password, userId], (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).send("Error saving user data.");
    }
    res.redirect(`/profile/${userId}`);
  });
});

module.exports = router;
