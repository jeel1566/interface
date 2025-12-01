# n8n Interface Builder - Project Context Document

## Project Vision

**Goal:** Build a platform where users can create permanent, custom dashboards for their n8n workflows with execution history tracking.

**NOT a management dashboard** - It's a dashboard builder/interface creator for n8n workflows.

---

## Core Concept

1. User creates workflow(s) in n8n
2. User connects their n8n instance to the platform (one-time setup)
3. User builds custom dashboard(s) for each workflow
4. Dashboard provides:
   - Input form (always available)
   - Output display (latest result)
   - **Execution history** (all previous inputs/outputs)
   - Quick switching between dashboards via sidebar

---

## User Experience Flow

```
Connect n8n Instance (one-time)
    ↓
Create Dashboard for Workflow
    ↓
Use Dashboard:
  - Fill form → Execute workflow
  - View result
  - Browse execution history
  - Switch to other dashboards via sidebar
```

---

## Example Use Case: CRM System

User creates multiple dashboards:
- **Lead Management** - Add/update leads
- **Email Campaigns** - Send newsletters
- **Analytics** - Generate reports
- **Customer Support** - Create tickets

All accessible via sidebar navigation, each with its own execution history.

---

## MVP Scope (What to Build First)

### ✅ In Scope
- Single n8n instance connection (no multi-instance)
- Dashboard creation (visual builder)
- Dashboard execution (form + results)
- Execution history per dashboard
- Sidebar navigation between dashboards
- **No authentication** (single-user deployment)
- **No marketplace** (future feature)

### ❌ Out of Scope (Future)
- User authentication/signup
- Multi-tenant support
- Marketplace for templates
- Dashboard sharing
- Analytics/charts
- Payment integration

---

## Technical Architecture

### Database (Supabase PostgreSQL)

**Core Tables:**
```sql
instances          -- User's n8n instance connection
dashboards         -- Custom dashboards (formerly "apps")
dashboard_fields   -- Form field definitions (formerly "app_fields")
execution_logs     -- Execution history with input/output
```

### Backend (FastAPI + Python)
- Async REST API
- n8n API client with retry logic
- Workflow execution service
- Webhook callback handler

### Frontend (React + TypeScript)
- Dashboard builder (visual form creator)
- Dashboard viewer (form + history)
- Sidebar navigation
- Execution history table

---

## Key Features

### 1. Dashboard Builder
- Select n8n workflow
- Define input fields (name, type, required, etc.)
- Customize appearance (theme color, layout)
- Preview before creating

### 2. Dashboard View
**Layout:**
```
┌─────────────────────────────────────┐
│  Sidebar    │  Main Content         │
│  ─────────  │  ───────────────────  │
│  Dashboard1 │  📊 Dashboard Name    │
│  Dashboard2 │                       │
│  Dashboard3 │  🔵 Execute           │
│  + New      │  [Input Form]         │
│             │  [Execute Button]     │
│             │                       │
│             │  📜 History (50)      │
│             │  [Execution List]     │
└─────────────────────────────────────┘
```

### 3. Execution History
- Table showing all executions for current dashboard
- Columns: Timestamp, Status, Input Summary, Output Summary
- Click row → View full details
- Filter by status, date range
- Search in inputs/outputs

### 4. Sidebar Navigation
- List all user's dashboards
- Click to switch instantly
- Show execution count badge
- "+ New Dashboard" button
- Collapsible for more space

---

## n8n Input/Output Types

### Common Input Types (Form Fields)
1. **Text** - Single-line text input
2. **Textarea** - Multi-line text
3. **Number** - Numeric input
4. **Email** - Email validation
5. **URL** - URL validation
6. **Date** - Date picker
7. **DateTime** - Date + time picker
8. **Boolean** - Checkbox/toggle
9. **Select** - Dropdown (single choice)
10. **Multi-Select** - Multiple choices
11. **File Upload** - File/image upload
12. **JSON** - JSON editor
13. **Password** - Masked input

### Common Output Types (Display Formats)
1. **JSON** - Structured data (most common)
2. **Text/String** - Plain text
3. **HTML** - Rich text/formatted content
4. **Image URL** - Display image
5. **File URL** - Download link
6. **Table Data** - Array of objects → render as table
7. **Boolean** - Success/failure indicator
8. **Number** - Numeric result
9. **Error** - Error message display

