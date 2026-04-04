const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const accountModel = require('../models/account.model')
const mongoose = require('mongoose')
const emailService = require('../services/email.service')



/**
 * - Create a new tansaction
 * THE 10 STEP TRANSACTION FLOW
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction as COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

async function createTransaction(req, res){
    
    /**
     * 1. Validate Request
     */

    const {fromAccount, toAccount, amount, idempotencyKey} = req.body
    
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "Missing required fields: fromAccount, toAccount, amount, idempotencyKey"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }


    /**
     * 2. Validate idempotency key
     */
    
    const transactionExistsWithSameIdempotencyKey = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(transactionExistsWithSameIdempotencyKey){
        if(transactionExistsWithSameIdempotencyKey.status === "COMPLETED"){
            return res.status(200).json({
                message: "Transaction already processed successfully."
            })
        }
        else if(transactionExistsWithSameIdempotencyKey.status === "PENDING"){
            return res.status(200).json({
                message: "Transaction is still processing.."
            })
        }
        else if(transactionExistsWithSameIdempotencyKey.status === "FAILED"){
            return res.status(500).json({
                message: "Previous attempt failed, please try again."
            })
        }
        else if(transactionExistsWithSameIdempotencyKey.status === "REVERSED"){
            return res.status(500).json({
                message: "Transaction was reversed, please retry."
            })
        }
    }

    /**
     * 3. Check account status
     */

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */

    const fromAccountBalance = await fromUserAccount.getBalance()

    if(fromAccountBalance < amount){
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${fromAccountBalance}. Requested amount is ${amount}`
        })
    }

    /**
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction as COMPLETED
     * 9. Commit MongoDB session
     */

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }, {session})

    const debitLedgerEntry = await ledgerModel.create({
        account: fromAccount,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
    }, {session})

    const creditLedgerEntry = await ledgerModel.create({
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
    }, {session})

    transaction.status = "COMPLETED"
    await transaction.save({session})

    /**
     * 10. Send email notification
     */

    await emailService.sendTransactionSuccessfulEmail(fromUserAccount.user.email, fromUserAccount.user.name, amount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })

}


module.exports = {
    createTransaction
}