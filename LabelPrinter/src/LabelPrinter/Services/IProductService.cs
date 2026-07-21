using LabelPrinter.Models;

namespace LabelPrinter.Services;

public interface IProductService
{
    Task<IReadOnlyList<Product>> GetActiveProductsAsync(
        CancellationToken cancellationToken = default);
}
