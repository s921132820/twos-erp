using System.IO;
using System.Windows;
using LabelPrinter.Api;
using LabelPrinter.Config;
using LabelPrinter.Printer;
using LabelPrinter.Services;
using LabelPrinter.ViewModels;
using LabelPrinter.Views;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LabelPrinter;

public partial class App : Application
{
    private ServiceProvider? _serviceProvider;
    private IErrorHandler? _errorHandler;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .Build();

        var googleAppsScriptOptions = configuration
            .GetSection(GoogleAppsScriptOptions.SectionName)
            .Get<GoogleAppsScriptOptions>()
            ?? new GoogleAppsScriptOptions();

        var meatWatchOptions = configuration
            .GetSection(MeatWatchOptions.SectionName)
            .Get<MeatWatchOptions>()
            ?? new MeatWatchOptions();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton(googleAppsScriptOptions);
        services.AddSingleton(meatWatchOptions);

        services.AddHttpClient<IGoogleAppsScriptClient, GoogleAppsScriptClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(googleAppsScriptOptions.TimeoutSeconds);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("LabelPrinter/1.0");
        });
        services.AddHttpClient<IMeatWatchApiClient, MeatWatchApiClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(meatWatchOptions.TimeoutSeconds);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("LabelPrinter/1.0");
        });

        services.AddSingleton<IProductService, ProductService>();
        services.AddSingleton<IMeatTraceService, MeatTraceService>();
        services.AddSingleton<ILabelDataService, LabelDataService>();
        services.AddSingleton<ILabelPrinter, WindowsLabelPrinter>();
        services.AddSingleton<IAppLogger, FileAppLogger>();
        services.AddSingleton<IErrorHandler, ErrorHandler>();
        services.AddSingleton<ISettingsService, SettingsService>();
        services.AddSingleton<IPrinterCatalog, WindowsPrinterCatalog>();
        services.AddSingleton<MainViewModel>();
        services.AddSingleton<SettingsViewModel>();
        services.AddSingleton<MainWindow>();

        _serviceProvider = services.BuildServiceProvider();
        _errorHandler = _serviceProvider.GetRequiredService<IErrorHandler>();

        DispatcherUnhandledException += OnDispatcherUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;

        var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
        MainWindow = mainWindow;
        mainWindow.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        DispatcherUnhandledException -= OnDispatcherUnhandledException;
        TaskScheduler.UnobservedTaskException -= OnUnobservedTaskException;
        _serviceProvider?.Dispose();
        base.OnExit(e);
    }

    private async void OnDispatcherUnhandledException(
        object sender,
        System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
    {
        e.Handled = true;
        var message = _errorHandler is null
            ? "예상하지 못한 오류가 발생했습니다."
            : await _errorHandler.HandleAsync(e.Exception, "UI thread");

        MessageBox.Show(message, "LabelPrinter 오류", MessageBoxButton.OK, MessageBoxImage.Error);
    }

    private void OnUnobservedTaskException(
        object? sender,
        UnobservedTaskExceptionEventArgs e)
    {
        e.SetObserved();
        if (_errorHandler is not null)
        {
            _ = _errorHandler.HandleAsync(e.Exception, "Unobserved task");
        }
    }
}
