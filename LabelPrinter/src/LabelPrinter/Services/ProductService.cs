using LabelPrinter.Api;
using LabelPrinter.Models;

namespace LabelPrinter.Services;

public sealed class ProductService : IProductService
{
    private readonly IGoogleAppsScriptClient _apiClient;

    public ProductService(IGoogleAppsScriptClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task<IReadOnlyList<Product>> GetActiveProductsAsync(
        CancellationToken cancellationToken = default)
    {
        var response = await _apiClient.GetAsync<List<Product>>(
            new Dictionary<string, string?>
            {
                ["action"] = "products"
            },
            cancellationToken);

        if (!response.Success)
        {
            throw new GoogleAppsScriptApiException(
                response.Message ?? "품목 목록을 가져오지 못했습니다.");
        }

        return (response.Data ?? [])
            .Where(product => product.IsActive)
            .OrderBy(product => product.ProductName, StringComparer.CurrentCulture)
            .ToArray();
    }
}
