using System.IO;
using System.Text;

namespace LabelPrinter.Services;

public sealed class FileAppLogger : IAppLogger
{
    private readonly SemaphoreSlim _writeLock = new(1, 1);
    private readonly string _logDirectory;

    public FileAppLogger()
    {
        _logDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "LabelPrinter",
            "Logs");
    }

    public async Task LogErrorAsync(
        Exception exception,
        string context,
        CancellationToken cancellationToken = default)
    {
        var lockAcquired = false;
        try
        {
            await _writeLock.WaitAsync(cancellationToken);
            lockAcquired = true;
            Directory.CreateDirectory(_logDirectory);

            var logPath = Path.Combine(
                _logDirectory,
                $"LabelPrinter-{DateTime.Now:yyyy-MM-dd}.log");
            var entry = new StringBuilder()
                .AppendLine($"[{DateTimeOffset.Now:O}] ERROR")
                .AppendLine($"Context: {context}")
                .AppendLine(exception.ToString())
                .AppendLine(new string('-', 80))
                .ToString();

            await File.AppendAllTextAsync(logPath, entry, Encoding.UTF8, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // The application is closing; logging must not block shutdown.
        }
        catch (IOException)
        {
            // Logging failures must never replace the original application error.
        }
        catch (UnauthorizedAccessException)
        {
            // Logging failures must never replace the original application error.
        }
        finally
        {
            if (lockAcquired)
            {
                _writeLock.Release();
            }
        }
    }
}
