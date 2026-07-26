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

            string currentExePath = Process.GetCurrentProcess().MainModule.FileName;
            string currentExeName = System.IO.Path.GetFileName(currentExePath);
            string currentExeDir = System.IO.Path.GetDirectoryName(currentExePath);

            _stepDots = new[] { StepDot1, StepDot2, StepDot3, StepDot4 };

            // Detect uninstall mode
            string[] args = Environment.GetCommandLineArgs();
            bool isUninstallFile = currentExeName.Equals("Uninstall.exe", StringComparison.OrdinalIgnoreCase);
            if (isUninstallFile || args.Contains("/uninstall", StringComparer.OrdinalIgnoreCase))
            {
                IsUninstallMode = true;
                if (!string.IsNullOrEmpty(currentExeDir) && Directory.Exists(currentExeDir))
                {
                    InstallPath = currentExeDir;
                }
            }

            if (string.IsNullOrEmpty(InstallPath))
            {
                InstallPath = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "WinDock");
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

            bool isForward = index >= _currentStep;
            _currentStep = index;

            // Update step dots with light mode active/inactive colors
            for (int i = 0; i < _stepDots.Length; i++)
            {
                _stepDots[i].Fill = i == index
                    ? new SolidColorBrush((Color)ColorConverter.ConvertFromString("#2563EB"))
                    : new SolidColorBrush((Color)ColorConverter.ConvertFromString("#CBD5E1"));
            }

            var oldStep = StepHost.Content as UserControl;
            var newStep = _steps[index];

            double enterStartPos = isForward ? 60.0 : -60.0;
            double exitEndPos = isForward ? -50.0 : 50.0;

            if (oldStep != null && oldStep != newStep)
            {
                if (!(oldStep.RenderTransform is TranslateTransform))
                {
                    oldStep.RenderTransform = new TranslateTransform(0, 0);
                }
                var fadeOut = new DoubleAnimation(1, 0, TimeSpan.FromMilliseconds(130));
                var slideOut = new DoubleAnimation(0, exitEndPos, TimeSpan.FromMilliseconds(130))
                {
                    EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseIn }
                };

                fadeOut.Completed += (s, e) =>
                {
                    ShowNewStep(newStep, enterStartPos);
                };

                oldStep.BeginAnimation(OpacityProperty, fadeOut);
                ((TranslateTransform)oldStep.RenderTransform).BeginAnimation(TranslateTransform.XProperty, slideOut);
            }
            else
            {
                ShowNewStep(newStep, enterStartPos);
            }
        }

        private void ShowNewStep(UserControl newStep, double enterStartPos)
        {
            newStep.Opacity = 0;
            var transform = new TranslateTransform(enterStartPos, 0);
            newStep.RenderTransform = transform;
            StepHost.Content = newStep;

            var fadeIn = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(240))
            {
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
            };
            var slideIn = new DoubleAnimation(enterStartPos, 0, TimeSpan.FromMilliseconds(240))
            {
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
            };

            newStep.BeginAnimation(OpacityProperty, fadeIn);
            transform.BeginAnimation(TranslateTransform.XProperty, slideIn);
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
        }
    }
}
