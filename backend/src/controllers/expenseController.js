const expenseService = require('../services/expenseService')

class ExpenseController {
  async index(req, res, next) {
    try {
      const data = await expenseService.findAll(req.companyId, req.query)
      res.json(data)
    } catch (err) { next(err) }
  }

  async cashflow(req, res, next) {
    try {
      const data = await expenseService.getCashFlow(req.companyId, req.query)
      res.json(data)
    } catch (err) { next(err) }
  }

  async create(req, res, next) {
    try {
      const data = await expenseService.create(req.companyId, req.body)
      res.status(201).json(data)
    } catch (err) { next(err) }
  }

  async update(req, res, next) {
    try {
      const data = await expenseService.update(req.params.id, req.companyId, req.body)
      res.json(data)
    } catch (err) { next(err) }
  }

  async destroy(req, res, next) {
    try {
      await expenseService.remove(req.params.id, req.companyId)
      res.status(204).send()
    } catch (err) { next(err) }
  }
}

module.exports = new ExpenseController()
