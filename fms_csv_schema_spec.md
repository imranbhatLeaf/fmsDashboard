# FMS Admin Upload CSV — Schema Specification

This spec defines the CSV format for bulk admin uploads. It replaces the
current simpler CSV. One file, one row per claim. Two columns
(`component`, `form_type`) drive which template, branding, and required
fields apply to that row.

Reference implementation file: `fms_admin_upload_template.csv`
(sample rows for all 4 components × representative form types).

---

## 1. Enums

**component** (case-insensitive, normalize to uppercase on ingest)
`ASSSR | VMI | DHC | JASSSR`

**form_type** (normalize to lowercase on ingest)
`allowance | fellowship | honorarium | refund`

**payee_status** (system-managed, admin should leave blank or omit on upload — system will default to `pending`)
`pending | completed | expired`

**journey_mode**
`Road | Rail | Air`

**local_journey_mode**
`Bus | Taxi | Car`

**participation_type** (honorarium only)
`Expert | Resource Person`

**lecture_type** (honorarium only)
`Online | Offline`

**honorarium_basis** (honorarium only — free text, NOT a fixed enum)
- ASSSR uses: `per hour` / `per day`
- VMI and DHC use: `per lecture` / `per day`
Store the raw value and render whichever label the component's template expects. Do not coerce ASSSR's "per hour" to "per lecture" or vice versa.

---

## 2. Column definitions

