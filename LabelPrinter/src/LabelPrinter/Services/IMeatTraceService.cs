using LabelPrinter.Models;

namespace LabelPrinter.Services;

public interface IMeatTraceService
{
    Task<MeatTraceInfo> GetTraceInfoAsync(
        string traceNumber,
        CancellationToken cancellationToken = default);
}
