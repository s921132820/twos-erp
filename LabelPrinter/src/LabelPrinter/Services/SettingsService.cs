using System.IO;
using System.Text.Json;
using LabelPrinter.Config;
using Microsoft.Extensions.Configuration;

namespace LabelPrinter.Services;

public sealed class SettingsService : ISettingsService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true
    };

    private readonly SemaphoreSlim _saveLock = new(1, 1);
    private readonly string _settingsDirectory;
    private readonly string _settingsPath;

    public SettingsService(IConfiguration configuration)
    {
        _settingsDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "LabelPrinter");
        _settingsPath = Path.Combine(_settingsDirectory, "printer-settings.json");

        var defaults = configuration
            .GetSection(PrinterSettings.SectionName)
            .Get<PrinterSettings>()
            ?? new PrinterSettings();

        Current = LoadSavedSettings(defaults);
    }

    public PrinterSettings Current { get; private set; }

    public async Task SavePrinterSettingsAsync(
        PrinterSettings settings,
        CancellationToken cancellationToken = default)
    {
        Validate(settings);
        var snapshot = settings.Copy();
        var lockAcquired = false;

        try
        {
            await _saveLock.WaitAsync(cancellationToken);
            lockAcquired = true;
            Directory.CreateDirectory(_settingsDirectory);

            var json = JsonSerializer.Serialize(snapshot, JsonOptions);
            var temporaryPath = _settingsPath + ".tmp";
            await File.WriteAllTextAsync(temporaryPath, json, cancellationToken);
            File.Move(temporaryPath, _settingsPath, overwrite: true);

            Current = snapshot;
        }
        finally
        {
            if (lockAcquired)
            {
                _saveLock.Release();
            }
        }
    }

    private PrinterSettings LoadSavedSettings(PrinterSettings defaults)
    {
        if (!File.Exists(_settingsPath))
        {
            Validate(defaults);
            return defaults.Copy();
        }

        try
        {
            var json = File.ReadAllText(_settingsPath);
            var saved = JsonSerializer.Deserialize<PrinterSettings>(json, JsonOptions);
            if (saved is null)
            {
                return defaults.Copy();
            }

            Validate(saved);
            return saved;
        }
        catch (JsonException)
        {
            return defaults.Copy();
        }
        catch (IOException)
        {
            return defaults.Copy();
        }
        catch (UnauthorizedAccessException)
        {
            return defaults.Copy();
        }
        catch (ArgumentOutOfRangeException)
        {
            return defaults.Copy();
        }
    }

    private static void Validate(PrinterSettings settings)
    {
        if (settings.LabelWidthMm is < 20 or > 300)
        {
            throw new ArgumentOutOfRangeException(
                nameof(settings.LabelWidthMm),
                "라벨 가로 길이는 20~300mm여야 합니다.");
        }

        if (settings.LabelHeightMm is < 20 or > 300)
        {
            throw new ArgumentOutOfRangeException(
                nameof(settings.LabelHeightMm),
                "라벨 세로 길이는 20~300mm여야 합니다.");
        }
    }
}
