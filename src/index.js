const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {
  generateMessage,
  generateSystemMessage,
  generateLocationMessage,
} = require('./utils/messages')
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users')

const app = express()

const server = http.createServer(app)
const io = socketio(server) // have to pass raw http server

const port = process.env.PORT || 5000
const systemName = 'MeetUp'
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))
app.use(express.json())

// io.emit => emit to all connections
// socket.emit => emit to one particular socket
// socket.broadcast.emit => emit to all connection except the current socket

io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username,
      room,
    })

    if (error) {
      return callback(error)
    }

    // socket.join | leave is only available in node server(not from browser)
    // - used to broadcast events to a subset of clients
    socket.join(user.roomId) // use cleaned-up data from our store

    socket.emit(
      'systemMessage',
      generateSystemMessage(`Joined the room: ${user.room} at `)
    )

    // broadcast emits events to every every client except
    // this particular socket
    // socket.broadcast.to.emit - broadcast event to specific room
    socket.broadcast
      .to(user.roomId)
      .emit(
        'systemMessage',
        generateSystemMessage(`${user.username} has joined!`)
      )

    io.to(user.roomId).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.roomId),
    })

    callback() // call callback to send acknowledgement back to the client

    // socket.emit, io.emit, socket.broadcast.emit
    // io.to.emit - emits event to a specific room
  })

  // When acknowledgement callback is passed to emit(),
  // it will be passed to 'on' callback as the last argument.
  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!')
    }

    const user = getUser(socket.id)

    if (user) {
      io.to(user.roomId).emit('message', generateMessage(user, message))
      callback()
    }
  })

  socket.on('sendLocation', ({ lat, lng }, callback) => {
    const user = getUser(socket.id)

    io.to(user.roomId).emit(
      'locationMessage',
      generateLocationMessage(user, { lat, lng })
    )
    callback('Location shared!')
  })

  // you can only listen to disconnect event on connected socket
  // -> io.on('disconnect') doesn't work!
  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      // socket is already disconnected here
      // so no need to use broadcast.emit
      io.to(user.roomId).emit(
        'systemMessage',
        generateSystemMessage(`${user.username} has left!`)
      )

      io.to(user.roomId).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.roomId),
      })
    }
  })
})

server.listen(port, () => {
  console.log('Server is up on port: ' + port)
})
