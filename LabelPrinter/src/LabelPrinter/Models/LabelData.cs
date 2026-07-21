namespace LabelPrinter.Models;

public sealed record LabelData(
    string ProductCode,
    string ProductName,
    string LabelName,
    string TraceNumber,
    string OriginCountry,
    string? ExpirationDate,
    string ImporterName,
    DateTimeOffset GeneratedAt)
{
    public bool HasExpirationDate => !string.IsNullOrWhiteSpace(ExpirationDate);
}