| Column | Type | Required when | Notes |
|---|---|---|---|
| `row_id` | string/int | always | Unique per row. Not shown to payee. |
| `component` | enum | always | See §1 |
| `form_type` | enum | always | See §1 |
| `name` | string | always | Claimant/applicant name |
| `designation` | string | always | Free text |
| `pay_level` | string | optional | e.g. `Level 7`, per OM pay-level matrix. Used for validating honorarium/DA rate ceilings if you want that check later. |
| `address` | string | always | |
| `phone_office` | string | optional | |
| `phone_mobile` | string | required | Used as fallback contact if email bounces |
| `email` | string | always | Where the completion link is sent — validate as email format at ingest, reject row otherwise |
| `programme_nature` | string | required for allowance, fellowship, honorarium | Not used by refund |
| `programme_title` | string | required for allowance, fellowship, honorarium | For refund, reuse this column for "Programme Applied for" |
| `participation_type` | enum | required for honorarium only | |
| `lecture_type` | enum | required for honorarium only | |
| `honorarium_basis` | string | required for honorarium only | See §1 |
| `num_presences` | number | required for honorarium only | Days or hours per `honorarium_basis` |
| `rate` | decimal | required for honorarium, fellowship | ₹ |
| `total_amount` | decimal | required for honorarium | = rate × num_presences (validate, don't just trust) |
| `journey_from` | string | required for allowance | |
| `journey_to` | string | required for allowance | |
| `journey_mode` | enum | required for allowance | |
| `journey_amount` | decimal | required for allowance | ₹ |
| `local_journey_from` | string | optional for allowance | Local leg is optional per the form |
| `local_journey_to` | string | optional for allowance | |
| `local_journey_mode` | enum | optional for allowance | |
| `local_journey_amount` | decimal | optional for allowance | ₹ |
| `grand_total` | decimal | required for allowance | journey_amount + local_journey_amount |
| `fellowship_rate` | decimal | required for fellowship | ₹ |
| `fellowship_total` | decimal | required for fellowship | |
| `refund_amount_claimed` | decimal | required for refund | ₹ |
| `payment_receipt_number` | string | required for refund | |
| `payment_receipt_date` | date (YYYY-MM-DD) | required for refund | |
| `refund_reason` | string | required for refund | |
| `academic_year` | string | required for refund | e.g. `2026-27` |
| `payee_status` | enum | system-managed | Admin leaves blank; default `pending` on ingest |
| `payee_link_token` | string | system-managed | Generate server-side (see §4) — reject upload if admin supplies a value here, to prevent token collisions/spoofing |
| `pan_number` | string | payee-filled | Must be blank on admin upload. 10-char PAN format validated when payee submits. |
| `aadhaar_number` | string | payee-filled, optional | Blank on admin upload. Optional per source forms — don't hard-require at payee-submit step. |
| `beneficiary_name` | string | payee-filled | Blank on admin upload |
| `account_number` | string | payee-filled | Blank on admin upload |
| `bank_name` | string | payee-filled | Blank on admin upload |
| `ifsc_code` | string | payee-filled | Blank on admin upload. Validate 11-char IFSC format. |
| `bank_branch_address` | string | payee-filled | Blank on admin upload |

---

## 3. Per-form-type required-field matrix

Use this to drive row-level validation on ingest — reject or flag rows missing required columns for their `form_type`.

| Column | allowance | fellowship | honorarium | refund |
|---|---|---|---|---|
| programme_nature | ✅ | ✅ | ✅ | – |
| programme_title | ✅ | ✅ | ✅ | ✅ (as "programme applied for") |
| participation_type | – | – | ✅ | – |
| lecture_type | – | – | ✅ | – |
| honorarium_basis | – | – | ✅ | – |
| num_presences | – | – | ✅ | – |
| rate | – | ✅ | ✅ | – |
| total_amount | – | – | ✅ | – |
| journey_from/to/mode/amount | ✅ | – | – | – |
| grand_total | ✅ | – | – | – |
| fellowship_rate/total | – | ✅ | – | – |
| refund_amount_claimed | – | – | – | ✅ |
| payment_receipt_number/date | – | – | – | ✅ |
| refund_reason | – | – | – | ✅ |
| academic_year | – | – | – | ✅ |

---

## 4. Ingest workflow (for the agent to implement)

1. **Parse CSV**, validate header row matches expected schema exactly (fail fast with a clear error listing missing/extra columns).
2. **Per row validate**: enum values, required-field matrix (§3), email format, numeric fields parse as numbers, dates parse as ISO dates.
3. On any row failure: do not partially ingest — return a report of `row_id` + error reason, let admin fix and re-upload. (Alternative: ingest valid rows, quarantine invalid ones — pick based on your app's existing error-handling convention.)
4. For each valid row:
   - Generate `payee_link_token` — cryptographically random, ≥22 chars (e.g. `nanoid` or `crypto.randomBytes(16).toString('hex')`), unique constraint in DB.
   - Insert row into `claims` table with `payee_status = 'pending'`.
   - Send email to `email` containing link: `{APP_URL}/complete/{payee_link_token}`.
5. **Payee-facing page** (`/complete/{token}`):
   - Look up claim by token. If not found or `payee_status = 'completed'`, show appropriate message (don't leak whether token ever existed vs. already used — same generic message either way).
   - Render a read-only summary of the claim (name, programme, amounts) built from the `component` + `form_type` template.
   - Editable fields: only `pan_number`, `aadhaar_number` (optional), `beneficiary_name`, `account_number`, `bank_name`, `ifsc_code`, `bank_branch_address`.
   - On submit: validate PAN/IFSC formats, update row, set `payee_status = 'completed'`, generate the filled PDF using the component-specific template, and (optionally) notify admin/treasurer.
6. **Token expiry**: consider a TTL (e.g. 30 days) after which `payee_status` auto-flips to `expired` and the link shows "please contact the office to resend."

---

## 5. Template routing table

Map `(component, form_type)` → template file / letterhead / signatory block:

| component | form_type | Template source |
|---|---|---|
| ASSSR | allowance | ASSSR_Allowance_Form |
| ASSSR | fellowship | ASSSR_Fellowship |
| ASSSR | honorarium | ASSSR_Honorarium_Form |
| ASSSR | refund | ASSSR_Refund_Form |
| VMI | allowance | VMI_Allowance_Form |
| VMI | honorarium | VMI_Honorarium_Form |
| DHC | honorarium | DHC_Honorarium |
| JASSSR | * | *(no source template provided yet — confirm with office before building)* |

Note: only VMI honorarium and VMI allowance templates were provided (no VMI fellowship/refund forms seen yet); DHC only has an honorarium template. If your app needs to accept `form_type` values for a `component` that has no template, validate that combination at ingest and reject rows like `VMI + fellowship` or `DHC + refund` until those templates exist — otherwise the agent will silently generate output from a missing/wrong template.

---

## 6. Security notes for the agent

- Never include `pan_number`, `aadhaar_number`, or bank fields in the admin-facing CSV export/import — those columns should only ever be written by the payee-facing endpoint, never by admin upload. Treat any admin-uploaded row with those fields pre-filled as a validation error.
- `payee_link_token` must not be guessable or sequential — use a CSPRNG.
- Rate-limit the `/complete/{token}` endpoint to prevent token brute-forcing.
- Log PAN/Aadhaar access separately (audit trail) since these are sensitive PII under Indian data protection norms.
