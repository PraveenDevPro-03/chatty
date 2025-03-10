
const socket = io()

let name;
let textarea = document.querySelector('#textarea')
let messagearea = document.querySelector('.message_area')
do {
    name = prompt('please enter your name')
} while (!name)

window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('chatMessages');
});

// नाम मिलने के बाद UI पर दिखाओ
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
        message: message.trim()
    }

    appendMessage(msg, 'outgoing')

    scrollToBottom()

    socket.emit('message', msg)
}


function appendMessage(msg, type) {

    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')
    let markup = `
        <h4>${msg.user}</h4>
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
