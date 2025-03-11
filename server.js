
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './db.js';  // MongoDB Connection
import Message from './Message.js';  // Message Model

import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();
connectDB(); 

const app = express();
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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

