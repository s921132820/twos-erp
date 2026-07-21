using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using LabelPrinter.Api;
using LabelPrinter.Helpers;
using LabelPrinter.Models;
using LabelPrinter.Printer;
using LabelPrinter.Services;

namespace LabelPrinter.ViewModels;

public sealed class MainViewModel : INotifyPropertyChanged
{
    private readonly IProductService _productService;
    private readonly IMeatTraceService _meatTraceService;
    private readonly ILabelDataService _labelDataService;
    private readonly ILabelPrinter _labelPrinter;
    private readonly IErrorHandler _errorHandler;
    private Product? _selectedProduct;
    private LabelData? _currentLabelData;
    private string _printQuantity = "1";
    private string _originCountry = "-";
    private string _expirationDate = "-";
    private string _traceNumber = "-";
    private string _importerName = "-";
    private string _labelName = "-";
    private string _statusMessage = "품목을 선택하고 출력 수량을 입력하세요.";
    private bool _isLoading;

    public MainViewModel(
        IProductService productService,
        IMeatTraceService meatTraceService,
        ILabelDataService labelDataService,
        ILabelPrinter labelPrinter,
        IErrorHandler errorHandler)
    {
        _productService = productService;
        _meatTraceService = meatTraceService;
        _labelDataService = labelDataService;
        _labelPrinter = labelPrinter;
        _errorHandler = errorHandler;
        PrintCommand = new AsyncRelayCommand(PrintAsync, CanPrint);
    }

    public ObservableCollection<Product> Products { get; } = [];

    public AsyncRelayCommand PrintCommand { get; }

    public Product? SelectedProduct
    {
        get => _selectedProduct;
        set
        {
            if (!SetProperty(ref _selectedProduct, value))
            {
                return;
            }

            TraceNumber = value?.TraceNumber ?? "-";
            LabelName = string.IsNullOrWhiteSpace(value?.LabelName)
                ? value?.ProductName ?? "-"
                : value.LabelName;
            OriginCountry = "-";
            ExpirationDate = "-";
            ImporterName = "-";
            CurrentLabelData = null;
            StatusMessage = value is null
                ? "품목을 선택하세요."
                : $"{value.ProductName} 품목이 선택되었습니다.";
        }
    }

    public string PrintQuantity
    {
        get => _printQuantity;
        set
        {
            if (SetProperty(ref _printQuantity, value))
            {
                if (!string.IsNullOrWhiteSpace(value)
                    && (!int.TryParse(value, out var quantity)
                        || quantity is < PrintLimits.MinimumQuantity or > PrintLimits.MaximumQuantity))
                {
                    StatusMessage = $"출력 수량은 {PrintLimits.MinimumQuantity}~{PrintLimits.MaximumQuantity} 사이의 숫자로 입력하세요.";
                }

                PrintCommand.NotifyCanExecuteChanged();
            }
        }
    }

    public string OriginCountry
    {
        get => _originCountry;
        set => SetProperty(ref _originCountry, value);
    }

    public string ExpirationDate
    {
        get => _expirationDate;
        set => SetProperty(ref _expirationDate, value);
    }

    public string TraceNumber
    {
        get => _traceNumber;
        set => SetProperty(ref _traceNumber, value);
    }

    public string ImporterName
    {
        get => _importerName;
        set => SetProperty(ref _importerName, value);
    }

    public string LabelName
    {
        get => _labelName;
        set => SetProperty(ref _labelName, value);
    }

