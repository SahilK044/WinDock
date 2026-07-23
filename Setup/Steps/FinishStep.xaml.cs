using System;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace WinDockSetup.Steps
{
    public partial class FinishStep : UserControl
    {
        public FinishStep()
        {
            InitializeComponent();
        }

        private void UserControl_Loaded(object sender, RoutedEventArgs e)
        {
            MainWindow mainWindow = (MainWindow)Window.GetWindow(this);
            bool isUninstall = mainWindow.IsUninstallMode;

            if (isUninstall)
            {
                TitleText.Text = "WinDock removed";
                SubtitleText.Text = "WinDock has been removed from your system.";
                LaunchCheckBox.Visibility = Visibility.Collapsed;
                
                mainWindow.UpdateTelemetry("REMOVED", "COMPLETE", 100.0);
            }
            else
            {
                TitleText.Text = "WinDock installed";
                SubtitleText.Text = "Your dock is ready to launch.";
                LaunchCheckBox.Visibility = Visibility.Visible;
                
                mainWindow.UpdateTelemetry("INSTALLED", "COMPLETE", 100.0);
            }

            PlayEntranceAnimations();
        }

        private void PlayEntranceAnimations()
        {
            bool animate = SystemParameters.ClientAreaAnimation;

            if (animate)
            {
                // Stroke-draw animation
                double pathLength = 25.0; // Approximation for M 6,13 L 11,18 L 20,7
                CheckmarkPath.StrokeDashArray = new DoubleCollection { pathLength, pathLength };
                CheckmarkPath.StrokeDashOffset = pathLength;

                var strokeAnim = new DoubleAnimation
                {
                    From = pathLength,
                    To = 0,
                    Duration = TimeSpan.FromMilliseconds(400),
                    EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseOut }
                };

                // Pulse animation (1.0 -> 1.05 -> 1.0)
                var scaleUpAnim = new DoubleAnimation
                {
                    From = 1.0,
                    To = 1.05,
                    BeginTime = TimeSpan.FromMilliseconds(400),
                    Duration = TimeSpan.FromMilliseconds(150),
                    EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseOut }
                };

                var scaleDownAnim = new DoubleAnimation
                {
                    From = 1.05,
                    To = 1.0,
                    BeginTime = TimeSpan.FromMilliseconds(550),
                    Duration = TimeSpan.FromMilliseconds(150),
                    EasingFunction = new BackEase { EasingMode = EasingMode.EaseOut }
                };

                Storyboard storyboard = new Storyboard();
                
                Storyboard.SetTarget(strokeAnim, CheckmarkPath);
                Storyboard.SetTargetProperty(strokeAnim, new PropertyPath("StrokeDashOffset"));
                storyboard.Children.Add(strokeAnim);

                Storyboard.SetTarget(scaleUpAnim, CheckmarkScale);
                Storyboard.SetTargetProperty(scaleUpAnim, new PropertyPath("ScaleX"));
                storyboard.Children.Add(scaleUpAnim);
                
                var scaleUpY = scaleUpAnim.Clone();
                Storyboard.SetTarget(scaleUpY, CheckmarkScale);
                Storyboard.SetTargetProperty(scaleUpY, new PropertyPath("ScaleY"));
                storyboard.Children.Add(scaleUpY);

                Storyboard.SetTarget(scaleDownAnim, CheckmarkScale);
                Storyboard.SetTargetProperty(scaleDownAnim, new PropertyPath("ScaleX"));
                storyboard.Children.Add(scaleDownAnim);

                var scaleDownY = scaleDownAnim.Clone();
                Storyboard.SetTarget(scaleDownY, CheckmarkScale);
                Storyboard.SetTargetProperty(scaleDownY, new PropertyPath("ScaleY"));
                storyboard.Children.Add(scaleDownY);

                // Fade ins
                AddFadeIn(storyboard, TitleText, 300);
                AddFadeIn(storyboard, SubtitleText, 400);
                AddFadeIn(storyboard, LaunchCheckBox, 500);
                AddFadeIn(storyboard, FinishButton, 600);

                storyboard.Begin();
            }
            else
            {
                // No animations
                CheckmarkPath.StrokeDashArray = null;
                CheckmarkPath.StrokeDashOffset = 0;
                TitleText.Opacity = 1;
                SubtitleText.Opacity = 1;
                LaunchCheckBox.Opacity = 1;
                FinishButton.Opacity = 1;
            }
        }

        private void AddFadeIn(Storyboard sb, UIElement element, int beginTimeMs)
        {
            var anim = new DoubleAnimation
            {
                From = 0,
                To = 1,
                BeginTime = TimeSpan.FromMilliseconds(beginTimeMs),
                Duration = TimeSpan.FromMilliseconds(200),
                EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseOut }
            };
            Storyboard.SetTarget(anim, element);
            Storyboard.SetTargetProperty(anim, new PropertyPath("Opacity"));
            sb.Children.Add(anim);
        }

        private void FinishButton_Click(object sender, RoutedEventArgs e)
        {
            MainWindow mainWindow = (MainWindow)Window.GetWindow(this);
            bool isUninstall = mainWindow.IsUninstallMode;

            if (isUninstall)
            {
                try
                {
                    string installPath = mainWindow.InstallPath;
                    string currentExe = Process.GetCurrentProcess().MainModule.FileName;
                    if (!string.IsNullOrEmpty(currentExe) && currentExe.StartsWith(installPath, StringComparison.OrdinalIgnoreCase))
                    {
                        bool keepConfig = mainWindow.KeepConfig;
                        string cmdArgs = $"/c timeout /t 2 /nobreak > NUL & del /f /q \"{currentExe}\"";
                        if (!keepConfig || !File.Exists(Path.Combine(installPath, "config.json")))
                        {
                            cmdArgs += $" & rmdir /s /q \"{installPath}\"";
                        }
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = "cmd.exe",
                            Arguments = cmdArgs,
                            CreateNoWindow = true,
                            UseShellExecute = false
                        });
                    }
                }
                catch { }
            }
            else if (LaunchCheckBox.IsChecked == true)
            {
                try
                {
                    string installPath = mainWindow.InstallPath;
                    string exePath = Path.Combine(installPath, "WinDock.exe");
                    if (File.Exists(exePath))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = exePath,
                            UseShellExecute = true
                        });
                    }
                }
                catch (Exception ex)
                {
                    // Ignore launch failures
                    Debug.WriteLine("Failed to launch WinDock: " + ex.Message);
                }
            }

            // Close the installer window
            mainWindow.Close();
        }
    }
}
