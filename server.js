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
    host: 'localhost', // MySQL server address
    user: 'root', // username
    password: 'MY20000218', // password
    database: 'chatroom' // database name
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to the database');
});

app.use(express.static(__dirname + '/public'));

// routing of the root path
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// user registration and login routing
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const insertQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;

    connection.query(insertQuery, [username, password], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                // Duplicate entry error for username
                console.error('Error registering user:', err);
                return res.status(400).send('Duplicate username');
            } else {
                console.error('Error registering user:', err);
                return res.status(500).send('Error registering user');
            }
        }
        console.log('User registered:', results);

        res.status(200).send('User registered successfully');
    });
});

// user login
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
        // after successful login, a success sign is returned to the front-end
        res.cookie('loggedInUser', JSON.stringify(results[0]), { maxAge: 3600000 }); // 1 hour

        res.status(200).send('User logged in successfully');
    });
});


// add a routing process for retrieving historical messages
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

// add a routing process for storing new messages
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
    // send messages to the WebSocket server
    const messageData = JSON.stringify({ message: message, user_id: user_id, timestamp: new Date() });
    connectedClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageData);
        }
    });


});
// add a route handler to get the user's username
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


// websocket-related code
const connectedClients = new Set();

wss.on('connection', (socket) => {
    connectedClients.add(socket);

    socket.on('message', (message) => {
        // when a message is received, it is broadcast to all connected clients
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

// create a WebSocket server using the Server object
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// bind the WebSocket server to an existing HTTP server
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (socket) => {
        wss.emit('connection', socket, request);
    });
});



// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