### Smart Output Rendering Strategy
```javascript
// Detect output type and render appropriately
if (output is image URL) → <img>
if (output is array of objects) → <Table>
if (output is HTML) → render HTML
if (output is file URL) → <DownloadButton>
if (output is JSON) → <JSONViewer>
else → <pre>{JSON.stringify(output)}</pre>
```

---

## Current Codebase Status

### ✅ What's Already Built (70% done)
- Dashboard creation (`AppBuilder.tsx`)
- Dashboard viewing (`AppView.tsx`)
- Execution storage (`execution_logs` table)
- Workflow execution logic (`workflow_service.py`)
- n8n API client (`n8n_service.py`)
- Webhook callback handler (`webhooks.py`)

### 🔧 What Needs Refactoring
- Remove multi-instance UI (keep backend, hide frontend)
- Remove "Workflows" browsing page
- Remove "Executions" global page
- Remove "Dashboard" overview page
- Rename "Apps" → "Dashboards" everywhere

### 🆕 What Needs Building
- Sidebar navigation component
- Execution history tab in dashboard view
- Smart output rendering logic
- Dashboard list as homepage
- Settings page for instance setup

---

## Refactoring Priority

### Phase 1: Core Refactoring (Week 1)
1. Rename `apps` → `dashboards` (DB + code)
2. Create sidebar navigation component
3. Create `DashboardList.tsx` as homepage
4. Simplify navigation (remove unnecessary pages)

### Phase 2: Enhanced Dashboard (Week 2)
1. Add execution history tab to dashboard view
2. Implement smart output rendering
3. Add dashboard switching via sidebar
4. Improve form builder UX

### Phase 3: Polish (Week 3)
1. Add search/filter to execution history
2. Add execution detail modal
3. Add dashboard customization options
4. Performance optimization

---

## Design Decisions

### 1. Sidebar Navigation
- **Why:** Quick switching between dashboards without page reload
- **Implementation:** Fixed left sidebar, main content on right
- **Mobile:** Collapsible hamburger menu

### 2. No Projects/Grouping (MVP)
- **Why:** Simpler, faster to build
- **Future:** Can add project grouping later if needed

### 3. No Authentication (MVP)
- **Why:** Single-user deployment, focus on core features
- **Future:** Add Supabase Auth when going multi-tenant

### 4. Polling vs WebSockets
- **Current:** Polling every 3 seconds (acceptable for MVP)
- **Future:** WebSockets for real-time updates

---

## Key Files Reference

### Backend
```
backend/
├── main.py                    # FastAPI app
├── config.py                  # Environment config
├── api/
│   ├── n8n_service.py         # n8n API client
│   ├── workflow_service.py    # Execution logic
│   └── v1/
│       ├── apps.py            # Dashboard CRUD (rename to dashboards.py)
│       ├── workflows.py       # Workflow endpoints
│       ├── executions.py      # Execution history
│       └── webhooks.py        # Callback handler
└── models/
    └── models.py              # App/AppField models
```

### Frontend
```
frontend/src/
├── App.tsx                    # Router
├── pages/
│   ├── AppBuilder.tsx         # Dashboard builder (rename to DashboardBuilder.tsx)
│   ├── AppView.tsx            # Dashboard view (rename to DashboardView.tsx)
│   ├── ExecutionDetail.tsx    # Execution details
│   └── [NEW] DashboardList.tsx  # Homepage
└── components/
    └── [NEW] Sidebar.tsx      # Dashboard navigation
```

---

## Questions Resolved

1. **Sidebar Navigation:** ✅ Yes, sidebar for quick dashboard switching
2. **Marketplace:** ❌ Not in MVP, future feature
3. **Input/Output Types:** ✅ See section above (13 input types, 9 output types)
4. **Authentication:** ❌ Not in MVP, single-user deployment

---

## Next Steps

1. Start refactoring existing code
2. Create sidebar navigation component
3. Add execution history to dashboard view
4. Build smart output rendering
5. Test end-to-end flow
6. Deploy MVP

---

## Success Criteria

User should be able to:
- ✅ Connect n8n instance (one-time)
- ✅ Create dashboard in < 2 minutes
- ✅ Execute workflow from dashboard
- ✅ View all execution history
- ✅ Switch between dashboards via sidebar
- ✅ See smart-rendered outputs (images, tables, JSON)

---

*Last Updated: 2025-11-25*
*Version: MVP v1.0*
