const express = require("express");
const router = express.Router();
const db = require("../db"); // Import the MySQL connection

// GET route to render the user list page
router.get("/user-list", (req, res) => {
  const sql = "SELECT * FROM user";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("adminUserList", { users: results });
  });
});

// POST route to handle user update
router.post("/update-user/:id", (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const sql = "UPDATE user SET name = ?, email = ? WHERE id = ?";
  db.query(sql, [name, email, id], (err, result) => {
    if (err) {
      console.error("Database update error:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/admin/user-list");
  });
});

// POST route to handle user deletion
router.post("/delete-user/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM user WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Database delete error:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/admin/user-list");
  });
});

module.exports = router;
