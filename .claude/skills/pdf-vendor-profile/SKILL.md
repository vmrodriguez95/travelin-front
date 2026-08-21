---
name: pdf-vendor-profile
description: Generates the JSON profile of a vendor so their PDF vouchers can be read (c-voucher-reader). Use it when the user uploads a booking PDF in any language —hotel, flight, train, bus— and asks to create or fix the JSON for that brand to extract its data, or when an existing profile stopped working because the vendor changed its template.
---

# Vendor profiles for PDF vouchers

`c-voucher-reader` reads a PDF by applying a declarative per-brand profile. This
skill produces that profile: a JSON file in `src/data/pdf/<id>.json`.

**The profile is data, never code.** It is interpreted by `pdf-profile.utils.ts`
in the browser. Never generate JavaScript for the client to load: that would be
remote code execution written from a file a user uploads.

## Flow

### 1. Look at the document

```bash
node .claude/skills/pdf-vendor-profile/scripts/inspect.mjs <pdf> --page 1
```

Prints the numbered lines exactly as the reader sees them (`⇥` = column
separator) and analyses the horizontal gaps.

`--mask` hides emails, phone numbers and long digit runs (booking references,
cards). **It does not hide people's names**, which cannot be detected reliably:
review the output before pasting it anywhere.

If the analysis says *"93u gap → cut at x ≈ 0.45"*, there are two blocks side by
side. Preview each one before writing anything:

```bash
node .claude/skills/pdf-vendor-profile/scripts/inspect.mjs <pdf> --crop 0.45,1,0,0.32
```

The indices printed in the crop are the ones you will use in `below`.

### 2. Write the profile

Start with the fields that have a clear label and leave the ones split across
lines for last. Save it to `src/data/pdf/<id>.json`.

### 3. Verify it against the real PDF

```bash
node .claude/skills/pdf-vendor-profile/scripts/verify.mjs <pdf> src/data/pdf/<id>.json
```

It bundles the real interpreter from `src/`, so it cannot drift from what the
browser does. Compare the output field by field with what the document says.
**A profile that has not been through this is not tested.**

### 4. Check it does not break the existing ones

Run `verify.mjs` again with the PDFs of the other profiles you have at hand.
Accessors without `within` read the whole document and are sensitive to changes
in the interpreter.

## Accessors

| Shape | What it does |
|---|---|
| `"Address"` | Shorthand: anchor on the label, value on the same line |
| `{ "label", "below", "column", "within", "transform" }` | `below` = lines further down (0 = same line). `column` = index after `⇥` |
| `{ "regex", "group", "within", "transform" }` | Over the crop's text. Case-insensitive. `group` defaults to 1 |
| `{ "linesAfter" \| "linesBefore", "count", "separator", "within" }` | Block of whole lines. For addresses |
| `{ "concat": [...], "separator" }` | Joins several accessors. For values split across lines |
| `{ "const": "..." }` | Literal |
| `[ ... ]` | Array = the first one that returns something wins. The way to cover a label in several languages |

`within` is a box in **page fractions** (`{ page, xMin, xMax, yMin, yMax }`),
with `y` counted **from the top**. Being fractions, the profile survives both A4
and Letter.

Transforms: `collapseSpaces`, `stripTrailingPunctuation`, `upper`, `stripLabel`
(this last one strips everything up to the first `:`, useful alongside `column`,
which does not trim the label).

## Profile fields

**Common:** `id`, `match` (array of fingerprints), `poiType`.

**`poi_hotel`:** `name`, `address`, `coordinates`, `price`, `dateStart`, `dateEnd`,
`timeStart`, `timeEnd`, `notes` (array of `{ icon, text }`).

**`poi_transport`:** `typeTransport`, `provider`, `operator`, `transportNumber`,
`class`, `passenger`, `seat`, `price`, `date`, `origin`, `destiny`
(these last two with `code`, `name`, `address`, `platform`, `time`).

