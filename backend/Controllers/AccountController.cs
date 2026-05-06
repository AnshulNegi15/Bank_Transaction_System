using System.Security.Claims;
using BankApi.Models;
using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace BankApi.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly MongoDbService _db;

    public AccountController(MongoDbService db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> CreateAccount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var account = new Account
        {
            UserId = userId!
        };

        await _db.Accounts.InsertOneAsync(account);

        return Created("", new { account });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyAccounts()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var accounts = await _db.Accounts.Find(a => a.UserId == userId).ToListAsync();
        
        var result = new List<object>();
        foreach(var acc in accounts)
        {
            var credits = await _db.Ledgers.Find(l => l.AccountId == acc.Id && l.Type == "CREDIT").ToListAsync();
            var debits = await _db.Ledgers.Find(l => l.AccountId == acc.Id && l.Type == "DEBIT").ToListAsync();
            
            var balance = credits.Sum(c => c.Amount) - debits.Sum(d => d.Amount);
            result.Add(new {
                account = acc,
                balance
            });
        }
        
        return Ok(new { accounts = result });
    }
}
