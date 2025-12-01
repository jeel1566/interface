# Instructions: Switch Dashboard Storage from SQLite to Supabase

## Step 1: Run SQL in Supabase

1. Go to your Supabase project: https://rcynknvsddngslpcdpgh.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `SUPABASE_CREATE_DASHBOARDS.sql`
4. Click **Run**
5. Verify you see: "Dashboard tables created successfully!"

## Step 2: Update Backend Database Configuration

The backend currently uses SQLite for dashboards. We need to switch to Supabase.

**File to update:** `backend/models/database.py`

Replace the entire file with the Supabase connection configuration.

## Step 3: Test the Connection

After updating, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
uvicorn main:app --reload --port 8000
```

## Step 4: Verify

1. Visit: http://localhost:8000/docs
2. Try the endpoint: `GET /api/v1/dashboards/`
3. Should return an empty array `[]` (no dashboards yet)
4. Create a test dashboard via the frontend at http://localhost:5173/builder

---

**Note:** Any dashboards you created in the local SQLite database will need to be recreated, as we're switching to Supabase.
