using LabelPrinter.Config;

namespace LabelPrinter.Services;

public interface ISettingsService
{
    PrinterSettings Current { get; }

    Task SavePrinterSettingsAsync(
        PrinterSettings settings,
        CancellationToken cancellationToken = default);
}
