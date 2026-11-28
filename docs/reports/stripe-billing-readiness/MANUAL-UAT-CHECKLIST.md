# Manual UAT checklist: Stripe billing (sandbox only)

Environment: Vercel Preview for branch `feat/stripe-billing-readiness`, DEV Supabase `mfglzabnayacssgertat`, Stripe sandbox `acct_1StznKDtPH5dvWkm`. Use Stripe test cards only. **Never use a real card.**

Sandbox prices (testing only, **not approved production pricing**): Individual A$14.99/month or A$149/year; Family A$19.99/month or A$169/year.

Test cards: success `4242 4242 4242 4242`; decline `4000 0000 0000 0002`; insufficient funds `4000 0000 0000 9995`; 3-D Secure required `4000 0025 0000 3155`. Any future expiry, any CVC, postcode 2000.

Items the automated suite already covers are listed in COVERAGE-MATRIX.md. The items below need human judgement or things a robot cannot assess.

| ID | Check | Expected | Pass |
|----|-------|----------|------|
| M-01 | Sign up as a new parent, open Billing, choose **Individual annual**, pay with the success card | Returned to MindMosaic; the confirmation "Payment received" is visible on the page you land on (the "add your first child" screen for a parent with no child yet); Billing then shows an active Individual plan | |
| M-02 | Repeat with the **decline** card on a second new parent | Stripe shows the issuer's refusal on its own page; you can retry or go back; no plan is activated | |
| M-03 | 3-D Secure card `4000 0025 0000 3155` | Stripe's authentication step appears; completing it activates the plan; failing it does not | |
| M-04 | Cancel out of Stripe Checkout with the browser Back link | Returned to MindMosaic with a sensible "cancelled" message, no charge, still on the trial/free state | |
| M-05 | On a phone (real device, not an emulator), run M-01 | Stripe page and MindMosaic pages are usable one-handed; no clipped buttons or sideways scrolling | |
| M-06 | Parent whose trial has expired, with no plan | Redirected to Billing with a clear way to choose a plan; their child can still sign in and practise a limited sample; no dead ends | |
| M-07 | With a paid Family plan, add 3 children, then try a 4th | Clear message that the limit is reached; nothing is deleted | |
| M-08 | Downgrade Family to Individual in the Stripe customer portal (if the portal offers it) or via support | Existing children stay; adding more is refused with a clear message | |
| M-09 | Open **Manage billing** (Stripe customer portal) | Portal opens for your own customer; update card, view invoices, cancel at period end all work; returning goes back to MindMosaic | |
| M-10 | Cancel at period end from Billing, then resume | Access continues until the paid period ends; resume restores normal renewal | |
| M-11 | Receipts and emails: does Stripe send what you expect to the parent's address? | Receipt wording, business name ("New business sandbox") and branding are acceptable for a first customer. **Production needs real business details.** | |
| M-12 | Read every price and plan claim on Home, Pricing, Assessments, Billing and FAQ | Every claim is true of the product. **See open item O-01 (Free-plan wording).** | |
| M-13 | Read the "Free" plan description and try practising as a guest | Wording matches reality. At the moment the pages say "5 sample questions in every programme, no account needed" while guests receive a full paper (10 questions in one sitting in the test). Decide the policy first. | |
| M-14 | Legal pages | Privacy, terms, refund wording are final and linked from Billing and Checkout. At the time of testing they were still drafts. | |
| M-15 | GST and invoices | Prices are shown GST-inclusive; confirm tax treatment and invoice format with your accountant | |

Sign-off: ______________________  Date: ____________  Result: PASS / FAIL
