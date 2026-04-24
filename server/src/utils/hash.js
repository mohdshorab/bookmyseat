const bcrypt = require("bcrypt");

exports.getHashedPass = async (password, saltRounds) => {
  return bcrypt.hash(password, saltRounds);
};
