# League Administrator Guide

This guide outlines day-to-day administrative operations for the Cricket League Registration Platform.

---

## 1. Accessing the Admin Console

- URL: `/admin/login`
- Default initial credentials:
  - **Email**: `admin@cricketleague.com`
  - **Password**: `CricketAdmin@2027`
- *Security Tip*: It is recommended to update the admin password or create dedicated admin accounts for verifiers upon first deployment.

---

## 2. Dashboard KPIs & Capacity Management

The **Overview Dashboard** (`/admin/dashboard`) provides real-time visibility:
- **Confirmed Players**: Verified registrations that have guaranteed tournament slots.
- **Pending Verification**: Players who paid via UPI and submitted proof receipts.
- **Available Slots**: Calculated dynamically as `Maximum Capacity - (Confirmed + Pending + Active 15m Holds)`.
- **Verified Total Collection**: Financial sum of approved registration payments (unverified or rejected payments are excluded).

---

## 3. Manual Payment Verification Workflow

1. Navigate to **Payment Verification** (`/admin/payments`).
2. Each card shows:
   - Registration ID (e.g. `KPL-2027-014`)
   - Player Full Name and Mobile Number
   - Amount payable (₹100)
   - Claimed **12-digit UTR** reference number
   - Submission timestamp (in IST)
   - Uploaded payment receipt preview thumbnail
3. **Cross-Verification Step**:
   - Open your receiving UPI merchant app (Google Pay for Business, PhonePe Business, Paytm for Business, or net banking statement).
   - Search for the claimed **UTR** number.
   - Confirm that ₹100 was credited to your account.
4. **Action**:
   - **APPROVE**: Tap **APPROVE**. The system atomically updates the payment status to `VERIFIED`, updates registration to `CONFIRMED`, logs an audit entry with your admin ID, and permanently locks the slot.
   - **REJECT**: If the UTR is invalid, duplicated, or the receipt is fake/blurry, tap **REJECT**. A dialog will prompt for a rejection reason (e.g. *"UTR not found on receiving bank statement"*). Rejecting releases the slot immediately for other aspiring players.
   - **INQUIRE VIA WHATSAPP**: Click the **WhatsApp** button to open a direct chat pre-filled with the player's name and registration ID to request a clearer screenshot or payment clarification.

---

## 4. Handling Registration Expiry

- Newly submitted registrations hold a slot for **15 minutes**.
- If a player does not upload payment proof within 15 minutes, their status automatically transitions to `EXPIRED` and the slot is freed up.
- If a player claims they paid before expiry, verify their bank timestamp against their registration timestamp. If valid, you can instruct them to re-register while slots remain open.

---

## 5. Tournament Settings Management

Navigate to **League Settings** (`/admin/settings`):
- **Capacity Safeguard**: The system will prevent you from reducing capacity below the number of currently occupied/confirmed slots.
- **Fee Safeguard**: The registration fee cannot be modified after players have already submitted payments to prevent fee discrepancies.
- **Toggle Registration**: Use the switch to pause registrations immediately if weather, ground availability, or schedule demands.
- **Update UPI ID**: You can change your receiving UPI ID and display name at any time.

---

## 6. Exporting Player Data

From both the **Overview Dashboard** and **Registrations Management** page:
- Click **Export CSV** or **Export Excel**.
- The generated file includes:
  - Registration ID
  - Player Full Name
  - Mobile Number
  - Email
  - Age
  - City / District
  - Cricket Role (Batsman, Bowler, All-rounder, Wicketkeeper)
  - Batting & Bowling Style
  - Team Name
  - Submission Date formatted in `Asia/Kolkata (IST)`
  - UTR Transaction Reference
  - Payment Status & Registration Status
