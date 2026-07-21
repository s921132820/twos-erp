namespace LabelPrinter.Config;

public sealed class GoogleAppsScriptOptions
{
    public const string SectionName = "GoogleAppsScript";

    public string BaseUrl { get; init; } = string.Empty;

    public int TimeoutSeconds { get; init; } = 15;
}
