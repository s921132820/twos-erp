namespace LabelPrinter.Api;

public sealed class GoogleAppsScriptApiException : Exception
{
    public GoogleAppsScriptApiException(string message)
        : base(message)
    {
    }

    public GoogleAppsScriptApiException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
