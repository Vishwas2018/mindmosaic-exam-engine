# Victorian Curriculum F–10 v2.0 Corrected Projected Node Coverage

> **Phase**: Phase 2 Applied Crosswalk  
> **Target Release**: `vic-f10-v2` (Victorian Curriculum F–10 Version 2.0)  
> **Scope**: Level 3 & Level 5 Mathematics and English (104 Content Descriptors)  
> **Deduplication Mode**: Distinct Questions Counted (Template-generated variants deduplicated)  
> **Total Deduplicated Question Universe**: 1,485 distinct items

---

## Executive Summary & Totals

This document reflects the **corrected, deduplicated node coverage** across all **104 Victorian Curriculum Version 2.0** content descriptors after applying Corrections 1, 2, and 3:

1. **Correction 1**: Eliminated catch-all routing on `VC2M5N09` and `VC2M3N04`. Only genuine multi-step contextual modelling items map to N09/N08. Pure single-operation computation with no Level 5 descriptor is honestly marked `no_match`.
2. **Correction 2**: Grammar knowledge items (verb identification, prepositions, articles, question words, negatives, clauses) are routed to the Language strand (`VC2E3LA06/07/08` and Level 5 equivalents), leaving `VC2E3LY12` and `VC2E5LY11` strictly for genuine editing/proofreading.
3. **Correction 3**: Question counts are deduplicated by content hash so template-generated variants count once.

### 1. Bank Question In-Scope vs Out-of-Scope (Deduplicated Distinct Counts)

| Category | Distinct Qs | Raw Bank Qs | Distinct Tuples | Scope Definition & Review Decision |
| :--- | :---: | :---: | :---: | :--- |
| **In-Scope Mapped (Maths & English)** | **1,091** | 1,940 | **700** | NAPLAN Numeracy, NAPLAN Reading, NAPLAN Language Conventions, ICAS Mathematics, ICAS English, Writing |
| **In-Scope Unmapped (`no_match`)** | **19** | 81 | **16** | Pure single-operation whole number arithmetic without L5 descriptor, parts of a circle |
| **Out-of-Scope Excluded** | **375** | 375 | **333** | ICAS Science (99 Qs), ICAS Digital Tech (133 Qs), Standalone ICAS Spelling (143 Qs) |
| **Total Active Universe** | **1,485** | **2,396** | **1,049** | Complete deduplicated production and family question universe |

---

### 2. Corrected Node Badge Status Summary (104 Nodes)

| Badge State | Criterion | Total Nodes | Percentage | Math L3 (24) | Math L5 (24) | English L3 (30) | English L5 (26) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 🟢 **Covered** | $\ge 5$ distinct questions | **48** | **46.15%** | 19 | 9 | 13 | 7 |
| 🟡 **Partial** | $1 - 4$ distinct questions | **15** | **14.42%** | 2 | 7 | 3 | 3 |
| ⚪ **Empty** | $0$ questions (Content Gap) | **41** | **39.42%** | 7 | 4 | 17 | 13 |
| **Total** | | **104** | **100.0%** | **24** | **24** | **30** | **26** |

---

## Breakdown by Learning Area & Level

### Performance Summary

```
Mathematics Level 3 (24 nodes):  [█████████████████   ] 19 Covered (79.2%) | 2 Partial (8.3%) |  7 Empty (29.2%)
Mathematics Level 5 (24 nodes):  [███████████         ] 9 Covered (37.5%) | 7 Partial (29.2%) |  4 Empty (16.7%)
English Level 3     (30 nodes):  [█████████████       ] 13 Covered (43.3%) | 3 Partial (10.0%) | 17 Empty (56.7%)
English Level 5     (26 nodes):  [███████             ]  7 Covered (26.9%) | 3 Partial (11.5%) | 13 Empty (50.0%)
```

---

## 1. Mathematics Level 3 Corrected Coverage (24 Nodes)

- **Total Descriptors**: 24
- **Covered (≥5 Distinct Qs)**: 19 (79.2%)
- **Partial (1-4 Distinct Qs)**: 2 (8.3%)
- **Empty (0 Qs)**: 7 (29.2%)

