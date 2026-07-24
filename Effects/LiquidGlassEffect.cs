using System;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace MacStyleDock
{
    /// <summary>
    /// Approximated "Liquid Glass" effect (Option A): edge refraction + a dynamic
    /// specular rim rendered on top of whatever the dock already draws (including
    /// your existing DWM acrylic blur brush). Drive LightAngle from cursor position
    /// and spike RefractionStrength/SpecularIntensity from your spring-animation
    /// system on hover/click for the "reactive" feel.
    /// </summary>
    public class LiquidGlassEffect : ShaderEffect
    {
        private static readonly PixelShader _pixelShader = new PixelShader
        {
            UriSource = new Uri("pack://application:,,,/Effects/LiquidGlass.ps", UriKind.Absolute),
            // ps_3_0 is not supported by WPF's software rasterizer — without this,
            // the effect can silently no-op (or throw) on machines that fall back
            // to software rendering.
            ShaderRenderMode = ShaderRenderMode.HardwareOnly
        };

        public LiquidGlassEffect()
        {
            PixelShader = _pixelShader;

            UpdateShaderValue(InputProperty);
            UpdateShaderValue(CornerRadiusProperty);
            UpdateShaderValue(RefractionStrengthProperty);
            UpdateShaderValue(LightAngleProperty);
            UpdateShaderValue(SpecularIntensityProperty);
            UpdateShaderValue(TintColorProperty);
            UpdateShaderValue(TintOpacityProperty);
            UpdateShaderValue(DockSizeProperty);
        }

        // The dock's own rendered visual (post-blur) — set automatically when used as an Effect.
        public Brush Input
        {
            get => (Brush)GetValue(InputProperty);
            set => SetValue(InputProperty, value);
        }
        public static readonly DependencyProperty InputProperty =
            RegisterPixelShaderSamplerProperty("Input", typeof(LiquidGlassEffect), 0);

        public double CornerRadius
        {
            get => (double)GetValue(CornerRadiusProperty);
            set => SetValue(CornerRadiusProperty, value);
        }
        public static readonly DependencyProperty CornerRadiusProperty =
            DependencyProperty.Register(nameof(CornerRadius), typeof(double), typeof(LiquidGlassEffect),
                new UIPropertyMetadata(18.0, PixelShaderConstantCallback(0)));

        public double RefractionStrength
        {
            get => (double)GetValue(RefractionStrengthProperty);
            set => SetValue(RefractionStrengthProperty, value);
        }
        public static readonly DependencyProperty RefractionStrengthProperty =
            DependencyProperty.Register(nameof(RefractionStrength), typeof(double), typeof(LiquidGlassEffect),
                new UIPropertyMetadata(6.0, PixelShaderConstantCallback(1)));

        /// <summary>Radians. Recompute each MouseMove from cursor position relative to the dock center.</summary>
        public double LightAngle
        {
            get => (double)GetValue(LightAngleProperty);
            set => SetValue(LightAngleProperty, value);
        }
        public static readonly DependencyProperty LightAngleProperty =
            DependencyProperty.Register(nameof(LightAngle), typeof(double), typeof(LiquidGlassEffect),
                new UIPropertyMetadata(Math.PI / 4, PixelShaderConstantCallback(2)));

        /// <summary>Baseline ~0.25–0.4; spike briefly to ~0.8 on hover/click via your spring callback.</summary>
        public double SpecularIntensity
        {
            get => (double)GetValue(SpecularIntensityProperty);
            set => SetValue(SpecularIntensityProperty, value);
        }
        public static readonly DependencyProperty SpecularIntensityProperty =
            DependencyProperty.Register(nameof(SpecularIntensity), typeof(double), typeof(LiquidGlassEffect),
                new UIPropertyMetadata(0.35, PixelShaderConstantCallback(3)));

        public Color TintColor
        {
            get => (Color)GetValue(TintColorProperty);
            set => SetValue(TintColorProperty, value);
        }
        public static readonly DependencyProperty TintColorProperty =
            DependencyProperty.Register(nameof(TintColor), typeof(Color), typeof(LiquidGlassEffect),
                new UIPropertyMetadata(Colors.White, PixelShaderConstantCallback(4)));

        public double TintOpacity
        {
            get => (double)GetValue(TintOpacityProperty);
            set => SetValue(TintOpacityProperty, value);
        }
        public static readonly DependencyProperty TintOpacityProperty =
            DependencyProperty.Register(nameof(TintOpacity), typeof(double), typeof(LiquidGlassEffect),
                new UIPropertyMetadata(0.08, PixelShaderConstantCallback(5)));

        /// <summary>Set to the dock's actual rendered size in device px; update on SizeChanged.</summary>
        public Size DockSize
        {
            get => (Size)GetValue(DockSizeProperty);
            set => SetValue(DockSizeProperty, value);
        }
        public static readonly DependencyProperty DockSizeProperty =
            DependencyProperty.Register(nameof(DockSize), typeof(Size), typeof(LiquidGlassEffect),
                new UIPropertyMetadata(new Size(200, 60), PixelShaderConstantCallback(6)));
    }
}
