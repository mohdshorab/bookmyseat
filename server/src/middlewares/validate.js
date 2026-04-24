const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
    });
    next();
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: e.issues[0].message,
    });
  }
};

module.exports = validate;
