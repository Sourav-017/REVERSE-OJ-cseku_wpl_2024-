const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all blog posts
router.get("/", (req, res) => {
  db.query(
    "SELECT id, title, subtitle, content, created_by, created_at FROM blogs ORDER BY created_at DESC",
    (error, rows) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Database error");
      }
      res.render("blogs", {
        blogPosts: rows,
        message: req.query.message || null,
      });
    }
  );
});
router.get("/", (req, res) => {
  db.query(
    "SELECT id, title, subtitle, content, created_by, created_at FROM blogs ORDER BY created_at DESC",
    (error, rows) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Database error");
      }
      res.render("blogs", {
        blogPosts: rows,
        message: req.query.message || null,
      });
    }
  );
});

// GET form to post a new blog
router.get("/:id", (req, res) => {
  const blogId = req.params.id; // Get the ID from the URL parameter
  console.log(blogId);
  console.log("Fetching blog with ID:", blogId);

  // Query the database for the blog post with the specific ID
  db.query("SELECT * FROM blogs WHERE id = ?", [blogId], (error, rows) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Database error");
    }

    if (rows.length > 0) {
      // If the blog exists, render the 'createBlog' page with the blog data
      res.render("show_blog", { post: rows[0] });
    } else {
      // If no blog is found for that ID, show a 404 error
    }
  });
});

// POST new blog post
router.post("/", (req, res) => {
  const { title, subtitle, content, created_by } = req.body;

  if (!title || !content || !created_by) {
    return res.status(400).send("Title, content, and author are required");
  }

  db.query(
    "INSERT INTO blogs (title, subtitle, content, created_by, created_at) VALUES (?, ?, ?, ?, NOW())",
    [title, subtitle, content, created_by],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Error adding blog post");
      }
      res.redirect("/blogs?message=Blog post has been added successfully!");
    }
  );
});

module.exports = router;
