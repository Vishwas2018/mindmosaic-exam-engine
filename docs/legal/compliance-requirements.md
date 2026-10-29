# Legal & Compliance Requirements: Monetisation & Child Privacy

**Branch:** `docs/monetisation-readiness`  
**Status:** Requirements Specification & Legal Counsel Questionnaire (NOT Binding Legal Advice)  
**Date:** October 2026  
**Audience:** Repository Owner (Vish), External Legal Counsel, Compliance Reviewers  

---

## 1. Notice & Scope

> [!CAUTION]
> **NOT LEGAL ADVICE:** This document does NOT contain binding legal text, formal terms, or an adopted privacy policy. It provides an engineering and regulatory compliance specification that identifies the technical realities, operational constraints, and statutory requirements that **must be reviewed and formalized by a qualified Australian legal practitioner** before paid billing goes live.

### Current Baseline in Codebase
* `/terms` (`src/app/terms/page.tsx`) renders a draft outline marked with `DraftBanner`: *"not final legal text... pending professional legal review"*.
* `/privacy` (`src/app/privacy/page.tsx`) renders an accurate description of current engineering data collection, with explicit disclosure: *"We have not yet published a formal data-retention or account-deletion policy — this is a known gap, not an oversight"*.
* Both pages last had draft copy updated on **20 July 2026**. Neither is legally binding today.

---

## 2. Australian Children's Online Privacy Code (10 December 2026)

### 2.1 Statutory Context & Source Material
* **Legislation:** *Privacy Act 1988* (Cth), amended by the *Privacy Legislation Amendment (Enforcement and Other Measures) Act 2022* (Cth).
* **Regulatory Body:** Office of the Australian Information Commissioner (OAIC).
* **Statutory Deadline:** Registration of online services and code commencement due by **10 December 2026**.
* **Applicability:** Applies to "online services likely to be accessed by children" (defined as individuals under 18 years of age). MindMosaic directly targets Year 3 (~8-9 years) and Year 5 (~10-11 years) students and is squarely within scope.

### 2.2 Core Statutory Requirements & Technical Status

#### A. Best Interests of the Child (BIOC) Primary Consideration
* **Requirement:** The commercial interests of the platform must be subordinated to the privacy, safety, and development of the child.
* **MindMosaic Status:** Compliant by design. Default privacy posture is maximum privacy: zero profiling, zero third-party behavioural ad-trackers, zero social feeds or inter-student messaging.

#### B. Verifiable Parental Consent (VPC) & Account Provisioning
* **Requirement:** Services targeting children under 16 must obtain verifiable parental consent before collecting personal data or enabling account access.
* **MindMosaic Engineering Architecture:**
  * Students **cannot** self-register. There is no public student sign-up form.
  * Parents must register first using their own adult email and password (or third-party OAuth).
  * The parent provisions the child account via `provisionChild` (`src/features/auth/provision-child.ts`), generating an alias email (`child_xxx@internal.mindmosaic.app`) and a 6-digit PIN.
  * **Gap for Counsel:** The current flow assumes that anyone creating a parent account is an authorized parent/guardian. Counsel must advise whether email verification + credit card payment (when billing launches) satisfies the "reasonable steps" threshold for Verifiable Parental Consent under the AU Code.

#### C. Data Minimisation & Non-Collection of Superfluous Identifiers
* **Requirement:** Collect only what is strictly necessary to provide the educational service.
* **MindMosaic Status:**
  * **Collected:** Student display name (first name/nickname), year level (e.g. 3 or 5), curriculum jurisdiction, question responses, timestamps, and scores.
  * **Excluded:** No date of birth, no real email address, no home address, no school name, no photos, no biometrics, no geolocation data.
  * **Recommendation:** Maintain this strict minimisation; do not add demographic or tracking fields.

#### D. Prohibition of Targeted Profiling & Advertising
* **Requirement:** Absolute prohibition on using child user data for behavioural advertising, automated emotional profiling, or commercial re-targeting.
* **MindMosaic Status:** Fully compliant. No ad networks, analytics SDKs (e.g. Google Analytics / Meta Pixel), or data brokers are integrated.

