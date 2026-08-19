using System.Diagnostics;
using System.ServiceProcess;
using System.Windows.Forms;

namespace TwosFood.ERPLauncher;

internal static class Program
{
    private const string ERP_URL = "http://localhost:3000";
    private const string HEALTH_URL = "http://localhost:3000/api/health";
    private const string MYSQL_SERVICE_NAME = "MySQL80";
    private const string START_ARGUMENTS = "run dev";
    private const int MYSQL_START_TIMEOUT_SECONDS = 20;
    private const int SERVER_START_TIMEOUT_SECONDS = 60;
    private const string STARTUP_LOCK_NAME = "Local\\TwosFoodERPLauncher";

    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();

        try
        {
            RunAsync().GetAwaiter().GetResult();
        }
        catch (Exception exception)
        {
            LogException(exception);
            ShowError("ERP 실행 중 예상하지 못한 오류가 발생했습니다.\nlauncher.log를 확인해 주세요.");
        }
    }

    private static async Task RunAsync()
    {
        LogMessage("[Launcher]");

        var projectRoot = FindProjectRoot();
        if (projectRoot is null)
        {
            LogMessage("Project root: Not found");
            ShowError("투에스푸드 ERP 프로젝트 폴더를 찾을 수 없습니다.\n실행 파일 위치를 확인해 주세요.");
            return;
        }

        LogMessage($"Project root: {projectRoot}");
        LogMessage($"package.json: {(File.Exists(Path.Combine(projectRoot, "package.json")) ? "Found" : "Not found")}");
        LogMessage($".env: {(File.Exists(Path.Combine(projectRoot, ".env")) ? "Found" : "Not found")}");

        if (await CheckHealthAsync())
        {
            LogMessage("Next.js status: Ready (already running)");
            OpenBrowser();
            return;
        }

        using var startupLock = new Semaphore(1, 1, STARTUP_LOCK_NAME);
        var ownsStartupLock = startupLock.WaitOne(0);
        if (!ownsStartupLock)
        {
            LogMessage("Another launcher is starting the server; waiting for Next.js.");
            if (await WaitForServer())
            {
                OpenBrowser();
                return;
            }

            ShowError("ERP 서버를 실행하지 못했습니다.\n서버 콘솔의 오류 내용을 확인해 주세요.");
            return;
        }

        try
        {
            if (await CheckHealthAsync())
            {
                LogMessage("Next.js status: Ready (started by another process)");
                OpenBrowser();
                return;
            }

            if (!EnsureMySqlServiceRunning())
            {
                ShowError("투에스푸드 ERP 데이터베이스 서비스를 시작할 수 없습니다.\nMySQL80 서비스를 확인하거나 관리자 권한으로 실행해 주세요.");
                return;
            }

            if (!await IsCommandAvailable("node"))
            {
                ShowError("Node.js가 설치되어 있지 않습니다.\n설치 상태를 확인해 주세요.");
                return;
            }

            var pnpmCommand = await FindPnpmCommand();
            if (pnpmCommand is null)
            {
                ShowError("pnpm이 설치되어 있지 않습니다.\n설치 상태를 확인해 주세요.");
                return;
            }

            StartServer(projectRoot, pnpmCommand);

            if (await WaitForServer())
            {
                LogMessage("Next.js status: Ready");
                OpenBrowser();
                return;
            }

            LogMessage("Next.js status: Timeout");
            ShowError("투에스푸드 ERP 서버를 실행하지 못했습니다.\n서버 콘솔의 오류 내용을 확인해 주세요.");
        }
        finally
        {
            startupLock.Release();
        }
    }

    private static bool EnsureMySqlServiceRunning()
    {
        try
        {
            using var service = new ServiceController(MYSQL_SERVICE_NAME);
            service.Refresh();
            LogMessage($"MySQL service: {service.ServiceName}");
            LogMessage($"MySQL status: {service.Status}");

            if (service.Status == ServiceControllerStatus.Running)
            {
                return true;
            }

            if (service.Status == ServiceControllerStatus.Stopped)
            {
                LogMessage("Starting MySQL80 service...");
                service.Start();
            }

            service.WaitForStatus(
                ServiceControllerStatus.Running,
                TimeSpan.FromSeconds(MYSQL_START_TIMEOUT_SECONDS));
            service.Refresh();
            LogMessage($"MySQL status after wait: {service.Status}");
            return service.Status == ServiceControllerStatus.Running;
        }
        catch (Exception exception)
        {
            LogMessage($"MySQL service check/start failed: {exception.Message}");
            return false;
        }
    }

    private static string? FindProjectRoot()
    {
        var startDirectories = new[]
        {
            Path.GetDirectoryName(Environment.GetCommandLineArgs().FirstOrDefault()),
            Path.GetDirectoryName(Environment.ProcessPath),
            AppContext.BaseDirectory,
            Environment.CurrentDirectory
        };

        foreach (var startDirectory in startDirectories
                     .Where(path => !string.IsNullOrWhiteSpace(path))
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var directory = new DirectoryInfo(startDirectory!);
            while (directory is not null)
            {
                if (File.Exists(Path.Combine(directory.FullName, "package.json")) &&
                    File.Exists(Path.Combine(directory.FullName, "pnpm-lock.yaml")))
                {
                    return directory.FullName;
                }

                directory = directory.Parent;
            }
        }

        return null;
    }

    private static async Task<bool> CheckHealthAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            using var response = await client.GetAsync(HEALTH_URL, HttpCompletionOption.ResponseHeadersRead);
            var ready = response.IsSuccessStatusCode;
            LogMessage($"Health check: HTTP {(int)response.StatusCode} ({(ready ? "Success" : "Not ready")})");
            return ready;
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            LogMessage($"Health check: Not ready ({exception.GetType().Name})");
            return false;
        }
    }

    private static async Task<bool> WaitForServer()
    {
        for (var second = 0; second < SERVER_START_TIMEOUT_SECONDS; second++)
        {
            if (await CheckHealthAsync())
            {
                LogMessage("Health check success");
                return true;
            }

            await Task.Delay(1000);
        }

        return false;
    }

    private static async Task<bool> IsCommandAvailable(string command)
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = GetCommandInterpreter(),
                Arguments = $"/d /s /c \"{command} --version\"",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            });

            if (process is null)
            {
                return false;
            }

            var output = process.StandardOutput.ReadToEndAsync();
            var error = process.StandardError.ReadToEndAsync();
            await Task.WhenAll(process.WaitForExitAsync(), output, error);
            return process.ExitCode == 0;
        }
        catch (Exception exception)
        {
            LogMessage($"Command check failed for {command}: {exception.Message}");
            return false;
        }
    }

    private static async Task<string?> FindPnpmCommand()
    {
        if (await IsCommandAvailable("pnpm"))
        {
            return "pnpm";
        }

        return await IsCommandAvailable("corepack pnpm") ? "corepack pnpm" : null;
    }

    private static string GetCommandInterpreter() =>
        Environment.GetEnvironmentVariable("ComSpec") ?? "cmd.exe";

    private static void StartServer(string projectRoot, string pnpmCommand)
    {
        LogMessage("Starting pnpm run dev...");
        Process.Start(new ProcessStartInfo
        {
            FileName = GetCommandInterpreter(),
            Arguments = $"/k {pnpmCommand} {START_ARGUMENTS}",
            WorkingDirectory = projectRoot,
            UseShellExecute = true
        });
    }

    private static void OpenBrowser()
    {
        LogMessage($"Opening {ERP_URL}");
        Process.Start(new ProcessStartInfo
        {
            FileName = ERP_URL,
            UseShellExecute = true
        });
    }

    private static void ShowError(string message) =>
        MessageBox.Show(message, "투에스푸드 ERP", MessageBoxButtons.OK, MessageBoxIcon.Error);

    private static string GetLogPath()
    {
        var logDirectory = Path.Combine(Path.GetTempPath(), "TwosFoodERP");
        Directory.CreateDirectory(logDirectory);
        return Path.Combine(logDirectory, "launcher.log");
    }

    private static void LogException(Exception exception) =>
        LogMessage($"Unexpected error: {exception}");

    private static void LogMessage(string message)
    {
        try
        {
            File.AppendAllText(GetLogPath(), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}\n");
        }
        catch
        {
            // Logging must never prevent the launcher from continuing.
        }
    }
}
