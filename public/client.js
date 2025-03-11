
const socket = io()


let textarea = document.querySelector('#textarea')
let messagearea = document.querySelector('.message_area')


let name = '';

// ✅ Fetch the logged-in user's name from the server
async function getUserDetails() {
    try {
        let response = await fetch('/getUser');
        let data = await response.json();

        if (data.success) {
            name = data.user.name;
            document.getElementById("usernameDisplay").innerText = name;

            // ✅ Only redirect if not already on /chat
            if (window.location.pathname !== "/chat") {
                window.location.href = "/chat";
            }
        } else {
            // ✅ Only redirect if not already on /
            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// ✅ Call function on page load
getUserDetails();




window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('chatMessages');
});

document.getElementById("usernameDisplay").innerText = name;



textarea.addEventListener('keyup', (e) => {

    if (e.key === 'Enter' && !e.shiftkey) {
        e.preventDefault();
        let message = textarea.value.trim();
        if (message) {
            sendMessage(message);
            textarea.value = '';
        }
    }
})


function sendMessage(message) {

    let msg = {
        user: name,
        message: message.trim(),
        timestamp: new Date().toISOString()
    }

    appendMessage(msg, 'outgoing')

    scrollToBottom()

    socket.emit('message', msg)
}


function appendMessage(msg, type) {

    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')

    let dateTime = new Date(msg.timestamp).toLocaleString('en-US', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });

    let markup = `
        <h4>${msg.user} &nbsp;<span class="time">${dateTime}</span></h4>
        <p>${msg.message}</p>

    `
    mainDiv.innerHTML = markup
    messagearea.appendChild(mainDiv)
}


//recieve

socket.on('message', (msg) => {
    appendMessage(msg, 'incoming')
    scrollToBottom()
})

//scroll

function scrollToBottom() {
    messagearea.scrollTop = messagearea.scrollHeight
}


//file
document.getElementById('fileInput').addEventListener('change', function(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            let fileData = {
                name: file.name,
                type: file.type,
                data: e.target.result
            };
            socket.emit('fileMessage', fileData);
        };
        reader.readAsDataURL(file);
    }
});


socket.on('fileMessage', (fileData) => {
    let messageArea = document.querySelector('.message_area');
    let fileElement = document.createElement('div');

    if (fileData.type.startsWith('image/')) {
        fileElement.innerHTML = `<img src="${fileData.data}" width="200">`;
    } else {
        fileElement.innerHTML = `<a href="${fileData.data}" download="${fileData.name}">${fileData.name}</a>`;
    }

    messageArea.appendChild(fileElement);
});
