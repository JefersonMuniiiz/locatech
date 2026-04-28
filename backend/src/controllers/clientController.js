const clientService = require('../services/clientService');

class ClientController {
  async index(req, res, next) {
    try {
      const data = await clientService.findAll(req.companyId, req.query);
      res.json(data);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const data = await clientService.findById(req.params.id, req.companyId);
      res.json(data);
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const data = await clientService.create(req.companyId, req.body);
      res.status(201).json(data);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = await clientService.update(req.params.id, req.companyId, req.body);
      res.json(data);
    } catch (error) { next(error); }
  }

  async destroy(req, res, next) {
    try {
      await clientService.delete(req.params.id, req.companyId);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}

module.exports = new ClientController();
