using BankApi.Models;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace BankApi.Services;

public class MongoDbService
{
    private readonly IMongoDatabase _database;

    public MongoDbService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDb");
        var mongoUrl = MongoUrl.Create(connectionString);
        var mongoClient = new MongoClient(mongoUrl);
        _database = mongoClient.GetDatabase(mongoUrl.DatabaseName);
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Account> Accounts => _database.GetCollection<Account>("accounts");
    public IMongoCollection<Transaction> Transactions => _database.GetCollection<Transaction>("transactions");
    public IMongoCollection<Ledger> Ledgers => _database.GetCollection<Ledger>("ledgers");
    
    public MongoClient Client => (MongoClient)_database.Client;
}
