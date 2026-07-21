using LabelPrinter.Models;

namespace LabelPrinter.Printer;

public interface ILabelPrinter
{
    Task<PrintResult> PrintAsync(
        LabelData labelData,
        int quantity,
        CancellationToken cancellationToken = default);
}
