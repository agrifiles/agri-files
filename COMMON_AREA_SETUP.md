# Common Area Feature - Database & API Setup

## Issue
The print page was not showing the common area consent letter because:
1. Database columns weren't created yet
2. API was fetching from old endpoint instead of v2

## Solution Implemented

### 1. Database Columns (Created in migrations/004_add_common_area_fields.sql)
```sql
ALTER TABLE files ADD COLUMN is_common_area boolean DEFAULT false;
ALTER TABLE files ADD COLUMN scheme_name text;
ALTER TABLE files ADD COLUMN giver_names text;
```

### 2. Backend API - Already Updated
- `backend/routes/files.js` - Uses `SELECT *` ✅
- `backend/routes/files-v2.js` - Uses `SELECT *` ✅
- Both return all columns including new fields

### 3. Frontend API - FIXED
- Updated `frontend/src/app/files/print/[id]/page.js`
- Changed from: `${API}/api/files/${routeId}`
- Changed to: `${API}/api/v2/files/${routeId}`
- Also updated bill fetch to use v2 API

## Setup Instructions

### Step 1: Run Database Migration
Execute this SQL in your PostgreSQL database (Neon):

```sql
-- Add common area fields to files table
ALTER TABLE "files"
ADD COLUMN "is_common_area" boolean DEFAULT false;

ALTER TABLE "files"
ADD COLUMN "scheme_name" text;

ALTER TABLE "files"
ADD COLUMN "giver_names" text;
```

Or run the migration file:
```bash
# Run from database client
psql -U username -d database_name -f backend/migrations/004_add_common_area_fields.sql
```

### Step 2: Deploy Frontend
The frontend changes are already in place - just rebuild:
```bash
cd frontend
npm run build
npm start
```

### Step 3: Verify
1. Create a new file with "Common Area" checkbox enabled
2. Print the file (use 🖨️ Print button)
3. You should see:
   - Page with consent letter before quotation
   - All fields properly populated
   - Giver names looped with signature boxes

## Fields Used in Consent Letter

| Field | Database | Frontend Form | Marathi Label |
|-------|----------|---------------|---------------|
| Common Area | `is_common_area` | `form.isCommonArea` | सामान्य क्षेत्र |
| Scheme Name | `scheme_name` | `form.schemeName` | योजनेचे नाव |
| Giver Names | `giver_names` | `form.giverNames` | देणार्याचि नावे |

## Comma-Separated Giver Names
The `giver_names` field stores multiple names as comma-separated string:
```
Farmer1,Farmer2,Farmer3,Farmer4,Farmer5
```

The print page automatically:
1. Splits by comma
2. Trims whitespace
3. Loops through each name
4. Creates signature line for each farmer

## Testing Checklist
- [ ] Database columns added successfully
- [ ] New file creation with common area enabled
- [ ] File saved with all three new fields
- [ ] File loaded in print page shows all fields
- [ ] Consent letter page appears before quotation
- [ ] Giver names populate with signature boxes
- [ ] Print output generates correctly
