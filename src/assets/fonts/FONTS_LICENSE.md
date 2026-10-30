# Font Licensing, Provenance and Inventory

This directory contains self-hosted font assets used by MindMosaic to ensure deterministic, zero-network, offline-capable builds. All fonts are open-source and licensed under permissive open-source licences (primarily the SIL Open Font License 1.1).

---

## 1. Font Inventory and Provenance

| File Name | Internal Family | PostScript Name | Style / Cut | Weight(s) | Internal Version | Provenance / Upstream Source | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `dm-sans-latin-variable.woff2` | DM Sans 9pt | DMSans9pt-Regular | Variable | 100–1000 (wght) | Version 4.004; gftools[0.9.30] | Google Fonts (`dm-fonts`) | `9fea608a947e67020c33cad9a6fe3d60c54119dfb8cff87768a8117a15ed7543` |
| `dm-serif-display-latin-400.woff2` | DM Serif Display | DMSerifDisplay-Regular | Static | 400 | Version 5.200; ttfautohint (v1.8.3) | Google Fonts (`dm-fonts`) | `fdf61e20fd2c0108e0ea28da4daca0035205b4b7fc031a3974b865b704de160a` |
| `geist-latin-variable.woff2` | Geist | Geist-Regular | Variable | 100–900 (wght) | Version 1.800 | Vercel (`geist-font`) | `19f9c92546aa300c312235e3125af1b81394d8db9a4bc4a425cd5b641d2d54e1` |
| `instrument-sans-latin-variable.woff2` | Instrument Sans | InstrumentSans-Regular | Variable | 400–700 (wght) | Version 1.000; gftools[0.9.28] | Instrument / Google Fonts (`instrument-sans`) | `2ee17598a98d8a59e4df8152d015bec9ab8e4d5672cc0ab42bef806b568e3971` |
| `roboto-latin-700.woff2` | Roboto | Roboto-Bold | Static | 700 | Version 3.015; 2026 | Google Fonts (`roboto-classic`) | `b9d66d1708156f765ada51939bc24ed259dafa69eb631b36e443680fe9e15879` |
| `roboto-700-latin.woff` *(legacy)* | Roboto | Roboto-Bold | Static | 700 | Version 3.015; 2026 | Google Fonts (`roboto-classic`) | `5f1abbfb0e2d60bd83f1c520aac0108980e1c4ca43d984ffa0a3fb649febd508` |

---

## 2. Variable Font Axes

| Family | Asset File | Axis Tag | Name | Min | Default | Max | Present in Asset |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DM Sans** | `dm-sans-latin-variable.woff2` | `wght` | Weight | 100.0 | 400.0 | 1000.0 | Yes (9 named instances: Thin to ExtraBold) |
| **Geist** | `geist-latin-variable.woff2` | `wght` | Weight | 100.0 | 400.0 | 900.0 | Yes (9 named instances: Thin to ExtraBold) |
| **Instrument Sans** | `instrument-sans-latin-variable.woff2` | `wght` | Weight | 400.0 | 400.0 | 700.0 | Yes (4 named instances: Regular to Bold) |

*Note: Upstream full font releases for DM Sans include an `opsz` axis (9–40) and Instrument Sans include a `wdth` axis (75–100); the committed production WOFF2 files are curated latin-subset assets optimized for web performance containing the primary `wght` axis.*

---

## 3. Authoritative Copyright and Attribution Notices

### DM Sans
- **Copyright**: Copyright 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts), with Reserved Font Name "DM Sans".
- **Designers**: Colophon Foundry
- **Licence URL**: https://scripts.sil.org/OFL
- **Licence**: SIL Open Font License, Version 1.1

### DM Serif Display
- **Copyright**: Copyright 2014–2017 Adobe Systems Incorporated (http://www.adobe.com/), with Reserved Font Name 'Source'. Copyright 2019 Google LLC, with Reserved Font Name "DM Serif Display".
- **Designers**: Colophon Foundry
- **Licence URL**: http://scripts.sil.org/OFL
- **Licence**: SIL Open Font License, Version 1.1

### Geist
- **Copyright**: Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font)
- **Designers**: Andrés Briganti, Mateo Zaragoza, Guillermo Rauch, Evil Rabbit, José Rago, Facundo Santana
- **Licence URL**: https://openfontlicense.org
- **Licence**: SIL Open Font License, Version 1.1 (the font software itself is licensed under SIL OFL 1.1 as recorded in OpenType `name` table record ID 14; software tooling in the Vercel repository is released under MIT).

### Instrument Sans
- **Copyright**: Copyright 2022 The Instrument Sans Project Authors (https://github.com/Instrument/instrument-sans), with Reserved Font Name "Instrument Sans".
- **Designers**: Rodrigo Fuenzalida, Jordan Egstad
- **Licence URL**: https://scripts.sil.org/OFL
- **Licence**: SIL Open Font License, Version 1.1

### Roboto
- **Copyright**: Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic)
- **Designers**: Christian Robertson, ParaType, Font Bureau
- **Licence URL**: https://openfontlicense.org
- **Licence**: SIL Open Font License, Version 1.1 (as declared in the OpenType `name` table of Roboto v3.015; historical releases under Android were licensed under Apache 2.0).

---

## 4. Licence Texts

### SIL OPEN FONT LICENSE Version 1.1 — 26 February 2007

The following licence applies to: **DM Sans**, **DM Serif Display**, **Geist**, **Instrument Sans**, and **Roboto**.

```
-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply to any
document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Copyright Holder" refers to the individual(s) or entity(ies) that
own the copyright in the Font Software.

"Modified Version" refers to any derivative of the Font Software made
by adding, removing, or replacing components -- in part or in whole --
of the original components, or by changing formats or porting the Font
Software to a new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Reserved Font Name may be used by any Modified Version. The
Reserved Font Name(s) for this font is/are specified in the copyright
statement(s) above.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or unless their explicit written
permission is granted.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created using
the Font Software or its derivatives.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTY OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE FONT SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE FONT SOFTWARE.
```

### Supplementary Information: Historical and Ancillary Licences

#### Vercel Geist Repository Code Licence (MIT)
The JavaScript/TypeScript wrapper and repository distribution scripts of Geist are released by Vercel, Inc. under the MIT License:

```
Copyright (c) 2024 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### Historical Android Roboto Licence (Apache License 2.0)
Early releases of Roboto for the Android operating system were released under the Apache License, Version 2.0:

```
Copyright 2010-2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 5. Verification Checklist

- [x] All 5 committed font binaries are in WOFF2 format (`wOF2` magic header).
- [x] Internal OpenType metadata (family names, PostScript names, versions, weights, variable axes) independently verified via `fonttools`.
- [x] All font assets contain only the required `latin` character subset.
- [x] All font assets are verified open-source with permissive, royalty-free redistribution rights.
- [x] Zero network requests during production compilation (`next build`).
- [x] SHA-256 cryptographic hashes verified and recorded above.
