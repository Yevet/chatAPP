const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });

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
        const loggedInUser = results[0];
        // 登录成功后返回成功标志给前端
        res.cookie('loggedInUser', JSON.stringify(results[0]), { maxAge: 3600000 }); // 1 hour

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
    const { user_id } = req.body;
    const isoTimestamp = new Date().toISOString();
    const unixTimestamp = Math.floor(new Date(isoTimestamp).getTime() / 1000);
    //const loggedInUser = JSON.parse(req.cookies.loggedInUser);
    const insertQuery = `INSERT INTO chat_messages (user_id, message, timestamp) VALUES (?, ?, FROM_UNIXTIME(?))`;

    connection.query(insertQuery, [user_id, message, unixTimestamp], (err, results) => {
        if (err) {
            console.error('Error posting message:', err);
            return res.status(500).send('Error posting message');
        }

        const newMessage = { user_id, message, timestamp: isoTimestamp };
        res.json(newMessage);
    });
    // 发送消息到WebSocket服务器
    const messageData = JSON.stringify({ message: message, user_id: user_id, timestamp: new Date() });
    connectedClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageData);
        }
    });


});
// 添加一个路由处理用于获取用户的用户名
app.get('/getUser/:userId', (req, res) => {
    const userId = req.params.userId;
    const selectQuery = `SELECT username FROM users WHERE id = ?`;

    connection.query(selectQuery, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Error fetching user');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        res.json(results[0]);
    });
});


// 与WebSocket相关的代码
const connectedClients = new Set();

wss.on('connection', (socket) => {
    connectedClients.add(socket);

    socket.on('message', (message) => {
        // 当收到消息时，广播给所有连接的客户端
        connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    socket.on('close', () => {
        connectedClients.delete(socket);
    });
});

// 使用 server 对象创建 WebSocket 服务器
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// 将WebSocket服务器绑定到现有HTTP服务器
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (socket) => {
        wss.emit('connection', socket, request);
    });
});



// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
