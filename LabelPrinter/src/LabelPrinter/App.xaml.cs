using System.IO;
using System.Windows;
using LabelPrinter.Api;
using LabelPrinter.Config;
using LabelPrinter.Services;
using LabelPrinter.ViewModels;
using LabelPrinter.Views;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LabelPrinter;

public partial class App : Application
{
    private ServiceProvider? _serviceProvider;

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
        services.AddSingleton<MainViewModel>();
        services.AddSingleton<MainWindow>();

        _serviceProvider = services.BuildServiceProvider();

        var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
        MainWindow = mainWindow;
        mainWindow.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _serviceProvider?.Dispose();
        base.OnExit(e);
    }
}
