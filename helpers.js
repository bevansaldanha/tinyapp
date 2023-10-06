// checks given email against emails for users in the database, and return the user if there is a match and null if not. 
function findUserByEmail(email, database) {
  for (const id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  return null;
}

module.exports = { findUserByEmail };