using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Animation;
using Microsoft.Win32;

namespace WinDockSetup.Steps
{
    public partial class ProgressStep : UserControl
    {
        private bool _isCancelling = false;
        private List<string> _logs = new List<string>();

        public ProgressStep()
        {
            InitializeComponent();
        }

        private async void UserControl_Loaded(object sender, RoutedEventArgs e)
        {
            var sb = (Storyboard)FindResource("ShimmerAnimation");
            sb.Begin();

            await RunProcessAsync();
        }

        private void Log(string message)
        {
            _logs.Add(message);
            if (_logs.Count > 5)
            {
                _logs.RemoveAt(0);
            }
            LogText.Text = string.Join(Environment.NewLine, _logs);
            if (LogScrollViewer != null)
            {
                LogScrollViewer.ScrollToEnd();
            }
        }

        private async Task RunProcessAsync()
        {
            RetryBtn.Visibility = Visibility.Collapsed;
            _isCancelling = false;
            
            dynamic mainWindow = Window.GetWindow(this);
            bool isUninstall = mainWindow.IsUninstallMode;
            
            TitleText.Text = isUninstall ? "Removing WinDock" : "Installing WinDock";
            
            try
            {
                if (isUninstall)
                {
                    await RunUninstallAsync(mainWindow);
                }
                else
                {
                    await RunInstallAsync(mainWindow);
                }
                
                if (!_isCancelling)
                {
                    mainWindow.GoNext();
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = "Error: " + ex.Message;
                StatusText.Foreground = (System.Windows.Media.Brush)FindResource("SignalRedBrush");
                Log("Error: " + ex.Message);
                mainWindow.UpdateTelemetry("ERROR", ex.Message, 0);
                RetryBtn.Visibility = Visibility.Visible;
            }
        }

        private async Task RunInstallAsync(dynamic mainWindow)
        {
            string installPath = mainWindow.InstallPath;
            bool createDesktopShortcut = mainWindow.CreateDesktopShortcut;
            bool launchOnStartup = mainWindow.LaunchOnStartup;

            // Step 1: Preparing directory
            UpdateStatus("Preparing installation directory...", "PREPARING", "0% · Init", 5, mainWindow);
            if (!Directory.Exists(installPath))
            {
                Directory.CreateDirectory(installPath);
            }
            await Task.Delay(400);

            // Step 2: Extracting application files
            UpdateStatus("Extracting application files...", "EXTRACTING", "10% · Unzipping", 10, mainWindow);
            await ExtractPayloadAsync(installPath, mainWindow);
            await Task.Delay(400);

            // Step 3: Creating Start Menu shortcut
            UpdateStatus("Creating Start Menu shortcut...", "SHORTCUT", "70% · Start Menu", 70, mainWindow);
            string programsFolder = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
            CreateShortcut(
                Path.Combine(programsFolder, "WinDock.lnk"),
                Path.Combine(installPath, "WinDock.exe")
            );
            await Task.Delay(400);

            // Step 4: Creating Desktop shortcut
            if (createDesktopShortcut)
            {
                UpdateStatus("Creating Desktop shortcut...", "SHORTCUT", "80% · Desktop", 80, mainWindow);
                string desktopFolder = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                CreateShortcut(
                    Path.Combine(desktopFolder, "WinDock.lnk"),
                    Path.Combine(installPath, "WinDock.exe")
                );
                await Task.Delay(400);
            }

            // Step 5: Registering startup entry
            if (launchOnStartup)
            {
                UpdateStatus("Registering startup entry...", "STARTUP", "85% · Registry", 85, mainWindow);
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    if (key != null)
                    {
                        key.SetValue("WinDock", $"\"{Path.Combine(installPath, "WinDock.exe")}\"");
                    }
                }
                await Task.Delay(400);
            }

            // Step 6: Writing default configuration
            UpdateStatus("Writing default configuration...", "CONFIG", "90% · Settings", 90, mainWindow);
            string configExample = Path.Combine(installPath, "config.example.json");
            string configTarget = Path.Combine(installPath, "config.json");
            if (File.Exists(configExample) && !File.Exists(configTarget))
            {
                File.Copy(configExample, configTarget);
            }
            await Task.Delay(400);

            // Step 7: Copying uninstaller
            UpdateStatus("Copying uninstaller...", "UNINSTALLER", "95% · Finalizing", 95, mainWindow);
            string currentExe = Assembly.GetExecutingAssembly().Location;
            string uninstallExe = Path.Combine(installPath, "Uninstall.exe");
            if (File.Exists(currentExe) && !string.Equals(currentExe, uninstallExe, StringComparison.OrdinalIgnoreCase))
            {
                File.Copy(currentExe, uninstallExe, true);
            }
            await Task.Delay(400);

            UpdateStatus("Installation complete.", "COMPLETE", "100% · Done", 100, mainWindow);
        }

