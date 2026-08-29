# Australian Curriculum Jurisdiction & Version Matrix (FΓÇô10)

**Document ID:** `DOC-CURR-001`  
**Research Date / Access Date:** 28 August 2026  
**Author:** Antigravity (Curriculum Research & Planning Pack)  
**Target Repository Branch:** `gemini/curriculum-catalogue-planning`  
**Scope:** Foundation/Transition to Year 10 (F/TΓÇô10) across all Australian States, Territories, and National Frameworks.  
*Senior secondary certification frameworks (Years 11ΓÇô12) are strictly separated from FΓÇô10 catalogue models and documented in Section 5.*

---

## 1. Executive Summary & Cross-Jurisdiction Structural Differences

Australia operates under a federated education architecture. While the **Australian Curriculum, Assessment and Reporting Authority (ACARA)** sets the national curriculum framework (**Australian Curriculum Version 9.0**), constitutional and statutory authority for school education resides with the state and territory governments.

### Critical Structural Distinctions
MindMosaic's database and user experience must **never treat Year levels, Developmental Levels, and NSW Stages as interchangeable**:
- **ACARA Australian Curriculum:** Organised by **Years of Schooling** (Foundation, Year 1 to Year 10).
- **Victorian Curriculum (VCAA):** Organised along a developmental continuum of **Levels** (Foundation, Level 1 to Level 10, plus Level 10A). In Victorian pedagogical reporting, a Level represents a student's developmental milestone along a continuum, rather than a fixed chronological age or school year gate.
- **NSW Curriculum (NESA):** Organised by **Stages** spanning two years of learning (Early Stage 1: Kindergarten; Stage 1: Years 1ΓÇô2; Stage 2: Years 3ΓÇô4; Stage 3: Years 5ΓÇô6; Stage 4: Years 7ΓÇô8; Stage 5: Years 9ΓÇô10). Outcomes and content are expected across the entire two-year stage.
- **Northern Territory:** Primary continuum begins with **Transition (T)** (equivalent to Foundation/Prep/Kindergarten), progressing TΓÇô10.

---

## 2. Master Jurisdiction, Version & Implementation Matrix

Every implementation status and sector claim is backed by direct primary authority links verified on 28 August 2026.

