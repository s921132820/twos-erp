using LabelPrinter.Api;
using LabelPrinter.Models;

namespace LabelPrinter.Services;

public sealed class MeatTraceService : IMeatTraceService
{
    private readonly IMeatWatchApiClient _apiClient;

    public MeatTraceService(IMeatWatchApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public Task<MeatTraceInfo> GetTraceInfoAsync(
        string traceNumber,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.GetTraceInfoAsync(traceNumber, cancellationToken);
    }
}
