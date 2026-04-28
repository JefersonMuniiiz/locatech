const billingService = require('../services/billingService')

class BillingController {
  async createCharge(req, res, next) {
    try {
      const data = await billingService.createCharge(req.params.rentalId, req.companyId, req.body)
      res.status(201).json(data)
    } catch (err) { next(err) }
  }

  async syncStatus(req, res, next) {
    try {
      const data = await billingService.syncChargeStatus(req.params.rentalId, req.companyId)
      res.json(data)
    } catch (err) { next(err) }
  }

  async webhook(req, res, next) {
    try {
      const data = await billingService.processWebhook(req.body)
      res.json(data)
    } catch (err) { next(err) }
  }

  async addDamageFine(req, res, next) {
    try {
      const data = await billingService.addDamageFine(req.params.rentalId, req.companyId, req.body)
      res.status(201).json(data)
    } catch (err) { next(err) }
  }

  async getDamageFines(req, res, next) {
    try {
      const data = await billingService.getDamageFines(req.params.rentalId, req.companyId)
      res.json(data)
    } catch (err) { next(err) }
  }

  async removeDamageFine(req, res, next) {
    try {
      const data = await billingService.removeDamageFine(req.params.fineId, req.params.rentalId, req.companyId)
      res.json(data)
    } catch (err) { next(err) }
  }
}

module.exports = new BillingController()
