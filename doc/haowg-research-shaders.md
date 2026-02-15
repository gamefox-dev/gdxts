# HAOWG Shader Research (`addons/vfx_library/shaders`)

Source: `/tmp/GODOT-VFX-LIBRARY/addons/vfx_library/shaders/*.gdshader`

Each row captures shader uniforms, dominant visual behavior, and intended usage context for the gdxts port.

| Shader | Uniforms | Major visual logic | Expected usage context |
| --- | --- | --- | --- |
| `blink.gdshader` | float blink_speed; float min_alpha | sin(TIME * blink_speed) drives alpha pulsing between min_alpha and 1.0 | character hit feedback, warning markers, UI icon pulse |
| `blur_amount.gdshader` | float blur_amount | 9x9 kernel averages 81 texture taps around UV for soft full-sprite blur | motion blur, stun/debuff feedback, transition overlays |
| `burning.gdshader` | float burn_amount; vec4 fire_color1; vec4 fire_color2; sampler2D distortion_texture; float distortion_strength | distortion noise offsets UV, mixes two fire colors, and applies vertical burn-edge mask | burning status, fire enchant, destruction transition |
| `chromatic_aberration.gdshader` | float aberration_amount; vec2 aberration_direction | RGB channels sampled with opposite UV offsets for lens split/fringing | impact bursts, camera stress, magical distortion |
| `color_change.gdshader` | vec4 target_color; float mix_amount; bool preserve_luminance | mixes original RGB toward target_color with optional luminance preservation | team-color swaps, temporary buffs, palette shifts |
| `dissolve.gdshader` | float dissolve_amount; sampler2D dissolve_texture; vec4 edge_color; float edge_width | noise threshold controls pixel discard alpha; separate edge band tinted by edge_color | spawn/despawn effects, teleport dissolve, death fade |
| `enemy.gdshader` | float blur_amount; float shake_intensity; float white_intensity; float time | combines UV shake, configurable blur kernel, and white flash blend | enemy damage pipeline (shake + blur + white hit flash) |
| `energy_barrier.gdshader` | float hex_scale; vec4 barrier_color; float pulse_speed; float edge_brightness | procedural hex grid + time pulse layered over texture to build shield field | barriers, shields, magical domes, forcefields |
| `flash_white.gdshader` | float flash_amount; vec4 flash_color | simple mix(TEXTURE, flash_color, flash_amount * alpha) keeps source alpha | damage flash and short confirmation flashes |
| `fog.gdshader` | sampler2D noise_texture; float density; vec2 speed | scrolling noise (fract(UV + speed*TIME)) modulates alpha density | ambient fog volumes and low-contrast atmosphere |
| `frozen.gdshader` | float freeze_amount; vec4 ice_color; sampler2D ice_texture; float crystal_intensity | ice texture overlay + freeze_amount blend + crystal highlights | freeze/debuff state and cold-environment overlays |
| `grayscale.gdshader` | float grayscale_amount; vec3 luminance_weights | weighted luminance conversion blended by grayscale_amount | status effects, pause/death filters, scene desaturation |
| `heat_distortion.gdshader` | float distortion_speed; float distortion_amount; sampler2D noise_texture | animated noise RG offsets UV to refract sprite/background | heat haze, flames, exhaust, hot-air distortion |
| `invisibility.gdshader` | float invisibility_amount; float distortion_amount; sampler2D distortion_texture | distorted UV sampling with fade-to-transparent and edge glow retention | stealth/invisibility status and cloaking |
| `outline_glow.gdshader` | vec4 outline_color; float outline_width; float glow_intensity | samples neighboring alpha in radial steps to build outline mask and glow tint | selection highlight, interactable emphasis, spell outlines |
| `petrify.gdshader` | float petrify_amount; vec4 stone_color; sampler2D crack_texture; float crack_intensity | grayscale stone base plus crack-texture darkening scaled by petrify_amount | petrify/stone curse status effects |
| `poison.gdshader` | float poison_amount; vec4 poison_color; float pulse_speed | time pulse modulates poison intensity and blends toward poison_color | poison/debuff and toxic aura effects |
| `portal_vortex.gdshader` | float vortex_speed; float vortex_strength; vec4 portal_color1; vec4 portal_color2 | polar UV swirl rotates sample coordinates; dual portal colors oscillate over radius | portals, magical gates, void vortex visuals |
| `radial_blur.gdshader` | float blur_strength; vec2 blur_center; int samples | samples along vector from blur_center to UV for radial streak blur | dash, zoom bursts, spell charge emphasis |
| `shake_intensity.gdshader` | float time; float shake_intensity | time-based sine/cos offset of UV coordinates | screen/sprite shake or unstable energy look |
| `starSky.gdshader` | vec2 dimensions; float small_stars; float small_stars_far_size; float small_stars_near_size; float large_stars; float large_stars_far_size; float large_stars_near_size; vec4 far_stars_color; vec4 near_stars_color; sampler2D small_stars_texture; sampler2D large_stars_texture; float base_scroll_speed; float additional_scroll_speed | procedural starfield layers with randomized lane speeds and parallax-like size/color | parallax sky backgrounds and space backdrops |
| `vignette.gdshader` | float vignette_strength; float vignette_size; vec4 vignette_color | distance(UV, center) through smoothstep darkens/tints edges | cinematic framing, damage vignette, focus effects |
| `water.gdshader` | float level; vec4 water_albedo; float water_opacity; float water_speed; float wave_distortion; int wave_multiplyer; bool water_texture_on; float reflection_X_offset; float reflection_Y_offset; sampler2D noise_texture; sampler2D noise_texture2; sampler2D SCREEN_TEXTURE; float pixel_resolution_x; float pixel_resolution_y; float edge_fade_width | level-based water mask, noise-driven wave distortion, screen-texture reflection, edge fade | 2D water body surface + reflection pass |
| `water_surface.gdshader` | vec2 wave_direction; float wave_speed; float wave_frequency; float wave_amplitude; vec4 water_tint | sin/cos wave offsets perturb UV then tint texture with water_tint | surface ripple animation on water sprites |
