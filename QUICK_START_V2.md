# V2 API Migration - Quick Start Guide

## ✅ What Was Done

### Backend (Complete)
- ✅ Created `/routes/files-v2.js` with robust API endpoints
- ✅ Registered v2 routes in `server.js` at `/api/v2`
- ✅ All endpoints include proper type conversion (varchar → number)
- ✅ Transactional operations for atomic file + bill creation
- ✅ Automatic bill deletion when changing companies
- ✅ Backend is running on port 5006

### Frontend (Complete)  
- ✅ Updated all 20 API endpoint references in `new/page.js`
- ✅ Migrated from `/api/files` to `/api/v2/files`
- ✅ Migrated from `/api/bills` to `/api/v2/bills`
- ✅ Updated company loading to use v2 context endpoint
- ✅ Updated product loading to use v2 products endpoint
- ✅ Updated file loading to use v2 file/bill endpoint
- ✅ All submit functions updated to use v2 endpoints
- ✅ No errors found in page.js

---

## 🚀 Ready to Test

### Test Workflow:
1. **Create New File:**
   - Go to `/new` page
   - Fill in farmer details
   - Select company (companies loaded via v2 API)
   - Products load automatically (via v2 API)
   - Enter bill items quantities
   - Click "Save & Print"

2. **Edit File:**
   - Go to `/new?id=123` (edit mode)
   - File details load (via v2 API)
   - Bill items load for original company (via v2 API)
   - Change company if needed (cache system works)
   - Update quantities
   - Click "Update & Print"

3. **Company Switching:**
   - Select different company
   - Get confirmation dialog
   - Old items cached for original company
   - New products loaded (via v2 API)
   - Switch back to original company - items restored from cache

---

## 📋 API Reference

### Context/Companies
```
GET /api/v2/files/context/:userId
→ Returns user's company links (max 3)
```

### Products
```
GET /api/v2/files/products/:userId?companyId=X
→ Returns all products for user + company with proper type conversion
```

### Files
```
POST /api/v2/files
→ Create file (with optional bill + items)

PUT /api/v2/files/:fileId
→ Update file

GET /api/v2/files/:fileId/bill?userId=X&companyId=Y
→ Get file + bill + items for specific company
```

### Bills
```
POST /api/v2/bills
→ Create new bill (auto-deletes old bill for same company)

PUT /api/v2/bills/:billId
→ Update bill + items

GET /api/v2/bills/next-bill-no?owner_id=X&month=Y&year=Z
→ Get next bill number for month/year
```

---

## 🔧 Configuration

**Backend Port:** 5006
**Frontend Dev Port:** 3000
**API Base:** `http://localhost:5006` (local) or `https://agri-files.onrender.com` (production)

---

## ✨ Key Features

✅ Proper type conversion (all numeric fields are numbers, not strings)
✅ Atomic transactions (file + bill created/updated together)
✅ Company-aware bill management (auto-delete old bill on company change)
✅ Bill item caching (switch companies without losing selections)
✅ Responsive design (mobile + desktop views)
✅ Error handling (all responses include success flag + error messages)
✅ No more orphaned bills or corrupted data

---

## 📝 Database Notes

**Required Cleanup:**
- Remove `duplicated_from` FK constraint if present
- Ensure `company_id`, `company_slot_no` columns exist in bills table

**Field Mappings:**
- `spare1` in products = userId (stored as VARCHAR, converted to number)
- `spare2` in products = companyId (stored as VARCHAR, converted to number)
- `spare3` in products = companySlot (stored as VARCHAR, converted to number)

---

## 🎯 Next Steps

1. Test file creation flow
2. Test file editing flow
3. Test company switching with caching
4. Test bill printing
5. Test mobile responsive views
6. Monitor for any API errors in console
7. Deploy to production when ready

---

## 📞 Troubleshooting

**If API returns 500 errors:**
- Check backend logs: `node server.js` output
- Ensure database connection is working
- Verify `billItemsCache` column removed from bills table

**If products don't load:**
- Check company ID is valid (exists in `company_link` table)
- Verify products exist in database for that company+user
- Check `spare1` and `spare2` values match exactly

**If bill items don't save:**
- Check `owner_id` is being sent
- Verify items have `qty > 0`
- Check database constraints are not blocking inserts
