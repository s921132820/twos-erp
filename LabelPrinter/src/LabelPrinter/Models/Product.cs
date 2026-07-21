using System.Text.Json.Serialization;

namespace LabelPrinter.Models;

public sealed class Product
{
    [JsonPropertyName("productCode")]
    public string ProductCode { get; init; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; init; } = string.Empty;

    [JsonPropertyName("traceNumber")]
    public string TraceNumber { get; init; } = string.Empty;

    [JsonPropertyName("labelName")]
    public string LabelName { get; init; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; init; }
}
