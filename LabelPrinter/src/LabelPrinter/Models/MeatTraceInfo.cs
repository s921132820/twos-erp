namespace LabelPrinter.Models;

public sealed record MeatTraceInfo(
    string TraceNumber,
    string ItemName,
    string OriginCountry,
    string? ExpirationDate,
    string ImporterName);
