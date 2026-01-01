# Solink

**Solink** is a DePIN-style infrastructure platform that converts verified real-world bandwidth sharing and uptime into transparent, auditable on-chain rewards on **Solana**.

Solink bridges high-frequency off-chain telemetry (uptime, bandwidth, latency) with low-cost, high-throughput on-chain settlement, enabling scalable micro-rewards without sacrificing transparency or performance.

---

## 🚀 What Is Solink?

Solink allows users to run lightweight nodes (or browser extensions) that contribute network resources such as bandwidth and uptime.  
These contributions are:

1. **Measured in real time**
2. **Aggregated deterministically**
3. **Converted into points**
4. **Redeemable on-chain on Solana (next milestone)**

The system is designed to scale to thousands of nodes while keeping settlement costs minimal.

---

## ❓ Problem

Distributed network participation today faces several challenges:

- **Lack of transparency**  
  Users cannot verify how rewards are calculated.

- **High settlement costs**  
  On-chain rewards are expensive when distributed frequently.

- **Fraud & manipulation risks**  
  Fake uptime, replay attacks, and spoofed telemetry reduce trust.

These problems make it difficult to build fair, scalable DePIN reward systems.

---

## ✅ Solution

Solink solves this by separating **measurement**, **aggregation**, and **settlement**:

- **Off-chain**: High-frequency telemetry & rollups
- **On-chain (Solana)**: Low-cost, high-throughput reward settlement

### High-Level Flow

Node / Extension
↓ (heartbeat, uptime, bandwidth, latency)
PointEvent (event ledger)
↓
Hourly Rollup (MetricsHourly)
Daily Rollup (MetricsDaily)
↓
User Dashboard (real-time + history)
↓
On-chain Claim (Solana Program) ← next milestone


This architecture allows Solink to process large volumes of data efficiently while maintaining on-chain trust.

---

## ⚙️ Architecture Overview

### Core Components

- **Node / Extension**
  - Reports uptime, bandwidth, latency
  - Sends signed heartbeat events

- **Event Ledger**
  - Immutable PointEvent records
  - Source-tagged & versioned

- **Rollup Engine**
  - Hourly rollups (MetricsHourly)
  - Daily rollups (MetricsDaily)
  - Deterministic & idempotent

- **Dashboard**
  - Real-time metrics
  - Historical analytics (today / 7d / 30d)
  - User + system-wide views

- **Planned Solana Program**
  - Point → token conversion
  - On-chain verification
  - Low-fee reward claims

---

## 🧩 Why Solana?

Solink is **Solana-native by design**.

Solana enables Solink to:

- Settle **micro-rewards frequently** with minimal fees
- Handle **high-throughput claim traffic**
- Provide **fast finality** for a real-time UX
- Integrate with staking, DAO governance, and ecosystem tooling

This system would not be viable on high-fee or low-throughput blockchains.

---

## 🟢 Current Status (Already Live)

This project is **not a concept**.

### ✅ What Is Already Built

- Live backend with event ingestion
- Deterministic hourly & daily rollups
- Real-time and historical dashboard
- Anti-negative & data-integrity safeguards
- Production database & APIs

### ✅ Verified Capabilities

- Real-time points calculation
- System-wide & per-user metrics
- Backfill & correction support
- Rollup reproducibility

The system is already producing real data and analytics.

---

## 🧪 Anti-Fraud & Integrity

Solink includes foundational protections:

- Earn-only rollups (no debit contamination)
- Deterministic aggregation
- Negative-value clamping
- Source & type validation
- Trust / Quality Factor hooks (extensible)

Future milestones extend this with on-chain verification.

---

## 🛠️ What We Are Building With the Grant

### Milestone 1 – Solana Reward Program
- On-chain claim program
- Point → token conversion
- Devnet deployment
- Backend claim signer & verifier

### Milestone 2 – Verification & Trust
- Node attestation
- Replay & spoof protection
- Trust-weighted claims
- Rate limiting & anomaly detection

### Milestone 3 – Mainnet Readiness
- Program hardening
- Monitoring & alerts
- Pilot reward distribution
- Open-source release

---

## 📊 Success Metrics

- Active nodes
- Daily telemetry events
- Points generated per day
- Successful on-chain claims
- Average cost per claim
- 7-day / 30-day user retention

---

## 💰 Grant Budget (Estimate)

**Requested:** USD $25,000

| Category | Allocation |
|--------|------------|
| Solana program development | $10,000 |
| Backend & verifier systems | $7,000 |
| Security & testing | $4,000 |
| Infrastructure & monitoring | $2,000 |
| Community pilots | $2,000 |

---

## 🌐 Open Source Commitment

- Core Solana program will be open source
- Rollup logic & APIs documented
- Public dashboards & metrics

---

## 👤 Team

**Founder / Lead Engineer**

- Full-stack Web3 engineer
- Experience with Solana, real-time systems, and distributed infrastructure
- Focus on production-grade execution over speculation

---

## 📎 Demo & Evidence

- Live dashboard (local & production)
- Real telemetry & rollups
- API endpoints available for review

(Demo video & screenshots available upon request)

---

## 📜 License

MIT (planned for core components)
