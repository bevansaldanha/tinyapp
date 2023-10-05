
function findUserByEmail(email, database) {
  for (const id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  return null;
}

module.exports = { findUserByEmail };