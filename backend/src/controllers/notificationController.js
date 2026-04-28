const notificationService = require('../services/notificationService')

class NotificationController {
  async status(req, res, next) {
    try {
      const data = await notificationService.getStatus()
      res.json(data)
    } catch (err) { next(err) }
  }

  async sendCobranca(req, res, next) {
    try {
      const data = await notificationService.notifyCobranca(req.params.rentalId, req.companyId)
      res.json({ message: 'Mensagem de cobrança enviada!', ...data })
    } catch (err) { next(err) }
  }

  async sendAtrasada(req, res, next) {
    try {
      const data = await notificationService.notifyAtrasada(req.params.rentalId, req.companyId)
      res.json({ message: 'Aviso de atraso enviado!', ...data })
    } catch (err) { next(err) }
  }

  async sendLembretes(req, res, next) {
    try {
      const data = await notificationService.notifyLembretes(req.companyId)
      res.json({ message: `${data.total} lembrete(s) processado(s)`, ...data })
    } catch (err) { next(err) }
  }
}

module.exports = new NotificationController()
