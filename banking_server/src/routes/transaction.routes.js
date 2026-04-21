const express = require('express');
const passport = require('passport');
const router = express.Router();

const { validateRequest } = require('../middlewares/validation.middleware');
const transactionController = require('../controllers/transaction.controller');
const { transferSchema } = require('../validations/transaction.validation');
const authMiddleware = require('../middlewares/auth.middleware');
const { transferLimiter } = require('../config/secuirity');

router.use(passport.authenticate('jwt', { session: false })); // Protect all routes with JWT authentication

// POST /api/v1/transactions/transfer - Initiate a fund transfer between accounts
router.post('/transfer', authMiddleware.protect, transferLimiter, validateRequest(transferSchema), transactionController.transferFunds);