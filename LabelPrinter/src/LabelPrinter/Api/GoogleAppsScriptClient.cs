using System.Net.Http;
using System.Text.Json;
using LabelPrinter.Config;

namespace LabelPrinter.Api;

public sealed class GoogleAppsScriptClient : IGoogleAppsScriptClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly GoogleAppsScriptOptions _options;

    public GoogleAppsScriptClient(
        HttpClient httpClient,
        GoogleAppsScriptOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public async Task<ApiResponse<T>> GetAsync<T>(
        IReadOnlyDictionary<string, string?> queryParameters,
        CancellationToken cancellationToken = default)
    {
        var requestUri = BuildRequestUri(queryParameters);

        try
        {
            using var response = await _httpClient.GetAsync(requestUri, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new GoogleAppsScriptApiException(
                    $"Google Apps Script 요청이 실패했습니다. HTTP {(int)response.StatusCode}");
            }

            var result = JsonSerializer.Deserialize<ApiResponse<T>>(responseBody, JsonOptions);

            return result ?? throw new GoogleAppsScriptApiException(
                "Google Apps Script 응답을 해석할 수 없습니다.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new GoogleAppsScriptApiException(
                "Google Apps Script 응답 시간이 초과되었습니다.");
        }
        catch (HttpRequestException exception)
        {
            throw new GoogleAppsScriptApiException(
                "Google Apps Script에 연결할 수 없습니다.", exception);
        }
        catch (JsonException exception)
        {
            throw new GoogleAppsScriptApiException(
                "Google Apps Script가 올바른 JSON을 반환하지 않았습니다.", exception);
        }
    }

    private Uri BuildRequestUri(IReadOnlyDictionary<string, string?> queryParameters)
    {
        if (!Uri.TryCreate(_options.BaseUrl, UriKind.Absolute, out var baseUri)
            || baseUri.Scheme != Uri.UriSchemeHttps)
        {
            throw new GoogleAppsScriptApiException(
                "appsettings.json에 유효한 HTTPS Google Apps Script URL을 설정하세요.");
        }

        var query = string.Join(
            "&",
            queryParameters
                .Where(pair => !string.IsNullOrWhiteSpace(pair.Value))
                .Select(pair =>
                    $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value!)}"));

        var builder = new UriBuilder(baseUri);
        var existingQuery = builder.Query.TrimStart('?');
        builder.Query = string.Join(
            "&",
            new[] { existingQuery, query }.Where(value => !string.IsNullOrWhiteSpace(value)));

        return builder.Uri;
    }
}
