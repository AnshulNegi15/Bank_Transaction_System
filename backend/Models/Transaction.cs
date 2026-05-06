using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BankApi.Models;

public class Transaction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("fromAccount")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string FromAccountId { get; set; } = null!;

    [BsonElement("toAccount")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string ToAccountId { get; set; } = null!;

    [BsonElement("status")]
    public string Status { get; set; } = "PENDING";

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("idempotencyKey")]
    public string IdempotencyKey { get; set; } = null!;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
