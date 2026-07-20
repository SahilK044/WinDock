using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace WinDockSetup
{
    public partial class MainWindow : Window
    {
        private bool _isUninstallMode = false;

        public MainWindow()
        {
            InitializeComponent();
            
            InstallPathTextBox.Text = GetDefaultInstallPath();

            string currentExeName = Path.GetFileName(Process.GetCurrentProcess().MainModule.FileName);
            bool isUninstallFile = currentExeName.Equals("Uninstall.exe", StringComparison.OrdinalIgnoreCase);

            string[] args = Environment.GetCommandLineArgs();
            if (isUninstallFile || args.Contains("/uninstall", StringComparer.OrdinalIgnoreCase))
            {
                _isUninstallMode = true;
                TitleBarText.Text = "WinDock Uninstaller";
                TitleText.Text = "Uninstall WinDock";
                SubtitleText.Text = "This will remove WinDock and all its components from your computer.";
                PathPanel.Visibility = Visibility.Collapsed;
                OptionsPanel.Visibility = Visibility.Collapsed;
                ActionButton.Content = "Uninstall";
            }
        }

        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                DragMove();
            }
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private string GetDefaultInstallPath()
        {
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "WinDock");
        }

        private string GetInstallPath()
        {
            string path = InstallPathTextBox.Text.Trim();
            if (string.IsNullOrEmpty(path))
            {
                path = GetDefaultInstallPath();
            }
            return path;
        }

        private void BrowseButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("Shell.Application");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic folder = shell.BrowseForFolder(0, "Select installation folder:", 0x0041, 0);
                    if (folder != null)
                    {
                        dynamic folderItem = folder.Self;
                        string selectedPath = folderItem.Path;
                        if (!string.IsNullOrEmpty(selectedPath))
                        {
                            InstallPathTextBox.Text = Path.Combine(selectedPath, "WinDock");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Could not open folder picker: " + ex.Message, "Warning", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void ActionButton_Click(object sender, RoutedEventArgs e)
        {
            if (_isUninstallMode)
            {
                Uninstall();
            }
            else
            {
                Install();
            }
        }

        private async void Install()
        {
            bool createShortcut = ShortcutCheckbox.IsChecked == true;
            bool runOnStartup = StartupCheckbox.IsChecked == true;
            string installPath = GetInstallPath();

            WelcomePanel.Visibility = Visibility.Collapsed;
            ProgressPanel.Visibility = Visibility.Visible;

            await Task.Run(() =>
            {
                try
                {

                    // Create installation directory
                    UpdateStatus("Creating directory...", 10);
                    if (!Directory.Exists(installPath))
                    {
                        Directory.CreateDirectory(installPath);
                    }

                    // Terminate running WinDock processes to release file locks
                    UpdateStatus("Closing running instances...", 15);
                    foreach (var process in System.Diagnostics.Process.GetProcessesByName("WinDock"))
                    {
                        try
                        {
                            process.Kill();
                            process.WaitForExit(3000);
                        }
                        catch {}
                    }

                    // Extract embedded ZIP payload
                    UpdateStatus("Extracting application files...", 20);
                    var assembly = Assembly.GetExecutingAssembly();
                    string resourceName = assembly.GetManifestResourceNames()
                        .FirstOrDefault(name => name.EndsWith("app_payload.zip", StringComparison.OrdinalIgnoreCase));

                    if (string.IsNullOrEmpty(resourceName))
                    {
                        throw new FileNotFoundException("Embedded installer payload not found.");
                    }

                    using (var stream = assembly.GetManifestResourceStream(resourceName))
                    using (var archive = new ZipArchive(stream))
                    {
                        int total = archive.Entries.Count;
                        int current = 0;

                        foreach (var entry in archive.Entries)
                        {
                            if (string.IsNullOrEmpty(entry.Name))
                            {
                                Directory.CreateDirectory(Path.Combine(installPath, entry.FullName));
                                continue;
                            }

                            string destPath = Path.Combine(installPath, entry.FullName);
                            string destDir = Path.GetDirectoryName(destPath);
                            if (!Directory.Exists(destDir))
                            {
                                Directory.CreateDirectory(destDir);
                            }

                            try
                            {
                                entry.ExtractToFile(destPath, overwrite: true);
                            }
                            catch
                            {
                                Thread.Sleep(500);
                                entry.ExtractToFile(destPath, overwrite: true);
                            }

                            current++;
                            double progressVal = 20 + ((double)current / total * 60);
                            UpdateStatus("Extracting " + entry.Name + "...", progressVal);
                            Thread.Sleep(30);
                        }
                    }

                    // Copy installer to install directory as Uninstall.exe
                    UpdateStatus("Creating uninstaller...", 85);
                    try
                    {
                        string currentExe = Process.GetCurrentProcess().MainModule.FileName;
                        if (File.Exists(currentExe))
                        {
                            File.Copy(currentExe, Path.Combine(installPath, "Uninstall.exe"), true);
                        }
                    }
                    catch {}

                    // Create Desktop Shortcut
                    if (createShortcut)
                    {
                        UpdateStatus("Creating shortcuts...", 92);
                        string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                        string shortcutPath = Path.Combine(desktopPath, "WinDock.lnk");
                        string exePath = Path.Combine(installPath, "WinDock.exe");

                        string psScript = $"$s = (New-Object -ComObject WScript.Shell).CreateShortcut('{shortcutPath}'); $s.TargetPath = '{exePath}'; $s.WorkingDirectory = '{installPath}'; $s.Save()";
                        var startInfo = new ProcessStartInfo
                        {
                            FileName = "powershell.exe",
                            Arguments = $"-NoProfile -WindowStyle Hidden -Command \"{psScript}\"",
                            CreateNoWindow = true,
                            UseShellExecute = false
                        };
                        using (var p = Process.Start(startInfo))
                        {
                            p?.WaitForExit();
                        }
                    }

                    // Register startup run key in registry
                    if (runOnStartup)
                    {
                        UpdateStatus("Configuring system integration...", 96);
                        string exePath = Path.Combine(installPath, "WinDock.exe");
                        using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                        {
                            key?.SetValue("WinDock", exePath);
                        }
                    }

                    UpdateStatus("Finalizing...", 100);
                    Thread.Sleep(500);

                    // Switch to Complete Panel
                    Dispatcher.BeginInvoke((Action)delegate
                    {
                        ProgressPanel.Visibility = Visibility.Collapsed;
                        CompletePanel.Visibility = Visibility.Visible;
                    });
                }
                catch (Exception ex)
                {
                    Dispatcher.BeginInvoke((Action)delegate
                    {
                        MessageBox.Show("Installation failed:\n" + ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                        ProgressPanel.Visibility = Visibility.Collapsed;
                        WelcomePanel.Visibility = Visibility.Visible;
                    });
                }
            });
        }

        private async void Uninstall()
        {
            WelcomePanel.Visibility = Visibility.Collapsed;
            ProgressPanel.Visibility = Visibility.Visible;

            await Task.Run(() =>
            {
                try
                {
                    UpdateStatus("Stopping running instances...", 20);
                    foreach (var process in Process.GetProcessesByName("WinDock"))
                    {
                        try { process.Kill(); process.WaitForExit(); } catch {}
                    }

                    UpdateStatus("Removing registry settings...", 40);
                    using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                    {
                        key?.DeleteValue("WinDock", false);
                    }

                    UpdateStatus("Removing shortcuts...", 60);
                    string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    string shortcutPath = Path.Combine(desktopPath, "WinDock.lnk");
                    if (File.Exists(shortcutPath))
                    {
                        try { File.Delete(shortcutPath); } catch {}
                    }

                    UpdateStatus("Cleaning files...", 80);
                    Thread.Sleep(500);

                    // Trigger cmd self-delete script
                    string installPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                    string cmdCommand = $"/c timeout /t 1 & del /f /q \"{installPath}\\*\" & rmdir /s /q \"{installPath}\"";
                    
                    ProcessStartInfo startInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = cmdCommand,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };

                    Process.Start(startInfo);

                    Dispatcher.BeginInvoke((Action)delegate
                    {
                        MessageBox.Show("WinDock was successfully uninstalled.", "Uninstall", MessageBoxButton.OK, MessageBoxImage.Information);
                        Close();
                    });
                }
                catch (Exception ex)
                {
                    Dispatcher.BeginInvoke((Action)delegate
                    {
                        MessageBox.Show("Uninstall failed:\n" + ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                        Close();
                    });
                }
            });
        }

        private void UpdateStatus(string message, double progress)
        {
            Dispatcher.BeginInvoke((Action)delegate
            {
                StatusText.Text = message;
                InstallProgressBar.Value = progress;
            });
        }

        private void LaunchButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string installPath = GetInstallPath();
                string exePath = Path.Combine(installPath, "WinDock.exe");
                Process.Start(new ProcessStartInfo
                {
                    FileName = exePath,
                    WorkingDirectory = installPath
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Could not launch WinDock:\n" + ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            Close();
        }
    }
}
