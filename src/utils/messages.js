const generateMessage = ({ username, id }, text) => {
  return withCreatedAt({ text, username, id })
}

const generateSystemMessage = (text) => {
  return withCreatedAt({ text })
}

/**
 * takes a coordinate object and return location message object with url and createdAt
 * @param {{lat: number, lng: number}} param1 - latitude and longitude of the location
 * @returns {{url:string, createdAt: number}}
 */
const generateLocationMessage = ({ username, id }, { lat, lng }) => {
  const url = `https://google.com/maps?q=${lat},${lng}`
  return withCreatedAt({ url, username, id })
}

/**
 * Take an obj and return a new object with 'createdAt' property containing current unix time string
 * @param {any} obj
 */
const withCreatedAt = (obj) => {
  return {
    ...obj,
    createdAt: new Date().getTime(),
  }
}

module.exports = {
  generateMessage,
  generateSystemMessage,
  generateLocationMessage,
}
