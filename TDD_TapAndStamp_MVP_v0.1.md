# TDD - Tap & Stamp

## 1) Goal & Scope

- **Goal:** App-less, POS-agnostic digital stamp cards for SMB HoReCa (coffee shops first) using **Apple Wallet** and **Google Wallet** with **per-merchant branding** and **QR-based join/stamp** flows.
- **Out of scope (MVP):** POS integrations, customer accounts, SMS/WhatsApp, multi-venue analytics, complex reward logic.

## 2) High-Level Architecture

- **Client surfaces**
    - Customer mobile browser (for join/stamp URLs)
    - Apple Wallet / Google Wallet pass UI
    - Simple merchant admin (branding wizard + stats + poster download)
- **Backend**
    - **API server** (Node + TypeScript; Express or Next.js API routes)
    - **Supabase** (Postgres, Storage, optional Edge Functions)
    - **Image pipeline** (Node + Sharp/Canvas)
    - **Apple PassKit** web service + APNs (pass push)
    - **Google Wallet Objects** (Class/Object CRUD + JWT “Save to Wallet”)
- **Storage**
    - Postgres (merchants, members, visits)
    - Object storage/CDN (logo assets, stamp strip images)

## 3) Data Model (Postgres / Supabase)

```sql
-- merchants (one row per café)
CREATE TABLE merchants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  reward_goal     int  NOT NULL DEFAULT 8,
  branding        jsonb NOT NULL,      -- see schema below
  join_qr_url     text,                -- generated on create
  stamp_qr_url    text,                -- generated on create
  branding_version int NOT NULL DEFAULT 1,
  created_at      timestamptz DEFAULT now()
);

-- members (one pass per customer per merchant)
CREATE TABLE members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  device_type     text NOT NULL CHECK (device_type IN ('apple','google','web')),
  wallet_id       text,                -- Apple serialNumber or Google objectId
  stamp_count     int NOT NULL DEFAULT 0,
  reward_available boolean NOT NULL DEFAULT false,
  last_stamp_at   timestamptz,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_members_merchant ON members(merchant_id);

-- visits audit trail
CREATE TABLE visits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  stamped_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_visits_member ON visits(member_id);

```

### Branding JSON (`merchants.branding`)

```json
{
  "logo_url": "https://cdn/brands/lap/logo.png",
  "primary_color": "#6B4A3A",
  "secondary_color": "#E8D9CF",
  "label_color": "#FFFFFF",
  "background": { "type": "solid", "color": "#6B4A3A", "image_url": null },
  "stamp": {
    "total": 8,
    "shape": "circle",
    "filled_color": "#6B4A3A",
    "empty_color": "#FFFFFF",
    "outline_color": "#FFFFFF",
    "overlay_logo": false
  }
}

```

## 4) Core Flows

### 4.1 Join (no form)

- Customer scans **Join QR**: `GET /add/:merchantSlug`
- Device detection → serves:
    - **Apple**: signed `.pkpass` (creates `members` row if needed)
    - **Google**: redirects to “Save to Google Wallet” link/JWT (creates `members` row)
- Initial pass shows **0/N** stamps with merchant branding

### 4.2 Stamp (no POS)

- Customer scans **Stamp QR**: `GET /stamp/:memberId`
- Server checks **cooldown** (e.g., 5 minutes):
    - If OK: `stamp_count += 1`; writes `visits` record
    - Set `reward_available = true` when `stamp_count == reward_goal`
- **Update pass**:
    - Apple: APNs pass push → device pulls updated pass JSON & `strip.png`
    - Google: `PATCH LoyaltyObject` → new `imageModulesData` + balance
- Response `200 { stamp_count, reward_available }`

### 4.3 Redeem (optional staff PIN)

- Staff confirms reward → `POST /redeem/:memberId`
- If `reward_available`, reset `stamp_count = 0; reward_available = false`
- Push/patch pass to show `0/N`

## 5) API Endpoints

**Public**

- `GET /add/:merchantSlug` → add pass (Apple `.pkpass` or Google Save link)
- `GET /stamp/:memberId` → add 1 stamp (with cooldown)
- `POST /redeem/:memberId` → reset to 0 (optional merchant PIN in body)

**PassKit (Apple-required)**

- `POST /passkit/v1/devices/:deviceId/registrations/:passTypeId/:serial` → register device push token
- `GET /passkit/v1/passes/:passTypeId/:serial` → return pass JSON for latest state
- `DELETE .../registrations/...` (optional)

**Admin**

