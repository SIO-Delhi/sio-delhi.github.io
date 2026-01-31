precision mediump float;

varying vec2 v_texCoord;

uniform sampler2D u_image;
uniform sampler2D u_lut;
uniform bool u_useLut;
uniform float u_lutSize;

// Adjustments
uniform float u_exposure;     // -5 to +5 EV
uniform float u_contrast;     // -100 to +100
uniform float u_highlights;   // -100 to +100
uniform float u_shadows;      // -100 to +100
uniform float u_whites;       // -100 to +100
uniform float u_blacks;       // -100 to +100
uniform float u_temperature;  // -100 to +100
uniform float u_tint;         // -100 to +100
uniform float u_vibrance;     // -100 to +100
uniform float u_saturation;   // -100 to +100
uniform float u_hue;          // -180 to +180

// Helper: Convert RGB to HSL
vec3 rgb2hsl(vec3 c) {
    float maxC = max(c.r, max(c.g, c.b));
    float minC = min(c.r, min(c.g, c.b));
    float l = (maxC + minC) / 2.0;
    
    if (maxC == minC) {
        return vec3(0.0, 0.0, l);
    }
    
    float d = maxC - minC;
    float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    float h;
    
    if (maxC == c.r) {
        h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if (maxC == c.g) {
        h = (c.b - c.r) / d + 2.0;
    } else {
        h = (c.r - c.g) / d + 4.0;
    }
    h /= 6.0;
    
    return vec3(h, s, l);
}

// Helper: Convert HSL to RGB
float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    if (s == 0.0) {
        return vec3(l);
    }
    
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    
    return vec3(
        hue2rgb(p, q, h + 1.0/3.0),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - 1.0/3.0)
    );
}

// Luminance calculation
float luminance(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// Apply 3D LUT
vec3 applyLut(vec3 color, sampler2D lut, float size) {
    // Texture is size*size wide, size tall
    float sliceSize = 1.0 / size;
    // X pixel size: 1/(size*size)
    float xPixelSize = sliceSize / size;
    float xInnerSize = xPixelSize * (size - 1.0);
    // Y pixel size: 1/size (texture height = size)
    float yPixelSize = 1.0 / size;
    float yInnerSize = yPixelSize * (size - 1.0);

    float zSlice0 = min(floor(color.b * (size - 1.0)), size - 2.0);
    float zSlice1 = min(zSlice0 + 1.0, size - 1.0);

    float xOffset = xPixelSize * 0.5 + color.r * xInnerSize;
    float yOffset = yPixelSize * 0.5 + color.g * yInnerSize;

    float s0 = zSlice0 * sliceSize;
    float s1 = zSlice1 * sliceSize;

    vec3 slice0Color = texture2D(lut, vec2(xOffset + s0, yOffset)).rgb;
    vec3 slice1Color = texture2D(lut, vec2(xOffset + s1, yOffset)).rgb;

    float zOffset = mod(color.b * (size - 1.0), 1.0);
    return mix(slice0Color, slice1Color, zOffset);
}

void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    vec3 rgb = color.rgb;
    
    // 1. Apply LUT first (if enabled)
    if (u_useLut) {
        rgb = applyLut(rgb, u_lut, u_lutSize);
    }
    
    // 2. Exposure (2^ev multiplier)
    rgb *= pow(2.0, u_exposure);
    
    // 3. Temperature & Tint (simplified white balance)
    float temp = u_temperature / 100.0;
    float tint = u_tint / 100.0;
    rgb.r += temp * 0.1;
    rgb.b -= temp * 0.1;
    rgb.g -= tint * 0.1;
    
    // 4. Contrast (S-curve around midtones)
    float contrastFactor = (u_contrast / 100.0) * 0.5 + 1.0;
    rgb = (rgb - 0.5) * contrastFactor + 0.5;
    
    // 5. Highlights & Shadows (tone mapping)
    float lum = luminance(rgb);
    
    // Highlights: adjust high luminance (positive = brighter highlights)
    float highlightMask = smoothstep(0.5, 1.0, lum);
    float highlightAdjust = u_highlights / 100.0 * highlightMask * 0.5;
    rgb += highlightAdjust;
    
    // Shadows: boost low luminance
    float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum);
    float shadowAdjust = u_shadows / 100.0 * shadowMask * 0.5;
    rgb += shadowAdjust;
    
    // 6. Whites & Blacks (clip point adjustment)
    float whitesAdjust = u_whites / 100.0 * 0.1;
    float blacksAdjust = u_blacks / 100.0 * 0.1;
    rgb = rgb * (1.0 + whitesAdjust) + blacksAdjust;
    
    // 7. Vibrance & Hue (Combined HSL ops)
    vec3 hsl = rgb2hsl(rgb);
    
    // Apply Hue
    float hueShift = u_hue / 360.0;
    hsl.x = fract(hsl.x + hueShift); // Wrap around 0.0-1.0

    // Apply Vibrance
    float vibranceAmount = u_vibrance / 100.0;
    float saturationBoost = vibranceAmount * (1.0 - hsl.y); // Less boost for already saturated
    hsl.y = clamp(hsl.y + saturationBoost * 0.5, 0.0, 1.0);
    
    rgb = hsl2rgb(hsl);
    
    // 8. Saturation (global)
    float satAmount = u_saturation / 100.0;
    float gray = luminance(rgb);
    rgb = mix(vec3(gray), rgb, 1.0 + satAmount);
    
    // Clamp final output
    rgb = clamp(rgb, 0.0, 1.0);
    
    gl_FragColor = vec4(rgb, color.a);
}
