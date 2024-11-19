
const express = require("express");
const router = express.Router();
const db = require("../db"); 

router.get("/", (req, res) => {
  res.render("login", { errorMessage: "" });
});

router.post("/", (req, res) => {
  const { username, password } = req.body;
  console.log("Username entered:", username);
  console.log("Password entered:", password);

  const sql = "SELECT * FROM user WHERE name = ?";
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.render("login", { errorMessage: "Error during login. Please try again." });
    }

    console.log("Query Results:", results);

    if (results.length === 0) {
      return res.render("login", { errorMessage: "User not found" });
    }

    const user = results[0];
    console.log("Stored password:", user.password);

    
    if (password === user.password) {
      return res.send("Login successful!");
    } else {
      return res.render("login", { errorMessage: "Invalid credentials" });
    }
  });
});

module.exports = router;
