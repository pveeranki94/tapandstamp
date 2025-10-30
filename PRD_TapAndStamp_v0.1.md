PRD - Tap & Stamp

**Product:** Tap & Stamp — App-less Loyalty for Cafés

**Version:** v0.1

---

## 1. Problem Statement

Independent cafés and small HoReCa businesses still rely on **paper stamp cards** to drive repeat visits.

Paper cards get lost, cannot be tracked, and offer zero data to the merchant.

Existing loyalty software (e.g., Square, Lightspeed, Kortpress):

- Requires POS integration or customer accounts
- Is too complex or expensive for small independent cafés
- Breaks the simplicity and speed of the café experience

There is a clear opportunity for an **instant, app-less digital alternative** that feels as simple as a paper card — but with the power of live updates and brand customization.

---

## 2. Product Vision

> “Make it effortless for cafés to reward loyal customers — no app, no login, no setup.
> 
> 
> Just a QR code, a tap, and a stamp.”
> 

Tap & Stamp replaces paper stamp cards with a **branded Apple Wallet and Google Wallet pass** that updates automatically each time a customer visits.

Each café has its own look, feel, and reward logic — all managed through a lightweight web backend.

---

## 3. Target Users

### 🎯 Primary

**Café Owners / Managers (SMB HoReCa)**

- 1–3 locations, minimal tech setup
- Want to increase repeat business
- Don’t have time or budget for complex loyalty platforms
- Care about aesthetics and brand identity

### 🧍 Secondary

**Café Customers**

- Regulars with iPhone or Android
- Prefer quick, low-friction experiences
- Don’t want another app or signup form

---

## 4. Goals & Success Metrics

| Goal | Metric | Target |
| --- | --- | --- |
| Simplicity | Onboarding time for a café | < 10 minutes |
| Adoption | % of daily visitors adding card | ≥ 25% |
| Engagement | Avg. visits per member per month | ≥ 3 |
| Retention | Increase in repeat rate after 4 weeks | ≥ 10% |
| Revenue validation | Willingness to pay for pilot | ≥ €30–50 / month |

---

## 5. Core Use Cases

### For Customers

- Scan a QR → instantly add a loyalty card to Wallet
- See café branding, logo, and stamp progress
- Scan a “stamp” QR at the counter to add a new stamp
- When full → card turns “reward ready,” redeem for free item

### For Merchants

- Upload logo, set colors and reward goal (e.g., 8 stamps = free coffee)
- Automatically generate branded Join + Stamp QR posters
- View members, stamps issued, rewards redeemed
- Reset customer cards after reward redemption

---

## 6. MVP Scope (v0.2)

| Category | Included | Excluded |
| --- | --- | --- |
| **Wallet cards** | Apple Wallet & Google Wallet support | Mobile app |
| **Stamps** | Simple “scan to stamp” QR flow | POS-triggered automation |
| **Branding** | Custom logo, colors, background, stamp style | Advanced theming or animated stamps |
| **Join Flow** | Static QR (detects device, adds pass) | Signup form, referrals |
| **Reward Logic** | Fixed: 8 stamps = free item | Tiered or point-based |
| **Merchant Setup** | Self-serve branding wizard | Multi-location dashboard |
| **Analytics** | Basic: members, stamps, redemptions | Advanced insights or segmentation |
| **Messaging** | None in MVP | SMS/WhatsApp triggers |
| **Security** | Cooldown per stamp (e.g. 5min) + staff redeem PIN | User accounts or auth flows |

---

## 7. Key Features

| Feature | Description | Success Criteria |
| --- | --- | --- |
| **Join QR** | Customer scans → adds branded Wallet pass | Works instantly on iOS/Android |
| **Stamp QR** | Customer scans → adds 1 stamp | Updates in under 3 sec |
| **Custom branding** | Each café defines logo, colors, background, stamp colors | 100% merchant-specific pass |
| **Reward & reset** | Pass changes color when full; resets on redeem | Barista understands visually |
| **Admin dashboard** | Upload branding, download posters, see stats | <10 min setup |
| **Poster generator** | Auto-create “Join / Stamp” posters in brand style | Café can print immediately |

---

## 8. User Flow

### 🧍 Customer

1. Sees “Join our loyalty” QR at the counter.
2. Scans QR → adds Wallet pass → pass shows “0/8 stamps.”
3. Each visit: scans “Stamp” QR → new stamp added automatically.
4. When 8 stamps: pass turns green “Free Coffee!” → shows at counter.
5. Barista redeems via short URL → resets stamps to 0.

### ☕ Merchant

1. Sign up on Tap & Stamp → upload logo, choose colors, set reward goal.
2. System generates:
    - 8 stamp card images (0–8)
    - Branded Apple & Google Wallet templates
    - Printable Join & Stamp QR posters
3. Merchant tests on own phone.
4. Goes live in-store within 10 minutes.

---

## 9. Technical Requirements (High-Level)

- Works offline for scanning (device caches QR link)
- Passes auto-update via backend when online
- Support Apple PassKit and Google Wallet Objects
- Handle up to 500 members per café in MVP
- GDPR-compliant (minimal data: user ID only)
- Scalable for later analytics and POS integration

---

## 10. Non-Goals (MVP)

- Customer login or profile
- Push notifications or SMS
- Multi-venue aggregation
- POS / payment integration
- Tiered points or complex gamification

---

## 11. Risks & Assumptions

| Risk | Mitigation |
| --- | --- |
| Customer doesn’t have Apple/Google Wallet | Show fallback mobile card |
| Fraud (scanning multiple times) | Enforce 5-min cooldown |
| Merchants forget to display QR | Provide printed poster templates |
| Pass updates delayed | Cache + retry logic |
| Merchant churn | Track onboarding and ROI early |

---

## 12. Deliverables (MVP)

1. **Working prototype**: Join QR + Stamp QR flow
2. **Apple & Google passes**: with dynamic stamp count + branding
3. **Merchant onboarding UI**: upload branding + choose colors
4. **Poster generator**: downloadable QR posters
5. **Basic backend dashboard**: view active users & redemptions

---

## 13. Timeline

| Phase | Duration | Deliverables |
| --- | --- | --- |
| Week 1–2 | Branding & pass generation | Working branded `.pkpass` and Google Wallet pass |
| Week 3 | Stamp QR flow | `/stamp/:uid` endpoint with live updates |
| Week 4 | Merchant onboarding UI | Logo upload, color pickers, reward setup |
| Week 5 | Pilot launch | 1 café, 20 users |
| Week 6–7 | Feedback + iteration | Prepare for paid pilot |

---

## 14. Open Questions

- Should redemption auto-reset the pass or require staff confirmation?
- Should customers get a web view to see their stamps too?
- Should the reward goal (e.g., 6 vs 8 stamps) be merchant-configurable at setup?