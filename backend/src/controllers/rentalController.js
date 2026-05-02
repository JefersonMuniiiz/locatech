const rentalService = require('../services/rentalService');

class RentalController {
  async index(req, res, next) {
    try {
      const data = await rentalService.findAll(req.companyId, req.query);
      res.json(data);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const data = await rentalService.findById(req.params.id, req.companyId);
      res.json(data);
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const data = await rentalService.create(req.companyId, req.body);
      res.status(201).json(data);
    } catch (error) { next(error); }
  }

  async complete(req, res, next) {
    try {
      const data = await rentalService.complete(req.params.id, req.companyId);
      res.json(data);
    } catch (error) { next(error); }
  }

  async updatePayment(req, res, next) {
    try {
      const data = await rentalService.updatePayment(req.params.id, req.companyId, req.body);
      res.json(data);
    } catch (error) { next(error); }
  }

  async dashboard(req, res, next) {
    try {
      const data = await rentalService.getDashboardStats(req.companyId);
      res.json(data);
    } catch (error) { next(error); }
  }

  async todayDeliveries(req, res, next) {
    try {
      const data = await rentalService.getTodayDeliveries(req.companyId);
      res.json(data);
    } catch (error) { next(error); }
  }
async update(req, res, next) {
  try {
    const data = await rentalService.update(req.params.id, req.companyId, req.body)
    res.json(data)
  } catch (err) { next(err) }
}

async destroy(req, res, next) {
  try {
    await rentalService.delete(req.params.id, req.companyId)
    res.status(204).send()
  } catch (err) { next(err) }
}

}


module.exports = new RentalController();
