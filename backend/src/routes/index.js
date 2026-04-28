const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');

const authController = require('../controllers/authController');
const equipmentController = require('../controllers/equipmentController');
const clientController = require('../controllers/clientController');
const rentalController = require('../controllers/rentalController');
const userController = require('../controllers/userController')
const notificationController = require('../controllers/notificationController')
const billingController = require('../controllers/billingController');

// Auth routes
router.post('/auth/register', (req, res, next) => authController.register(req, res, next));
router.post('/auth/login', (req, res, next) => authController.login(req, res, next));
router.get('/auth/me', authenticate, (req, res, next) => authController.me(req, res, next));

// Dashboard
router.get('/dashboard', authenticate, (req, res, next) => rentalController.dashboard(req, res, next));

// Equipment routes
router.get('/equipments', authenticate, (req, res, next) => equipmentController.index(req, res, next));
router.get('/equipments/:id', authenticate, (req, res, next) => equipmentController.show(req, res, next));
router.post('/equipments', authenticate, (req, res, next) => equipmentController.create(req, res, next));
router.put('/equipments/:id', authenticate, (req, res, next) => equipmentController.update(req, res, next));
router.delete('/equipments/:id', authenticate, (req, res, next) => equipmentController.destroy(req, res, next));

// Client routes
router.get('/clients', authenticate, (req, res, next) => clientController.index(req, res, next));
router.get('/clients/:id', authenticate, (req, res, next) => clientController.show(req, res, next));
router.post('/clients', authenticate, (req, res, next) => clientController.create(req, res, next));
router.put('/clients/:id', authenticate, (req, res, next) => clientController.update(req, res, next));
router.delete('/clients/:id', authenticate, (req, res, next) => clientController.destroy(req, res, next));

// Rental routes
router.get('/rentals', authenticate, (req, res, next) => rentalController.index(req, res, next));
router.get('/rentals/deliveries/today', authenticate, (req, res, next) => rentalController.todayDeliveries(req, res, next));
router.get('/rentals/:id', authenticate, (req, res, next) => rentalController.show(req, res, next));
router.post('/rentals', authenticate, (req, res, next) => rentalController.create(req, res, next));
router.patch('/rentals/:id/complete', authenticate, (req, res, next) => rentalController.complete(req, res, next));
router.patch('/rentals/:id/payment', authenticate, (req, res, next) => rentalController.updatePayment(req, res, next));

// User routes (admin only)
const { requireAdmin } = require('../middlewares/auth');
router.get('/users', authenticate, requireAdmin, (req, res, next) => userController.index(req, res, next));
router.post('/users', authenticate, requireAdmin, (req, res, next) => userController.create(req, res, next));
router.put('/users/:id', authenticate, requireAdmin, (req, res, next) => userController.update(req, res, next));
router.delete('/users/:id', authenticate, requireAdmin, (req, res, next) => userController.destroy(req, res, next));

// Billing / Asaas routes
router.post('/billing/:rentalId/charge', authenticate, (req, res, next) => billingController.createCharge(req, res, next))
router.get('/billing/:rentalId/sync', authenticate, (req, res, next) => billingController.syncStatus(req, res, next))
router.post('/billing/webhook', (req, res, next) => billingController.webhook(req, res, next)) // público para Asaas

// Damage fines routes
router.get('/rentals/:rentalId/damages', authenticate, (req, res, next) => billingController.getDamageFines(req, res, next))
router.post('/rentals/:rentalId/damages', authenticate, (req, res, next) => billingController.addDamageFine(req, res, next))
router.delete('/rentals/:rentalId/damages/:fineId', authenticate, (req, res, next) => billingController.removeDamageFine(req, res, next))

// Notification / WhatsApp routes
router.get('/notifications/status', authenticate, (req, res, next) => notificationController.status(req, res, next))
router.post('/notifications/cobranca/:rentalId', authenticate, (req, res, next) => notificationController.sendCobranca(req, res, next))
router.post('/notifications/atrasada/:rentalId', authenticate, (req, res, next) => notificationController.sendAtrasada(req, res, next))
router.post('/notifications/lembretes', authenticate, (req, res, next) => notificationController.sendLembretes(req, res, next))

module.exports = router
