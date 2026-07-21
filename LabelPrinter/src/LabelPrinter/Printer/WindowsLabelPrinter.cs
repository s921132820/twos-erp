using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Markup;
using System.Windows.Media;
using LabelPrinter.Config;
using LabelPrinter.Models;
using LabelPrinter.Services;

namespace LabelPrinter.Printer;

public sealed class WindowsLabelPrinter : ILabelPrinter
{
    private readonly ISettingsService _settingsService;

    public WindowsLabelPrinter(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    public async Task<PrintResult> PrintAsync(
        LabelData labelData,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(labelData);
        cancellationToken.ThrowIfCancellationRequested();

        if (quantity is < PrintLimits.MinimumQuantity or > PrintLimits.MaximumQuantity)
        {
            throw new LabelPrintException(
                $"출력 수량은 {PrintLimits.MinimumQuantity}~{PrintLimits.MaximumQuantity}장이어야 합니다.");
        }

        if (Application.Current is null)
        {
            throw new LabelPrintException("WPF 애플리케이션 인쇄 환경을 찾을 수 없습니다.");
        }

        return await Application.Current.Dispatcher.InvokeAsync(() =>
        {
            cancellationToken.ThrowIfCancellationRequested();
            return PrintOnUiThread(labelData, quantity);
        });
    }

    private PrintResult PrintOnUiThread(LabelData labelData, int quantity)
    {
        try
        {
            var settings = _settingsService.Current;
            using var printServer = new LocalPrintServer();
            using var printQueue = string.IsNullOrWhiteSpace(settings.PrinterName)
                ? LocalPrintServer.GetDefaultPrintQueue()
                : printServer
                    .GetPrintQueues(new[]
                    {
                        EnumeratedPrintQueueTypes.Local,
                        EnumeratedPrintQueueTypes.Connections
                    })
                    .FirstOrDefault(queue => string.Equals(
                        queue.FullName,
                        settings.PrinterName,
                        StringComparison.CurrentCultureIgnoreCase));

            if (printQueue is null)
            {
                throw new LabelPrintException("Windows 기본 프린터가 설정되어 있지 않습니다.");
            }

            var printDialog = new PrintDialog
            {
                PrintQueue = printQueue
            };
            var labelWidth = MillimetersToDeviceUnits(settings.LabelWidthMm);
            var labelHeight = MillimetersToDeviceUnits(settings.LabelHeightMm);
            var pageWidth = PositiveOrDefault(printDialog.PrintableAreaWidth, labelWidth);
            var pageHeight = PositiveOrDefault(printDialog.PrintableAreaHeight, labelHeight);
            var document = CreateDocument(
                labelData,
                quantity,
                pageWidth,
                pageHeight,
                labelWidth,
                labelHeight);
            var jobName = $"LabelPrinter-{labelData.ProductCode}-{DateTime.Now:yyyyMMddHHmmss}";

            printDialog.PrintDocument(document.DocumentPaginator, jobName);
            return new PrintResult(printQueue.FullName, quantity);
        }
        catch (LabelPrintException)
        {
            throw;
        }
        catch (PrintSystemException exception)
        {
            throw new LabelPrintException("Windows 프린터로 라벨을 전송하지 못했습니다.", exception);
        }
        catch (Exception exception)
        {
            throw new LabelPrintException("라벨 출력 중 오류가 발생했습니다.", exception);
        }
    }

    private static FixedDocument CreateDocument(
        LabelData labelData,
        int quantity,
        double pageWidth,
        double pageHeight,
        double labelWidth,
        double labelHeight)
    {
        var document = new FixedDocument();
        document.DocumentPaginator.PageSize = new Size(pageWidth, pageHeight);

        for (var copy = 0; copy < quantity; copy++)
        {
            var fixedPage = new FixedPage
            {
                Width = pageWidth,
                Height = pageHeight,
                Background = Brushes.White
            };

            var label = CreateLabel(
                labelData,
                pageWidth,
                pageHeight,
                labelWidth,
                labelHeight);
            fixedPage.Children.Add(label);

            var pageContent = new PageContent();
            ((IAddChild)pageContent).AddChild(fixedPage);
            document.Pages.Add(pageContent);
        }

        return document;
    }

    private static FrameworkElement CreateLabel(
        LabelData data,
        double pageWidth,
        double pageHeight,
        double labelWidth,
        double labelHeight)
    {
        var panel = new StackPanel();
        panel.Children.Add(CreateText(data.LabelName, 20, FontWeights.Bold));
        panel.Children.Add(CreateText($"원산지: {data.OriginCountry}", 13));
        panel.Children.Add(CreateText($"유통기한: {data.ExpirationDate ?? "정보 없음"}", 13));
        panel.Children.Add(CreateText($"이력번호: {data.TraceNumber}", 13));
        panel.Children.Add(CreateText($"수입업체: {data.ImporterName}", 11));

        var label = new Border
        {
            Width = Math.Min(labelWidth, pageWidth),
            Height = Math.Min(labelHeight, pageHeight),
            Padding = new Thickness(12),
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(1),
            Background = Brushes.White,
            Child = panel
        };

        label.Measure(new Size(label.Width, label.Height));
        label.Arrange(new Rect(0, 0, label.Width, label.Height));
        label.UpdateLayout();
        return label;
    }

    private static TextBlock CreateText(string text, double fontSize, FontWeight? fontWeight = null)
    {
        return new TextBlock
        {
            Text = text,
            FontFamily = new FontFamily("Malgun Gothic"),
            FontSize = fontSize,
            FontWeight = fontWeight ?? FontWeights.Normal,
            Margin = new Thickness(0, 0, 0, 5),
            TextWrapping = TextWrapping.Wrap
        };
    }

    private static double PositiveOrDefault(double value, double defaultValue)
    {
        return double.IsNaN(value) || double.IsInfinity(value) || value <= 0
            ? defaultValue
            : value;
    }

    private static double MillimetersToDeviceUnits(double millimeters) =>
        millimeters * 96d / 25.4d;
}
