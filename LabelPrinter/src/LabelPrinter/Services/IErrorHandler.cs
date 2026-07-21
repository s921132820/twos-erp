namespace LabelPrinter.Services;

public interface IErrorHandler
{
    Task<string> HandleAsync(
        Exception exception,
        string context,
        CancellationToken cancellationToken = default);
}
