---
name: pdf-vendor-profile
description: Generates the JSON profile of a vendor so their PDF vouchers can be read (c-voucher-reader). Use it when the user uploads a booking PDF in any language —hotel, flight, train, bus— and asks to create or fix the JSON for that brand to extract its data, or when an existing profile stopped working because the vendor changed its template.
---

# Vendor profiles for PDF vouchers

`c-voucher-reader` reads a PDF by applying a declarative per-brand profile. This
skill produces that profile: a JSON file in `src/data/pdf/<poiType>/<id>.json`.

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
lines for last.

**The folder is the classification, so decide the `poiType` before writing
anything.** A stay — hotel, hostel, apartment, guesthouse — is `poi_hotel`; a
journey — flight, train, bus, ferry, transfer — is `poi_transport`. The file
goes in the matching folder and the JSON repeats it in its own `poiType` field:

```
src/data/pdf/poi_hotel/booking.json
src/data/pdf/poi_transport/12go.json
```

Both have to agree. The folder is what the API globs; the field is what the
interpreter reads to pick a parser. They are served as `/api/<poiType>/pdf/<id>`.

The two are separate catalogues, so a brand selling both — Booking sells stays
and flights, 12Go sells buses and ferries — gets **one profile per type**, each
in its folder, and the two may share the same `match` fingerprint. Never try to
cover both from a single file: the field sets have nothing in common.

### 3. Verify it against the real PDF

```bash
node .claude/skills/pdf-vendor-profile/scripts/verify.mjs <pdf> src/data/pdf/<poiType>/<id>.json
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
`class`, `price`, `date`, and the journey — `origin` + `destiny` for a single
leg (each with `code`, `name`, `address`, `platform`, `time`, `date`), or
`segments` for a voucher that prints several. Plus the travellers:
`passengers` for a list, or `passenger` + `seat` for a vendor that only ever
prints one.

`provider` is a plain string, not an accessor: it is the brand issuing the
voucher, which the profile already knows.

Dates and prices normalise themselves: return the raw text and
`parseNaturalDate` and `parsePrice` will parse it. `parsePrice` reads the
currency out of the same string — any ISO code (`542 THB`) or a common symbol
(`€`, `฿`, `R$`, `S/`) — so when the amount and the currency sit in different
places, `concat` them into one value instead of dropping the currency.

### `typeTransport`

A vendor that only sells one mode states it outright: `"typeTransport": "bus"`.
An aggregator sells several, and printing `bus` on a ferry ticket is exactly the
plausible-but-wrong value the user will not catch. Read it instead:

```json
"typeTransport": {
  "from": { "label": "Class:", "column": 2, "within": { "yMin": 0.1, "yMax": 0.34 } },
  "map": { "ferry": "ferry", "boat": "ferry", "train": "train", "bus": "bus", "van": "bus" },
  "fallback": "bus"
}
```

`from` is a normal accessor, so it can be a `concat` of the two or three places
where the vehicle might be named. The `map` keys are matched as case- and
accent-insensitive substrings **in the order written**, so put the specific
before the generic (`boat` before `van`, for a "Long Tail Boat" run by a van
company). `fallback` is what the vendor sells most of.

### `segments`

One journey is described once, with `origin`/`destiny` at the top level. A
voucher that prints several legs — an outbound and a return — uses `segments`
instead, and each leg is read from its own block of lines:

```json
"segments": {
  "within": { "page": 0, "xMax": 0.49 },
  "startsAt": "^De\\s+[^(\\n]+\\([A-Z]{3}\\)\\s*a\\s+",
  "until": ["Datos del pasajero"],
  "date": { "regex": "([A-Za-z]{3,}\\.?,\\s*\\d{1,2}\\s+[A-Za-z]{3,})\\s*·" },
  "operator": { "regex": "\\n([^·\\n]+?)\\s*·\\s*[A-Z]{2}\\d{2,}" },
  "origin": { "code": { "regex": "\\bDe\\s+[^(\\n]+\\(([A-Z]{3})\\)" } },
  "destiny": { "code": { "regex": "a\\s+[^(\\n]+\\(([A-Z]{3})\\)" } }
}
```

A new block opens on every line matching `startsAt` and runs to the next one;
`until` closes the list before the section that follows. Inside a block the
accessors are the **ordinary ones** — label, regex, concat, arrays — resolved
against that block's lines. `within` has no meaning there: the block is already
the scope. `operator`, `transportNumber`, `class` and `date` fall back to the
top-level field when the block does not define one.

The draft takes its name from the **first** leg, so a return trip reads as
"Madrid - Tokyo" rather than "Madrid - Madrid".

A point also accepts its own `date`, alongside `time`. Use it whenever a leg can
land after midnight: without it the arrival inherits the departure's day, and a
red-eye ends up arriving before it left.

### `passengers`

A list, one row per traveller, bounded by labels rather than counted:

```json
"passengers": {
  "within": { "yMin": 0.1, "yMax": 0.42 },
  "after": "Passengers",
  "until": ["Total", "Information"],
  "name": { "regex": "^([^\\n\\t(]+?)\\s*\\((?:M|F)[,)]" },
  "seat": { "regex": "\\t\\s*([^\\s(\\t]+)\\s*\\(" }
}
```

`after` is the header the table hangs off; the rows are the lines below it,
stopping before the first line that matches `until`. `name` and `seat` run
against **one row at a time** — they take `regex` (with `group`) or `column`,
plus `transform`, and nothing else: no `label`, no `within`, because the row has
already been located. A row whose `name` comes out empty is dropped, which is
what keeps a footer line out of the list.

Prefer patterns that key on the row's *shape* — `(M)`, `(F, Passport …)`, a seat
in its own column — over anything worded, since that survives both languages.


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

**Many vouchers carry no year.** Do not invent it, and do not go looking for one
to staple on: what you return is parsed by `parseNaturalDate`, which resolves the
year itself, in this order.

1. A year printed inside the value wins — `18 August 2026`.
2. Otherwise, **the weekday pins it down**: `mar, 28 oct` can only be 2025 within
   any realistic travel window, because that date is a Tuesday in no other
   nearby year. So when the voucher prints the weekday, **capture it** — start
   the match at `mar,` rather than at `28`. It costs nothing and it is the only
   thing standing between you and a wrong year.
3. Only as a last resort, `findDocumentYear` takes the earliest plausible year
   mentioned anywhere in the document — which on a flight voucher is quite
   likely to be **a passport expiry date**, not the journey. Do not rely on it
   when a weekday is available.

**PDF metadata is useless for identifying the brand.** If the user forwarded or
reprinted the document from their phone, `Producer` says "iOS Quartz
PDFContext". Use the text.

**`manifest` is a reserved id.** The manifest is served next to the profiles, at
`/api/<poiType>/pdf/manifest`.

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

The profile is served on its own: `src/pages/api/[poiType]/pdf/[id].ts` walks
`src/data/pdf/*/*.json` with a glob, and `manifest.ts` publishes the
`{id, match}` pairs of each type. Dropping the file in the right folder is the
whole registration — nothing to wire by hand, no frontend deploy.

Each type has its own manifest, so the reader only ever downloads the catalogue
for the form the user is filling in. That is what stops `booking` under
`poi_hotel` from being tried against a flight voucher, and it means an id only
has to be unique within its own `poiType`.
