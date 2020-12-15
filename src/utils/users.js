const users = []

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({ id, username, room }) => {
  // Clean the user-generated data
  username = username.trim()
  room = room.trim()

  // Validation
  if (!username || !room) {
    return {
      error: 'Username and room are required!',
    }
  }

  // If the same room with different casing exist, use that name as user's room
  const existingUserWithSameRoom = users.find(
    (user) => user.room.toLowerCase() === room.toLowerCase()
  )
  if (existingUserWithSameRoom) {
    room = existingUserWithSameRoom.room
  }

  // Check for existing user in the same room
  const existingUser = users.find((user) => {
    return (
      user.room.toLowerCase() === room.toLowerCase() &&
      user.username.toLowerCase() === username.toLowerCase()
    )
  })

  // Validate username
  if (existingUser) {
    return {
      error: 'Username is in use!',
    }
  }

  // Store user
  const user = { id, username, room, roomId: room.toLowerCase() }
  users.push(user)

  return { user }
}

const removeUser = (id) => {
  // faster than filter because findIndex will stop as soon as it finds the match
  const index = users.findIndex((user) => user.id === id)
  if (index !== -1) {
    return users.splice(index, 1)[0] // return the removed user
  }
}

/**
 *
 * @param {string} id - Socket.id
 * @returns {({id: string, username: string, room: string} | undefined)}
 */
const getUser = (id) => {
  return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
  return users.filter((user) => user.roomId === room.trim().toLowerCase())
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
}
