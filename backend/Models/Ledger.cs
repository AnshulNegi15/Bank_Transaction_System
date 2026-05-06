using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BankApi.Models;

public class Ledger
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("account")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string AccountId { get; set; } = null!;

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("transaction")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string TransactionId { get; set; } = null!;

    [BsonElement("type")]
    public string Type { get; set; } = null!;
}
