# Phase M2: Hebrew RTL + i18n

## Goal
Implement full Hebrew RTL support and i18n infrastructure for StudyOS v2, maintaining an Apple-like aesthetic.

## Requirements

- **M2-RTL-01**: Implement i18next with Hebrew and English locales.
- **M2-RTL-02**: Automatic direction detection and manual toggle in Layout.
- **M2-RTL-03**: Convert all current layout/component CSS to use logical properties (`margin-inline`, `padding-inline`, etc.).
- **M2-RTL-04**: Add Hebrew font (Heebo) with proper sizing and line-height.
- **M2-RTL-05**: Implement directional icon flipping logic (flip arrows, chevrons; keep media controls, checkmarks).
- **M2-RTL-06**: Ensure Apple-like typography balance (e.g. Heebo +2pt font size in Hebrew vs English).
- **M2-RTL-07**: Define standards for mixed Bi-di text handling (`unicode-bidi: isolate`).
