// LiquidGlass.fx
// WPF ShaderEffect pixel shader (Shader Model 3.0) — approximated macOS Liquid Glass:
// edge refraction of the input + a dynamic specular rim driven by LightAngle.
// Compile with: fxc /T ps_3_0 /E main /Fo LiquidGlass.ps LiquidGlass.fx
// (fxc.exe ships with the Windows SDK / older DirectX SDK)

sampler2D implicitInputSampler : register(s0);

float  CornerRadius       : register(c0); // px
float  RefractionStrength : register(c1); // px, how far the edge bends
float  LightAngle         : register(c2); // radians, direction the highlight comes from
float  SpecularIntensity  : register(c3); // 0..1+
float4 TintColor          : register(c4); // rgba, glass tint
float  TintOpacity        : register(c5); // 0..1
float2 DockSize           : register(c6); // rendered size in px

// Signed distance to a rounded rectangle centered at origin.
float sdRoundedBox(float2 p, float2 halfSize, float r)
{
    float2 q = abs(p) - halfSize + r;
    return length(max(q, 0.0f)) + min(max(q.x, q.y), 0.0f) - r;
}

float4 main(float2 uv : TEXCOORD) : COLOR
{
    float2 halfSize = DockSize * 0.5f;
    float2 p = (uv - 0.5f) * DockSize;

    float dist = sdRoundedBox(p, halfSize, CornerRadius);

    // Approximate the SDF gradient (surface normal) via finite differences.
    const float eps = 1.0f;
    float dx = sdRoundedBox(p + float2(eps, 0), halfSize, CornerRadius)
             - sdRoundedBox(p - float2(eps, 0), halfSize, CornerRadius);
    float dy = sdRoundedBox(p + float2(0, eps), halfSize, CornerRadius)
             - sdRoundedBox(p - float2(0, eps), halfSize, CornerRadius);
    float2 normal = normalize(float2(dx, dy) + 1e-5f);

    // Only bend pixels within a band straddling the boundary (dist == 0).
    float edgeBand = 22.0f; // px — widen/narrow to taste
    float edgeFactor = 1.0f - saturate(abs(dist) / edgeBand);
    edgeFactor *= step(dist, 4.0f); // fade out once well inside the shape

    float2 refractOffset = normal * (RefractionStrength * edgeFactor) / max(DockSize, float2(1, 1));
    float2 sampleUV = saturate(uv + refractOffset);

    float4 baseColor = tex2D(implicitInputSampler, sampleUV);

    // Specular rim: brightens where the surface normal faces the simulated light.
    float2 lightDir = float2(cos(LightAngle), sin(LightAngle));
    float nDotL = saturate(dot(normal, lightDir));
    float rim = pow(edgeFactor, 1.5f) * pow(nDotL, 2.0f) * SpecularIntensity;

    float3 color = lerp(baseColor.rgb, TintColor.rgb, TintOpacity * TintColor.a);
    color += rim.xxx;

    return float4(color, baseColor.a);
}
