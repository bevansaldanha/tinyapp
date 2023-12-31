const { assert } = require('chai');

const { findUserByEmail } = require('../helpers.js');

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

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert(user.id === expectedUserID);
  });
});

describe('findUserByEmail', function() {
  it('should return undefined for an unregistered email', function() {
    const user = findUserByEmail("noemail@example.com", testUsers);
    const expectedUserID = undefined;
    assert(user !== expectedUserID);
  });
  it('should return undefined for a non-existent email', function() {
    const user = findUserByEmail("noemail@example.com", testUsers);
    const expectedUserID = undefined;
    assert(user !== expectedUserID);
  });

});