namespace LabelPrinter.Config;

public sealed class PrinterSettings
{
    public const string SectionName = "Printer";

    public string PrinterName { get; set; } = string.Empty;

    public double LabelWidthMm { get; set; } = 80;

    public double LabelHeightMm { get; set; } = 50;

    public PrinterSettings Copy() => new()
    {
        PrinterName = PrinterName,
        LabelWidthMm = LabelWidthMm,
        LabelHeightMm = LabelHeightMm
    };
}