    public LabelData? CurrentLabelData
    {
        get => _currentLabelData;
        private set
        {
            if (SetProperty(ref _currentLabelData, value))
            {
                PrintCommand.NotifyCanExecuteChanged();
            }
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        set => SetProperty(ref _statusMessage, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        private set
        {
            if (SetProperty(ref _isLoading, value))
            {
                OnPropertyChanged(nameof(IsNotLoading));
                PrintCommand.NotifyCanExecuteChanged();
            }
        }
    }

    public bool IsNotLoading => !IsLoading;

    public async Task LoadProductsAsync(CancellationToken cancellationToken = default)
    {
        if (IsLoading)
        {
            return;
        }

        IsLoading = true;
        StatusMessage = "Google Spreadsheet에서 품목을 불러오는 중입니다.";

        try
        {
            var products = await _productService.GetActiveProductsAsync(cancellationToken);

            Products.Clear();
            foreach (var product in products)
            {
                Products.Add(product);
            }

            StatusMessage = Products.Count == 0
                ? "사용 가능한 품목이 없습니다. Spreadsheet를 확인하세요."
                : $"품목 {Products.Count}개를 불러왔습니다.";
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            StatusMessage = "품목 불러오기가 취소되었습니다.";
        }
        catch (Exception exception)
        {
            StatusMessage = await _errorHandler.HandleAsync(
                exception,
                "Google Spreadsheet 품목 조회",
                cancellationToken);
        }
        finally
        {
            IsLoading = false;
        }
    }

    public async Task LoadSelectedTraceInfoAsync(
        CancellationToken cancellationToken = default)
    {
        var selectedProduct = SelectedProduct;
        if (selectedProduct is null || IsLoading)
        {
            return;
        }

        IsLoading = true;
        StatusMessage = "공공데이터 API에서 이력정보를 조회하는 중입니다.";

        try
        {
            var traceInfo = await _meatTraceService.GetTraceInfoAsync(
                selectedProduct.TraceNumber,
                cancellationToken);

            if (!ReferenceEquals(SelectedProduct, selectedProduct))
            {
                return;
            }

            var labelData = _labelDataService.Create(selectedProduct, traceInfo);
            CurrentLabelData = labelData;
            LabelName = labelData.LabelName;
            OriginCountry = labelData.OriginCountry;
            ExpirationDate = labelData.HasExpirationDate
                ? labelData.ExpirationDate!
                : "API 제공 없음";
            ImporterName = labelData.ImporterName;
            TraceNumber = labelData.TraceNumber;
            StatusMessage = labelData.HasExpirationDate
                ? "라벨 데이터 생성이 완료되었습니다."
                : "라벨 데이터가 생성되었지만 API에 유통기한이 없습니다.";
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            StatusMessage = "이력정보 조회가 취소되었습니다.";
        }
        catch (Exception exception)
        {
            CurrentLabelData = null;
            StatusMessage = await _errorHandler.HandleAsync(
                exception,
                "MeatWatch 이력 조회 및 라벨 데이터 생성",
                cancellationToken);
        }
        finally
        {
            IsLoading = false;
        }
    }

    private bool CanPrint()
    {
        return !IsLoading
            && CurrentLabelData is not null
            && int.TryParse(PrintQuantity, out var quantity)
            && quantity is >= PrintLimits.MinimumQuantity and <= PrintLimits.MaximumQuantity;
    }

    private async Task PrintAsync()
    {
        var labelData = CurrentLabelData;
        if (labelData is null)
        {
            StatusMessage = "먼저 품목과 이력정보를 조회하세요.";
            return;
        }

        if (!int.TryParse(PrintQuantity, out var quantity)
            || quantity is < PrintLimits.MinimumQuantity or > PrintLimits.MaximumQuantity)
        {
            StatusMessage = $"출력 수량은 {PrintLimits.MinimumQuantity}~{PrintLimits.MaximumQuantity}장이어야 합니다.";
            return;
        }

        IsLoading = true;
        StatusMessage = "Windows 기본 프린터로 라벨을 전송하는 중입니다.";

        try
        {
            var result = await _labelPrinter.PrintAsync(labelData, quantity);
            StatusMessage = $"{result.PrinterName} 프린터로 {result.Quantity}장 출력했습니다.";
        }
        catch (Exception exception)
        {
            StatusMessage = await _errorHandler.HandleAsync(exception, "Windows 라벨 출력");
        }
        finally
        {
            IsLoading = false;
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    private bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
        {
            return false;
        }

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}