| Code | Strand | Curriculum Descriptor Label | Distinct Qs | Resulting Badge State | Alignment Sample Reference |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `VC2M3N01` | Number | Properties and behaviour of odd and even numbers | **6** | 🟢 **Ready to practise (6)** | `mindmosaic.numeracy.odd-and-even-numbers.iden`<br/>`mindmosaic.numeracy.number.num-number-odd-eve`<br/>`mindmosaic.numeracy.number.num-number-odd-eve` |
| `VC2M3N02` | Number | Reading, writing and ordering five-digit whole numbers | **29** | 🟢 **Ready to practise (29)** | `mindmosaic.numeracy.skip-counting.reading-a-n`<br/>`mindmosaic.numeracy.place-value-to-999.identi`<br/>`mindmosaic.numeracy.number-patterns.continue-` |
| `VC2M3N03` | Number | Unit fractions, multiples and completing the whole | **23** | 🟢 **Ready to practise (23)** | `mindmosaic.numeracy.reading-a-pie-chart.relat`<br/>`mindmosaic.numeracy.fractions.naming-fraction`<br/>`mindmosaic.numeracy.fractions.describing-a-fr` |
| `VC2M3N04` | Number | Addition and subtraction with two- and three-digit numbers using place-value partitioning | **18** | 🟢 **Ready to practise (18)** | `mindmosaic.numeracy.addition-with-regrouping.`<br/>`mindmosaic.numeracy.subtraction-with-regroupi`<br/>`mindmosaic.numeracy.subtraction-with-regroupi` |
| `VC2M3N05` | Number | Multiplication and division representations with arrays and number sentences | **15** | 🟢 **Ready to practise (15)** | `mindmosaic.numeracy.multiplication.find-a-tot`<br/>`mindmosaic.numeracy.division-facts.divide-wit`<br/>`mindmosaic.numeracy.capacity.compare-capacity` |
| `VC2M3N06` | Number | Estimation strategies and checking calculation reasonableness | **5** | 🟢 **Ready to practise (5)** | `mindmosaic.numeracy.rounding.round-a-2-digit-`<br/>`mindmosaic.numeracy.rounding.reason-backwards`<br/>`mindmosaic.numeracy.rounding-and-estimation.r` |
| `VC2M3N07` | Number | Dollar and cent relationships and monetary representations | **32** | 🟢 **Ready to practise (32)** | `mindmosaic.numeracy.money.adding-money-amount`<br/>`mindmosaic.numeracy.perimeter.calculating-the`<br/>`mindmosaic.numeracy.money.add-two-amounts-of-` |
| `VC2M3N08` | Number | Mathematical modelling in practical additive and financial contexts | **8** | 🟢 **Ready to practise (8)** | `mindmosaic.numeracy.multiplication-facts-and-`<br/>`mindmosaic.numeracy.two-step-problems.solve-a`<br/>`mindmosaic.numeracy.division-facts-in-context` |
| `VC2M3N09` | Number | Algorithms and decision sequences for investigating number patterns | **20** | 🟢 **Ready to practise (20)** | `mindmosaic.numeracy.number-patterns.continue-`<br/>`mindmosaic.numeracy.number-patterns.continue-`<br/>`mindmosaic.numeracy.elapsed-time.finding-elap` |
| `VC2M3A01` | Algebra | Inverse relationships between addition and subtraction | **1** | 🟡 **In development (1)** | `mindmosaic.numeracy.comparing-numbers.compari` |
| `VC2M3A02` | Algebra | Mental addition and subtraction strategies using number facts to 20 | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M3A03` | Algebra | Multiplication and related division facts for 3, 4, 5 and 10 | **5** | 🟢 **Ready to practise (5)** | `mindmosaic.numeracy.division-facts.use-a-know`<br/>`mindmosaic.numeracy.division.share-a-quantity`<br/>`mindmosaic.numeracy.multiplication-facts.mult` |
| `VC2M3M01` | Measurement | Metric measurement unit selection and benchmark estimation | **21** | 🟢 **Ready to practise (21)** | `mindmosaic.numeracy.properties-of-shapes.iden`<br/>`mindmosaic.numeracy.mass.compare-masses-in-a-`<br/>`mindmosaic.numeracy.capacity.read-a-bar-graph` |
| `VC2M3M02` | Measurement | Measuring length, mass and capacity with scaled instruments | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M3M03` | Measurement | Formal time units and comparing event durations | **15** | 🟢 **Ready to practise (15)** | `mindmosaic.numeracy.time-intervals.work-out-a`<br/>`mindmosaic.numeracy.reading-a-table.read-a-ta`<br/>`mindmosaic.numeracy.reading-a-line-graph.find` |
| `VC2M3M04` | Measurement | Analog and digital clock reading to the minute | **5** | 🟢 **Ready to practise (5)** | `mindmosaic.numeracy.reading-and-reasoning-abo`<br/>`mindmosaic.numeracy.elapsed-time.finding-a-fi`<br/>`mindmosaic.numeracy.time.time-intervals-and-e` |
| `VC2M3M05` | Measurement | Angles as measures of turn and right-angle benchmarks | **6** | 🟢 **Ready to practise (6)** | `mindmosaic.numeracy.3d-objects.name-a-3d-obje`<br/>`mindmosaic.numeracy.two-dimensional-shapes.na`<br/>`mindmosaic.numeracy.2d-shapes.name-a-2d-shape` |
| `VC2M3SP01` | Space | Classifying and comparing three-dimensional objects by geometric features | **3** | 🟡 **In development (3)** | `mindmosaic.numeracy.data-interpretation.compa`<br/>`mindmosaic.numeracy.properties-of-3d-objects.`<br/>`mindmosaic.numeracy.nets-and-solids.predict-t` |
| `VC2M3SP02` | Space | Two-dimensional mapping and relative spatial positioning | **8** | 🟢 **Ready to practise (8)** | `mindmosaic.numeracy.coordinates.locating-poin`<br/>`mindmosaic.numeracy.2d-shapes.naming-2d-shape`<br/>`mindmosaic.numeracy.symmetry.count-lines-of-s` |
| `VC2M3ST01` | Statistics | Categorical and discrete data collection and frequency tables | **9** | 🟢 **Ready to practise (9)** | `mindmosaic.numeracy.interpreting-data-tables.`<br/>`mindmosaic.numeracy.interpreting-tables.compa`<br/>`mindmosaic.numeracy.reading-a-table.read-a-si` |
| `VC2M3ST02` | Statistics | Graphical representations and comparative data analysis | **15** | 🟢 **Ready to practise (15)** | `mindmosaic.numeracy.reading-a-bar-chart.inter`<br/>`mindmosaic.numeracy.comparing-data.comparing-`<br/>`mindmosaic.numeracy.reading-a-line-graph.orde` |
| `VC2M3ST03` | Statistics | Guided statistical investigations and interpreting data sets | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M3P01` | Probability | Qualitative chance language and outcome likelihood | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M3P02` | Probability | Repeated chance trials and observed outcome variation | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M5N03` | Number | Comparing and ordering fractions and mixed numerals with related denominators | **21** | 🟢 **Ready to practise (21)** | `mindmosaic.numeracy.fractions-in-a-pie-chart.`<br/>`mindmosaic.numeracy.fractions.recognising-one`<br/>`mindmosaic.numeracy.fractions.find-a-fraction` |
| `VC2M5M03` | Measurement | 12-hour and 24-hour time system conversions and scheduling | **7** | 🟢 **Ready to practise (7)** | `mindmosaic.numeracy.reading-a-line-graph.matc`<br/>`mindmosaic.numeracy.time.add-a-duration.g5-ic`<br/>`mindmosaic.numeracy.statistics.reading-and-in` |
| `VC2M5SP03` | Space | Transformational geometry: translations, reflections, rotations and symmetry | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M5ST03` | Statistics | Statistical investigation planning, data collection and analysis | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |

