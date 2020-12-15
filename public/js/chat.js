/**
 * Takes unix time string and return formatted string
 * @param {string} time
 */
const formatTime = (time) => {
  return moment(time).format('h:m a')
}

// io became available because we ran the script above this file
// <script src="/socket.io/socket.io.js"></script>
const socket = io() // connects client to the web socket

// Elements
const roomInfoEl = document.getElementById('room-info')
const messageFormEl = document.getElementById('message-form')
const messageFormInputEl = messageFormEl.querySelector('input')
const messageFormButtonEl = messageFormEl.querySelector('button')
const locationButtonEl = document.getElementById('send-location')
const messagesEl = document.getElementById('messages')

// HTML Templates inside script tag
const messageTemplate = document.getElementById('message-template').innerHTML
const systemMessageTemplate = document.getElementById('system-message-template')
  .innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const roomInfoTemplate = document.getElementById('room-info-template').innerHTML

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

messageFormEl.addEventListener('submit', (e) => {
  e.preventDefault()

  // disable submit button on submit
  messageFormButtonEl.setAttribute('disabled', 'disabled')

  const message = e.target.elements.message.value

  // fn passed as the last arg to .emit() is called
  //  when the event is acknowledged.
  socket.emit('sendMessage', message, (error) => {
    // re-enable submit button on event acknowledgement
    messageFormButtonEl.removeAttribute('disabled')
    // clear input control
    messageFormInputEl.value = ''
    // move focus back to input control (from submit button)
    messageFormInputEl.focus()

    if (error) {
      return console.log(error)
    }
    console.log('The message is sent to the server!')
  })
})

const autoScroll = () => {
  // New message element
  const newMessageEl = messagesEl.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessageEl)
  const newMessageMarginBottom = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessageEl.clientHeight + newMessageMarginBottom

  // Visible Height
  const visibleHeight = messagesEl.offsetHeight

  // Height of messages container
  const messagesDivHeight = messagesEl.scrollHeight

  // How far have I scrolled?
  const scrollOffset = messagesEl.scrollTop + visibleHeight

  // scrollOffset === visibleHeight === messageDivHeight when there is no scrollbar
  const messagesDivHeightBeforeNewMessage = messagesDivHeight - newMessageHeight

  // Pad the space to account for rounding errors in measure & user not "fully" scrolling down.
  const scrolledToTheBottomZone = 50

  if (
    messagesDivHeightBeforeNewMessage <=
    scrollOffset + scrolledToTheBottomZone
  ) {
    messagesEl.scrollTop = messagesEl.scrollHeight
  }
}

socket.on('message', ({ username, text, createdAt, id }) => {
  const view = {
    message: text,
    createdAt: formatTime(createdAt),
    username,
    me: id === socket.id ? 'me' : null, // add class 'me' if it's my message
  }
  // renders given template string with view object
  // and returns html string
  const html = Mustache.render(messageTemplate, view)

  messagesEl.insertAdjacentHTML('beforeend', html)

  autoScroll()
})

socket.on('systemMessage', ({ text, createdAt }) => {
  const view = {
    message: text,
    createdAt: formatTime(createdAt),
  }

  const html = Mustache.render(systemMessageTemplate, view)

  messagesEl.insertAdjacentHTML('beforeend', html)

  autoScroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(roomInfoTemplate, {
    room,
    users,
  })
  roomInfoEl.innerHTML = html
})

locationButtonEl.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }
  // disable button until fetching is done
  locationButtonEl.setAttribute('disabled', 'disabled')
  messageFormInputEl.focus()

  console.log('Getting current position...')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      (message) => {
        // re-enable location button on event acknowledgement
        locationButtonEl.removeAttribute('disabled')
      }
    )
  })
})

socket.on('locationMessage', ({ id, url, createdAt, username }) => {
  console.log('on locationMessage')
  const view = {
    me: id === socket.id ? 'me' : null, // add class 'me' if it's my message
    username,
    url,
    createdAt: formatTime(createdAt),
  }
  const html = Mustache.render(locationTemplate, view)
  messagesEl.insertAdjacentHTML('beforeend', html)

  autoScroll()
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/' // redirect user to the join page
  }
})

// focus input control on page load
messageFormInputEl.focus()