| Jurisdiction | Governing Authority & Link | Framework & Version | Primary Structural Units (FΓÇô10) | Implementation Status (as of Aug 2026) | Sector Qualifications & Evidence | Official Data-Access Mode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AU** (National) | [ACARA](https://www.australiancurriculum.edu.au/) | Australian Curriculum Version 9.0 | Foundation to Year 10 (Year-by-year in English, Maths, Science; 2-year bands in HASS, Arts, Tech, HPE, Languages) | Published 2022. National transition across states/territories occurring 2023ΓÇô2027. Supported via [ACARA V9 Implementation](https://www.australiancurriculum.edu.au/). | National benchmark framework. Provides base descriptors adopted or adapted by state/territory authorities. | **Public Machine-Readable Bulk:** [MRAC Portal](https://www.australiancurriculum.edu.au/f-10-curriculum/machine-readable-australian-curriculum/) (RDF/XML, JSON-LD, SPARQL endpoint, CSV). |
| **VIC** (Victoria) | [VCAA](https://f10.vcaa.vic.edu.au/) | Victorian Curriculum FΓÇô10 Version 2.0 | Foundation to Level 10 (Levels 1ΓÇô10; Level 10A; Foundation Levels AΓÇôD) | **Active Rollout:** Mathematics & English V2.0 prioritised/mandated for teaching from 2024/2025. Other learning areas phased 2025ΓÇô2026. V1.0 sunset scheduled for 31 Dec 2026. Supported via [VCAA V2.0 Overview](https://f10.vcaa.vic.edu.au/). | **Government:** Mandated by [Vic Department of Education](https://www.vic.gov.au/curriculum-programs). <br>**Catholic:** [MACS / VCEA](https://www.macs.vic.edu.au/) adopts V2.0 with religious education framework. <br>**Independent:** [VRQA Minimum Standards](https://www.vrqa.vic.gov.au/) require equivalent curriculum (ISV schools manage own timeline). | **Public Web Pages:** [VCAA FΓÇô10 V2 Website](https://f10.vcaa.vic.edu.au/) (HTML/PDF/Word). *No public SPARQL or REST export API.* |
| **NSW** (New South Wales) | [NESA](https://curriculum.nsw.edu.au/) | NSW Curriculum Reform Syllabuses | Early Stage 1 (K), Stage 1 (Y1ΓÇô2), Stage 2 (Y3ΓÇô4), Stage 3 (Y5ΓÇô6), Stage 4 (Y7ΓÇô8), Stage 5 (Y9ΓÇô10) | **Active Rollout:** English and Mathematics KΓÇô2 implemented 2023; Years 3ΓÇô10 implemented 2024. Other learning areas phased 2024ΓÇô2027. Supported via [NESA Implementation](https://curriculum.nsw.edu.au/). | **Public:** Mandated by [NSW Department of Education](https://education.nsw.gov.au/). <br>**Catholic & Independent:** [CSNSW](https://www.csnsw.catholic.edu.au/) & [AISNSW](https://www.aisnsw.edu.au/) implement NESA syllabuses under statutory registration. | **Public Web Portal & Tables:** [NSW Curriculum Website](https://curriculum.nsw.edu.au/) (HTML/CSV/PDF). *No public unauthenticated API endpoints documented.* |
| **QLD** (Queensland) | [QCAA](https://www.qcaa.qld.edu.au/p-10/aciq) | Australian Curriculum in Queensland (ACiQ) (AC V9.0) | Prep to Year 10 | **Active Phased Implementation:** Staged transition across learning areas (English & Maths active; full implementation by 2026/2027). Supported via [QCAA ACiQ](https://www.qcaa.qld.edu.au/p-10/aciq). | **State Schools:** Guided by [Education Queensland PΓÇô10 Policy](https://education.qld.gov.au/curriculum/stages-of-schooling/p-10). <br>**Catholic & Independent:** [QCEC](https://www.qcec.catholic.edu.au/) and [ISQ](https://www.isq.qld.edu.au/) manage sector-specific planning (unverified timing per school). | **Public Web Pages + Authenticated Tool:** ACARA MRAC base + [QCAA PΓÇô10 Planning App](https://www.qcaa.qld.edu.au/p-10/aciq) (planning tool restricted to registered QLD educators). |
| **WA** (Western Australia) | [SCSA](https://k10outline.scsa.wa.edu.au/) | Western Australian Curriculum and Assessment Outline (WACAO) (adapted from AC V9.0) | Pre-primary to Year 10 | **Active Phased Implementation:** English & HPE implemented 2025; HASS, Maths, Science, Technologies implemented 2026; Arts & Languages familiarisation 2026 $\rightarrow$ implementation 2027. Supported via [SCSA KΓÇô10 Circular](https://k10outline.scsa.wa.edu.au/). | **Public Schools:** Mandated by [WA Department of Education](https://www.education.wa.edu.au/). <br>**Catholic & Independent:** [CEWA](https://www.cewa.edu.au/) and [AISWA](https://www.ais.wa.edu.au/) follow SCSA registration standards. | **Public Web Portal:** [SCSA KΓÇô10 Outline](https://k10outline.scsa.wa.edu.au/) (HTML/PDF/DOCX syllabus tables). *No public API.* |
| **SA** (South Australia) | [SA Department for Education](https://www.education.sa.gov.au/) | South Australian Curriculum (adapted from AC V9.0) | Reception to Year 10 | **Active Transition:** Public schools transitioning to updated SA curriculum informed by AC V9.0; full implementation target 2027. Supported via [SA Dept for Education](https://www.education.sa.gov.au/). | **Public Schools:** Researched state curriculum directly governs state public schools. <br>**Catholic & Independent:** [CESA](https://www.cesa.catholic.edu.au/) and [AISSA](https://www.aissa.net.au/) adopt AC V9.0 directly under registration requirements (*sector timelines unverified*). | **Public Web Pages:** [SA Curriculum Resources](https://www.education.sa.gov.au/) + national ACARA MRAC. |
| **TAS** (Tasmania) | [DECYP](https://www.decyp.tas.gov.au/) | Australian Curriculum Version 9.0 | Prep to Year 10 | **Active Implementation:** Tasmanian government schools adopt AC V9.0 directly, supported by the DECYP Teaching and Learning Centre. Supported via [DECYP Curriculum](https://www.decyp.tas.gov.au/). | **Government:** Mandated by DECYP. <br>**Catholic & Independent:** [Catholic Education Tasmania](https://catholic.tas.edu.au/) and [Independent Schools Tasmania](https://www.independentschools.tas.edu.au/) implement AC V9.0. | **Public Machine-Readable Bulk:** Direct adoption of ACARA MRAC. |
| **ACT** (Australian Capital Territory) | [ACT Education Directorate](https://www.education.act.gov.au/) | Australian Curriculum Version 9.0 | Kindergarten to Year 10 | **Active Implementation:** Implemented across ACT Public Schools in line with ACT system policies. Supported via [ACT Education](https://www.education.act.gov.au/). | **Public Schools:** Governed by ACT Education Directorate. <br>**Catholic & Independent:** [CECG](https://cg.catholic.edu.au/) and [AISACT](https://www.ais.act.edu.au/) manage sector transitions (*Catholic/independent sector implementation unverified without sector-specific published timeline*). | **Public Machine-Readable Bulk:** Direct adoption of ACARA MRAC. |
| **NT** (Northern Territory) | [NT Department of Education](https://nt.gov.au/learning/curriculum/) | Northern Territory Curriculum Framework (AC V9.0) | Transition to Year 10 (TΓÇô10) | **Active Phased Implementation:** English, Maths, HPE implemented 2025; Technologies, HASS, Languages, Arts in 2026. Supported via [NT Government Curriculum](https://nt.gov.au/learning/curriculum/). | **Government:** Mandated by NT Department of Education / NT Board of Studies. <br>**Catholic & Independent:** [Catholic Education NT](https://www.ceont.catholic.edu.au/) and [AISNT](https://www.aisnt.asn.au/) operate under NTBOS registration. | **Public Machine-Readable Bulk:** Direct adoption of ACARA MRAC + NT contextual documents. |

---

## 3. Deep-Dive: Victorian Curriculum FΓÇô10 Version 2.0 (Victoria)

### 3.1 Structure: 8 Learning Areas and 4 Capabilities
The Victorian Curriculum FΓÇô10 V2.0 defines 8 Learning Areas and 4 Capabilities:

#### Learning Areas (8):
1. **English:** 3 Strands (*Language*, *Literature*, *Literacy*), Levels Foundation to Level 10.
2. **Mathematics:** 6 Strands (*Number*, *Algebra*, *Measurement*, *Space*, *Statistics*, *Probability* - Probability commences at Level 3), Levels Foundation to Level 10, plus Level 10A.
3. **Science:** Science Understanding, Science Inquiry Skills (2-year bands: FoundationΓÇôLevel 2, Levels 3ΓÇô4, Levels 5ΓÇô6, Levels 7ΓÇô8, Levels 9ΓÇô10).
4. **The Humanities:** History, Geography, Civics and Citizenship, Economics and Business (band levels).
5. **The Arts:** Dance, Drama, Media Arts, Music, Visual Arts, Visual Communication Design (band levels).
6. **Technologies:** Design and Technologies, Digital Technologies (band levels).
7. **Health and Physical Education:** Personal, Social and Community Health; Movement and Physical Activity (band levels).
8. **Languages:** Various language pathways (band levels).

#### Capabilities (4):
1. **Critical and Creative Thinking**
2. **Ethical Capability**
3. **Intercultural Capability**
4. **Personal and Social Capability**

### 3.2 Relationship Between Years and Levels in Victoria
- **Level 3 (Year 3 Cohort):** Level 3 Mathematics and English descriptors describe the developmental progression typically taught and assessed during Year 3. For Science and Humanities, Year 3 students are assessed against the **Levels 3ΓÇô4 band**.
  - *Correction Note:* In Victorian Mathematics V2.0 Level 3, whole number place value and numeral naming explicitly extend **beyond 10,000** (descriptor `VC2M3N02`), not merely up to 10,000.
- **Level 5 (Year 5 Cohort):** Level 5 Mathematics and English descriptors describe the developmental progression typically taught and assessed during Year 5. For Science and Humanities, Year 5 students are assessed against the **Levels 5ΓÇô6 band**.

---

## 4. Unsupported Data-Access Clarifications (Production Honesty)

To ensure technical and architectural honesty:
1. **ACARA MRAC:** Offers genuine public machine-readable datasets (RDF/XML, JSON-LD, SPARQL endpoint).
2. **VCAA:** Does **not** provide a documented public REST API or SPARQL endpoint. Content must be referenced via public web URLs (`https://f10.vcaa.vic.edu.au/`) or static official downloads.
3. **NESA:** Does **not** offer an unauthenticated public developer JSON export API. Syndrome/digital syllabus pages are accessed via public HTML and CSV tables (`https://curriculum.nsw.edu.au/`).
4. **QCAA:** The PΓÇô10 Planning App is an **authenticated web application** restricted to accredited Queensland teachers, not a public data feed.

---

## 5. Senior Secondary Separation Boundary

Senior Secondary curricula (Years 11ΓÇô12) are strictly excluded from the MindMosaic FΓÇô10 catalogue:

| Jurisdiction | Senior Secondary Framework (Strictly Excluded) | Certifying Authority |
| :--- | :--- | :--- |
| **VIC** | Victorian Certificate of Education (VCE), VCE Vocational Major (VM), Victorian Pathways Certificate (VPC) | VCAA |
| **NSW** | Higher School Certificate (HSC) | NESA |
| **QLD** | Queensland Certificate of Education (QCE) | QCAA |
| **WA** | Western Australian Certificate of Education (WACE) | SCSA |
| **SA** | South Australian Certificate of Education (SACE) | SACE Board of South Australia |
| **TAS** | Tasmanian Certificate of Education (TCE) | TASC |
| **ACT** | ACT Senior Secondary Certificate | ACT BSSS |
| **NT** | Northern Territory Certificate of Education and Training (NTCET) | NTBOS / SACE Board |
