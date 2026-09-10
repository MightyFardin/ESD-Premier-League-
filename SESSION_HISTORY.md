# Session History & Feature Implementations

This document serves as a persistent memory of the features, rules, and logic implemented during previous sessions. If you are a new agent reading this after a `/clear`, use this to understand the current state of the application.

## 1. Budget Forfeit & Minimum Quota Penalty Logic
**Files Modified:** `server/index.js`, `src/pages/ManagerDashboard.jsx`
- **Dynamic Quota Calculation:** The system dynamically calculates the `baseQuota` (Minimum Required Players) as `Total Players / Total Teams`.
- **Penalty Logic (Bidding & Selling):** 
  - If a manager's remaining budget drops below the amount required to buy their remaining minimum quota at the `defaultBasePrice`, they are penalized.
  - **The Penalty:** Their most expensive purchased player is immediately forfeited (status changed to 'unsold' and returned to the Admin). The manager's ID is added to the `bannedTeams` array for that specific player, permanently banning them from bidding on that player again.
  - This check happens both when they *attempt to place a bid* and when a player is finally *sold* to them.
- **Max Squad Size Limit:** Managers are strictly blocked from placing bids if their squad size reaches `maxSquadSize` (set by Admin).
- **Dashboard Display:** The Manager Dashboard actively displays `Squad (Min: X, Max: Y)` reflecting these limits.

## 2. Live Auction Timer Robustness
**Files Modified:** `src/pages/LiveAuction.jsx`, `server/index.js`
- **The Issue:** The 30-second live auction timer used to freeze or jump back to 30 seconds whenever the server broadcasted a state update (like a new manager connecting or a manual time addition).
- **The Fix:** 
  - The React `useEffect` for the live timer now uses a `useRef` to track the exact, absolute `auctionEndAt` timestamp provided by the server. 
  - It only recalculates the local countdown target if the server's absolute timestamp actually changes.
  - The `+10s` (Add Time) button logic in `server/index.js` was updated to correctly recalculate the `timerRemaining` on the fly so clients perfectly sync with added time.

## 3. Auction Start Schedule (Countdown) Preview
**Files Modified:** `src/pages/AdminSettings.jsx`
- **The Issue:** The Admin could set a future date/time for the "Auction Start Schedule", but they couldn't see the timer on the Admin Settings page, leading to confusion over whether it was working.
- **The Fix:** Imported and rendered the `<Countdown />` component directly below the datetime input in `AdminSettings.jsx`. As soon as a future date is picked, a live preview of the countdown timer appears. (Note: If a past date is selected, the timer hides itself as intended).

## 4. General Preferences
- **Language:** The user prefers responses to be entirely in **English**.
- **Deployment:** The project is linked to Vercel/GitHub. Any fixed code must be committed and pushed to the `main` branch to trigger a live deployment.
- **Local Testing:** Local testing runs on port `5175` (frontend via Vite) and port `3001` (backend via Node/Socket.io). 

## 5. Uptime Monitoring (Health Check)
**Files Modified:** `server/index.js`
- **The Issue:** The backend hosted on Render was sleeping during inactivity, requiring an uptime ping from Cron-job.org. 
- **The Fix:** Added a lightweight `GET /health` endpoint that instantly responds with `{"status": "ok"}`. This keeps the backend alive without querying the database or interfering with Socket.io.

## 6. Safari/iOS Date Parsing Bug (Countdown Timer)
**Files Modified:** `src/components/Countdown.jsx`
- **The Issue:** The countdown timer for the auction schedule was not appearing on Safari or iOS devices, or for certain timezones because `new Date('YYYY-MM-DDTHH:mm')` parsed as `NaN` (Invalid Date) in older/strict WebKit engines.
- **The Fix:** 
  - Standardized the date string by replacing hyphens with slashes and `T` with a space (`YYYY/MM/DD HH:mm`), making it universally parseable.
  - Wrapped the date parsing in a robust `try-catch` block.
  - Added a visual debug fallback state so that if the timer is expired or the date is strictly invalid, it renders a red debug box rather than silently failing and returning `null`.

---
*Last updated: Sept 9, 2026*
