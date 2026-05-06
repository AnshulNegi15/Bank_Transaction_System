using BankApi.DTOs;
using BankApi.Models;
using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace BankApi.Controllers;

[ApiController]
[Route("api/transaction")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly MongoDbService _db;

    public TransactionController(MongoDbService db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction(TransactionRequest req)
    {
        if (string.IsNullOrEmpty(req.FromAccount) || string.IsNullOrEmpty(req.ToAccount) || req.Amount <= 0 || string.IsNullOrEmpty(req.IdempotencyKey))
        {
            return BadRequest(new { message = "Missing required fields: fromAccount, toAccount, amount, idempotencyKey" });
        }

        var fromUserAccount = await _db.Accounts.Find(a => a.Id == req.FromAccount).FirstOrDefaultAsync();
        var toUserAccount = await _db.Accounts.Find(a => a.Id == req.ToAccount).FirstOrDefaultAsync();

        if (fromUserAccount == null || toUserAccount == null)
        {
            return BadRequest(new { message = "Invalid fromAccount or toAccount" });
        }

        var existingTx = await _db.Transactions.Find(t => t.IdempotencyKey == req.IdempotencyKey).FirstOrDefaultAsync();
        if (existingTx != null)
        {
            if (existingTx.Status == "COMPLETED") return Ok(new { message = "Transaction already processed successfully." });
            if (existingTx.Status == "PENDING") return Ok(new { message = "Transaction is still processing.." });
            if (existingTx.Status == "FAILED") return StatusCode(500, new { message = "Previous attempt failed, please try again." });
            if (existingTx.Status == "REVERSED") return StatusCode(500, new { message = "Transaction was reversed, please retry." });
        }

        if (fromUserAccount.Status != "ACTIVE" || toUserAccount.Status != "ACTIVE")
        {
            return BadRequest(new { message = "Both fromAccount and toAccount must be ACTIVE to process transaction" });
        }

        var credits = await _db.Ledgers.Find(l => l.AccountId == fromUserAccount.Id && l.Type == "CREDIT").ToListAsync();
        var debits = await _db.Ledgers.Find(l => l.AccountId == fromUserAccount.Id && l.Type == "DEBIT").ToListAsync();
        var balance = credits.Sum(c => c.Amount) - debits.Sum(d => d.Amount);

        if (balance < req.Amount)
        {
            return BadRequest(new { message = $"Insufficient balance. Current balance is {balance}. Requested amount is {req.Amount}" });
        }

        using var session = await _db.Client.StartSessionAsync();
        session.StartTransaction();

        try
        {
            var transaction = new Transaction
            {
                FromAccountId = req.FromAccount,
                ToAccountId = req.ToAccount,
                Amount = req.Amount,
                IdempotencyKey = req.IdempotencyKey,
                Status = "PENDING"
            };
            await _db.Transactions.InsertOneAsync(session, transaction);

            var debitLedger = new Ledger
            {
                AccountId = req.FromAccount,
                Amount = req.Amount,
                TransactionId = transaction.Id!,
                Type = "DEBIT"
            };
            await _db.Ledgers.InsertOneAsync(session, debitLedger);

            var creditLedger = new Ledger
            {
                AccountId = req.ToAccount,
                Amount = req.Amount,
                TransactionId = transaction.Id!,
                Type = "CREDIT"
            };
            await _db.Ledgers.InsertOneAsync(session, creditLedger);

            var update = Builders<Transaction>.Update.Set(t => t.Status, "COMPLETED");
            await _db.Transactions.UpdateOneAsync(session, t => t.Id == transaction.Id, update);

            await session.CommitTransactionAsync();

            transaction.Status = "COMPLETED";

            return Created("", new { message = "Transaction completed successfully", transaction });
        }
        catch
        {
            await session.AbortTransactionAsync();
            return StatusCode(500, new { message = "Transaction failed" });
        }
    }
}
