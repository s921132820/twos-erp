namespace LabelPrinter.Config;

public sealed class MeatWatchOptions
{
    public const string SectionName = "MeatWatch";

    public string BaseUrl { get; init; } = string.Empty;

    public string ApiKey { get; init; } = string.Empty;

    public string ApiKeyParameterName { get; init; } = "serviceKey";

    public string TraceNumberParameterName { get; init; } = "traceNo";

    public string ResponseFormatParameterName { get; init; } = "format";

    public string ResponseFormat { get; init; } = "json";

    public int TimeoutSeconds { get; init; } = 15;

    public MeatWatchFieldOptions Fields { get; init; } = new();
}

public sealed class MeatWatchFieldOptions
{
    public string TraceNumber { get; init; } = "traceNumber";

    public string ItemName { get; init; } = "itemName";

    public string OriginCountry { get; init; } = "originCountry";

    public string ExpirationDate { get; init; } = "expirationDate";

    public string ImporterName { get; init; } = "importerName";
}
