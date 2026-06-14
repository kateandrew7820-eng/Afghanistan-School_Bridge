---
name: Styling tokens
description: Default theme, fonts, and brand token rules
type: design
---
- Default theme is **dark** (deep slate base with teal/cyan primary glow). Light is supported via a user toggle (next-themes, `attribute="class"`, `storageKey="schoolbridge-theme"`).
- Fonts: Roboto for body, Montserrat for headings.
- Always use semantic tokens from `index.css` (`--background`, `--primary`, `--accent`, `--success`, `--warning`, `--destructive`, `--gradient-hero`, `--shadow-glow`, `--shadow-elegant`). Never hardcode palette colors in components.