Dates and prices normalise themselves: return the raw text and
`parseNaturalDate` and `parsePrice` will parse it.

## Documents in Spanish or English

The same vendor issues the same voucher in either language, and the user may
hand you one or the other. **A profile must cope with both**, and the whole
point is that you do not need a second profile per language.

Labels are matched case- and accent-insensitively and as a substring, so
`"direccion"` already matches `Dirección`, `DIRECCIÓN` and `Dirección del
hotel`. What it does not do is translate: `ENTRADA` will never match `CHECK-IN`.
Cover both with an array, most specific first:

```json
"dateStart": [
  { "label": "ENTRADA", "below": 1, "within": { "xMin": 0.45, "yMax": 0.32 } },
  { "label": "CHECK-IN", "below": 1, "within": { "xMin": 0.45, "yMax": 0.32 } }
]
```

The layout is normally the same in both editions — the same box in the same
place, only the wording changes. So the `within` crop carries over unchanged and
only the `label` needs the alternative. Do check it: a longer translation can
wrap onto an extra line and shift the `below` count.

Month names are parsed in both languages, abbreviations included (`18 de agosto
de 2026`, `18 August 2026`, `29 AGO`). Return the raw text either way.

Prefer a `within` + `below` anchor over a `regex` full of alternations. And when
you only have one of the two editions in front of you, say so when you hand over
the profile, so the other one gets tested before it is trusted.

## Real-world traps

**Columns interleave.** Two blocks side by side share no baseline, so a
whole-page read mixes them together. This is the most frequent case and the
reason `within` exists. In Booking's PDF, the hotel address and the dates box
alternate line by line.

**Values get split.** A day on one line and its month on the next; coordinates
cut in half. That is what `concat` solves:

```json
"dateStart": { "concat": [
  { "label": "CHECK-IN", "column": 0, "below": 1, "within": { "xMin": 0.45, "yMax": 0.32 } },
  { "label": "CHECK-IN", "column": 0, "below": 2, "within": { "xMin": 0.45, "yMax": 0.32 } }
]}
```

Anchor on the label that does exist (`CHECK-IN`) and reach the neighbouring one
with `column: 1`, instead of looking up `CHECK-OUT` separately.

**Many vouchers carry no year.** Do not invent it: `findDocumentYear` gets it
from elsewhere in the document.

**PDF metadata is useless for identifying the brand.** If the user forwarded or
reprinted the document from their phone, `Producer` says "iOS Quartz
PDFContext". Use the text.

**`manifest` is a reserved id.** The manifest is served at `/api/pdf/manifest`.

## Choosing the `match`

It is the fingerprint the brand is recognised by. Pick the most stable thing in
the document: a domain (`booking.com`), a tax id, a licence number. Avoid
product names, and above all avoid anything translated — a footer sentence is
only a good fingerprint if it is the same string in the Spanish and the English
edition. A domain or a tax id always is.

Beware of anything too generic: `"hotel"` would match half the world. And watch
out for aggregator PDFs, which mention several brands — use the one that issues
the document, not the accommodation's.

## Rules

**Empty beats wrong.** The user reviews a blank, but a plausible and false date
can slip past them. If a field cannot be read with confidence, leave it out of
the profile; `sanitizeDraft` does the same at the end.

**Prefer label anchors over `regex`.** They hold up better against template
tweaks and against translation. Keep `regex` for whatever has no label.

**One `within` per field, as tight as possible.** An accessor without a crop
reads the whole document and can latch onto the wrong section.

**Eyeball the values.** A field coming back filled does not mean it is the right
piece of data. Check each one against the PDF.

## Afterwards

The profile is served on its own: `/api/pdf/[id].ts` walks `src/data/pdf/*.json`
with a glob, and `manifest.ts` publishes the `{id, match}` pairs. Nothing needs
registering by hand and there is no frontend deploy.
