const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Create a database connection
const db = new sqlite3.Database(':memory:');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const mysql = require('mysql');

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost', // MySQL服务器地址
  user: 'your_username', // 用户名
  password: 'your_password', // 密码
  database: 'chatroom' // 数据库名
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to the database');
});
