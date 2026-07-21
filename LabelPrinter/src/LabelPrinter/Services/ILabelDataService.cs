using LabelPrinter.Models;

namespace LabelPrinter.Services;

public interface ILabelDataService
{
    LabelData Create(Product product, MeatTraceInfo traceInfo);
}
