---
name: pdf-vendor-profile
description: Genera el perfil JSON de un proveedor para leer sus vouchers en PDF (c-voucher-reader). Úsala cuando el usuario suba un PDF de reserva —hotel, vuelo, tren, bus— y pida crear o corregir el JSON de esa marca para extraer sus datos, o cuando un perfil existente haya dejado de funcionar porque el proveedor cambió su plantilla.
---

# Perfiles de proveedor para vouchers en PDF

`c-voucher-reader` lee un PDF aplicando un perfil declarativo por marca. Esta
skill produce ese perfil: un JSON en `src/data/pdf/<id>.json`.

**El perfil es dato, nunca código.** Lo interpreta `pdf-profile.utils.ts` en el
navegador. No generes nunca JavaScript para que lo cargue el cliente: sería
ejecución de código remoto escrito a partir de un fichero que sube un usuario.

## Flujo

### 1. Mirar el documento

```bash
node .claude/skills/pdf-vendor-profile/scripts/inspect.mjs <pdf> --page 1
```

Imprime las líneas numeradas tal y como las ve el lector (`⇥` = separador de
columna) y analiza los huecos horizontales.

`--mask` oculta emails, teléfonos y números largos (localizadores, tarjetas).
**No oculta nombres de personas**, que no se pueden detectar de forma fiable:
revisa la salida antes de pegarla en ningún sitio.

Si el análisis dice *"hueco de 93u → corta en x ≈ 0.45"*, hay dos bloques
lado a lado. Previsualiza cada uno antes de escribir nada:

```bash
node .claude/skills/pdf-vendor-profile/scripts/inspect.mjs <pdf> --crop 0.45,1,0,0.32
```

Los índices que salen en el recorte son los que usarás en `below`.

### 2. Escribir el perfil

Empieza por los campos con etiqueta clara y deja para el final los que estén
partidos entre líneas. Guárdalo en `src/data/pdf/<id>.json`.

### 3. Verificarlo contra el PDF real

```bash
node .claude/skills/pdf-vendor-profile/scripts/verify.mjs <pdf> src/data/pdf/<id>.json
```

Bundlea el intérprete real desde `src/`, así que no puede desviarse de lo que
hace el navegador. Compara la salida campo a campo con lo que pone el
documento. **Un perfil que no ha pasado por aquí no está probado.**

### 4. Comprobar que no rompe los que ya había

Vuelve a pasar `verify.mjs` con los PDFs de los otros perfiles que tengas a
mano. Los accesores sin `within` leen el documento entero y son sensibles a
cambios en el intérprete.

## Accesores

| Forma | Qué hace |
|---|---|
| `"Dirección"` | Atajo: ancla en la etiqueta, valor en la misma línea |
| `{ "label", "below", "column", "within", "transform" }` | `below` = líneas por debajo (0 = misma línea). `column` = índice tras `⇥` |
| `{ "regex", "group", "within", "transform" }` | Sobre el texto del recorte. Insensible a mayúsculas. `group` por defecto 1 |
| `{ "linesAfter" \| "linesBefore", "count", "separator", "within" }` | Bloque de líneas enteras. Para direcciones |
| `{ "concat": [...], "separator" }` | Pega varios accesores. Para valores partidos entre líneas |
| `{ "const": "..." }` | Literal |
| `[ ... ]` | Array = gana el primero que devuelva algo |

`within` es una caja en **fracciones de página** (`{ page, xMin, xMax, yMin, yMax }`),
con `y` contada **desde arriba**. Al ser fracciones, el perfil sobrevive a A4 y Letter.

Transformaciones: `collapseSpaces`, `stripTrailingPunctuation`, `upper`, `stripLabel`
(esta última quita todo hasta el primer `:`, útil junto a `column`, que no
recorta la etiqueta).

## Campos del perfil

**Comunes:** `id`, `match` (array de huellas), `poiType`.

**`poi_hotel`:** `name`, `address`, `coordinates`, `price`, `dateStart`, `dateEnd`,
`timeStart`, `timeEnd`, `notes` (array de `{ icon, text }`).

**`poi_transport`:** `typeTransport`, `provider`, `operator`, `transportNumber`,
`class`, `passenger`, `seat`, `price`, `date`, `origin`, `destiny`
(estos dos con `code`, `name`, `address`, `platform`, `time`).

Fechas y precios se normalizan solos: devuelve el texto crudo y ya lo parsean
`parseNaturalDate` y `parsePrice`.

## Trampas reales

**Las columnas se entrelazan.** Dos bloques lado a lado no comparten línea
base, así que una lectura de página entera los mezcla. Este es el caso más
frecuente y la razón de que exista `within`. En el PDF de Booking, la dirección
del hotel y la caja de fechas se intercalan línea sí, línea no.

**Los valores se parten.** Un día en una línea y su mes en la siguiente; unas
coordenadas cortadas por la mitad. Es lo que resuelve `concat`:

```json
"dateStart": { "concat": [
  { "label": "ENTRADA", "column": 0, "below": 1, "within": { "xMin": 0.45, "yMax": 0.32 } },
  { "label": "ENTRADA", "column": 0, "below": 2, "within": { "xMin": 0.45, "yMax": 0.32 } }
]}
```

Ancla en la etiqueta que sí existe (`ENTRADA`) y llega a la de al lado con
`column: 1`, en vez de buscar `SALIDA` por separado.

**Muchos vouchers no llevan año.** No lo inventes: `findDocumentYear` lo saca
de otra parte del documento.

**Los metadatos del PDF no sirven para identificar la marca.** Si el usuario
reenvió o reimprimió el documento desde el móvil, `Producer` dice
"iOS Quartz PDFContext". Usa el texto.

**`manifest` es un id reservado.** El manifiesto se sirve en `/api/pdf/manifest`.

## Elegir el `match`

Es la huella con la que se reconoce la marca. Escoge lo más estable del
documento: un dominio (`booking.com`), un CIF, un número de licencia, una frase
del pie legal. Evita nombres de producto o cualquier cosa que cambie por
campaña o por idioma.

Cuidado con lo demasiado genérico: `"hotel"` casaría con medio mundo. Y ojo con
los PDFs de agregadores, que mencionan varias marcas — usa la que emite el
documento, no la del alojamiento.

## Reglas

**Vacío es mejor que equivocado.** El usuario revisa un hueco, pero se le puede
colar una fecha plausible y falsa. Si un campo no se puede leer con seguridad,
déjalo fuera del perfil; `sanitizeDraft` hace lo mismo al final.

**Prefiere anclas por etiqueta a `regex`.** Aguantan mejor los retoques de
plantilla. Reserva `regex` para lo que no tenga etiqueta.

**Un `within` por campo, lo más ajustado posible.** Un accesor sin recorte lee
el documento entero y puede engancharse a la sección equivocada.

**Comprueba los valores a ojo.** Que un campo salga relleno no significa que
sea el dato correcto. Contrasta cada uno con el PDF.

## Después

El perfil se sirve solo: `/api/pdf/[id].ts` recorre `src/data/pdf/*.json` con un
glob, y `manifest.ts` publica los pares `{id, match}`. No hay que registrar nada
a mano ni desplegar el frontend.
