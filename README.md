# tapandstamp
Here’s a concise **README summary** for your Tap & Stamp repository — aligned with your PRD and TDD:

---

# Tap & Stamp — App-less Loyalty for Cafés

**Tap & Stamp** replaces paper stamp cards with **Apple Wallet** and **Google Wallet** passes that update automatically with each visit.
No apps, logins, or POS integration — just a **QR code, a tap, and a stamp**.

---

## 🌟 Overview

Independent cafés can launch a branded digital loyalty program in under 10 minutes.
Customers simply scan a QR code to add a loyalty card to their phone’s Wallet and scan again at each visit to collect stamps.

---

## 🚀 MVP Features

* **Join QR** → Instantly add pass to Apple/Google Wallet
* **Stamp QR** → Add 1 stamp (with cooldown to prevent abuse)
* **Reward logic** → 8 stamps = free item; resets after redemption
* **Branding wizard** → Custom logo, colors, and background
* **Poster generator** → Auto-create “Join” and “Stamp” QR posters
* **Dashboard** → View members, stamps, and redemptions

---

## 🏗️ Tech Stack

* **Backend:** Node.js (TypeScript, Express/Next.js)
* **Database:** Supabase (Postgres + Storage)
* **Wallets:** Apple PassKit & Google Wallet Objects
* **Image pipeline:** Sharp/Canvas for stamp strip rendering
* **Hosting:** Vercel / Render / Fly.io

---

## 🧩 Core Flows

1. **Join:** `/add/:merchantSlug` → creates Wallet pass (Apple or Google)
2. **Stamp:** `/stamp/:memberId` → increments stamps with cooldown
3. **Redeem:** `/redeem/:memberId` → resets after reward

---

## ✅ MVP Acceptance Criteria

* Merchant setup under 10 minutes
* Pass adds successfully on iOS & Android
* Stamp updates appear on pass within 3 seconds
* Branding applies uniquely per merchant
* Basic analytics available (members, stamps, rewards)

---

## 🔒 Security

* 5-minute stamp cooldown
* Non-guessable UUIDs for member and merchant IDs
* Optional staff PIN for reward redemption
* Minimal data (no PII) and GDPR-compliant

---

## 📅 Current Status

* PRD v0.1 / TDD v0.1 implemented
* MVP scope: single-café, no POS or messaging integrations
* Ready for pilot testing with one café
