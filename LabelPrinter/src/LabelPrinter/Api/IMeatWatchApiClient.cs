using LabelPrinter.Models;

namespace LabelPrinter.Api;

public interface IMeatWatchApiClient
{
    Task<MeatTraceInfo> GetTraceInfoAsync(
        string traceNumber,
        CancellationToken cancellationToken = default);
}
