using System.Printing;

namespace LabelPrinter.Printer;

public sealed class WindowsPrinterCatalog : IPrinterCatalog
{
    public IReadOnlyList<string> GetInstalledPrinterNames()
    {
        try
        {
            using var printServer = new LocalPrintServer();
            return printServer
                .GetPrintQueues(new[]
                {
                    EnumeratedPrintQueueTypes.Local,
                    EnumeratedPrintQueueTypes.Connections
                })
                .Select(queue => queue.FullName)
                .Distinct(StringComparer.CurrentCultureIgnoreCase)
                .OrderBy(name => name, StringComparer.CurrentCultureIgnoreCase)
                .ToArray();
        }
        catch (PrintSystemException exception)
        {
            throw new LabelPrintException(
                "설치된 Windows 프린터 목록을 가져오지 못했습니다.", exception);
        }
    }
}
