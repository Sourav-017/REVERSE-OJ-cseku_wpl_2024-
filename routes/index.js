var express = require("express");
var router = express.Router();
const db = require("../db");
/* GET home page. */
router.get("/", (req, res) => {
  console.log(req.session);
  res.render("index", { session: req.session });
});

router.get("/profile/:id", (req, res) => {
  const userId = req.params.id;
  console.log(userId);
  db.query("SELECT * FROM user WHERE id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).send("Database error.");
    }
    if (results.length > 0) {
      console.log(results[0]);
      res.render("profile", { user: results[0] }); // Render profile page with user data
    } else {
      res.status(404).send("User not found.");
    }
  });
});

router.get("/profile/edit/:id", (req, res) => {
  const userId = req.params.id;
  console.log(userId);
  db.query("SELECT * FROM user WHERE id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).send("Database error.");
    }
    if (results.length > 0) {
      console.log(results[0]);
      res.render("profile", { user: results[0] }); // Render profile page with user data
    } else {
      res.status(404).send("User not found.");
    }
  });
});

module.exports = router;
