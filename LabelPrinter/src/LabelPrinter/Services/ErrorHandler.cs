using LabelPrinter.Api;
using LabelPrinter.Printer;

namespace LabelPrinter.Services;

public sealed class ErrorHandler : IErrorHandler
{
    private readonly IAppLogger _logger;

    public ErrorHandler(IAppLogger logger)
    {
        _logger = logger;
    }

    public async Task<string> HandleAsync(
        Exception exception,
        string context,
        CancellationToken cancellationToken = default)
    {
        await _logger.LogErrorAsync(exception, context, cancellationToken);

        return exception switch
        {
            GoogleAppsScriptApiException => exception.Message,
            MeatWatchApiException => exception.Message,
            LabelDataException => exception.Message,
            LabelPrintException => exception.Message,
            FormatException => exception.Message,
            ArgumentOutOfRangeException => exception.Message,
            _ => "예상하지 못한 오류가 발생했습니다. 로그를 확인하세요."
        };
    }
}
