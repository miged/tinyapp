const bcrypt = require('bcryptjs');

// URL Database
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://lighthouselabs.ca',
    userID: 'aJ48lW',
    visits: 34,
    uniqueVisits: 20,
    uniqueVisitors: [],
    visitDates: [],
    dateCreated: new Date(),
  }
};

// User Database
const users = {
  aJ48lW: {
    id: 'aJ48lW',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur'),
  },
};

module.exports = { urlDatabase, users };
