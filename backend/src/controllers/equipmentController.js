const equipmentService = require('../services/equipmentService');

class EquipmentController {
  async index(req, res, next) {
    try {
      const data = await equipmentService.findAll(req.companyId, req.query);
      res.json(data);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const data = await equipmentService.findById(req.params.id, req.companyId);
      res.json(data);
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const data = await equipmentService.create(req.companyId, req.body);
      res.status(201).json(data);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = await equipmentService.update(req.params.id, req.companyId, req.body);
      res.json(data);
    } catch (error) { next(error); }
  }

  async destroy(req, res, next) {
    try {
      await equipmentService.delete(req.params.id, req.companyId);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}

module.exports = new EquipmentController();
