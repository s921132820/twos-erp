using System.Windows;
using LabelPrinter.ViewModels;

namespace LabelPrinter.Views;

public partial class SettingsWindow : Window
{
    public SettingsWindow(SettingsViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
        viewModel.Load();
    }
}