- `POST /admin/merchants` → create merchant (branding JSON, reward_goal)
- `POST /admin/merchants/:id/branding` → update branding (+ bump `branding_version`)
- `GET /admin/stats/:merchantId` → totals (members, stamps, redemptions)
- `GET /admin/poster/:merchantId?type=join|stamp` → returns PDF

## 6) Apple Wallet (PassKit) Details

- **Pass type:** `storeCard` (or `generic`)
- **Assets bundled in `.pkpass`:**
    - `pass.json`
    - `logo.png` (merchant)
    - `icon.png`
    - `strip.png` (**the stamp strip image for current count**)
    - `manifest.json` + `signature`
- **Key fields in `pass.json`:**
    - `passTypeIdentifier`, `teamIdentifier`, `serialNumber` (use `member.id`)
    - `backgroundColor` ← branding.primary_color
    - `labelColor` ← branding.label_color
    - `barcode.message` ← `member.id`
    - `storeCard.primaryFields[0].value` ← `"X / N"`

**Pass update flow**

- On stamp/redeem:
    1. Update DB
    2. **APNs pass push** to registered device(s)
    3. iOS requests `GET /passkit/v1/passes/:type/:serial`
    4. Return updated `pass.json` and **replace `strip.png`** with the pre-rendered image for new `X/N`

**Certificates & signing**

- Apple Pass Type ID cert (.p12) + WWDR cert chain (store in secrets manager)
- Sign manifest; build `.pkpass` in memory; send to client with correct content-type

## 7) Google Wallet (Wallet Objects) Details

- **One LoyaltyClass per merchant** (MVP simplifies branding)
- **LoyaltyClass** fields: `id`, `programName`, `hexBackgroundColor`, `logo`
- **LoyaltyObject** (per member): `id`, `classId`, `loyaltyPoints.balance`, `imageModulesData[0].mainImage.uri` (your current stamp strip URL), `barcode.value` = `member.id`
- **Add to Wallet:** Signed JWT link (service account)
- **Update on stamp:** `PATCH LoyaltyObject` with new balance & image URL

## 8) Image Pipeline (Stamp Strip)

**Requirements**

- Generate **0..N** images per merchant
- Reuse images (no per-request rendering)
- Support **circle/square** shapes; colorized per branding
- Include **text “X / N”** for clarity & accessibility

**Rendering**

- Use **Sharp** or **node-canvas**
- Dimensions:
    - Apple `strip.png`: ~1125×432 px (@2x), PNG, <200–300 KB
    - Google `imageModulesData` image: ~1032×336 px (@2x), PNG, similar size
- Steps:
    1. Base: solid color or background image (center-crop)
    2. Lay out N slots with padding
    3. Draw empty slots (empty_color + outline_color)
    4. Fill first X with filled_color
    5. Overlay “X / N” text in label_color (ensure contrast)
    6. Export PNG; upload to `/stamps/<merchantSlug>/v<brandingVersion>_<X>of<N>.png`

**Cache busting**

- Include `branding_version` in filename to invalidate CDN when branding changes

## 9) Security & Abuse Controls

- **Cooldown**: deny `/stamp` if `now - last_stamp_at < 5min`
- **Rate limiting**: per IP & per member (e.g., 10 stamps/hour)
- **Redeem PIN (optional)**: hash & store per merchant; require on `/redeem`
- **UUIDs** for `member.id` & non-guessable QR links
- **Secrets**: Apple cert, APNs key, Google SA JSON in server-side secrets/KMS
- **Minimal PII**: no phone/email in MVP; only IDs & timestamps
- **GDPR**: privacy notice on posters; data deletion on request (admin tool later)

## 10) Observability

- **Structured logs**: request id, merchantSlug, memberId (hash), action, latency, result
- **Metrics**:
    - `/stamp` success rate & latency
    - APNs push success/error counts
    - Google PATCH success/error
    - Image CDN hit rate
- **Alerts**:
    - Error rate spikes (>2% 5xx)
    - APNs or Google failure bursts
    - DB connection errors

## 11) Admin UX (MVP)

- **Branding wizard**:
    - Upload logo (auto resize to required sizes)
    - Color pickers (contrast check; show warnings)
    - Stamp settings (total, shape, colors)
    - Save → generate assets (0..N); create Apple template; create Google Class
- **Poster generator**:
    - HTML → PDF (Puppeteer). Two variants:
        - “Join our loyalty — scan to add to Wallet”
        - “Scan for your stamp”
    - Brand colors & logo; embedded QR codes (short URLs)
