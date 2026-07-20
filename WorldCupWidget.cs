using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Effects;
using System.Windows.Shapes;
using System.Windows.Media.Imaging;

namespace MacStyleDock
{
    public sealed class WorldCupOverlayWindow : Window
    {
        public void UpdatePosition(double x, double y, string dockPosition)
        {
            if (dockPosition == "Top") {
                this.Left = x - this.Width / 2;
                this.Top = y;
            } else if (dockPosition == "Left") {
                this.Left = x;
                this.Top = y - this.Height / 2;
            } else if (dockPosition == "Right") {
                this.Left = x - this.Width;
                this.Top = y - this.Height / 2;
            } else {
                this.Left = x - this.Width / 2;
                this.Top = y - this.Height;
            }
        }
        private const string FeedUrl = "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026";
        private static readonly FontFamily WidgetFont = new FontFamily("Source Sans Pro, Segoe UI, Arial");
        private static List<WorldCupEvent> cachedEvents;
        private static DateTime cacheTime;

        private readonly DockWindow owner;
        private readonly StackPanel contentPanel;
        private readonly TextBlock statusText;
        private readonly Border activeTab;
        private readonly TranslateTransform activeTabTransform;
        private readonly Button overviewButton;
        private readonly Button matchesButton;
        private readonly Button radioButton;
        private readonly Button tournamentButton;
        private string currentTab = "Overview";

        private static System.Speech.Synthesis.SpeechSynthesizer activeSynth;
        private static WorldCupRadioItem activePlayingItem;
        private static Button activePlayingButton;

        [StructLayout(LayoutKind.Sequential)]
        private struct AccentPolicy
        {
            public int AccentState;
            public int AccentFlags;
            public int GradientColor;
            public int AnimationId;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct WindowCompositionAttributeData
        {
            public int Attribute;
            public IntPtr Data;
            public int SizeOfData;
        }

        [DllImport("user32.dll")]
        private static extern int SetWindowCompositionAttribute(IntPtr hwnd, ref WindowCompositionAttributeData data);

        public bool isLight { get { return owner != null && owner.GetEffectiveTheme().ToLower() == "light"; } }

        public WorldCupOverlayWindow(DockWindow dockOwner)
        {
            owner = dockOwner;
            Width = 720;
            Height = 570;
            WindowStyle = WindowStyle.None;
            AllowsTransparency = true;
            Background = Brushes.Transparent;
            ShowInTaskbar = false;
            Topmost = true;
            ResizeMode = ResizeMode.NoResize;
            FontFamily = WidgetFont;

            Grid root = new Grid { Margin = new Thickness(18) };
            root.RenderTransformOrigin = new Point(0.5, 0.5);

            Border shell = new Border
            {
                CornerRadius = new CornerRadius(24),
                Background = isLight ? new SolidColorBrush(Color.FromRgb(245, 245, 250)) : new SolidColorBrush(Color.FromRgb(24, 25, 31)),
                Effect = owner.settings != null && owner.settings.PerformanceMode ? null : new DropShadowEffect
                {
                    BlurRadius = 34,
                    ShadowDepth = 8,
                    Opacity = 0.48,
                    Color = Colors.Black,
                    Direction = 270
                }
            };

            Border innerGlass = new Border
            {
                CornerRadius = new CornerRadius(24),
                BorderThickness = new Thickness(0),
                BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(52, 0, 0, 0) : Color.FromArgb(52, 255, 255, 255))),
                Background = CreateGlassBrush(),
                Padding = new Thickness(20)
            };

            Grid layout = new Grid();
            layout.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            layout.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            layout.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            layout.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            layout.Children.Add(CreateHeader());

            Grid tabs = new Grid
            {
                Width = 430,
                Height = 38,
                HorizontalAlignment = HorizontalAlignment.Center,
                Margin = new Thickness(0, 16, 0, 14),
                Background = new SolidColorBrush((isLight ? Color.FromArgb(30, 0, 0, 0) : Color.FromArgb(30, 255, 255, 255)))
            };
            tabs.Clip = new RectangleGeometry(new Rect(0, 0, 430, 38), 12, 12);
            activeTabTransform = new TranslateTransform();
            activeTab = new Border
            {
                Width = 104,
                Height = 34,
                HorizontalAlignment = HorizontalAlignment.Left,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(2),
                CornerRadius = new CornerRadius(10),
                Background = new LinearGradientBrush(Color.FromRgb(255, 45, 85), Color.FromRgb(218, 18, 61), 0),
                RenderTransform = activeTabTransform,
                Effect = new DropShadowEffect { BlurRadius = 15, ShadowDepth = 0, Opacity = 0.42, Color = Color.FromRgb(255, 45, 85) }
            };
            tabs.Children.Add(activeTab);

            UniformGrid tabButtons = new UniformGrid { Rows = 1, Columns = 4 };
            overviewButton = CreateTabButton("Overview");
            matchesButton = CreateTabButton("Matches");
            radioButton = CreateTabButton("Team Radio");
            tournamentButton = CreateTabButton("Tournament");
            overviewButton.Click += (s, e) => SwitchTab("Overview", 0);
            matchesButton.Click += (s, e) => SwitchTab("Matches", 1);
            radioButton.Click += (s, e) => SwitchTab("Radio", 2);
            tournamentButton.Click += (s, e) => SwitchTab("Tournament", 3);
            tabButtons.Children.Add(overviewButton);
            tabButtons.Children.Add(matchesButton);
            tabButtons.Children.Add(radioButton);
            tabButtons.Children.Add(tournamentButton);
            tabs.Children.Add(tabButtons);
            Grid.SetRow(tabs, 1);
            layout.Children.Add(tabs);

            ScrollViewer scroll = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
                Margin = new Thickness(-20, 0, -20, 0),
                Padding = new Thickness(20, 0, 20, 0)
            };

            System.Windows.Threading.DispatcherTimer smoothScrollTimer = new System.Windows.Threading.DispatcherTimer { Interval = TimeSpan.FromMilliseconds(16) };
            double targetScrollOffset = 0;
            smoothScrollTimer.Tick += (s, ev) =>
            {
                if (Math.Abs(targetScrollOffset - scroll.VerticalOffset) < 1.0)
                {
                    scroll.ScrollToVerticalOffset(targetScrollOffset);
                    smoothScrollTimer.Stop();
                }
                else
                {
                    scroll.ScrollToVerticalOffset(scroll.VerticalOffset + (targetScrollOffset - scroll.VerticalOffset) * 0.35);
                }
            };
            scroll.PreviewMouseWheel += (s, e) =>
            {
                e.Handled = true;
                if (!smoothScrollTimer.IsEnabled) targetScrollOffset = scroll.VerticalOffset;
                targetScrollOffset -= e.Delta * 1.5;
                if (targetScrollOffset < 0) targetScrollOffset = 0;
                if (targetScrollOffset > scroll.ScrollableHeight) targetScrollOffset = scroll.ScrollableHeight;
                smoothScrollTimer.Start();
            };

