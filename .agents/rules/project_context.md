---
name: Project Context
description: Current state and recent changes of the Football Auction Platform
---

# Football Auction Platform - Current State

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Socket.io + SQLite
- Styling: Custom sleek dark/light mode with Lucide icons and SVG icons.

## Recent Features Implemented
1. **Admin Dashboard Redesign**:
   - Implemented sleek floating tabs for Players and Teams.
   - Refined the "+ Add Player" button.
   - Implemented floating edit modals to avoid shifting layout on the page.
   - Fixed Z-index issues so background dimming spans the entire screen.
2. **Player Filtering & Exporting**:
   - Added `CustomSelect.jsx` for Session and Position filtering. `CustomSelect` is positioned `absolute` with high `z-index` so it overlaps content nicely instead of pushing the layout down.
   - Implemented an **Import** button for bulk uploading Players via `.csv` or `.json`.
   - Implemented an **Export** dropdown menu supporting CSV, Excel (.xlsx), and PDF exports of the currently filtered player list (utilizing `jspdf`, `jspdf-autotable`, and `xlsx` libraries).
3. **App Shell / Layout**:
   - Integrated SVG icons for Light/Dark mode toggling.
   - Integrated dynamic network/Server Status SVG icons.
   - Enhanced EPL Branding (larger logo and text on Desktop and Mobile).
   - Added SVG icons to both Desktop Sidebar and Mobile Bottom Tab Navigation.
4. **Manager Management**:
   - Added capability to Delete Managers directly from the admin interface, fully wiping them from the SQLite database.

## System Constraints (Important)
- **DO NOT PUSH TO GITHUB**: The user has explicitly instructed NOT to push recent changes to GitHub. All work should remain strictly on localhost for now.
