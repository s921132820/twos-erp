using LabelPrinter.Models;

namespace LabelPrinter.Services;

public sealed class LabelDataService : ILabelDataService
{
    public LabelData Create(Product product, MeatTraceInfo traceInfo)
    {
        ArgumentNullException.ThrowIfNull(product);
        ArgumentNullException.ThrowIfNull(traceInfo);

        var productCode = Required(product.ProductCode, "품목코드");
        var productName = Required(product.ProductName, "품목명");
        var productTraceNumber = Required(product.TraceNumber, "Spreadsheet 이력번호");
        var apiTraceNumber = Required(traceInfo.TraceNumber, "API 이력번호");

        if (!string.Equals(productTraceNumber, apiTraceNumber, StringComparison.Ordinal))
        {
            throw new LabelDataException(
                $"Spreadsheet 이력번호({productTraceNumber})와 API 이력번호({apiTraceNumber})가 일치하지 않습니다.");
        }

        var labelName = string.IsNullOrWhiteSpace(product.LabelName)
            ? productName
            : product.LabelName.Trim();

        return new LabelData(
            productCode,
            productName,
            labelName,
            apiTraceNumber,
            Required(traceInfo.OriginCountry, "원산지"),
            NormalizeOptional(traceInfo.ExpirationDate),
            Required(traceInfo.ImporterName, "수입업체"),
            DateTimeOffset.Now);
    }

    private static string Required(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new LabelDataException($"라벨 필수 항목 '{fieldName}'이 비어 있습니다.");
        }

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