            try
            {
                string thumbColor = isLight ? "#40000000" : "#40FFFFFF";
                string xaml = @"
<Style xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation'
       xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'
       TargetType='{x:Type ScrollBar}'>
    <Setter Property='Width' Value='6'/>
    <Setter Property='Background' Value='Transparent'/>
    <Setter Property='Template'>
        <Setter.Value>
            <ControlTemplate TargetType='{x:Type ScrollBar}'>
                <Grid Background='Transparent'>
                    <Track Name='PART_Track' IsDirectionReversed='true'>
                        <Track.Thumb>
                            <Thumb>
                                <Thumb.Template>
                                    <ControlTemplate TargetType='{x:Type Thumb}'>
                                        <Border CornerRadius='3' Background='" + thumbColor + @"' />
                                    </ControlTemplate>
                                </Thumb.Template>
                            </Thumb>
                        </Track.Thumb>
                    </Track>
                </Grid>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>";
                var scrollStyle = (Style)System.Windows.Markup.XamlReader.Parse(xaml);
                scroll.Resources.Add(typeof(System.Windows.Controls.Primitives.ScrollBar), scrollStyle);
            }
            catch {}
            contentPanel = new StackPanel { Margin = new Thickness(2, 0, 2, 0) };
            scroll.Content = contentPanel;
            Grid.SetRow(scroll, 2);
            layout.Children.Add(scroll);

            Grid footer = new Grid { Margin = new Thickness(4, 12, 4, 0) };
            statusText = Text("Updating match center...", 11, (isLight ? Color.FromArgb(145, 0, 0, 0) : (isLight ? Color.FromArgb(145, 0, 0, 0) : Color.FromArgb(145, 255, 255, 255))), FontWeights.Normal);
            footer.Children.Add(statusText);
            Button refresh = CreateTextButton("Refresh");
            refresh.HorizontalAlignment = HorizontalAlignment.Right;
            refresh.Click += (s, e) => LoadFeed(true);
            footer.Children.Add(refresh);
            Grid.SetRow(footer, 3);
            layout.Children.Add(footer);

            innerGlass.Child = layout;
            shell.Child = innerGlass;
            root.Children.Add(shell);
            Grid sheenContainer = new Grid { Clip = new RectangleGeometry(new Rect(0, 0, 684, 534), 24, 24) };
            sheenContainer.Children.Add(CreateAnimatedSheen());
            root.Children.Add(sheenContainer);
            Content = root;

            Loaded += (s, e) =>
            {
                SwitchTab("Overview", 0);
                LoadFeed(false);
            };

