using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace WinDockSetup.Steps
{
    public partial class WelcomeStep : UserControl
    {
        public WelcomeStep()
        {
            InitializeComponent();
        }

        private void UserControl_Loaded(object sender, RoutedEventArgs e)
        {
            if (Window.GetWindow(this) is MainWindow mainWindow)
            {
                if (mainWindow.IsUninstallMode)
                {
                    TitleText.Text = "Uninstall WinDock";
                    SubtitleText.Text = "This removes WinDock from your Start Menu and startup.";
                    ContinueBtn.Content = "Uninstall";
                    SpecPanel.Visibility = Visibility.Collapsed;
                    KeepConfigCheckBox.Visibility = Visibility.Visible;
                }
                else
                {
                    SpecPanel.Visibility = Visibility.Visible;
                    KeepConfigCheckBox.Visibility = Visibility.Collapsed;
                }
            }

            AnimateEntrance();
        }

        private void AnimateEntrance()
        {
            bool animationsEnabled = SystemParameters.ClientAreaAnimation;

            if (animationsEnabled)
            {
                // Logo animation
                var logoFade = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(200));
                var logoScaleX = new DoubleAnimation(0.96, 1.0, TimeSpan.FromMilliseconds(200))
                {
                    EasingFunction = new BackEase { Amplitude = 0.3, EasingMode = EasingMode.EaseOut }
                };
                var logoScaleY = new DoubleAnimation(0.96, 1.0, TimeSpan.FromMilliseconds(200))
                {
                    EasingFunction = new BackEase { Amplitude = 0.3, EasingMode = EasingMode.EaseOut }
                };

                LogoImage.BeginAnimation(UIElement.OpacityProperty, logoFade);
                LogoScale.BeginAnimation(ScaleTransform.ScaleXProperty, logoScaleX);
                LogoScale.BeginAnimation(ScaleTransform.ScaleYProperty, logoScaleY);

                // Title
                var titleFade = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(200)) { BeginTime = TimeSpan.FromMilliseconds(80) };
                TitleText.BeginAnimation(UIElement.OpacityProperty, titleFade);

                // Subtitle
                var subFade = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(200)) { BeginTime = TimeSpan.FromMilliseconds(120) };
                SubtitleText.BeginAnimation(UIElement.OpacityProperty, subFade);

                // SpecPanel / CheckBox
                var specFade = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(200)) { BeginTime = TimeSpan.FromMilliseconds(145) };
                if (Window.GetWindow(this) is MainWindow mw && mw.IsUninstallMode)
                {
                    KeepConfigCheckBox.BeginAnimation(UIElement.OpacityProperty, specFade);
                }
                else
                {
                    SpecPanel.BeginAnimation(UIElement.OpacityProperty, specFade);
                }

                // Buttons
                var btnFade = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(200)) { BeginTime = TimeSpan.FromMilliseconds(170) };
                ButtonsPanel.BeginAnimation(UIElement.OpacityProperty, btnFade);
            }
            else
            {
                LogoImage.Opacity = 1;
                LogoScale.ScaleX = 1;
                LogoScale.ScaleY = 1;
                TitleText.Opacity = 1;
                SubtitleText.Opacity = 1;
                SpecPanel.Opacity = 1;
                KeepConfigCheckBox.Opacity = 1;
                ButtonsPanel.Opacity = 1;
            }
        }

        private void ContinueBtn_Click(object sender, RoutedEventArgs e)
        {
            if (Window.GetWindow(this) is MainWindow mainWindow)
            {
                if (mainWindow.IsUninstallMode)
                {
                    mainWindow.KeepConfig = KeepConfigCheckBox.IsChecked == true;
                }
                mainWindow.GoNext();
            }
        }

        private void CancelBtn_Click(object sender, RoutedEventArgs e)
        {
            Window.GetWindow(this)?.Close();
        }
    }
}
