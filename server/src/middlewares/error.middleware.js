const sendApiResponse = require("../utils/sendApiResponse");

exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorDetail = "";

  if (err.code == 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `A record with this ${field} already exists.`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation Error";
    errorDetail = err.issues[0].message;
  }

  console.error("Error: ", err);
  return sendApiResponse({
    status: statusCode,
    message,
    res,
    props: errorDetail ? { error: errorDetail } : {},
  });
};
