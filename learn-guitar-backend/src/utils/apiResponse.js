export const successResponse = (res, {
  statusCode = 200,
  message,
  data = null,
  meta = null
}) => {
  const payload = {
    success: true
  };

  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  if (meta) payload.meta = meta;

  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, {
  statusCode = 400,
  message,
  errors = null
}) => {
  const payload = {
    success: false,
    message
  };

  if (errors) payload.errors = errors;

  return res.status(statusCode).json(payload);
};
