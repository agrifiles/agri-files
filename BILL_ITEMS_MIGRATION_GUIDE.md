# Quick Setup: Add line_no Column to bill_items

## What Changed?
Bill items now maintain their insertion order consistently. A new `line_no` column tracks the order items were added (1, 2, 3...).

## Required Database Migration

### Option 1: Run the SQL Migration File
```bash
# Navigate to project root
cd d:\agri-files

# Run the migration
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f backend/migrations/006_add_line_no_to_bill_items.sql
```

### Option 2: Run SQL Manually in pgAdmin or psql

Copy and paste this into your PostgreSQL client:

```sql
-- Add line_no column to bill_items table
ALTER TABLE bill_items
ADD COLUMN line_no INTEGER DEFAULT 1;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_bill_items_line_no ON bill_items(bill_id, line_no);

-- Make it NOT NULL
ALTER TABLE bill_items
ALTER COLUMN line_no SET NOT NULL;
```

### Option 3: Update via Neon Console
If using Neon.tech:
1. Go to your Neon database SQL Editor
2. Paste the SQL above
3. Click "Execute"

## Verify the Migration
```sql
-- Check the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bill_items'
ORDER BY ordinal_position;

-- Should show line_no as INTEGER, NOT NULL
```

## Testing After Migration

1. **Create a bill** with items: Apple, Banana, Cherry (in that order)
2. **Edit the bill** - items should show: Apple, Banana, Cherry
3. **Copy the bill** - items should show: Apple, Banana, Cherry  
4. **Print the bill** - items should show: Apple, Banana, Cherry

## Code Changes
- ✅ POST /api/bills - Now sets line_no when creating items
- ✅ PUT /api/bills/:id - Now sets line_no when updating items
- ✅ GET /api/bills/:id - Now orders by line_no ASC
- ✅ GET /api/bills/:id/print - Now orders by line_no ASC
- ✅ POST /api/bills/:id/copy - Now preserves and reassigns line_no

## If Something Goes Wrong

**Rollback the migration:**
```sql
-- Remove the column (if needed)
ALTER TABLE bill_items
DROP COLUMN line_no CASCADE;

-- Remove the index
DROP INDEX IF EXISTS idx_bill_items_line_no;
```

---
**After running the migration, restart your backend server:**
```bash
cd backend
node server.js
```
