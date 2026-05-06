namespace BankApi.DTOs;

public class TransactionRequest
{
    public string FromAccount { get; set; } = null!;
    public string ToAccount { get; set; } = null!;
    public decimal Amount { get; set; }
    public string IdempotencyKey { get; set; } = null!;
}
