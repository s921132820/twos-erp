namespace LabelPrinter.Services;

public sealed class LabelDataException : Exception
{
    public LabelDataException(string message)
        : base(message)
    {
    }
}
