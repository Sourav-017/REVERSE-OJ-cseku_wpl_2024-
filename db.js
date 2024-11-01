// db.js (MySQL connection setup)
const mysql = require("mysql2");

// Create a connection to the database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",   // Your MySQL username
  password: "",   // Your MySQL password
  database: "oj", // Your database name
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: ", err);
    return;
  }
  console.log("Connected to MySQL database!");
});

module.exports = connection;
