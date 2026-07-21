namespace LabelPrinter.Printer;

public interface IPrinterCatalog
{
    IReadOnlyList<string> GetInstalledPrinterNames();
}
