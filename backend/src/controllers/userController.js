const userService = require('../services/userService');

class UserController {
  async index(req, res, next) {
    try {
      const data = await userService.findAll(req.companyId);
      res.json(data);
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const data = await userService.create(req.companyId, req.body);
      res.status(201).json(data);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const data = await userService.update(req.params.id, req.companyId, req.body);
      res.json(data);
    } catch (err) { next(err); }
  }

  async destroy(req, res, next) {
    try {
      await userService.delete(req.params.id, req.companyId, req.user.id);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();
