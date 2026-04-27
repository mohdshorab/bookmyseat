const sendApiResponse = ({ status, message, res, props }) => {
  return res.status(status).json({
    success: status < 400,
    message: message,
    ...props,
  });
};
module.exports = sendApiResponse;
