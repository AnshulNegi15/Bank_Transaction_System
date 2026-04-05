const express = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const transactionController = require('../controllers/transaction.controller')


const router = express.Router()

/**
 * - POST /api/transaction
 * - Create a new transaction
 */
router.post('/', authMiddleware.authMiddleware, transactionController.createTransaction)




module.exports = router