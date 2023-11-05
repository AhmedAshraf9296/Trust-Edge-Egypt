const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { User, Message,Room } = require('./db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  {authenticateUser,generateSecretKey , messageLimiter} =require('./middleware.js')
const { setupSocket } = require('./socket');
const app = express();
const port = 3000;
const io = setupSocket();

// Use middleware to parse JSON in request bodies
app.use(bodyParser.json());

// Secret key for JWT

  const secretKey = generateSecretKey();
  console.log('Generated Secret Key:', secretKey);

// User Registration with JWT
app.post('/api/users', (req, res) => {
  const { username, password } = req.body;

  // Hash the password before storing it
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    User.create({ username, password: hash })
      .then(user => {
        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
        res.status(201).json({ user, token });
      })
      .catch(error => {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({ error: 'Username is not unique' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
      });
  });
});

// User Authentication with JWT
app.post('/api/auth', (req, res) => {
  const { username, password } = req.body;

  // Find the user by username
  User.findOne({ where: { username } })
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      // Compare the provided password with the stored hash
      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          return res.status(401).json({ error: 'Authentication failed' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
        return res.status(200).json({ message: 'Authentication successful', token });
      });
    })
    .catch(error => res.status(500).json({ error: 'Internal Server Error' }));
});

// Send a chat message (with user authentication and rate limiting)
app.post('/api/messages', messageLimiter, authenticateUser, (req, res) => {
  const { username, content, RoomId } = req.body;

  // Check if the user is in the specified chat room
  // if (!req.user.chatRooms.includes(roomId)) {
  //   return res.status(403).json({ error: 'You are not a member of this chat room' });
  // }

  // Broadcast the message to users in the same chat room
  // io.to(roomId).emit('message', { username, content });

  // Save the message to the database
  Message.create({ username, content, RoomId })
    .then(message => res.status(201).json(message))
    .catch(error => res.status(500).json({ error: 'Internal Server Error' }));
});

// Get all chat messages for a specific chat room (with user authentication)
app.get('/api/messages/:roomId', authenticateUser, (req, res) => {
  const { roomId } = req.params;

  // Check if the user is in the specified chat room
  // if (!req.user.chatRooms.includes(roomId)) {
  //   return res.status(403).json({ error: 'You are not a member of this chat room' });
  // }
  console.log('roomIdroomIdroomId',roomId)
  Message.findAll({ where: { RoomId:roomId } })
    .then(messages => res.status(200).json(messages))
    .catch(error => res.status(500).json({ error: 'Internal Server Error' }));
});

// Create a chat room (only authenticated users can create chat rooms)
app.post('/api/chat-rooms', authenticateUser, async (req, res) => {
  const { name } = req.body;

  try {
    const room = await createChatRoom(name);
    res.status(201).json({ room });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Room name is not unique' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


async function createChatRoom(name) {
  const room = await Room.create({ name });
  return room;
}

// Join a chat room
app.post('/api/join-room/:roomId', authenticateUser, async (req, res) => {
  const { roomId } = req.params;
  console.log("req.paramsreq.params",)
  try {
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Join the chat room
    const user = await User.findByPk(req.userId);
    await user.addRoom(room);

    res.status(200).json({ message: 'Joined chat room successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