---

## 2. Mathematics Level 5 Corrected Coverage (24 Nodes)

- **Total Descriptors**: 24
- **Covered (≥5 Distinct Qs)**: 9 (37.5%)
- **Partial (1-4 Distinct Qs)**: 7 (29.2%)
- **Empty (0 Qs)**: 4 (16.7%)

| Code | Strand | Curriculum Descriptor Label | Distinct Qs | Resulting Badge State | Alignment Sample Reference |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `VC2M5N01` | Number | Decimal place value, comparison and number-line positioning | **24** | 🟢 **Ready to practise (24)** | `mindmosaic.numeracy.comparing-decimals.orderi`<br/>`mindmosaic.numeracy.decimals.reading-decimals`<br/>`mindmosaic.numeracy.place-value.add-a-power-o` |
| `VC2M5N02` | Number | Factors, multiples and divisibility rules for natural numbers | **12** | 🟢 **Ready to practise (12)** | `mindmosaic.numeracy.parity.classify-whole-num`<br/>`mindmosaic.numeracy.generalisation.identify-i`<br/>`mindmosaic.numeracy.properties.match-number-p` |
| `VC2M5N04` | Number | Percentage representations and fraction-decimal conversions | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M5N05` | Number | Addition and subtraction of fractions with related denominators | **1** | 🟡 **In development (1)** | `mindmosaic.numeracy.fractions.infer-a-whole.g` |
| `VC2M5N06` | Number | Multi-digit multiplication strategies and reasonableness checks | **2** | 🟡 **In development (2)** | `mindmosaic.numeracy.multiplication.multiply-t`<br/>`mindmosaic.numeracy.multiplication.multiplica` |
| `VC2M5N07` | Number | Division strategies and contextual remainder interpretation | **5** | 🟢 **Ready to practise (5)** | `mindmosaic.numeracy.division.divide-equally.g`<br/>`mindmosaic.numeracy.inverse-operations.work-b`<br/>`mindmosaic.numeracy.division.reason-with-a-re` |
| `VC2M5N08` | Number | Estimation strategies and result validation in financial contexts | **22** | 🟢 **Ready to practise (22)** | `mindmosaic.numeracy.money-problems.solving-mu`<br/>`mindmosaic.numeracy.area-of-a-triangle.calcul`<br/>`mindmosaic.numeracy.money.find-a-unit-cost.g5` |
| `VC2M5N09` | Number | Mathematical modelling in practical additive and multiplicative problem solving | **1** | 🟡 **In development (1)** | `mindmosaic.numeracy.multi-step-operations.com` |
| `VC2M5N10` | Number | Computational algorithms with branching, iteration and pattern exploration | **5** | 🟢 **Ready to practise (5)** | `mindmosaic.numeracy.number-patterns.extending`<br/>`mindmosaic.numeracy.patterns.continue-a-seque`<br/>`mindmosaic.numeracy.rules.infer-a-function-ru` |
| `VC2M5A01` | Algebra | Multiplication and division inverse families and fact structures | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M5A02` | Algebra | Solving unknown values in equations using operational properties | **3** | 🟡 **In development (3)** | `mindmosaic.numeracy.operations.evaluate-expre`<br/>`mindmosaic.numeracy.operations.evaluate-expre`<br/>`mindmosaic.numeracy.operations.order-calculat` |
| `VC2M5M01` | Measurement | Metric unit selection and precision in length, mass and capacity | **2** | 🟡 **In development (2)** | `mindmosaic.numeracy.metric-units.compare-conv`<br/>`mindmosaic.numeracy.volume.order-a-method.g5-` |
| `VC2M5M02` | Measurement | Perimeter and area calculation for regular and irregular shapes | **12** | 🟢 **Ready to practise (12)** | `mindmosaic.numeracy.perimeter-and-area.calcul`<br/>`mindmosaic.numeracy.perimeter.calculate-perim`<br/>`mindmosaic.numeracy.area.infer-a-square-side.` |
| `VC2M5M04` | Measurement | Angle measurement and construction in degrees using a protractor | **5** | 🟢 **Ready to practise (5)** | `mindmosaic.numeracy.types-of-triangles.identi`<br/>`mindmosaic.numeracy.types-of-angles.classifyi`<br/>`mindmosaic.numeracy.types-of-angles.identifyi` |
| `VC2M5SP01` | Space | Three-dimensional objects and net construction | **1** | 🟡 **In development (1)** | `mindmosaic.numeracy.3d-objects.naming-parts-o` |
| `VC2M5SP02` | Space | Grid coordinate systems and directional navigation | **9** | 🟢 **Ready to practise (9)** | `mindmosaic.numeracy.coordinates.reading-coord`<br/>`mindmosaic.numeracy.distance-on-a-grid.findin`<br/>`mindmosaic.numeracy.coordinates.filtering-poi` |
| `VC2M5ST01` | Statistics | Categorical and discrete data distributions and mode identification | **39** | 🟢 **Ready to practise (39)** | `mindmosaic.numeracy.comparing-data-with-a-ben`<br/>`mindmosaic.numeracy.totalling-data.adding-val`<br/>`mindmosaic.numeracy.interpreting-tables.compa` |
| `VC2M5ST02` | Statistics | Line graphs representing continuous change over time | **4** | 🟡 **In development (4)** | `mindmosaic.numeracy.statistics.ordering-value`<br/>`mindmosaic.numeracy.statistics.ordering-value`<br/>`mindmosaic.numeracy.statistics.ordering-value` |
| `VC2M5P01` | Probability | Equally likely and unequal chance experiment outcomes | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2M5P02` | Probability | Repeated chance trials and frequency-based likelihood estimation | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |

---

## 3. English Level 3 Corrected Coverage (30 Nodes)

- **Total Descriptors**: 30
- **Covered (≥5 Distinct Qs)**: 13 (43.3%)
- **Partial (1-4 Distinct Qs)**: 3 (10.0%)
- **Empty (0 Qs)**: 17 (56.7%)

| Code | Strand | Curriculum Descriptor Label | Distinct Qs | Resulting Badge State | Alignment Sample Reference |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `VC2E3LA01` | Language | Social conventions and shared understanding in collaborative interactions | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LA02` | Language | Evaluative language, emotional expression and tone variation | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LA03` | Language | Structural features and organization across diverse text types | **15** | 🟢 **Ready to practise (15)** | `mindmosaic.reading.following-a-procedure.iden`<br/>`mindmosaic.reading.factual-recount.locate-dir`<br/>`mindmosaic.reading.factual-recount.sequence-e` |
| `VC2E3LA04` | Language | Paragraphing for idea grouping and textual cohesion | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LA05` | Language | Visual layout and navigational features in print and digital media | **1** | 🟡 **In development (1)** | `mindmosaic.reading.insect-migration.using-hea` |
| `VC2E3LA06` | Language | Clause structures and grammatical relationships in sentences | **55** | 🟢 **Ready to practise (55)** | `mindmosaic.language-conventions.correcting-mi`<br/>`mindmosaic.language-conventions.subject-verb-`<br/>`mindmosaic.language-conventions.capital-lette` |
| `VC2E3LA07` | Language | Verb processes for actions, feelings, thoughts and states | **2** | 🟡 **In development (2)** | `mindmosaic.language-conventions.word-classes.`<br/>`mindmosaic.language-conventions.parts-of-spee` |
| `VC2E3LA08` | Language | Tense consistency and temporal anchoring of verbs | **13** | 🟢 **Ready to practise (13)** | `mindmosaic.language-conventions.verb-tense.ch`<br/>`mindmosaic.language-conventions.verb-tense.ma`<br/>`mindmosaic.language-conventions.verb-tense.ir` |
| `VC2E3LA09` | Language | Modal verbs for expressing obligation and probability | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LA10` | Language | Visual and auditory elements enhancing textual meaning | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LA11` | Language | Topic-specific vocabulary expansion and word relationships | **40** | 🟢 **Ready to practise (40)** | `mindmosaic.reading.word-meaning-from-context.`<br/>`mindmosaic.reading.word-meaning-from-context.`<br/>`mindmosaic.reading.word-meaning.understand-vo` |
| `VC2E3LA12` | Language | Apostrophes of contraction and possessive apostrophes in singular nouns | **17** | 🟢 **Ready to practise (17)** | `mindmosaic.language-conventions.contractions.`<br/>`mindmosaic.language-conventions.apostrophes-i`<br/>`mindmosaic.language-conventions.apostrophes-f` |
| `VC2E3LE01` | Literature | Characters, settings and cultural contexts in literary texts | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LE02` | Literature | Personal responses and text-to-self connections in literature | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LE03` | Literature | Authorial craft: plot development, character portrayal and mood | **25** | 🟢 **Ready to practise (25)** | `mindmosaic.reading.inferring-character-motiva`<br/>`mindmosaic.reading.descriptive-writing.explai`<br/>`mindmosaic.reading.inferring-feelings-from-be` |
| `VC2E3LE04` | Literature | Poetic and literary devices including rhythm and onomatopoeia | **9** | 🟢 **Ready to practise (9)** | `mindmosaic.reading.recalling-a-detail.finding`<br/>`mindmosaic.reading.poetry.understand-figurati`<br/>`mindmosaic.reading.a-poem-about-the-seaside.w` |
| `VC2E3LE05` | Literature | Imaginative text creation adapting literary styles and characters | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LY01` | Literacy | Oral interaction skills and contributing to group discussions | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LY02` | Literacy | Spoken text delivery using vocal clarity, pace and projection | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LY03` | Literacy | Phonic decoding, syllable segmentation and multisyllabic reading | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LY04` | Literacy | Morphological awareness: base words, prefixes, suffixes and spelling rules | **23** | 🟢 **Ready to practise (23)** | `mindmosaic.language-conventions.plurals.spell`<br/>`mindmosaic.language-conventions.prefixes.buil`<br/>`mindmosaic.language-conventions.suffixes.doub` |
| `VC2E3LY05` | Literacy | Spelling complex and less common grapheme patterns | **9** | 🟢 **Ready to practise (9)** | `mindmosaic.language-conventions.spelling-in-c`<br/>`mindmosaic.language-conventions.common-tricky`<br/>`mindmosaic.language-conventions.silent-letter` |
| `VC2E3LY06` | Literacy | High-frequency word recognition, homophones and spelling | **12** | 🟢 **Ready to practise (12)** | `mindmosaic.language-conventions.homophones.ch`<br/>`mindmosaic.language-conventions.homophones.ch`<br/>`mindmosaic.language-conventions.homophones.ch` |
| `VC2E3LY07` | Literacy | Fluent reading strategies, semantic monitoring and self-correction | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LY08` | Literacy | Audience awareness and purpose variations across similar texts | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E3LY09` | Literacy | Authorial purpose and audience identification through text features | **14** | 🟢 **Ready to practise (14)** | `mindmosaic.reading.author-s-purpose.identifyi`<br/>`mindmosaic.reading.identifying-the-audience.i`<br/>`mindmosaic.reading.information-text.identify-` |
| `VC2E3LY10` | Literacy | Reading comprehension: prediction, visualising, summarising and inference | **208** | 🟢 **Ready to practise (208)** | `mindmosaic.reading.finding-information-in-a-s`<br/>`mindmosaic.reading.word-meaning-from-context.`<br/>`mindmosaic.reading.reading-a-timetable.findin` |
| `VC2E3LY11` | Literacy | Writing narrative, informative and persuasive texts with structured paragraphs | **2** | 🟡 **In development (2)** | `mindmosaic.writing.writing-a-short-narrative.`<br/>`mindmosaic.writing.writing-instructions.compo` |
| `VC2E3LY12` | Literacy | Editing and proofreading for structure, grammar and punctuation | **28** | 🟢 **Ready to practise (28)** | `mindmosaic.language-conventions.capital-lette`<br/>`mindmosaic.language-conventions.question-mark`<br/>`mindmosaic.language-conventions.commas-in-lis` |
| `VC2E3LY13` | Literacy | Cursive handwriting: clear letter formation, joins and consistency | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LA03` | Language | Genre stages, structural phases and language features in complex texts | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LE03` | Literature | Narrative point of view and its influence on reader interpretation | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LY03` | Literacy | Advanced phonological and morphological analysis of variable pronunciations | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |

---

## 4. English Level 5 Corrected Coverage (26 Nodes)

- **Total Descriptors**: 26
- **Covered (≥5 Distinct Qs)**: 7 (26.9%)
- **Partial (1-4 Distinct Qs)**: 3 (11.5%)
- **Empty (0 Qs)**: 13 (50.0%)

| Code | Strand | Curriculum Descriptor Label | Distinct Qs | Resulting Badge State | Alignment Sample Reference |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `VC2E5LA01` | Language | Social register, contextual language choices and interpersonal roles | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LA02` | Language | Constructing reasoned arguments using evidence and authority | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LA04` | Language | Theme progression, sentence starters and cohesive sequencing | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LA05` | Language | Complex sentence structures with dependent and independent clauses | **22** | 🟢 **Ready to practise (22)** | `mindmosaic.language-conventions.verb-forms-an`<br/>`mindmosaic.language-conventions.adverbs.ident`<br/>`mindmosaic.language-conventions.sentence-type` |
| `VC2E5LA06` | Language | Expanded noun groups for detailed description and precision | **1** | 🟡 **In development (1)** | `mindmosaic.language-conventions.articles.arti` |
| `VC2E5LA07` | Language | Multimodal cohesion: sequence, visual design and sound in digital texts | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LA08` | Language | Specialised terminology and technical vocabulary precision | **28** | 🟢 **Ready to practise (28)** | `mindmosaic.reading.word-meaning-from-context.`<br/>`mindmosaic.language-conventions.synonyms.prod`<br/>`mindmosaic.language-conventions.word-relation` |
| `VC2E5LA09` | Language | Punctuation conventions: commas in prepositional phrases and plural possession | **13** | 🟢 **Ready to practise (13)** | `mindmosaic.language-conventions.possessive-ap`<br/>`mindmosaic.language-conventions.punctuation.p`<br/>`mindmosaic.language-conventions.punctuation.u` |
| `VC2E5LE01` | Literature | Historical and cultural contexts in Australian and world literature | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LE02` | Literature | Critical literary discussion and metalanguage for text analysis | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LE04` | Literature | Figurative imagery: similes, metaphors, personification and sound devices | **4** | 🟡 **In development (4)** | `mindmosaic.reading.comprehension.identifying-`<br/>`mindmosaic.reading.comprehension.identifying-`<br/>`mindmosaic.reading.comprehension.identifying-` |
| `VC2E5LE05` | Literature | Creative text composition experimenting with figurative language and voice | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LY01` | Literacy | Active listening, paraphrasing, questioning and justifying opinions | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LY02` | Literacy | Structured oral presentations and multimodal deliveries | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LY04` | Literacy | Word etymology, Greek and Latin roots and advanced spelling generalizations | **7** | 🟢 **Ready to practise (7)** | `mindmosaic.language-conventions.correcting-mi`<br/>`mindmosaic.language-conventions.homophones.ho`<br/>`mindmosaic.language-conventions.spelling.spel` |
| `VC2E5LY05` | Literacy | Irregular plurals and grammatical shifts caused by suffixation | **5** | 🟢 **Ready to practise (5)** | `mindmosaic.language-conventions.plurals.plura`<br/>`mindmosaic.language-conventions.grammar.formi`<br/>`mindmosaic.language-conventions.grammar.formi` |
| `VC2E5LY06` | Literacy | Fluent comprehension of complex texts using multi-layered cueing systems | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LY07` | Literacy | Historical and societal reflections in text composition | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LY08` | Literacy | Evaluating structural conventions and rhetorical devices against purpose | **11** | 🟢 **Ready to practise (11)** | `mindmosaic.reading.identifying-the-purpose-of`<br/>`mindmosaic.reading.main-idea.identifying-auth`<br/>`mindmosaic.reading.main-idea.identifying-auth` |
| `VC2E5LY09` | Literacy | Evaluative comprehension: synthesis, inference and critical questioning | **143** | 🟢 **Ready to practise (143)** | `mindmosaic.reading.inferring-character-motiva`<br/>`mindmosaic.reading.combining-text-and-table-i`<br/>`mindmosaic.reading.word-meaning-from-context.` |
| `VC2E5LY10` | Literacy | Multi-paragraph text creation with elaborated ideas for targeted audiences | **2** | 🟡 **In development (2)** | `mindmosaic.writing.writing-a-persuasive-text.`<br/>`mindmosaic.writing.writing-an-information-rep` |
| `VC2E5LY11` | Literacy | Collaborative and independent text editing against quality criteria | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
| `VC2E5LY12` | Literacy | Fluent, legible and automatic cursive handwriting | **0** | ⚪ **Coming soon (0)** | *(No supporting items)* |