            IsVisibleChanged += (s, e) =>
            {
                if (!IsVisible && activeSynth != null)
                {
                    try
                    {
                        activeSynth.SpeakAsyncCancelAll();
                        if (activePlayingButton != null)
                        {
                            UpdatePlayButtonState(activePlayingButton, false);
                        }
                        activePlayingItem = null;
                        activePlayingButton = null;
                        activeSynth = null;
                    }
                    catch {}
                }
            };
        }

        private Brush CreateGlassBrush()
        {
            LinearGradientBrush brush = new LinearGradientBrush
            {
                StartPoint = new Point(0, 0),
                EndPoint = new Point(1, 1)
            };
            if (isLight)
            {
                brush.GradientStops.Add(new GradientStop(Color.FromArgb(238, 245, 245, 250), 0));
                brush.GradientStops.Add(new GradientStop(Color.FromArgb(226, 235, 235, 240), 0.55));
                brush.GradientStops.Add(new GradientStop(Color.FromArgb(240, 230, 230, 235), 1));
            }
            else
            {
                brush.GradientStops.Add(new GradientStop(Color.FromArgb(238, 24, 25, 31), 0));
                brush.GradientStops.Add(new GradientStop(Color.FromArgb(226, 13, 14, 19), 0.55));
                brush.GradientStops.Add(new GradientStop(Color.FromArgb(240, 8, 9, 13), 1));
            }
            return brush;
        }

        private UIElement CreateHeader()
        {
            Grid header = new Grid { Margin = new Thickness(4, 2, 4, 0) };
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            Border mark = new Border
            {
                Width = 52,
                Height = 52,
                CornerRadius = new CornerRadius(15),
                Background = new SolidColorBrush((isLight ? Color.FromArgb(20, 0, 0, 0) : Color.FromArgb(20, 255, 255, 255))),
                BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(40, 0, 0, 0) : Color.FromArgb(40, 255, 255, 255))),
                BorderThickness = new Thickness(1)
            };

            try
            {
                Image img = new Image { Margin = new Thickness(2) };
                BitmapImage bmp = new BitmapImage();
                bmp.BeginInit();
                string logoUri = isLight ? "pack://application:,,,/fifa_logo_black.png" : "pack://application:,,,/fifa_logo.png";
                bmp.UriSource = new Uri(logoUri, UriKind.Absolute);
                bmp.CacheOption = BitmapCacheOption.OnLoad;
                bmp.EndInit();
                img.Source = bmp;
                mark.Child = img;
            }
            catch
            {
                mark.Background = new LinearGradientBrush(Color.FromRgb(255, 45, 85), Color.FromRgb(155, 25, 80), 45);
                mark.Effect = new DropShadowEffect { BlurRadius = 20, ShadowDepth = 0, Opacity = 0.46, Color = Color.FromRgb(255, 45, 85) };
                mark.Child = new Viewbox { Margin = new Thickness(12), Child = CreateTrophyGlyph() };
            }

            header.Children.Add(mark);

            StackPanel title = new StackPanel { Margin = new Thickness(14, 1, 0, 0), VerticalAlignment = VerticalAlignment.Center };
            title.Children.Add(Text("WORLD CUP 2026", 21, (isLight ? Colors.Black : Colors.White), FontWeights.Bold));
            title.Children.Add(Text("Live tournament center", 12, (isLight ? Color.FromArgb(160, 0, 0, 0) : Color.FromArgb(160, 255, 255, 255)), FontWeights.Normal));
            Grid.SetColumn(title, 1);
            header.Children.Add(title);

            Border live = new Border
            {
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(10, 6, 10, 6),
                Background = new SolidColorBrush((isLight ? Color.FromArgb(28, 0, 0, 0) : Color.FromArgb(28, 255, 255, 255))),
                BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(38, 0, 0, 0) : Color.FromArgb(38, 255, 255, 255))),
                BorderThickness = new Thickness(1),
                VerticalAlignment = VerticalAlignment.Center
            };
            StackPanel liveRow = new StackPanel { Orientation = Orientation.Horizontal };
            Ellipse dot = new Ellipse { Width = 7, Height = 7, Fill = new SolidColorBrush(Color.FromRgb(50, 215, 120)), Margin = new Thickness(0, 0, 7, 0) };
            liveRow.Children.Add(dot);
            liveRow.Children.Add(Text("LIVE DATA", 11, (isLight ? Color.FromRgb(50, 55, 60) : Color.FromRgb(225, 230, 236)), FontWeights.SemiBold));
            live.Child = liveRow;
            Grid.SetColumn(live, 2);
            header.Children.Add(live);
            Pulse(dot);
            return header;
        }

        private FrameworkElement CreateTrophyGlyph()
        {
            Grid glyph = new Grid { Width = 30, Height = 30 };
            Path cup = new Path
            {
                Stroke = Brushes.White,
                StrokeThickness = 2.4,
                StrokeStartLineCap = PenLineCap.Round,
                StrokeEndLineCap = PenLineCap.Round,
                StrokeLineJoin = PenLineJoin.Round,
                Data = Geometry.Parse("M7,4 L9,15 C10,20 20,20 21,15 L23,4 M7,6 C2,6 3,14 9,14 M23,6 C28,6 27,14 21,14 M15,20 L15,25 M10,26 L20,26")
            };
            glyph.Children.Add(cup);
            return glyph;
        }

        private UIElement CreateAnimatedSheen()
        {
            Rectangle sheen = new Rectangle
            {
                Width = 140,
                Height = 760,
                IsHitTestVisible = false,
                Opacity = 0.12,
                Fill = new LinearGradientBrush((isLight ? Color.FromArgb(0, 0, 0, 0) : Color.FromArgb(0, 255, 255, 255)), (isLight ? Color.FromArgb(110, 0, 0, 0) : Color.FromArgb(110, 255, 255, 255)), 0),
                RenderTransform = new RotateTransform(18),
                HorizontalAlignment = HorizontalAlignment.Left
            };
            TranslateTransform move = new TranslateTransform(-220, -80);
            TransformGroup group = new TransformGroup();
            group.Children.Add(new RotateTransform(18));
            group.Children.Add(move);
            sheen.RenderTransform = group;
            if (owner.settings == null || !owner.settings.PerformanceMode)
            {
                move.BeginAnimation(TranslateTransform.XProperty, new DoubleAnimation(-220, 860, TimeSpan.FromSeconds(8.5))
                {
                    RepeatBehavior = RepeatBehavior.Forever,
                    EasingFunction = new SineEase { EasingMode = EasingMode.EaseInOut }
                });
            }
            return sheen;
        }

        private Button CreateTabButton(string label)
        {
            Button btn = new Button
            {
                Content = label,
                Height = 36,
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                Foreground = Brushes.White,
                FontFamily = WidgetFont,
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Cursor = Cursors.Hand
            };

            // Replace the default WPF button control template entirely.
            // The default template contains a rectangular Border with system hover chrome,
            // which shows as a sharp rectangle over the sliding pill. A bare ContentPresenter
            // ensures no background rectangle ever appears — only the pill is the indicator.
            ControlTemplate template = new ControlTemplate(typeof(Button));
            FrameworkElementFactory cpFactory = new FrameworkElementFactory(typeof(ContentPresenter));
            cpFactory.SetValue(ContentPresenter.HorizontalAlignmentProperty, HorizontalAlignment.Center);
            cpFactory.SetValue(ContentPresenter.VerticalAlignmentProperty, VerticalAlignment.Center);
            template.VisualTree = cpFactory;
            btn.Template = template;

            return btn;
        }

        private Button CreateTextButton(string label)
        {
            Button button = new Button
            {
                Content = label,
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                Foreground = new SolidColorBrush(Color.FromRgb(255, 85, 115)),
                FontFamily = WidgetFont,
                FontSize = 11,
                FontWeight = FontWeights.SemiBold,
                Cursor = Cursors.Hand,
                Padding = new Thickness(8, 3, 8, 3)
            };
            return button;
        }

        private void SwitchTab(string tab, int index)
        {
            currentTab = tab;
            activeTabTransform.BeginAnimation(TranslateTransform.XProperty, new DoubleAnimation(activeTabTransform.X, index * 106.5, TimeSpan.FromMilliseconds(260))
            {
                EasingFunction = new QuarticEase { EasingMode = EasingMode.EaseOut }
            });
            RenderCurrentTab();
        }

        private void RenderCurrentTab()
        {
            contentPanel.Children.Clear();
            if (currentTab == "Matches") RenderMatches();
            else if (currentTab == "Tournament") RenderTournament();
            else if (currentTab == "Radio") RenderRadio();
            else RenderOverview();

            int delay = 0;
            foreach (UIElement child in contentPanel.Children)
            {
                FrameworkElement element = child as FrameworkElement;
                if (element == null) continue;
                element.Opacity = 0;
                TranslateTransform translate = new TranslateTransform(0, 8);
                element.RenderTransform = translate;
                element.BeginAnimation(OpacityProperty, new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(220)) { BeginTime = TimeSpan.FromMilliseconds(delay) });
                translate.BeginAnimation(TranslateTransform.YProperty, new DoubleAnimation(8, 0, TimeSpan.FromMilliseconds(250))
                {
                    BeginTime = TimeSpan.FromMilliseconds(delay),
                    EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
                });
                delay += 35;
            }
        }

        private void RenderOverview()
        {
            List<WorldCupEvent> events = cachedEvents ?? new List<WorldCupEvent>();
            DateTime now = DateTime.Now;
            WorldCupEvent upcoming = events.Where(e => e.GetLocalStart() >= now.AddHours(-2) && !e.IsFinished).OrderBy(e => e.GetLocalStart()).FirstOrDefault();
            WorldCupEvent recent = events.Where(e => e.IsFinished).OrderByDescending(e => e.GetLocalStart()).FirstOrDefault();

            Grid feature = new Grid { Margin = new Thickness(0, 0, 0, 12) };
            feature.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1.35, GridUnitType.Star) });
            feature.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            feature.Children.Add(CreateFeatureCard(upcoming));
            Border recentCard = CreateRecentCard(recent);
            recentCard.Margin = new Thickness(10, 0, 0, 0);
            Grid.SetColumn(recentCard, 1);
            feature.Children.Add(recentCard);
            contentPanel.Children.Add(feature);

            contentPanel.Children.Add(SectionTitle("UP NEXT"));
            foreach (WorldCupEvent match in events.Where(e => !e.IsFinished).OrderBy(e => e.GetLocalStart()).Take(3))
                contentPanel.Children.Add(CreateMatchRow(match));

            if (events.Count == 0)
                contentPanel.Children.Add(CreateEmptyState("Fixtures will appear here when the live feed connects."));
        }

        private void RenderMatches()
        {
            List<WorldCupEvent> events = (cachedEvents ?? new List<WorldCupEvent>()).OrderBy(e => e.GetLocalStart()).ToList();
            if (events.Count == 0)
            {
                contentPanel.Children.Add(CreateEmptyState("No match data is available yet. Try Refresh."));
                return;
            }

            DateTime? day = null;
            foreach (WorldCupEvent match in events)
            {
                DateTime localDay = match.GetLocalStart().Date;
                if (!day.HasValue || localDay != day.Value)
                {
                    day = localDay;
                    contentPanel.Children.Add(SectionTitle(localDay.ToString("dddd, MMMM d", CultureInfo.InvariantCulture).ToUpperInvariant()));
                }
                contentPanel.Children.Add(CreateMatchRow(match));
            }
        }

        private void RenderTournament()
        {
            contentPanel.Children.Add(CreateTournamentHero());
            UniformGrid facts = new UniformGrid { Columns = 3, Margin = new Thickness(0, 12, 0, 10) };
            facts.Children.Add(CreateFact("48", "TEAMS"));
            facts.Children.Add(CreateFact("104", "MATCHES"));
            facts.Children.Add(CreateFact("3", "HOST NATIONS"));
            contentPanel.Children.Add(facts);
            contentPanel.Children.Add(SectionTitle("HOSTS"));
            contentPanel.Children.Add(CreateHostRow());
        }

        private Border CreateFeatureCard(WorldCupEvent match)
        {
            Border card = GlassCard();
            card.Padding = new Thickness(18);
            StackPanel body = new StackPanel();
            body.Children.Add(Text(match == null ? "NEXT MATCH" : match.StatusLabel, 11, Color.FromRgb(255, 85, 115), FontWeights.Bold));
            body.Children.Add(Text(match == null ? "Waiting for fixtures" : match.GetLocalStart().ToString("ddd, MMM d  |  h:mm tt"), 13, (isLight ? Color.FromArgb(170, 0, 0, 0) : Color.FromArgb(170, 255, 255, 255)), FontWeights.Normal, new Thickness(0, 4, 0, 14)));

            Grid teams = new Grid();
            teams.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            teams.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            teams.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            teams.Children.Add(CreateTeam(match == null ? "Home" : match.strHomeTeam, HorizontalAlignment.Left));
            TextBlock versus = Text("VS", 13, (isLight ? Color.FromArgb(110, 0, 0, 0) : Color.FromArgb(110, 255, 255, 255)), FontWeights.Bold);
            versus.Margin = new Thickness(14, 18, 14, 0);
            Grid.SetColumn(versus, 1);
            teams.Children.Add(versus);
            FrameworkElement away = CreateTeam(match == null ? "Away" : match.strAwayTeam, HorizontalAlignment.Right);
            Grid.SetColumn(away, 2);
            teams.Children.Add(away);
            body.Children.Add(teams);
            card.Child = body;
            return card;
        }

        private Border CreateRecentCard(WorldCupEvent match)
        {
            Border card = GlassCard();
            card.Padding = new Thickness(16);
            StackPanel body = new StackPanel();
            body.Children.Add(Text("LATEST RESULT", 11, (isLight ? Color.FromArgb(145, 0, 0, 0) : (isLight ? Color.FromArgb(145, 0, 0, 0) : Color.FromArgb(145, 255, 255, 255))), FontWeights.Bold));
            body.Children.Add(Text(match == null ? "No result yet" : match.strHomeTeam, 17, (isLight ? Colors.Black : Colors.White), FontWeights.SemiBold, new Thickness(0, 15, 0, 2)));
            body.Children.Add(Text(match == null ? "-" : match.Score, 30, Color.FromRgb(255, 70, 104), FontWeights.Bold));
            body.Children.Add(Text(match == null ? "Live results appear automatically" : match.strAwayTeam, 17, (isLight ? Colors.Black : Colors.White), FontWeights.SemiBold, new Thickness(0, 2, 0, 0)));
            card.Child = body;
            return card;
        }

        private Border CreateMatchRow(WorldCupEvent match)
        {
            Border row = GlassCard();
            row.CornerRadius = new CornerRadius(10);
            row.Padding = new Thickness(13, 10, 13, 10);
            row.Margin = new Thickness(0, 0, 0, 7);
            Grid grid = new Grid();
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(85) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(52) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(78) });

            grid.Children.Add(Text(match.GetLocalStart().ToString("h:mm tt"), 12, (isLight ? Color.FromArgb(150, 0, 0, 0) : Color.FromArgb(150, 255, 255, 255)), FontWeights.SemiBold));
            // Home Panel: Flag and Name
            StackPanel homePanel = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
            Border homeFlagBorder = new Border
            {
                Width = 24,
                Height = 18,
                CornerRadius = new CornerRadius(4),
                Margin = new Thickness(0, 0, 8, 0),
                BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(35, 0, 0, 0) : Color.FromArgb(35, 255, 255, 255))),
                BorderThickness = new Thickness(1),
                VerticalAlignment = VerticalAlignment.Center
            };
            string homeCode = GetCountryCode(match.strHomeTeam);
            if (!string.IsNullOrEmpty(homeCode))
            {
                ImageSource flagSource = LoadFlagImage(homeCode, homeFlagBorder);
                if (flagSource != null)
                {
                    homeFlagBorder.Background = new ImageBrush { ImageSource = flagSource, Stretch = Stretch.UniformToFill };
                }
            }
            homePanel.Children.Add(homeFlagBorder);
            TextBlock home = Text(match.strHomeTeam ?? "TBD", 14, (isLight ? Colors.Black : Colors.White), FontWeights.SemiBold);
            home.VerticalAlignment = VerticalAlignment.Center;
            homePanel.Children.Add(home);
            Grid.SetColumn(homePanel, 1);
            grid.Children.Add(homePanel);

            TextBlock score = Text(match.IsFinished ? match.Score : "vs", match.IsFinished ? 17 : 12, match.IsFinished ? Color.FromRgb(255, 80, 112) : (isLight ? Color.FromArgb(120, 0, 0, 0) : (isLight ? Color.FromArgb(120, 0, 0, 0) : Color.FromArgb(120, 255, 255, 255))), FontWeights.Bold);
            score.HorizontalAlignment = HorizontalAlignment.Center;
            Grid.SetColumn(score, 2);
            grid.Children.Add(score);

            // Away Panel: Flag and Name
            StackPanel awayPanel = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
            Border awayFlagBorder = new Border
            {
                Width = 24,
                Height = 18,
                CornerRadius = new CornerRadius(4),
                Margin = new Thickness(0, 0, 8, 0),
                BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(35, 0, 0, 0) : Color.FromArgb(35, 255, 255, 255))),
                BorderThickness = new Thickness(1),
                VerticalAlignment = VerticalAlignment.Center
            };
            string awayCode = GetCountryCode(match.strAwayTeam);
            if (!string.IsNullOrEmpty(awayCode))
            {
                ImageSource flagSource = LoadFlagImage(awayCode, awayFlagBorder);
                if (flagSource != null)
                {
                    awayFlagBorder.Background = new ImageBrush { ImageSource = flagSource, Stretch = Stretch.UniformToFill };
                }
            }
            awayPanel.Children.Add(awayFlagBorder);
            TextBlock away = Text(match.strAwayTeam ?? "TBD", 14, (isLight ? Colors.Black : Colors.White), FontWeights.SemiBold);
            away.VerticalAlignment = VerticalAlignment.Center;
            awayPanel.Children.Add(away);
            Grid.SetColumn(awayPanel, 3);
            grid.Children.Add(awayPanel);
            Border state = new Border
            {
                CornerRadius = new CornerRadius(8),
                Background = new SolidColorBrush(match.IsLive ? Color.FromArgb(65, 255, 45, 85) : (isLight ? Color.FromArgb(24, 0, 0, 0) : Color.FromArgb(24, 255, 255, 255))),
                Padding = new Thickness(8, 4, 8, 4),
                HorizontalAlignment = HorizontalAlignment.Right,
                Child = Text(match.StatusLabel, 10, match.IsLive ? Color.FromRgb(255, 95, 122) : (isLight ? Color.FromArgb(155, 0, 0, 0) : (isLight ? Color.FromArgb(155, 0, 0, 0) : Color.FromArgb(155, 255, 255, 255))), FontWeights.Bold)
            };
            Grid.SetColumn(state, 4);
            grid.Children.Add(state);
            row.Child = grid;
            return row;
        }

        private Border CreateTournamentHero()
        {
            Border hero = GlassCard();
            hero.Padding = new Thickness(20);
            Grid grid = new Grid();
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            StackPanel copy = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
            copy.Children.Add(Text("THE BIGGEST WORLD CUP", 12, Color.FromRgb(255, 85, 115), FontWeights.Bold));
            copy.Children.Add(Text("United by football", 28, (isLight ? Colors.Black : Colors.White), FontWeights.Bold, new Thickness(0, 5, 0, 4)));
            copy.Children.Add(Text("Canada  |  Mexico  |  United States", 14, (isLight ? Color.FromArgb(165, 0, 0, 0) : Color.FromArgb(165, 255, 255, 255)), FontWeights.Normal));
            grid.Children.Add(copy);
            Image trophy = new Image { Width = 78, Height = 78, Opacity = 0.88 };
            try {
                BitmapImage bmp = new BitmapImage();
                bmp.BeginInit();
                string logoUri = isLight ? "pack://application:,,,/fifa_logo_black.png" : "pack://application:,,,/fifa_logo.png";
                bmp.UriSource = new Uri(logoUri, UriKind.Absolute);
                bmp.CacheOption = BitmapCacheOption.OnLoad;
                bmp.EndInit();
                trophy.Source = bmp;
            } catch { }
            Grid.SetColumn(trophy, 1);
            grid.Children.Add(trophy);
            hero.Child = grid;
            return hero;
        }

        private Border CreateFact(string value, string label)
        {
            Border card = GlassCard();
            card.Margin = new Thickness(4);
            card.Padding = new Thickness(12);
            StackPanel body = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };
            body.Children.Add(Text(value, 27, (isLight ? Colors.Black : Colors.White), FontWeights.Bold));
            TextBlock caption = Text(label, 10, (isLight ? Color.FromArgb(135, 0, 0, 0) : Color.FromArgb(135, 255, 255, 255)), FontWeights.Bold);
            caption.HorizontalAlignment = HorizontalAlignment.Center;
            body.Children.Add(caption);
            card.Child = body;
            return card;
        }

        private Border CreateHostRow()
        {
            Border card = GlassCard();
            card.Padding = new Thickness(16, 13, 16, 13);
            UniformGrid hosts = new UniformGrid { Columns = 3 };
            hosts.Children.Add(CreateHost("CA", "Canada", Color.FromRgb(255, 59, 48)));
            hosts.Children.Add(CreateHost("MX", "Mexico", Color.FromRgb(48, 190, 110)));
            hosts.Children.Add(CreateHost("US", "United States", Color.FromRgb(36, 123, 255)));
            card.Child = hosts;
            return card;
        }

        private FrameworkElement CreateHost(string code, string name, Color color)
        {
            StackPanel host = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
            
            Grid badgeGrid = new Grid
            {
                Width = 34,
                Height = 28,
                Margin = new Thickness(0, 0, 8, 0)
            };

            Border fallbackBadge = new Border
            {
                CornerRadius = new CornerRadius(7),
                Background = new SolidColorBrush(Color.FromArgb(70, color.R, color.G, color.B)),
                Child = Text(code, 11, (isLight ? Colors.Black : Colors.White), FontWeights.Bold)
            };
            ((TextBlock)fallbackBadge.Child).HorizontalAlignment = HorizontalAlignment.Center;
            ((TextBlock)fallbackBadge.Child).VerticalAlignment = VerticalAlignment.Center;
            badgeGrid.Children.Add(fallbackBadge);

            string countryCode = GetCountryCode(name);
            if (!string.IsNullOrEmpty(countryCode))
            {
                Border flagBadge = new Border
                {
                    CornerRadius = new CornerRadius(7),
                    BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(35, 0, 0, 0) : Color.FromArgb(35, 255, 255, 255))),
                    BorderThickness = new Thickness(1),
                };
                badgeGrid.Children.Add(flagBadge);

                ImageSource flagSource = LoadFlagImage(countryCode, flagBadge);
                if (flagSource != null)
                {
                    flagBadge.Background = new ImageBrush
                    {
                        ImageSource = flagSource,
                        Stretch = Stretch.UniformToFill
                    };
                }
            }

            host.Children.Add(badgeGrid);
            TextBlock label = Text(name, 13, (isLight ? Colors.Black : Colors.White), FontWeights.SemiBold);
            label.VerticalAlignment = VerticalAlignment.Center;
            host.Children.Add(label);
            return host;
        }

        private FrameworkElement CreateTeam(string name, HorizontalAlignment alignment)
        {
            StackPanel team = new StackPanel { HorizontalAlignment = alignment };
            
            Grid monogramGrid = new Grid
            {
                Width = 42,
                Height = 42,
                HorizontalAlignment = alignment,
            };

            Border fallbackMonogram = new Border
            {
                CornerRadius = new CornerRadius(13),
                Background = new LinearGradientBrush((isLight ? Color.FromArgb(68, 0, 0, 0) : Color.FromArgb(68, 255, 255, 255)), (isLight ? Color.FromArgb(20, 0, 0, 0) : Color.FromArgb(20, 255, 255, 255)), 45),
                BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(35, 0, 0, 0) : Color.FromArgb(35, 255, 255, 255))),
                BorderThickness = new Thickness(1),
                Child = Text(GetInitials(name), 13, (isLight ? Colors.Black : Colors.White), FontWeights.Bold)
            };
            ((TextBlock)fallbackMonogram.Child).HorizontalAlignment = HorizontalAlignment.Center;
            ((TextBlock)fallbackMonogram.Child).VerticalAlignment = VerticalAlignment.Center;
            monogramGrid.Children.Add(fallbackMonogram);

            string countryCode = GetCountryCode(name);
            if (!string.IsNullOrEmpty(countryCode))
            {
                Border flagMonogram = new Border
                {
                    CornerRadius = new CornerRadius(13),
                    BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(35, 0, 0, 0) : Color.FromArgb(35, 255, 255, 255))),
                    BorderThickness = new Thickness(1),
                };
                monogramGrid.Children.Add(flagMonogram);

                ImageSource flagSource = LoadFlagImage(countryCode, flagMonogram);
                if (flagSource != null)
                {
                    flagMonogram.Background = new ImageBrush
                    {
                        ImageSource = flagSource,
                        Stretch = Stretch.UniformToFill
                    };
                }
            }

            team.Children.Add(monogramGrid);
            
            TextBlock label = Text(name, 14, (isLight ? Colors.Black : Colors.White), FontWeights.SemiBold, new Thickness(0, 7, 0, 0));
            label.HorizontalAlignment = alignment;
            team.Children.Add(label);
            return team;
        }

        private Border GlassCard()
        {
            return new Border
            {
                CornerRadius = new CornerRadius(13),
                Background = new LinearGradientBrush((isLight ? Color.FromArgb(35, 0, 0, 0) : Color.FromArgb(35, 255, 255, 255)), (isLight ? Color.FromArgb(14, 0, 0, 0) : Color.FromArgb(14, 255, 255, 255)), 90),
                BorderBrush = new SolidColorBrush((isLight ? Color.FromArgb(30, 0, 0, 0) : Color.FromArgb(30, 255, 255, 255))),
                BorderThickness = new Thickness(1)
            };
        }

        private TextBlock SectionTitle(string title)
        {
            return Text(title, 11, (isLight ? Color.FromArgb(135, 0, 0, 0) : Color.FromArgb(135, 255, 255, 255)), FontWeights.Bold, new Thickness(5, 8, 0, 8));
        }

        private Border CreateEmptyState(string message)
        {
            Border state = GlassCard();
            state.Padding = new Thickness(24);
            TextBlock text = Text(message, 14, (isLight ? Color.FromArgb(160, 0, 0, 0) : Color.FromArgb(160, 255, 255, 255)), FontWeights.Normal);
            text.TextWrapping = TextWrapping.Wrap;
            text.HorizontalAlignment = HorizontalAlignment.Center;
            state.Child = text;
            return state;
        }

        private TextBlock Text(string value, double size, Color color, FontWeight weight, Thickness? margin = null)
        {
            return new TextBlock
            {
                Text = value,
                FontFamily = WidgetFont,
                FontSize = size,
                FontWeight = weight,
                Foreground = new SolidColorBrush(color),
                Margin = margin ?? new Thickness(0),
                TextTrimming = TextTrimming.CharacterEllipsis,
                VerticalAlignment = VerticalAlignment.Center
            };
        }

        private void LoadFeed(bool force)
        {
            if (!force && cachedEvents != null && DateTime.Now - cacheTime < TimeSpan.FromMinutes(10))
            {
                statusText.Text = "Live feed  |  Updated " + cacheTime.ToString("h:mm tt");
                RenderCurrentTab();
                return;
            }

            statusText.Text = "Updating match center...";
            Task.Run(() =>
            {
                try
                {
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
                    using (WebClient client = new TimeoutWebClient())
                    {
                        client.Proxy = null;
                        client.Encoding = System.Text.Encoding.UTF8;
                        client.Headers.Add("user-agent", "WinDock World Cup Widget");
                        string json = client.DownloadString(FeedUrl);
                        WorldCupFeed feed = new JavaScriptSerializer().Deserialize<WorldCupFeed>(json);
                        List<WorldCupEvent> loaded = feed != null && feed.events != null ? feed.events : new List<WorldCupEvent>();
                        loaded = loaded.Where(e => !string.IsNullOrWhiteSpace(e.strHomeTeam) && !string.IsNullOrWhiteSpace(e.strAwayTeam)).ToList();
                        cachedEvents = loaded;
                        cacheTime = DateTime.Now;
                    }
                    Dispatcher.BeginInvoke((Action)(() =>
                    {
                        statusText.Text = "Live feed  |  Updated " + cacheTime.ToString("h:mm tt");
                        RenderCurrentTab();
                    }));
                }
                catch
                {
                    Dispatcher.BeginInvoke((Action)(() =>
                    {
                        statusText.Text = cachedEvents != null ? "Offline  |  Showing cached fixtures" : "Offline  |  Match feed unavailable";
                        RenderCurrentTab();
                    }));
                }
            });
        }

        private void Pulse(UIElement element)
        {
            if (owner.settings != null && owner.settings.PerformanceMode) return;
            element.BeginAnimation(OpacityProperty, new DoubleAnimation(0.35, 1, TimeSpan.FromSeconds(1.1))
            {
                AutoReverse = true,
                RepeatBehavior = RepeatBehavior.Forever,
                EasingFunction = new SineEase { EasingMode = EasingMode.EaseInOut }
            });
        }

        private void EnableBlur()
        {
            try
            {
                AccentPolicy policy = new AccentPolicy { AccentState = 4, GradientColor = unchecked((int)0x9A111217) };
                int size = Marshal.SizeOf(policy);
                IntPtr pointer = Marshal.AllocHGlobal(size);
                Marshal.StructureToPtr(policy, pointer, false);
                WindowCompositionAttributeData data = new WindowCompositionAttributeData { Attribute = 19, Data = pointer, SizeOfData = size };
                SetWindowCompositionAttribute(new WindowInteropHelper(this).Handle, ref data);
                Marshal.FreeHGlobal(pointer);
            }
            catch { }
        }

        private static string GetInitials(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "--";
            string[] parts = name.Split(new[] { ' ', '-' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1) return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpperInvariant();
            return (parts[0].Substring(0, 1) + parts[parts.Length - 1].Substring(0, 1)).ToUpperInvariant();
        }

        private static readonly Dictionary<string, string> CountryCodes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            {"canada", "ca"},
            {"mexico", "mx"},
            {"united states", "us"},
            {"usa", "us"},
            {"united states of america", "us"},
            {"bosnia-herzegovina", "ba"},
            {"bosnia and herzegovina", "ba"},
            {"south korea", "kr"},
            {"korea republic", "kr"},
            {"czech republic", "cz"},
            {"czechia", "cz"},
            {"paraguay", "py"},
            {"qatar", "qa"},
            {"switzerland", "ch"},
            {"germany", "de"},
            {"france", "fr"},
            {"brazil", "br"},
            {"argentina", "ar"},
            {"spain", "es"},
            {"italy", "it"},
            {"portugal", "pt"},
            {"netherlands", "nl"},
            {"belgium", "be"},
            {"croatia", "hr"},
            {"morocco", "ma"},
            {"japan", "jp"},
            {"australia", "au"},
            {"senegal", "sn"},
            {"ecuador", "ec"},
            {"iran", "ir"},
            {"england", "gb-eng"},
            {"wales", "gb-wls"},
            {"scotland", "gb-sct"},
            {"saudi arabia", "sa"},
            {"denmark", "dk"},
            {"tunisia", "tn"},
            {"costa rica", "cr"},
            {"cameroon", "cm"},
            {"serbia", "rs"},
            {"ghana", "gh"},
            {"uruguay", "uy"},
            {"poland", "pl"},
            {"sweden", "se"},
            {"norway", "no"},
            {"austria", "at"},
            {"ukraine", "ua"},
            {"turkey", "tr"},
            {"greece", "gr"},
            {"egypt", "eg"},
            {"nigeria", "ng"},
            {"algeria", "dz"},
            {"colombia", "co"},
            {"chile", "cl"},
            {"peru", "pe"},
            {"venezuela", "ve"},
            {"india", "in"},
            {"china", "cn"},
            {"south africa", "za"},
            {"cape verde", "cv"},
            {"curaçao", "cw"},
            {"curacao", "cw"},
            {"curaao", "cw"},
            {"haiti", "ht"},
            {"ivory coast", "ci"},
            {"cote d'ivoire", "ci"},
            {"côte d'ivoire", "ci"},
            {"panama", "pa"},
            {"honduras", "hn"},
            {"jamaica", "jm"},
            {"el salvador", "sv"},
            {"new zealand", "nz"},
            {"bolivia", "bo"},
            {"iraq", "iq"},
            {"jordan", "jo"},
            {"oman", "om"},
            {"uzbekistan", "uz"},
            {"mali", "ml"},
            {"angola", "ao"},
            {"congo dr", "cd"},
            {"dr congo", "cd"},
            {"democratic republic of the congo", "cd"},
            {"albania", "al"},
            {"georgia", "ge"},
            {"slovakia", "sk"},
            {"slovenia", "si"},
            {"hungary", "hu"},
            {"romania", "ro"},
            {"finland", "fi"},
            {"republic of ireland", "ie"},
            {"ireland", "ie"},
            {"northern ireland", "gb-nir"},
            {"iceland", "is"}
        };

        private static string GetCountryCode(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            name = name.Trim();
            if (CountryCodes.TryGetValue(name, out string code))
            {
                return code;
            }
            if (name.Length >= 2) return name.Substring(0, 2).ToLowerInvariant();
            return "";
        }

        private static readonly Dictionary<string, ImageSource> flagCache = new Dictionary<string, ImageSource>();
        private static readonly HashSet<string> downloadingFlags = new HashSet<string>();

        private static ImageSource LoadFlagImage(string code, Border borderToUpdate = null)
        {
            if (string.IsNullOrEmpty(code)) return null;
            code = code.ToLowerInvariant();

            lock (flagCache)
            {
                if (flagCache.ContainsKey(code)) return flagCache[code];
            }

            try
            {
                string localDir = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "flags");
                if (!System.IO.Directory.Exists(localDir))
                {
                    System.IO.Directory.CreateDirectory(localDir);
                }
                string localPath = System.IO.Path.Combine(localDir, code + ".png");

                if (System.IO.File.Exists(localPath))
                {
                    BitmapImage bmp = new BitmapImage();
                    bmp.BeginInit();
                    bmp.UriSource = new Uri(localPath, UriKind.Absolute);
                    bmp.CacheOption = BitmapCacheOption.OnLoad;
                    bmp.EndInit();
                    bmp.Freeze();
                    lock (flagCache)
                    {
                        flagCache[code] = bmp;
                    }
                    return bmp;
                }

                // If not downloaded, trigger background download
                lock (downloadingFlags)
                {
                    if (downloadingFlags.Contains(code)) return null;
                    downloadingFlags.Add(code);
                }

                System.Threading.ThreadPool.QueueUserWorkItem(_ =>
                {
                    try
                    {
                        using (var wc = new System.Net.WebClient())
                        {
                            wc.Proxy = null;
                            wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                            string url = "https://flagcdn.com/w80/" + code + ".png";
                            wc.DownloadFile(url, localPath);
                        }

                        if (System.IO.File.Exists(localPath))
                        {
                            BitmapImage bmp = new BitmapImage();
                            bmp.BeginInit();
                            bmp.UriSource = new Uri(localPath, UriKind.Absolute);
                            bmp.CacheOption = BitmapCacheOption.OnLoad;
                            bmp.EndInit();
                            bmp.Freeze();

                            lock (flagCache)
                            {
                                flagCache[code] = bmp;
                            }

                            if (borderToUpdate != null)
                            {
                                borderToUpdate.Dispatcher.BeginInvoke((Action)(() =>
                                {
                                    borderToUpdate.Background = new ImageBrush
                                    {
                                        ImageSource = bmp,
                                        Stretch = Stretch.UniformToFill
                                    };
                                }));
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        try { System.IO.File.AppendAllText("flag_error.txt", "Download error for " + code + ": " + ex.ToString() + "\n"); } catch {}
                    }
                    finally
                    {
                        lock (downloadingFlags)
                        {
                            downloadingFlags.Remove(code);
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                try { System.IO.File.AppendAllText("flag_error.txt", "Load error for " + code + ": " + ex.ToString() + "\n"); } catch {}
            }

            return null;
        }

        // --- WORLD CUP TEAM RADIO FUNCTIONALITY ---

        private List<WorldCupRadioItem> GetRadioItems()
        {
            List<WorldCupRadioItem> items = new List<WorldCupRadioItem>();
            List<WorldCupEvent> events = cachedEvents ?? new List<WorldCupEvent>();
            
            // Fallback items
            var fallbacks = new List<WorldCupRadioItem>
            {
                new WorldCupRadioItem {
                    Match = "Argentina vs France",
                    Channel = "VAR Room",
                    TimeStr = "118'",
                    Message = "Checking possible penalty for handball. Confirming position. Decision: Penalty kick.",
                    AudioSpeakerText = "Checking possible penalty for handball. Confirming position. Decision: Penalty kick.",
                    Color = Color.FromRgb(255, 45, 85)
                },
                new WorldCupRadioItem {
                    Match = "Argentina vs France",
                    Channel = "ARG Coach (Scaloni)",
                    TimeStr = "105'",
                    Message = "Stay compact! Watch Mbappe's runs behind the defense. We need to control the transition!",
                    AudioSpeakerText = "Stay compact! Watch Mbappe's runs behind the defense. We need to control the transition!",
                    Color = Color.FromRgb(46, 204, 113)
                },
                new WorldCupRadioItem {
                    Match = "USA vs England",
                    Channel = "USA Coach (Berhalter)",
                    TimeStr = "65'",
                    Message = "Push the fullbacks up! We have superiority on the flanks. Cross early!",
                    AudioSpeakerText = "Push the fullbacks up! We have superiority on the flanks. Cross early!",
                    Color = Color.FromRgb(52, 152, 219)
                },
                new WorldCupRadioItem {
                    Match = "Spain vs Germany",
                    Channel = "Referee Mic",
                    TimeStr = "42'",
                    Message = "No foul, play on! Clear challenge on the ball. Play on, guys!",
                    AudioSpeakerText = "No foul, play on! Clear challenge on the ball. Play on, guys!",
                    Color = Color.FromRgb(241, 196, 15)
                }
            };

            if (events == null || events.Count == 0)
            {
                return fallbacks;
            }

            int count = 0;
            foreach (var match in events)
            {
                if (count >= 3) break;
                string home = match.strHomeTeam ?? "TBD";
                string away = match.strAwayTeam ?? "TBD";
                string matchName = home + " vs " + away;

                items.Add(new WorldCupRadioItem
                {
                    Match = matchName,
                    Channel = home + " Coach",
                    TimeStr = "24'",
                    Message = "Keep the shape! Don't rush the build-up. Play simple passes.",
                    AudioSpeakerText = "Keep the shape! Don't rush the build-up. Play simple passes.",
                    Color = Color.FromRgb(46, 204, 113)
                });
                
                items.Add(new WorldCupRadioItem
                {
                    Match = matchName,
                    Channel = "VAR Room",
                    TimeStr = "58'",
                    Message = "Checking offside for the goal... line drawn. Player is onside. Goal stands.",
                    AudioSpeakerText = "Checking offside for the goal. line drawn. Player is onside. Goal stands.",
                    Color = Color.FromRgb(255, 45, 85)
                });

                items.Add(new WorldCupRadioItem
                {
                    Match = matchName,
                    Channel = away + " Coach",
                    TimeStr = "72'",
                    Message = "We need more intensity in the press! Win the second balls!",
                    AudioSpeakerText = "We need more intensity in the press! Win the second balls!",
                    Color = Color.FromRgb(52, 152, 219)
                });
                
                count++;
            }

            return items;
        }

        private void PlayRadioItem(WorldCupRadioItem item, Button playButton)
        {
            try
            {
                if (activeSynth != null)
                {
                    activeSynth.SpeakAsyncCancelAll();
                    if (activePlayingButton != null)
                    {
                        UpdatePlayButtonState(activePlayingButton, false);
                    }
                    if (activePlayingItem != null && activePlayingItem.Message == item.Message)
                    {
                        activeSynth = null;
                        activePlayingItem = null;
                        activePlayingButton = null;
                        return;
                    }
                }

                activeSynth = new System.Speech.Synthesis.SpeechSynthesizer();
                activePlayingItem = item;
                activePlayingButton = playButton;

                UpdatePlayButtonState(playButton, true);

                activeSynth.SpeakCompleted += (sender, args) =>
                {
                    Dispatcher.BeginInvoke((Action)(() =>
                    {
                        UpdatePlayButtonState(playButton, false);
                        PlayRadioEndClick();
                        activePlayingItem = null;
                        activePlayingButton = null;
                        activeSynth = null;
                    }));
                };

                PlayRadioClick();
                Task.Delay(150).ContinueWith(_ =>
                {
                    try
                    {
                        activeSynth.SpeakAsync(item.AudioSpeakerText);
                    }
                    catch {}
                });
            }
            catch {}
        }

        private void UpdatePlayButtonState(Button btn, bool isPlaying)
        {
            if (btn == null) return;
            btn.Content = isPlaying ? "■ STOP" : "▶ PLAY";
            btn.Foreground = isPlaying ? new SolidColorBrush(Color.FromRgb(255, 45, 85)) : new SolidColorBrush(Color.FromRgb(50, 215, 120));
        }

        private static void PlayRadioClick()
        {
            try
            {
                Task.Run(() =>
                {
                    Console.Beep(1000, 60);
                    Console.Beep(800, 60);
                });
            }
            catch {}
        }

        private static void PlayRadioEndClick()
        {
            try
            {
                Task.Run(() =>
                {
                    Console.Beep(700, 80);
                });
            }
            catch {}
        }

        private void RenderRadio()
        {
            List<WorldCupRadioItem> items = GetRadioItems();

            if (items.Count == 0)
            {
                contentPanel.Children.Clear();
                contentPanel.Children.Add(CreateEmptyState("No team radio communications recorded."));
                return;
            }

            foreach (var item in items)
            {
                Border row = GlassCard();
                row.CornerRadius = new CornerRadius(12);
                row.Padding = new Thickness(16, 12, 16, 12);
                row.Margin = new Thickness(0, 0, 0, 10);

                Grid grid = new Grid();
                grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                StackPanel leftCol = new StackPanel();
                
                Grid headerGrid = new Grid();
                headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                
                TextBlock matchText = Text(item.Match.ToUpperInvariant(), 12, (isLight ? Color.FromRgb(80, 80, 80) : Color.FromRgb(200, 200, 200)), FontWeights.Bold);
                headerGrid.Children.Add(matchText);
                
                leftCol.Children.Add(headerGrid);

                StackPanel metaRow = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 4, 0, 8) };
                
                Border channelBadge = new Border
                {
                    Background = new SolidColorBrush(Color.FromArgb(38, item.Color.R, item.Color.G, item.Color.B)),
                    CornerRadius = new CornerRadius(6),
                    Padding = new Thickness(8, 3, 8, 3),
                    Margin = new Thickness(0, 0, 8, 0)
                };
                channelBadge.Child = Text(item.Channel.ToUpperInvariant(), 10, item.Color, FontWeights.Bold);
                metaRow.Children.Add(channelBadge);

                TextBlock timeText = Text(item.TimeStr, 11, (isLight ? Color.FromArgb(150, 0, 0, 0) : Color.FromArgb(150, 255, 255, 255)), FontWeights.SemiBold);
                metaRow.Children.Add(timeText);
                
                leftCol.Children.Add(metaRow);

                TextBlock msgText = Text("\"" + item.Message + "\"", 13, (isLight ? Color.FromRgb(20, 20, 20) : Color.FromRgb(240, 240, 240)), FontWeights.Normal);
                msgText.FontStyle = FontStyles.Italic;
                msgText.TextWrapping = TextWrapping.Wrap;
                leftCol.Children.Add(msgText);

                Grid.SetColumn(leftCol, 0);
                grid.Children.Add(leftCol);

                Button playBtn = new Button
                {
                    Width = 85,
                    Height = 32,
                    VerticalAlignment = VerticalAlignment.Center,
                    Margin = new Thickness(12, 0, 0, 0),
                    Cursor = Cursors.Hand
                };
                
                ControlTemplate btnTemplate = new ControlTemplate(typeof(Button));
                FrameworkElementFactory borderFactory = new FrameworkElementFactory(typeof(Border));
                borderFactory.SetValue(Border.CornerRadiusProperty, new CornerRadius(8));
                borderFactory.SetValue(Border.BackgroundProperty, new SolidColorBrush((isLight ? Color.FromArgb(20, 0, 0, 0) : Color.FromArgb(20, 255, 255, 255))));
                borderFactory.SetValue(Border.BorderBrushProperty, new SolidColorBrush((isLight ? Color.FromArgb(30, 0, 0, 0) : Color.FromArgb(30, 255, 255, 255))));
                borderFactory.SetValue(Border.BorderThicknessProperty, new Thickness(1));
                
                FrameworkElementFactory cpFactory = new FrameworkElementFactory(typeof(ContentPresenter));
                cpFactory.SetValue(ContentPresenter.HorizontalAlignmentProperty, HorizontalAlignment.Center);
                cpFactory.SetValue(ContentPresenter.VerticalAlignmentProperty, VerticalAlignment.Center);
                borderFactory.AppendChild(cpFactory);
                btnTemplate.VisualTree = borderFactory;
                playBtn.Template = btnTemplate;

                bool isThisPlaying = activePlayingItem != null && activePlayingItem.Message == item.Message;
                UpdatePlayButtonState(playBtn, isThisPlaying);
                if (isThisPlaying)
                {
                    activePlayingButton = playBtn;
                }

                playBtn.Click += (sender, e) => PlayRadioItem(item, playBtn);

                Grid.SetColumn(playBtn, 1);
                grid.Children.Add(playBtn);

                row.Child = grid;
                contentPanel.Children.Add(row);
            }
        }
    }

    public class WorldCupRadioItem
    {
        public string Match { get; set; }
        public string Channel { get; set; }
        public string TimeStr { get; set; }
        public string Message { get; set; }
        public string AudioSpeakerText { get; set; }
        public Color Color { get; set; }
    }

    public sealed class WorldCupFeed
    {
        public List<WorldCupEvent> events { get; set; }
    }

    public sealed class WorldCupEvent
    {
        public string idEvent { get; set; }
        public string strEvent { get; set; }
        public string dateEvent { get; set; }
        public string strTime { get; set; }
        public string strHomeTeam { get; set; }
        public string strAwayTeam { get; set; }
        public string intHomeScore { get; set; }
        public string intAwayScore { get; set; }
        public string strStatus { get; set; }

        public bool IsFinished
        {
            get { return string.Equals(strStatus, "FT", StringComparison.OrdinalIgnoreCase) || string.Equals(strStatus, "AET", StringComparison.OrdinalIgnoreCase) || string.Equals(strStatus, "PEN", StringComparison.OrdinalIgnoreCase); }
        }

        public bool IsLive
        {
            get { return !string.IsNullOrEmpty(strStatus) && !IsFinished && !string.Equals(strStatus, "NS", StringComparison.OrdinalIgnoreCase); }
        }

        public string Score
        {
            get { return (string.IsNullOrEmpty(intHomeScore) ? "0" : intHomeScore) + "  -  " + (string.IsNullOrEmpty(intAwayScore) ? "0" : intAwayScore); }
        }

        public string StatusLabel
        {
            get
            {
                if (IsLive) return "LIVE";
                if (IsFinished) return "FULL TIME";
                return "UPCOMING";
            }
        }

        public DateTime GetLocalStart()
        {
            DateTime parsed;
            string raw = (dateEvent ?? "") + " " + (string.IsNullOrWhiteSpace(strTime) ? "00:00:00" : strTime);
            if (DateTime.TryParseExact(raw, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out parsed))
                return parsed.ToLocalTime();
            if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out parsed)) return parsed;
            return DateTime.MaxValue;
        }
    }

    internal static class WorldCupDrawingExtensions
    {
        public static void DrawArc(this DrawingContext context, Point start, Point end, Size radius, double rotation, bool largeArc, SweepDirection direction, Pen pen)
        {
            StreamGeometry geometry = new StreamGeometry();
            using (StreamGeometryContext g = geometry.Open())
            {
                g.BeginFigure(start, false, false);
                g.ArcTo(end, radius, rotation, largeArc, direction, true, false);
            }
            geometry.Freeze();
            context.DrawGeometry(null, pen, geometry);
        }
    }
}



