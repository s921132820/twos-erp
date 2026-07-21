namespace LabelPrinter.Services;

public interface IAppLogger
{
    Task LogErrorAsync(
        Exception exception,
        string context,
        CancellationToken cancellationToken = default);
}
