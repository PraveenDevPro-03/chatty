
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './db.js';  // MongoDB Connection
import Message from './Message.js';  // Message Model

import { fileURLToPath } from 'url';
import path from 'path';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js'; 
import session from 'express-session';
const app = express();

app.use(session({
    secret: 'your_secret_key',   
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));



dotenv.config();
connectDB(); 


app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
    }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/chatting.html');
});
io.on('connection', async (socket) => {
    console.log('🟢 New User Connected');

    try {
        const messages = await Message.find().sort({ timestamp: 1 });
        socket.emit('load_messages', messages);
    } catch (error) {
        console.error('❌ Error loading messages:', error);
    }

    socket.on('message', async (msg) => {
        try {

            const newMessage = new Message(msg);
            msg.timestamp = new Date().toISOString(); 
            await newMessage.save(); 
            
            socket.broadcast.emit('message', msg); // 
        } catch (error) {
            console.error('❌ Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 User Disconnected');
    });
});

io.on('connection', (socket) => {
    socket.on('fileMessage', (fileData) => {
        io.emit('fileMessage', fileData);
    });
});



mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error(err));

const JWT_SECRET = "secret_key";

// ✅ User Signup
app.post('/signup', async (req, res) => {
    const { name, email, mobile, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, mobile, password: hashedPassword });

    await newUser.save();
    res.json({ message: "User registered successfully" });
    
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    req.session.userId = user._id;

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, name: user.name });
});







app.get('/getUser', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ success: false, message: "User not authenticated" });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});





const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

