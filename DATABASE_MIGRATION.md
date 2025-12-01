# Database Migration Instructions

## Step 1: Create Dashboard Tables in Supabase

1. **Open Supabase Console**
   - Go to: https://rcynknvsddngslpcdpgh.supabase.co
   - Navigate to **SQL Editor**

2. **Run the Migration Script**
   - Copy the contents of `SUPABASE_CREATE_DASHBOARDS.sql`
   - Paste into SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Tables Created**
   - Go to **Table Editor**
   - You should see:
     - `dashboards` table
     - `dashboard_fields` table
     - `instances` table (already exists)
     - `execution_logs` table (already exists)

## Step 2: Add Database Password to .env

1. **Get Your Database Password**
   - In Supabase Console: **Settings** → **Database**
   - Scroll to **Connection string**
   - Click **URI** tab
   - Copy the password (between `postgres:` and `@db`)

2. **Update .env File**
   ```bash
   # Add this line to backend/.env
   SUPABASE_DB_PASSWORD="your-password-here"
   ```

## Step 3: Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C)
uvicorn main:app --reload --port 8000
```

## Step 4: Test the Connection

1. **Test API Endpoint**
   ```bash
   curl http://localhost:8000/api/v1/dashboards/
   ```
   Should return: `[]` (empty array)

2. **Create a Test Dashboard**
   - Go to: http://localhost:5173/builder
   - Create a new dashboard
   - Verify it appears in the database

## Troubleshooting

### Error: "relation 'dashboards' does not exist"
- **Solution:** Run the SQL migration script in Supabase

### Error: "password authentication failed"
- **Solution:** Check `SUPABASE_DB_PASSWORD` in `.env`

### Error: "connection refused"
- **Solution:** Verify Supabase URL is correct in `.env`

## Rollback (if needed)

```sql
-- Run in Supabase SQL Editor to remove tables
DROP TABLE IF EXISTS dashboard_fields CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;
```

---

**Status:** ⏳ Pending execution  
**Priority:** 🔴 Critical (required for dashboard functionality)
