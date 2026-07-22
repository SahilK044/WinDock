using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;

namespace WinDockSetup
{
    public partial class MainWindow : Window
    {
        private int _currentStep = 0;
        private UserControl[] _steps;
        private Ellipse[] _stepDots;

        public string InstallPath { get; set; }
        public bool CreateDesktopShortcut { get; set; } = false;
        public bool LaunchOnStartup { get; set; } = true;
        public bool IsUninstallMode { get; private set; } = false;
        public bool KeepConfig { get; set; } = true;

        public MainWindow()
        {
            InitializeComponent();
            InstallPath = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "WinDock");

            _stepDots = new[] { StepDot1, StepDot2, StepDot3, StepDot4 };

            // Detect uninstall mode
            string currentExeName = System.IO.Path.GetFileName(Process.GetCurrentProcess().MainModule.FileName);
            bool isUninstallFile = currentExeName.Equals("Uninstall.exe", StringComparison.OrdinalIgnoreCase);
            string[] args = Environment.GetCommandLineArgs();
            if (isUninstallFile || args.Contains("/uninstall", StringComparer.OrdinalIgnoreCase))
            {
                IsUninstallMode = true;
            }

            // Create steps
            _steps = new UserControl[]
            {
                new Steps.WelcomeStep(),
                new Steps.OptionsStep(),
                new Steps.ProgressStep(),
                new Steps.FinishStep()
            };

            if (IsUninstallMode)
            {
                StepDotsPanel.Visibility = Visibility.Collapsed;
            }

            NavigateToStep(0);
            SourceInitialized += OnSourceInitialized;
        }

        private void OnSourceInitialized(object sender, EventArgs e)
        {
            EnableBlurBehind();
        }

        private void EnableBlurBehind()
        {
            try
            {
                var hwnd = new WindowInteropHelper(this).Handle;
                WinDock.Shared.NativeBlur.ApplyBlur(hwnd, 0, 0, (int)Width, (int)Height, 12, 12);
            }
            catch { }
        }

        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed) DragMove();
        }

        private void CloseBtn_Click(object sender, RoutedEventArgs e) => Close();
        private void MinBtn_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

        public void NavigateToStep(int index)
        {
            if (index < 0 || index >= _steps.Length) return;
            _currentStep = index;

            var step = _steps[index];
            step.Opacity = 0;
            step.RenderTransform = new TranslateTransform(24, 0);
            StepHost.Content = step;

            // Update step dots
            for (int i = 0; i < _stepDots.Length; i++)
            {
                _stepDots[i].Fill = i == index
                    ? new SolidColorBrush((Color)ColorConverter.ConvertFromString("#35D6C7"))
                    : new SolidColorBrush((Color)ColorConverter.ConvertFromString("#26ffffff"));
            }

            // Animate in
            var fadeIn = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(220))
            {
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
            };
            var slideIn = new DoubleAnimation(24, 0, TimeSpan.FromMilliseconds(220))
            {
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
            };

            step.BeginAnimation(OpacityProperty, fadeIn);
            ((TranslateTransform)step.RenderTransform).BeginAnimation(TranslateTransform.XProperty, slideIn);
        }

        public void GoNext()
        {
            if (_currentStep < _steps.Length - 1)
            {
                if (IsUninstallMode && _currentStep == 0)
                {
                    // Skip OptionsStep (1) and jump to ProgressStep (2)
                    NavigateToStep(2);
                }
                else
                {
                    NavigateToStep(_currentStep + 1);
                }
            }
        }

        public void GoPrev()
        {
            if (_currentStep > 0)
            {
                if (IsUninstallMode && _currentStep == 2)
                {
                    // Back from ProgressStep (2) jumps to WelcomeStep (0)
                    NavigateToStep(0);
                }
                else
                {
                    NavigateToStep(_currentStep - 1);
                }
            }
        }

        public void UpdateTelemetry(string action, string detail, double progressPercent)
        {
            Dispatcher.Invoke(() =>
            {
                TelemetryAction.Text = action.ToUpperInvariant();
                TelemetryDetail.Text = detail.ToUpperInvariant();

                var parent = TelemetryFill.Parent as FrameworkElement;
                double targetWidth = parent != null ? parent.ActualWidth * (progressPercent / 100.0) : 0;

                var widthAnim = new DoubleAnimation(targetWidth, TimeSpan.FromMilliseconds(300))
                {
                    EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
                };
                TelemetryFill.BeginAnimation(WidthProperty, widthAnim);
            });
        }
    }
}
