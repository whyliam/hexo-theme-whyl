# Glasswork source snapshot

Source: https://github.com/kubai087/glasswork (main), retrieved 2026-11-14.
MIT license and NOTICE are included. No wallpapers or other media are copied.

- lens.mjs and adapt.mjs: upstream JavaScript with only extension changed.
- refract.mjs: adapter additions described below, preserving the upstream shader.
- source/css/glasswork.css: upstream material properties and shadows, prefixed to avoid theme token collisions; layout, radius and transition rules omitted.

Local refraction extensions: optional source.cover for focal-point-aware coordinates; failure on context loss. Sources are loaded with CORS and the renderer is disabled offscreen and under reduced transparency.
