# OpenI Hub — Brand Kit (Standard)

> Canonical brand guidelines for OpenI Hub. This is the single source of truth for
> colours, typography, and design language across the **platform UI** and all
> **downloadable assets** (PDFs). Mirrored in both repos (`openi-hub` + `openi-hub-backend`).
> Locked 16 Jun 2026.

---

## 1. Colour palette

| Token | Hex | RGB | Use |
|---|---|---|---|
| **OpenI Gold** (primary) | `#D0A848` | 208, 168, 72 | Primary accent — CTAs, buttons, key numbers, section accents, table header bands |
| **Deep Navy** | `#152838` | 21, 40, 56 | Bars, hero/closing panels, headings, primary body text on light |
| **Charcoal** | `#3A3A3A` | 58, 58, 58 | Heading text on light backgrounds |
| **Slate** | `#585858` | 88, 88, 88 | Secondary body text, captions, labels |
| **Light Sand** | `#F5F3EF` | 245, 243, 239 | Alternating rows, panel/tile fills, soft section bands |
| **White** | `#FFFFFF` | 255, 255, 255 | Page background, text on navy/gold |

**Deprecated (do NOT use — being phased out):** old gold `#D5AA5B`, old gold-dark `#CFA745`,
old navy `#252147`. Any new code must use the tokens above.

### Tailwind token mapping (frontend)
- `primary.500` → `#D0A848` (gold)
- `navy` / `dark.900` → `#152838` (deep navy)
- Prefer the `primary` / `navy` Tailwind tokens over inline hex literals in new code.

### PDF constant mapping (backend `src/services/pdfService.js`)
- `GOLD = '#D0A848'`, `DARK = NAVY = '#152838'`, `CHARCOAL = '#3A3A3A'`,
  `SLATE = '#585858'`, `SAND = '#F5F3EF'`.

---

## 2. Typography

- **Body & headings:** **Lexend** (sans). Weights in use: `Lexend` (regular),
  `Lexend-Semi` (600), `Lexend-Bold` (700).
- **Lora** (serif) is the aspirational heading face in the master brand deck, but the
  platform and PDFs ship **Lexend only** — hierarchy is created through **colour, weight,
  size, and banding**, not a second family. (Decision locked: no Lora .ttf bundled.)
- Eyebrows / labels: uppercase, letter-spaced, Slate or Gold.

---

## 3. Design language

- **Hero / closing panels:** full-bleed **Deep Navy** with a **3px gold base rule**;
  gold uppercase eyebrow, white bold title, sand-tint (`#C9D2DA`) supporting text.
- **Section headings:** light **Sand** band with a **4px gold left accent**, navy bold title.
- **Tables / fact grids:** gold (or navy) header band with white text; **alternating
  Light-Sand rows** for readability.
- **Key metrics:** sand tiles with a **1px gold border**, big **gold** number + small
  Slate uppercase label.
- **Header bar (PDF):** navy bar, logo left, `openi.ai` gold right.
- **Buttons / CTAs (UI):** gold fill, navy or white text.

---

## 4. Logo assets

- `openi_oi_mark.png` — the "OI" mark (square/icon use, PDF header bar).
- `openi_wordmark.png` — full wordmark.
- Running-header lockup pattern: **OpenI | [Document Title]**.

---

## 5. Scope of application

1. **Platform UI** (React/Vite, `openi-hub`): Tailwind theme tokens + `index.css` +
   inline literals retuned to the tokens above.
2. **Downloadable assets** (PDFs, `openi-hub-backend/src/services/pdfService.js`): all 13
   builders inherit the shared brand constants; the startup-profile PDF carries the full
   navy-hero / gold-band / sand-row / key-metric treatment.

**GST tax invoices are legally constrained** — colour changes only; never alter the GST
field layout (CGST/SGST/IGST, HSN/SAC, place of supply, total-in-words). Re-verify a
domestic + an export invoice render after any palette change.