        private async Task RunUninstallAsync(dynamic mainWindow)
        {
            string installPath = mainWindow.InstallPath;

            UpdateStatus("Removing startup entry...", "STARTUP", "20% · Registry", 20, mainWindow);
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
            {
                if (key != null && key.GetValue("WinDock") != null)
                {
                    key.DeleteValue("WinDock");
                }
            }
            await Task.Delay(400);

            UpdateStatus("Removing Start Menu shortcut...", "SHORTCUT", "40% · Start Menu", 40, mainWindow);
            string startMenuLink = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "WinDock.lnk");
            if (File.Exists(startMenuLink))
            {
                File.Delete(startMenuLink);
            }
            await Task.Delay(400);

            UpdateStatus("Removing Desktop shortcut...", "SHORTCUT", "60% · Desktop", 60, mainWindow);
            string desktopLink = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "WinDock.lnk");
            if (File.Exists(desktopLink))
            {
                File.Delete(desktopLink);
            }
            await Task.Delay(400);

            UpdateStatus("Removing application files...", "FILES", "80% · Deleting", 80, mainWindow);
            if (Directory.Exists(installPath))
            {
                bool keepConfig = mainWindow.KeepConfig;
                foreach (string file in Directory.GetFiles(installPath))
                {
                    string name = Path.GetFileName(file);
                    if (keepConfig && name.Equals("config.json", StringComparison.OrdinalIgnoreCase))
                    {
                        continue; // Preserve config.json
                    }
                    File.Delete(file);
                }
                
                foreach (string dir in Directory.GetDirectories(installPath))
                {
                    Directory.Delete(dir, true);
                }

                // Only delete the folder if config.json was deleted (meaning no files left)
                if (!keepConfig || !File.Exists(Path.Combine(installPath, "config.json")))
                {
                    Directory.Delete(installPath);
                }
            }
            await Task.Delay(400);
            
            UpdateStatus("Uninstallation complete.", "COMPLETE", "100% · Done", 100, mainWindow);
        }

        private void UpdateStatus(string message, string action, string detail, int percent, dynamic mainWindow)
        {
            StatusText.Text = message;
            Log(message);
            PercentText.Text = percent + "%";

            if (ProgressTrackContainer != null && ProgressTrackContainer.ActualWidth > 0)
            {
                double targetWidth = Math.Max(0, (ProgressTrackContainer.ActualWidth * percent) / 100.0);
                DoubleAnimation widthAnim = new DoubleAnimation
                {
                    To = targetWidth,
                    Duration = TimeSpan.FromMilliseconds(250),
                    EasingFunction = new QuinticEase { EasingMode = EasingMode.EaseOut }
                };
                ProgressBarFill.BeginAnimation(FrameworkElement.WidthProperty, widthAnim);
            }

            mainWindow.UpdateTelemetry(action, detail, percent);
        }

        private async Task ExtractPayloadAsync(string installPath, dynamic mainWindow)
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            string[] names = asm.GetManifestResourceNames();
            string resourceName = names.FirstOrDefault(n => n.EndsWith(".app_payload.zip"));
            
            if (string.IsNullOrEmpty(resourceName))
            {
                Log("Warning: app_payload.zip not found in embedded resources.");
                return;
            }

            using (Stream stream = asm.GetManifestResourceStream(resourceName))
            {
                if (stream == null) return;
                
                using (ZipArchive archive = new ZipArchive(stream, ZipArchiveMode.Read))
                {
                    int total = archive.Entries.Count;
                    int current = 0;
                    
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        if (_isCancelling) throw new Exception("Cancelled by user.");

                        current++;
                        double pct = 10.0 + (60.0 * current / total); // ranges from 10 to 70

                        string destPath = Path.Combine(installPath, entry.FullName);
                        if (string.IsNullOrEmpty(entry.Name))
                        {
                            Directory.CreateDirectory(destPath);
                        }
                        else
                        {
                            string dir = Path.GetDirectoryName(destPath);
                            if (!string.IsNullOrEmpty(dir))
                            {
                                Directory.CreateDirectory(dir);
                            }
                            entry.ExtractToFile(destPath, true);
                        }

                        mainWindow.UpdateTelemetry("EXTRACTING", $"{(int)pct}% · {entry.Name}", (int)pct);
                        PercentText.Text = (int)pct + "%";

                        if (ProgressTrackContainer != null && ProgressTrackContainer.ActualWidth > 0)
                        {
                            double targetWidth = Math.Max(0, (ProgressTrackContainer.ActualWidth * pct) / 100.0);
                            ProgressBarFill.Width = targetWidth;
                        }
                        
                        if (current % 5 == 0)
                        {
                            await Task.Delay(10);
                        }
                    }
                }
            }
        }

        private void CreateShortcut(string shortcutPath, string targetPath)
        {
            Type t = Type.GetTypeFromProgID("WScript.Shell");
            if (t != null)
            {
                dynamic shell = Activator.CreateInstance(t);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.Save();
            }
        }

        private void CancelBtn_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("Are you sure you want to cancel?", "Cancel Installation", MessageBoxButton.YesNo, MessageBoxImage.Warning);
            if (result == MessageBoxResult.Yes)
            {
                _isCancelling = true;
                StatusText.Text = "Cancelling...";
                Log("Operation cancelled by user.");
            }
        }

        private async void RetryBtn_Click(object sender, RoutedEventArgs e)
        {
            StatusText.Foreground = (System.Windows.Media.Brush)FindResource("FogWhite70Brush");
            await RunProcessAsync();
        }
    }
}
