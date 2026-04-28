const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Registro já existe com esses dados' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