#### E. Data Retention & Deletion Lifecycle
* **Requirement:** Clear, published retention periods; easy mechanism for parents to request erasure; prompt deletion of personal data once no longer needed.
* **MindMosaic Engineering Status:**
  * MindMosaic **already possesses a comprehensive database-level GDPR erasure subsystem** in `supabase/migrations/20260817090000_erasure_requests.sql` and `20260817100000_erasure_processor.sql`:
    * `request_student_erasure(student_id, ticket_ref)`: Admin-callable function that revokes student access immediately and schedules execution after a 30-day grace period.
    * `cancel_student_erasure(request_id)`: Cancels pending request within the 30-day window.
    * `process_due_erasures()`: Scheduled hourly via `pg_cron` (or triggered by admin), executing `erase_student` to hard-purge profile, responses, sessions, and attempts from both storage models transactionally.
  * **Current Gap:** There is **no self-service UI** for parents to request deletion. Currently, parents must email `hello@mindmosaic.app` and an operator must manually call SQL functions.
  * Furthermore, `DELETE /api/parent/children/[childId]` currently only unlinks the child from `parent_children` (archive), but does **not** queue an erasure request.

---

## 3. Intellectual Property, ACARA & ICAS Marketing Compliance

MindMosaic offers practice questions styled after Australian national and international assessments. The naming and marketing of these tests carry strict Australian Consumer Law (ACL) and intellectual property considerations.

### 3.1 ACARA & NAPLAN Compliance
* **Source Organization:** Australian Curriculum, Assessment and Reporting Authority (ACARA) & Education Services Australia (ESA).
* **Trademark & Copyright Facts:**
  * "NAPLAN" is a registered trademark and national program administered by ACARA.
  * ACARA owns copyright in all past NAPLAN test papers and question stimulus materials.
* **Mandatory MindMosaic Guardrails:**
  * **Zero Reproduction:** All questions, passages, and stimulus texts in MindMosaic are 100% original. No official past paper questions or passages are reproduced.
  * **Descriptive Nominative Use:** The terms "NAPLAN-style" or "NAPLAN practice format" may only be used descriptively to inform parents of the test format.
  * **Prominent Non-Affiliation Disclaimer:** Every page referencing NAPLAN must state:
    > *"MindMosaic is an independent practice platform and is not affiliated with, approved by, or endorsed by the Australian Curriculum, Assessment and Reporting Authority (ACARA) or Education Services Australia (ESA)."*
  * **No Score Guarantees:** Never advertise or imply that practice on MindMosaic guarantees a specific band or score on official assessments.

### 3.2 ICAS Compliance
* **Source Organization:** Janison Solutions Pty Ltd (formerly Educational Assessment Australia / UNSW Global).
* **Trademark Facts:**
  * "ICAS" is a registered trademark of Janison Solutions Pty Ltd.
* **Mandatory MindMosaic Guardrails:**
  * **Originality:** Never reproduce ICAS competition questions.
  * **Attribution:** All pages referencing ICAS must include:
    > *"ICAS is a registered trademark of Janison Solutions Pty Ltd. MindMosaic is not affiliated with or endorsed by Janison Solutions Pty Ltd or UNSW."*
  * Always use "ICAS-style practice" rather than "Official ICAS Tests".

---

## 4. Legal Compliance Checklist for Go-Live

The following checklist must be satisfied before charging parents:

