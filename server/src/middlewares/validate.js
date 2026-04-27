const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
    });
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = validate;
