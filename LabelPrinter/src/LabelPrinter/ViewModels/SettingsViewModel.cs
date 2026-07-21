using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using LabelPrinter.Config;
using LabelPrinter.Helpers;
using LabelPrinter.Printer;
using LabelPrinter.Services;

namespace LabelPrinter.ViewModels;

public sealed class SettingsViewModel : INotifyPropertyChanged
{
    private readonly ISettingsService _settingsService;
    private readonly IPrinterCatalog _printerCatalog;
    private readonly IErrorHandler _errorHandler;
    private string? _selectedPrinterName;
    private string _labelWidthMm = "80";
    private string _labelHeightMm = "50";
    private string _statusMessage = string.Empty;

    public SettingsViewModel(
        ISettingsService settingsService,
        IPrinterCatalog printerCatalog,
        IErrorHandler errorHandler)
    {
        _settingsService = settingsService;
        _printerCatalog = printerCatalog;
        _errorHandler = errorHandler;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public ObservableCollection<string> PrinterNames { get; } = [];

    public AsyncRelayCommand SaveCommand { get; }

    public string? SelectedPrinterName
    {
        get => _selectedPrinterName;
        set => SetProperty(ref _selectedPrinterName, value);
    }

    public string LabelWidthMm
    {
        get => _labelWidthMm;
        set => SetProperty(ref _labelWidthMm, value);
    }

    public string LabelHeightMm
    {
        get => _labelHeightMm;
        set => SetProperty(ref _labelHeightMm, value);
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public void Load()
    {
        try
        {
            PrinterNames.Clear();
            foreach (var printerName in _printerCatalog.GetInstalledPrinterNames())
            {
                PrinterNames.Add(printerName);
            }

            var current = _settingsService.Current;
            SelectedPrinterName = string.IsNullOrWhiteSpace(current.PrinterName)
                ? null
                : current.PrinterName;
            LabelWidthMm = current.LabelWidthMm.ToString("0.##");
            LabelHeightMm = current.LabelHeightMm.ToString("0.##");
            StatusMessage = "프린터를 지정하지 않으면 Windows 기본 프린터를 사용합니다.";
        }
        catch (Exception exception)
        {
            _ = SetErrorAsync(exception, "프린터 설정 불러오기");
        }
    }

    private async Task SaveAsync()
    {
        try
        {
            if (!double.TryParse(LabelWidthMm, out var width)
                || !double.TryParse(LabelHeightMm, out var height))
            {
                throw new FormatException("라벨 크기는 숫자로 입력하세요.");
            }

            await _settingsService.SavePrinterSettingsAsync(new PrinterSettings
            {
                PrinterName = SelectedPrinterName ?? string.Empty,
                LabelWidthMm = width,
                LabelHeightMm = height
            });

            StatusMessage = "설정을 저장했습니다. 다음 출력부터 적용됩니다.";
        }
        catch (Exception exception)
        {
            await SetErrorAsync(exception, "프린터 설정 저장");
        }
    }

    private async Task SetErrorAsync(Exception exception, string context)
    {
        StatusMessage = await _errorHandler.HandleAsync(exception, context);
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
        {
            return false;
        }

        field = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        return true;
    }
}
