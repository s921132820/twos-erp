namespace LabelPrinter.Printer;

public sealed class LabelPrintException : Exception
{
    public LabelPrintException(string message)
        : base(message)
    {
    }

    public LabelPrintException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
