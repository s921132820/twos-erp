using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using LabelPrinter.Config;
using LabelPrinter.Models;

namespace LabelPrinter.Api;

public sealed partial class MeatWatchApiClient : IMeatWatchApiClient
{
    private readonly HttpClient _httpClient;
    private readonly MeatWatchOptions _options;

    public MeatWatchApiClient(HttpClient httpClient, MeatWatchOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public async Task<MeatTraceInfo> GetTraceInfoAsync(
        string traceNumber,
        CancellationToken cancellationToken = default)
    {
        if (!TraceNumberRegex().IsMatch(traceNumber))
        {
            throw new MeatWatchApiException("이력번호는 숫자 12자리여야 합니다.");
        }

        var requestUri = BuildRequestUri(traceNumber);

        try
        {
            using var response = await _httpClient.GetAsync(requestUri, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new MeatWatchApiException(
                    $"이력정보 API 요청이 실패했습니다. HTTP {(int)response.StatusCode}");
            }

            return ParseResponse(body, traceNumber);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new MeatWatchApiException("이력정보 API 응답 시간이 초과되었습니다.");
        }
        catch (HttpRequestException exception)
        {
            throw new MeatWatchApiException("이력정보 API에 연결할 수 없습니다.", exception);
        }
        catch (JsonException exception)
        {
            throw new MeatWatchApiException("이력정보 API JSON 응답을 해석할 수 없습니다.", exception);
        }
        catch (System.Xml.XmlException exception)
        {
            throw new MeatWatchApiException("이력정보 API XML 응답을 해석할 수 없습니다.", exception);
        }
    }

    private Uri BuildRequestUri(string traceNumber)
    {
        if (!Uri.TryCreate(_options.BaseUrl, UriKind.Absolute, out var baseUri)
            || baseUri.Scheme != Uri.UriSchemeHttps)
        {
            throw new MeatWatchApiException(
                "appsettings.json에 승인받은 MeatWatch HTTPS API URL을 설정하세요.");
        }

        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new MeatWatchApiException(
                "appsettings.json에 MeatWatch API 인증값을 설정하세요.");
        }

        var parameters = new Dictionary<string, string>
        {
            [_options.ApiKeyParameterName] = _options.ApiKey,
            [_options.TraceNumberParameterName] = traceNumber
        };

        if (!string.IsNullOrWhiteSpace(_options.ResponseFormatParameterName)
            && !string.IsNullOrWhiteSpace(_options.ResponseFormat))
        {
            parameters[_options.ResponseFormatParameterName] = _options.ResponseFormat;
        }

        var query = string.Join(
            "&",
            parameters.Select(pair =>
                $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value)}"));

        var builder = new UriBuilder(baseUri);
        var existingQuery = builder.Query.TrimStart('?');
        builder.Query = string.Join(
            "&",
            new[] { existingQuery, query }.Where(value => !string.IsNullOrWhiteSpace(value)));

        return builder.Uri;
    }

    private MeatTraceInfo ParseResponse(string body, string requestedTraceNumber)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            throw new MeatWatchApiException("이력정보 API가 빈 응답을 반환했습니다.");
        }

        var values = body.TrimStart().StartsWith('<')
            ? ParseXml(body)
            : ParseJson(body);

        var originCountry = GetRequiredValue(
            values,
            _options.Fields.OriginCountry,
            "원산지");
        var importerName = GetRequiredValue(
            values,
            _options.Fields.ImporterName,
            "수입업체");

        return new MeatTraceInfo(
            GetValue(values, _options.Fields.TraceNumber) ?? requestedTraceNumber,
            GetValue(values, _options.Fields.ItemName) ?? string.Empty,
            originCountry,
            GetValue(values, _options.Fields.ExpirationDate),
            importerName);
    }

    private static Dictionary<string, string> ParseJson(string body)
    {
        using var document = JsonDocument.Parse(body);
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        CollectJsonValues(document.RootElement, values);
        return values;
    }

    private static void CollectJsonValues(
        JsonElement element,
        IDictionary<string, string> values)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (property.Value.ValueKind is JsonValueKind.String
                    or JsonValueKind.Number
                    or JsonValueKind.True
                    or JsonValueKind.False)
                {
                    values.TryAdd(property.Name, property.Value.ToString());
                }

                CollectJsonValues(property.Value, values);
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                CollectJsonValues(item, values);
            }
        }
    }

    private static Dictionary<string, string> ParseXml(string body)
    {
        var document = XDocument.Parse(body);
        return document
            .Descendants()
            .Where(element => !element.HasElements && !string.IsNullOrWhiteSpace(element.Value))
            .GroupBy(element => element.Name.LocalName, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First().Value.Trim(),
                StringComparer.OrdinalIgnoreCase);
    }

    private static string GetRequiredValue(
        IReadOnlyDictionary<string, string> values,
        string fieldName,
        string displayName)
    {
        return GetValue(values, fieldName)
            ?? throw new MeatWatchApiException(
                $"API 응답에서 {displayName} 필드 '{fieldName}'을 찾을 수 없습니다.");
    }

    private static string? GetValue(
        IReadOnlyDictionary<string, string> values,
        string fieldName)
    {
        return values.TryGetValue(fieldName, out var value)
            && !string.IsNullOrWhiteSpace(value)
                ? value.Trim()
                : null;
    }

    [GeneratedRegex("^[0-9]{12}$", RegexOptions.CultureInvariant)]
    private static partial Regex TraceNumberRegex();
}