### Category A: Terms of Service (`/terms`)
- [ ] **A1. Binding Terms:** Replace draft placeholder text with binding terms drafted/approved by Australian legal counsel.
- [ ] **A2. Australian Consumer Law (ACL) Guarantees:** Ensure terms comply with statutory consumer guarantees under Schedule 2 of the *Competition and Consumer Act 2010* (Cth). (Terms cannot exclude consumer guarantees of acceptable quality or fitness for purpose).
- [ ] **A3. Subscription & Renewal Terms:** Clear disclosure of billing cycle (monthly vs. annual), recurring charges, auto-renewal mechanisms, and simple cancellation procedures prior to renewal date.
- [ ] **A4. Refund Policy:** Clearly state refund conditions consistent with ACL (e.g. major failure vs change of mind).
- [ ] **A5. Fair Use & Account Sharing:** Explicit prohibition on sharing student login credentials outside the immediate household or commercial tutoring redistribution.

### Category B: Privacy Policy & Consent (`/privacy`)
- [ ] **B1. Formal Adoption:** Replace draft placeholder with formal Privacy Policy compliant with the Australian Privacy Principles (APPs) and the Children's Online Privacy Code.
- [ ] **B2. Explicit Data Collection Schedule:** Itemize all data collected from parents (name, email, payment token) and students (display name, year level, responses, timestamps).
- [ ] **B3. Third-Party Disclosures:** Disclose Stripe as payment processor, Supabase/AWS as hosting/database infrastructure.
- [ ] **B4. Published Retention & Deletion Policy:** Specify exact retention periods (e.g. active account lifetime + X days post-cancellation) and formalize the deletion workflow.
- [ ] **B5. Security & Breach Notification:** Document commitment to the Notifiable Data Breaches (NDB) scheme under the Privacy Act.

### Category C: Child Protection & Engineering Features
- [ ] **C1. Self-Service Account Closure:** Implement UI allowing parents to request family account closure and trigger the backend erasure engine.
- [ ] **C2. Student Unlink vs. Delete:** Clarify in the UI whether "Remove Child" archives or schedules permanent erasure.
- [ ] **C3. No Tracking Confirmation:** Ensure zero tracking scripts, cookies, or pixels are loaded in any authenticated or student route.

---

## 5. Specific Questions for External Legal Counsel (Vish's Lawyer)

When briefing legal counsel, present these 6 specific questions:

1. **AU Children's Online Privacy Code (10 Dec 2026):**
   * *Does our current model—where a parent must sign up first with a verified email and credit card, and then provisions a student using an internal alias and PIN—satisfy the "verifiable parental consent" and "reasonable steps" standards under the incoming Code? What specific additional disclosures or clickwrap acknowledgments are required at the point of child creation?*

2. **Australian Consumer Law (ACL) & Subscription Auto-Renewal:**
   * *What specific disclosures (pre-purchase confirmation, confirmation emails, reminder notices before annual renewals) are required under the ACCC's digital subscription guidelines to prevent our auto-renewing subscriptions ($14.99/mo and $149/yr) from being classified as unfair contract terms or deceptive conduct?*

3. **ACARA and ICAS Nominative Fair Use:**
   * *Are our proposed disclaimers on `/assessment-disclaimer`, landing pages, and practice exam headers sufficient to mitigate trademark infringement and misleading/deceptive conduct claims under sections 18 and 29 of the ACL? Do we need specific disclaimer placement above the fold on all marketing pages?*

4. **Statutory Limitation Periods vs. Right to Erasure:**
   * *Our database has an automated 30-day GDPR-style hard erasure worker (`process_due_erasures`). If a parent requests account deletion, is a 30-day cooling-off window appropriate, and must we retain financial transaction records (invoices, customer IDs) for 7 years under ATO tax rules while completely erasing the student's exam responses?*

5. **Student Content Ownership & Feedback Storage:**
   * *Students submit original written responses for essay/narrative questions, and teachers submit manual feedback. What intellectual property and moral rights licensing clause should be included in the Terms to ensure MindMosaic has the perpetual right to store and display this content to the family and class without acquiring copyright ownership from the child?*

6. **B2B School/Teacher Accounts vs. Family Accounts:**
   * *If teachers assign work to students whose accounts were provisioned by parents, or if a teacher invites students directly, does the school act as the parent's agent for consent, or does MindMosaic require independent parental consent for institutional classrooms?*
