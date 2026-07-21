namespace LabelPrinter.Api;

public sealed class MeatWatchApiException : Exception
{
    public MeatWatchApiException(string message)
        : base(message)
    {
    }

    public MeatWatchApiException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
