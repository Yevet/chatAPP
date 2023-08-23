const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: 'localhost', // MySQL服务器地址
  user: 'root', // 用户名
  password: 'MY20000218', // 密码
  database: 'chatroom' // 数据库名
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to the database');
});

app.use(express.static(__dirname + '/public'));

// 根路径的路由处理
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 用户注册和登录路由...
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const insertQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
  
    connection.query(insertQuery, [username, password], (err, results) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).send('Error registering user');
      }
      console.log('User registered:', results);
      res.status(200).send('User registered successfully');
    });
  });
  
  // 用户登录
// 用户登录
// 用户登录
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const selectQuery = `SELECT * FROM users WHERE username = ? AND password = ?`;
  
    connection.query(selectQuery, [username, password], (err, results) => {
      if (err) {
        console.error('Error logging in:', err);
        return res.status(500).send('Error logging in');
      }
  
      if (results.length === 0) {
        return res.status(401).send('Invalid username or password');
      }
  
      console.log('User logged in:', results);
      // 登录成功后返回成功标志给前端
      res.status(200).send('User logged in successfully');
    });
  });
  

// 添加一个路由处理用于获取历史消息
app.get('/messages', (req, res) => {
    const selectQuery = `SELECT * FROM chat_messages`;
  
    connection.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).send('Error fetching messages');
      }
  
      res.json(results);
    });
  });
  
  // 添加一个路由处理用于存储新消息
  app.post('/postMessage', (req, res) => {
    const { message } = req.body;
    const user_id = 1; // 替换为当前用户的 user_id，这里假设用户ID为1
    const isoTimestamp = new Date().toISOString();
    const unixTimestamp = Math.floor(new Date(isoTimestamp).getTime() / 1000);
    
    const insertQuery = `INSERT INTO chat_messages (user_id, message, timestamp) VALUES (?, ?, FROM_UNIXTIME(?))`;
  
    connection.query(insertQuery, [user_id, message, unixTimestamp], (err, results) => {
        if (err) {
            console.error('Error posting message:', err);
            return res.status(500).send('Error posting message');
        }
  
        const newMessage = { user_id, message, timestamp: isoTimestamp };
        res.json(newMessage);
    });
  });
  
  



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
