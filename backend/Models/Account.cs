using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BankApi.Models;

public class Account
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("user")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    [BsonElement("status")]
    public string Status { get; set; } = "ACTIVE";

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
