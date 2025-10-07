// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

dotenv.config();

const app = express();
const server = http.createServer(app);

// create uploads folder if not exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// socket.io
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' }
});
app.set('io', io);
io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  socket.on('register', userId => {
    socket.join(userId);
  });
  socket.on('disconnect', () => {});
});

// middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

// serve a simple index if someone opens the server root
app.get('/', (req, res) => res.json({ msg: 'Connecta API running' }));

// connect DB & start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error', err));
