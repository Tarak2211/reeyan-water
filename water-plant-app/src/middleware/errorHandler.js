const errorHandler = (err, req, res, next) => {
  // Log internally but never expose stack traces to client in production
  console.error(`[ERROR] ${new Date().toISOString()} — ${err.message}`);

  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: isProd
      ? (statusCode < 500 ? err.message : 'Internal server error')
      : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
