using System.Windows;
using System.Windows.Controls;
using LabelPrinter.ViewModels;

namespace LabelPrinter.Views;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;
    private readonly SettingsViewModel _settingsViewModel;
    private readonly CancellationTokenSource _lifetimeCancellation = new();

    public MainWindow(
        MainViewModel viewModel,
        SettingsViewModel settingsViewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _settingsViewModel = settingsViewModel;
        DataContext = _viewModel;
    }

    private async void MainWindow_OnLoaded(object sender, RoutedEventArgs e)
    {
        await _viewModel.LoadProductsAsync(_lifetimeCancellation.Token);
    }

    private async void ProductComboBox_OnSelectionChanged(
        object sender,
        SelectionChangedEventArgs e)
    {
        await _viewModel.LoadSelectedTraceInfoAsync(_lifetimeCancellation.Token);
    }

    private void MainWindow_OnClosed(object? sender, EventArgs e)
    {
        _lifetimeCancellation.Cancel();
        _lifetimeCancellation.Dispose();
    }

    private void SettingsButton_OnClick(object sender, RoutedEventArgs e)
    {
        var settingsWindow = new SettingsWindow(_settingsViewModel)
        {
            Owner = this
        };
        settingsWindow.ShowDialog();
    }
}
