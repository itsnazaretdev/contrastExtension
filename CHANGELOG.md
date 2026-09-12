# Change Log

All notable changes to the "contrast-checker" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- HSL colors written in the CSS Color 4 space syntax are now detected:
  `hsl(120 50% 50%)`, `hsl(120deg 50% 50% / 0.5)`, `hsla(210 100% 50% / 80%)`.
  Only the legacy comma syntax was recognised before.
- Negative and `deg`-suffixed hues parse correctly. The previous numeric scrape
  dropped the sign, so `hsl(-120 50% 50%)` was read as `hsl(120 50% 50%)`.
- Fractional saturation and lightness (`hsl(210.5 33.3% 20%)`) are accepted.

## [0.0.4] - 2026-09-12

### Fixed

- 8-digit hex colors (`#RRGGBBAA`) are now parsed correctly. The alpha byte
  overflowed the 32-bit bitwise shifts and produced wrong RGB components, so
  `#ff0000ff` reported a contrast ratio for blue instead of red.
- Colors are reported in document order. They were previously grouped by
  format, so `color: rgb(0, 0, 0); background: #fff;` was labelled
  `#fff vs rgb(0, 0, 0)`.
- Out-of-gamut RGB components are clamped to 0-255, matching browser
  behaviour. `rgb(300, 0, 0)` used to yield a luminance above 1 and a
  nonsensical ratio.
- Malformed hex input (`#12345`, `#ffzz`) is rejected instead of silently
  parsing a partial value.
- The Output Channel is created once on activation instead of on every run.
- Packaging no longer ships `pnpm-lock.yaml`, `select.png` or dev config
  (157 KB -> 11 KB), caused by a misspelled `.vscodeingnore` file.

### Changed

- The command is now grouped under the `Contrast Checker` category in the
  Command Palette.
- Bumped `@vscode/test-electron` to 3.1.0 so the test suite runs against
  VS Code 1.137+, which renamed the macOS binary from `Electron` to `Code`.

## [0.0.3] - 2026-07-29

- Support for HEX, RGB, and HSL color strings.
- Full 4-tier WCAG 2.1 report matrix.
- Native Output Channel printing integration.

## [0.0.2] - 2026-07-27

## [0.0.1] - 2026-07-19

- Initial release.
