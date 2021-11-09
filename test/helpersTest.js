const { assert } = require('chai');

const { getUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUser', () => {
  it('should return a user with valid email', () => {
    const user = getUser("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });
  it('should return undefined with nonexistant email', () => {
    const user = getUser("hello@example.com", testUsers);
    assert.equal(user, undefined);
  });
});
