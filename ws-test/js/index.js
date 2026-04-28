const userIdInput = prompt('userId: ');
const socket = io('ws://localhost:3001', {
  query: {
    userId: userIdInput
    // userId: '40adf297-3672-416b-addd-a65396b901a8'
  },
});

const socketElm = document.querySelector('.socket-connect');

socket.on('connect', () => {
  socketElm.textContent = `Connected: ${socket.id}`;
});

socket.on('BulkTaskCreation', (data) => {
  // socketElm.textContent = `connected: ${data.id}`;
  const listenElm = document.createElement('p');
  listenElm.classList.add('socket-listen');
  listenElm.textContent = data.message;
  document.body.appendChild(listenElm);
});

socket.on('disconnect', () => {
  alert('Server disconnected.');
  socketElm.textContent = `Server disconnected. Waiting for connection...`
  document.querySelector('.socket-listen').textContent = ''
});