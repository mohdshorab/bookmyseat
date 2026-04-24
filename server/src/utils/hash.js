const bcrypt = require("bcrypt");

exports.getHashedPass = async (password, saltRounds) => {
  return bcrypt.hash(password, saltRounds);
};

exports.verifyPass = async (password, hashedPass) => {
  return bcrypt.compare(password, hashedPass);
};