- **Basic stats**:
    
    # members, stamps issued (visits), estimated redemptions (= floor(stamps/goal))
    

## 12) Deployment

- **API**: Vercel/Render/Fly.io (Node 18+, TypeScript)
- **DB/Storage**: Supabase (Postgres + Storage + public CDN)
- **Domain**: `tapandstamp.yourdomain.com`
- **TLS/HSTS** enabled
- **APNs**: either direct (http/2 with auth key) or via a tiny long-running worker if your platform isn’t ideal for long-lived connections

## 13) Testing Strategy

- **Unit**:
    - Stamp cooldown logic; rollover to reward; reset
    - Branding contrast validator; renderer snapshot (0..N) deterministic tests
- **Integration**:
    - Pass generation & signature (Apple)
    - APNs push (mock success/failure)
    - Google: create Class/Object, Save link JWT, PATCH on stamp
- **E2E (staging)**:
    - Join → add pass (iOS + Android)
    - Stamp → pass updates visually
    - Fill to reward → redeem → reset to 0
- **Field pilot**:
    - One café, real posters; track adoption, scans/day, update latency

---

# Implementation Plan (sequence you can execute)

## Phase A — Foundations

1. **Repo setup**
    - Node + TypeScript + pnpm
    - ESLint/Prettier/Jest
    - Env schema (dotenv or tRPC config)
2. **Supabase project**
    - Apply schema (SQL above)
    - Storage buckets: `brands/`, `stamps/`, `posters/`
3. **Secrets**
    - Apple Pass Type ID cert & key
    - APNs auth key (p8)
    - Google service account JSON (Wallet issuer)
    - Store in platform secrets/KMS

## Phase B — Branding & Assets

1. **Branding wizard (admin)**
    - Upload logo → normalize sizes
    - Color pickers + WCAG contrast function
    - Stamp settings (total/shape/colors)
2. **Image renderer**
    - `renderStampStrip(branding, count, total) → Buffer`
    - Generate `0..N` PNGs; upload to `stamps/<slug>/v<version>_<X>of<N>.png`
3. **Poster generator**
    - HTML templates (Join/Stamp) → Puppeteer PDF
    - Embed short URLs & QR codes; store in `posters/<slug>/...`

## Phase C — Wallet Integrations

1. **Apple**
    - `.pkpass` builder: assemble `pass.json` + assets; sign manifest; return file
    - PassKit web service endpoints; device registration storage
    - APNs push helper (http/2)
2. **Google**
    - Class creator (per merchant) using branding
    - Object creator (per member)
    - Save link JWT helper
    - PATCH helper for updates

## Phase D — Public Flows

1. **`GET /add/:merchantSlug`**
    - Lookup merchant; create/find member (by `device_type`)
    - Apple: build & return `.pkpass` with `strip.png` = `0ofN`
    - Google: create object; redirect to Save link
2. **`GET /stamp/:memberId`**
    - Cooldown check; increment `stamp_count`; create `visits` record
    - If reached goal → `reward_available = true`
    - Apple: push update; Google: PATCH object (balance + new image URL)
    - Return JSON
3. **`POST /redeem/:memberId`**
    - Optional PIN guard (merchant setting)
    - Reset counters; push/patch update

## Phase E — Admin & Telemetry

1. **Stats endpoint/UI**
    - Total members; total visits; implied redemptions
2. **Logging & monitoring**
    - Structured logs with request id, merchant slug, member id (hashed)
    - Basic error alerts

## Phase F — Pilot Ready

1. Provision first merchant (your test café)
2. Generate posters & validate both device types
3. Do a “barista dry run” (scan Join, scan Stamp, see live update, redeem)

---

## Acceptance Criteria (MVP)

- A café can be onboarded with logo, colors, and stamp settings; posters downloadable.
- Customers can add **Apple** or **Google** Wallet pass via Join QR.
- Scanning Stamp QR increments stamps; **visible update** occurs on the Wallet pass.
- When full, pass clearly indicates **reward available**; redeem resets stamps to 0.
- Basic stats visible to the merchant; no crashes; updates typically reflect within a few seconds.

---

## Risk Checklist (before pilot)

- [ ]  Apple pass push succeeds on at least 2 test iPhones (different OS versions)
- [ ]  Google Wallet flow works on at least 2 Android devices (Wallet installed / no-Wallet fallback page)
- [ ]  Cooldown blocks rapid double scans
- [ ]  CDN returns correct stamp images for each count & merchant
- [ ]  Branding updates bump `branding_version` and invalidate cache
- [ ]  Secrets and certs are not committed; envs are locked down