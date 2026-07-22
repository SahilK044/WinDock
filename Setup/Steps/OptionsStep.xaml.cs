using System;
using System.IO;
using System.Windows;
using System.Windows.Controls;

namespace WinDockSetup.Steps
{
    public partial class OptionsStep : UserControl
    {
        public OptionsStep()
        {
            InitializeComponent();
            Loaded += OptionsStep_Loaded;
        }

        private void OptionsStep_Loaded(object sender, RoutedEventArgs e)
        {
            dynamic mainWindow = Window.GetWindow(this);
            if (mainWindow != null)
            {
                PathTextBox.Text = mainWindow.InstallPath;
                StartupToggle.IsChecked = mainWindow.LaunchOnStartup;
                DesktopShortcutToggle.IsChecked = mainWindow.CreateDesktopShortcut;
                mainWindow.UpdateTelemetry("OptionsStep", "Loaded", 40.0);
            }
            UpdateDiskSpace(PathTextBox.Text);
        }

        private void PathTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            UpdateDiskSpace(PathTextBox.Text);
        }

        private void UpdateDiskSpace(string path)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(path) && path.Length >= 2 && path[1] == ':')
                {
                    string driveName = path.Substring(0, 2) + "\\";
                    DriveInfo driveInfo = new DriveInfo(driveName);
                    if (driveInfo.IsReady)
                    {
                        double freeGb = driveInfo.AvailableFreeSpace / (1024.0 * 1024.0 * 1024.0);
                        DiskSpaceTextBlock.Text = $"{freeGb:F1} GB free";
                        return;
                    }
                }
            }
            catch { }
            DiskSpaceTextBlock.Text = "Unknown free space";
        }

        private void BrowseButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Type type = Type.GetType("System.Windows.Forms.FolderBrowserDialog, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089");
                if (type != null)
                {
                    object dialog = Activator.CreateInstance(type);
                    type.GetProperty("SelectedPath")?.SetValue(dialog, PathTextBox.Text, null);
                    
                    object result = type.GetMethod("ShowDialog", new Type[0])?.Invoke(dialog, null);
                    if (result != null && result.ToString() == "OK")
                    {
                        string selectedPath = type.GetProperty("SelectedPath")?.GetValue(dialog, null) as string;
                        if (!string.IsNullOrWhiteSpace(selectedPath))
                        {
                            PathTextBox.Text = selectedPath;
                        }
                    }
                }
            }
            catch
            {
                // Fallback or ignore if WinForms is unavailable
            }
        }

        private void BackButton_Click(object sender, RoutedEventArgs e)
        {
            dynamic mainWindow = Window.GetWindow(this);
            if (mainWindow != null)
            {
                mainWindow.GoPrev();
            }
        }

        private void InstallButton_Click(object sender, RoutedEventArgs e)
        {
            dynamic mainWindow = Window.GetWindow(this);
            if (mainWindow != null)
            {
                mainWindow.InstallPath = PathTextBox.Text;
                mainWindow.LaunchOnStartup = StartupToggle.IsChecked == true;
                mainWindow.CreateDesktopShortcut = DesktopShortcutToggle.IsChecked == true;
                
                mainWindow.GoNext();
            }
        }
    }
}
