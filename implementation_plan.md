# Feature Implementation Plan

## Issues & Features Summary

### 1. Download Details for Earnings Pages (Teacher + Admin)
Add CSV/PDF-style download for earnings data. For teacher side: total summary + per-month breakdown. For admin side: per-teacher earnings downloadable.

### 2. Admin-Managed Bank Transfer Details
Currently hard-coded. Need a dynamic system:
- Admin can add **1–5 bank accounts** (Bank Name, Account Name, Account Number)
- Each account can be **shown/hidden**
- Student wallet page fetches and displays these dynamically

### 3. Wallet Approvals Refresh Button
Simple: add a manual refresh button to the top of the admin wallet approvals page.

### 4. Reference Field Bug Fix
**Root cause found**: Student sends `reference` in FormData, but `walletController.js` reads `req.body.reference_number`. Field name mismatch causes it to always be null → shows "None". Fix: align field name in controller (read `reference` OR `reference_number`), and store it in the `description` field OR a dedicated column.

> [!NOTE]
> The `wallet_transactions` schema currently stores reference inside `description`. We need to either add a `reference_number` column to schema or fix the reading. Since `reference_number` is used in `exportSummaryCSV`, adding it to the schema is cleaner.

### 5. Settings Icon Does Nothing → Remove It
The `<Settings />` icon in `TopNavbar.js` (line 187) has no `onClick` handler, no link. It just floats there confusingly. **Fix: remove it** from the navbar.

---

## Open Questions

> [!IMPORTANT]
> **Earnings Download format**: Should the download be a **CSV file** (opens in Excel) or a styled **printable HTML** that opens in a new tab? CSV is simpler and more universally useful — recommending CSV.

> [!IMPORTANT]  
> **Bank Details Storage**: Since there's no table for bank details yet, I'll store them in the existing `settings` table as a JSON value (key: `bank_accounts`). This avoids schema changes. Is that acceptable?

---

## Proposed Changes

### Fix 1: Reference Field (Backend)

#### [MODIFY] walletController.js
- Change `const { user_id, amount, reference_number } = req.body;` to also read `req.body.reference` as fallback
- Store reference in a proper `reference_number` field

#### [MODIFY] schema.prisma  
- Add `reference_number String?` to `wallet_transactions` model
- Run `prisma db push`

---

### Fix 2: Settings Icon

#### [MODIFY] TopNavbar.js
- Remove the orphan `<Settings />` icon at line 187

---

### Feature 1: Wallet Approvals Refresh Button

#### [MODIFY] `src/app/dashboard/admin/wallet/page.js`
- Add a `RefreshCw` button near the tabs header that calls `fetchTransactions()`

---

### Feature 2: Admin Bank Details Manager

#### [NEW] Backend route + controller
- `GET /api/settings/bank_accounts` — returns all bank accounts from settings
- `POST /api/settings/bank_accounts` — saves/updates bank accounts array (admin only)

#### [MODIFY] `src/app/dashboard/admin/wallet/page.js`
- Add a new "Bank Transfer Accounts" section below the stats with a form to add/edit/hide up to 5 accounts

#### [MODIFY] `src/app/dashboard/student/wallet/page.js`
- Fetch bank accounts from API instead of hard-coded values
- Display each visible account as a card

---

### Feature 3: Download Earnings (Teacher)

#### [MODIFY] `backend/src/controllers/teacherController.js`
- Add `exportEarningsCSV` function: returns monthly breakdown + course/exam details as CSV
- Accepts `?teacher_id=&month=` (month optional for full history)

#### [MODIFY] `backend/src/routes/teacherRoutes.js`
- Register `GET /earnings/export`

#### [MODIFY] `src/app/dashboard/teacher/earnings/page.js`
- Add "Download CSV" button (full summary + per-month filter with download)

---

### Feature 4: Download Earnings (Admin)

#### [MODIFY] `src/app/dashboard/admin/earnings/page.js`
- Add "Download CSV" button for per-teacher or all-teacher earnings

---

## Verification Plan
- Test reference field: submit recharge with reference → check admin wallet shows it
- Test bank accounts: add/hide from admin → check student wallet updates
- Test downloads: click download → CSV downloads correctly
- Confirm settings icon is gone from all three dashboards
