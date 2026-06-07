export const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const paginated = (res, data, meta) =>
  res.status(200).json({ success: true, data, meta });

export const error = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
