// import express from 'express'
// import path from 'path';
// import { Socket } from 'socket.io';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const app=express()

// app.use(express.static(__dirname + '/public'))

// app.get('/',(req,res)=>{
//     res.sendFile(__dirname + '/index.html')
    
// })

// //server
// const io=require('socket.io')(app)
// io.on('connection',(socket)=>{
//     console.log('connected...')
// })


// const PORT=process.env.PORT||4000
// app.listen(PORT,()=>{
//     console.log(`listening..${PORT}`)
// }) 


// import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { Server } from 'socket.io';
// import http from 'http';

// import dotenv from 'dotenv';
// dotenv.config();


// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const app = express();
// const server = http.createServer(app); // HTTP Server बनाना जरूरी है

// app.use(express.static(__dirname + '/public'));

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

// // Socket.io के लिए सही तरीका
// const io = new Server(server);

// io.on('connection', (socket) => {
//     console.log('connected...');
//     socket.on('message',(msg)=>{
// socket.broadcast.emit('message',msg)
//     })
// });

// io.on('connection', (socket) => {
//     socket.on('fileMessage', (fileData) => {
//         io.emit('fileMessage', fileData);
//     });
// });


// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//     console.log(`Listening on port ${PORT}`);
// });

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './db.js';  // MongoDB Connection
import Message from './Message.js';  // Message Model

import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();
connectDB(); // MongoDB से कनेक्ट हो जाएगा

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // अगर CORS इशू हो तो इसे एडजस्ट कर सकते हो
    }
});

// ✅ ES Module में __dirname बनाओ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 🟢 जब नया यूजर कनेक्ट हो तो पुराने मैसेज लोड करो
io.on('connection', async (socket) => {
    console.log('🟢 New User Connected');

    try {
        // पुरानी चैट लोड करना
        const messages = await Message.find().sort({ timestamp: 1 });
        socket.emit('load_messages', messages);
    } catch (error) {
        console.error('❌ Error loading messages:', error);
    }

    // ✅ नया मैसेज रिसीव करना और सही तरीके से भेजना
    socket.on('message', async (msg) => {
        try {
            const newMessage = new Message(msg);
            await newMessage.save();  // MongoDB में स्टोर करो
            
            socket.broadcast.emit('message', msg); // ✅ बाकी यूज़र्स को भेजो (sender को exclude किया)
        } catch (error) {
            console.error('❌ Error saving message:', error);
        }
    });

    // जब यूजर डिस्कनेक्ट हो
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

