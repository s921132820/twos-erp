namespace LabelPrinter.Api;

public interface IGoogleAppsScriptClient
{
    Task<ApiResponse<T>> GetAsync<T>(
        IReadOnlyDictionary<string, string?> queryParameters,
        CancellationToken cancellationToken = default);
}
