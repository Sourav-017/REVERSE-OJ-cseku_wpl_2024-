var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", (req, res) => {
  res.render("index.ejs"); // Render the index page with buttons
});

module.exports = router;
