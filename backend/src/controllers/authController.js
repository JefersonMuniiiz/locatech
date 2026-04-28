const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res) {
    res.json({
      user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
      company: { id: req.user.company.id, name: req.user.company.name },
    });
  }
}

module.exports = new AuthController();
