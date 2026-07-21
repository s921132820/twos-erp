using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using LabelPrinter.Api;
using LabelPrinter.Models;
using LabelPrinter.Services;

namespace LabelPrinter.ViewModels;

public sealed class MainViewModel : INotifyPropertyChanged
{
    private readonly IProductService _productService;
    private readonly IMeatTraceService _meatTraceService;
    private Product? _selectedProduct;
    private string _printQuantity = "1";
    private string _originCountry = "-";
    private string _expirationDate = "-";
    private string _traceNumber = "-";
    private string _importerName = "-";
    private string _statusMessage = "품목을 선택하고 출력 수량을 입력하세요.";
    private bool _isLoading;

    public MainViewModel(
        IProductService productService,
        IMeatTraceService meatTraceService)
    {
        _productService = productService;
        _meatTraceService = meatTraceService;
    }

    public ObservableCollection<Product> Products { get; } = [];

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
            OriginCountry = "-";
            ExpirationDate = "-";
            ImporterName = "-";
            StatusMessage = value is null
                ? "품목을 선택하세요."
                : $"{value.ProductName} 품목이 선택되었습니다.";
        }
    }

    public string PrintQuantity
    {
        get => _printQuantity;
        set => SetProperty(ref _printQuantity, value);
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
        catch (GoogleAppsScriptApiException exception)
        {
            StatusMessage = exception.Message;
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

            OriginCountry = traceInfo.OriginCountry;
            ExpirationDate = string.IsNullOrWhiteSpace(traceInfo.ExpirationDate)
                ? "API 제공 없음"
                : traceInfo.ExpirationDate;
            ImporterName = traceInfo.ImporterName;
            TraceNumber = traceInfo.TraceNumber;
            StatusMessage = "이력정보 조회가 완료되었습니다.";
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            StatusMessage = "이력정보 조회가 취소되었습니다.";
        }
        catch (MeatWatchApiException exception)
        {
            StatusMessage = exception.Message;
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
