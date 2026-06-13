# Design

## Theme
A premium, modern visual theme utilizing sleek slate text colors, glass-like UI indicators, and HSL/Hex color coordinates that are clean and pleasant for student timetables.

## Colors

### Brand
- `--primary`: `#4f46e5` (Indigo)
- `--primary-hover`: `#4338ca`

### Background & Surface
- `--bg-primary`: `#f8fafc` (Slate 50)
- `--bg-card`: `#ffffff`
- `--border-color`: `#cbd5e1`

### Ink
- `--text-main`: `#0f172a` (Slate 900)
- `--text-muted`: `#475569` (Slate 600)

### Accents (Day Colors)
- `--color-mon`: `#0284c7` (Sky Blue)
- `--color-tue`: `#db2777` (Pink)
- `--color-wed`: `#059669` (Emerald Green)
- `--color-thu`: `#ea580c` (Orange)
- `--color-fri`: `#0891b2` (Cyan)
- `--color-sat`: `#7c3aed` (Purple)
- `--color-sun`: `#dc2626` (Red)

### Subject Card Themes
- **Indigo**: BG `#eef2ff`, Dark text `#1e1b4b`, Border `#4f46e5`
- **Emerald**: BG `#ecfdf5`, Dark text `#022c22`, Border `#059669`
- **Coral**: BG `#fff7ed`, Dark text `#431407`, Border `#ea580c`
- **Amethyst**: BG `#faf5ff`, Dark text `#2e1065`, Border `#9333ea`
- **Amber**: BG `#fffbeb`, Dark text `#451a03`, Border `#d97706`

## Typography
- **Primary Font**: `Outfit` (for English titles, indicators, timestamps)
- **Secondary Font**: `Kanit` (for Thai text, course codes, teacher names, and general labels)

## Layout & Components
- **Timetable Grid**: 2D CSS Grid mapping hours (8:00 - 20:00) against days of the week.
- **Responsive Adaptations**: Switches to active-day tab layout on mobile screens (< 768px).
- **Shadow Scale**:
  - `--shadow-soft`: light offset shadow
  - `--shadow-card`: default card elevation
  - `--shadow-hover`: high-elevation brand glow for interactive hovers
