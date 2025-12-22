# Bill Items Order - All Routes Summary

## Routes That Load Bill Items

### 1. ✅ GET /api/bills/:id (Edit Bill Page)
**File:** `backend/routes/bills.js:233`
```javascript
const itemsRes = await pool.query('SELECT * FROM bill_items WHERE bill_id=$1 ORDER BY line_no ASC', [id]);
```
**Frontend Call:** [frontend/src/app/bill/[id]/page.js:181](frontend/src/app/bill/[id]/page.js#L181)
```javascript
const res = await fetch(`${API}/api/bills/${routeId}`);
```
**When Used:** Loading bill for editing
**Order:** Items in sequence 1, 2, 3...

---

### 2. ✅ POST /api/bills (Create Bill)
**File:** `backend/routes/bills.js:307-369`
```javascript
for (let lineNo = 0; lineNo < items.length; lineNo++) {
  const it = items[lineNo];
  // ... INSERT INTO bill_items with line_no = lineNo + 1
}
```
**Frontend Call:** [frontend/src/app/bill/[id]/page.js:333](frontend/src/app/bill/[id]/page.js#L333)
```javascript
const res = await fetch(`${API}/api/bills`, {
  method: 'POST',
  body: JSON.stringify({ items: payloadItems, ... })
});
```
**When Used:** Creating a new bill
**Order Assignment:** Item 1→line_no=1, Item 2→line_no=2, etc.

---

### 3. ✅ PUT /api/bills/:id (Update Bill)
**File:** `backend/routes/bills.js:447-475`
```javascript
// DELETE old items
await client.query('DELETE FROM bill_items WHERE bill_id=$1', [id]);

// INSERT new items with line_no
for (let lineNo = 0; lineNo < items.length; lineNo++) {
  const it = items[lineNo];
  // ... INSERT with line_no = lineNo + 1
}
```
**Frontend Call:** [frontend/src/app/bill/[id]/page.js:323](frontend/src/app/bill/[id]/page.js#L323)
```javascript
const res = await fetch(`${API}/api/bills/${routeId}`, {
  method: 'PUT',
  body: JSON.stringify({ items: payloadItems, ... })
});
```
**When Used:** Updating existing bill
**Order Assignment:** Old items deleted, new ones assigned line_no 1, 2, 3...

---

### 4. ✅ POST /api/bills/:id/copy (Duplicate Bill)
**File:** `backend/routes/bills.js:527-537`
```javascript
// Fetch items in order
const itemsRes = await client.query('SELECT * FROM bill_items WHERE bill_id=$1 ORDER BY line_no ASC', [id]);

// Re-insert with new line_no
for (let lineNo = 0; lineNo < itemsRes.rows.length; lineNo++) {
  const it = itemsRes.rows[lineNo];
  // ... INSERT with line_no = lineNo + 1
}
```
**When Used:** Copying/duplicating a bill
**Order Preservation:** Source items fetched in order → new items get sequential line_no 1, 2, 3...

---

### 5. ✅ GET /api/bills/:id/print (Print Bill)
**File:** `backend/routes/bills.js:625`
```javascript
const itemsRes = await pool.query('SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY line_no ASC', [billIdNum]);
```
**Frontend Call:** [frontend/src/app/bill/print/[id]/page.js](frontend/src/app/bill/print/[id]/page.js)
```javascript
const res = await fetch(`${API}/api/bills/${billId}/print`);
```
**When Used:** Generating print invoice
**Order:** Items in sequence 1, 2, 3...

---

### 6. ✅ GET /api/bills (List Bills)
**File:** `backend/routes/bills.js:176-212`
```javascript
// This route returns BILLS, not items
// Bill items are loaded separately via GET /api/bills/:id
```
**When Used:** Loading bills list table
**Note:** Items are NOT returned in this route; they're fetched when editing individual bill

---

## Database Schema

### bill_items Table Structure
```
Column          | Type      | Description
----------------|-----------|---------------------------
item_id        | SERIAL    | Auto-increment primary key
bill_id        | INTEGER   | Foreign key to bills
product_id     | INTEGER   | Foreign key to products
description    | TEXT      | Product description
hsn            | VARCHAR   | HSN code
batch_no       | VARCHAR   | Batch number
cml_no         | VARCHAR   | CML number
size           | VARCHAR   | Product size
gov_rate       | NUMERIC   | Government rate
sales_rate     | NUMERIC   | Sales rate
uom            | VARCHAR   | Unit of measure
gst_percent    | NUMERIC   | GST percentage
qty            | NUMERIC   | Quantity
amount         | NUMERIC   | Line total (qty × sales_rate)
line_no        | INTEGER   | ✨ NEW: Order sequence (1,2,3...)
created_at     | TIMESTAMP | Creation timestamp
updated_at     | TIMESTAMP | Last update timestamp
```

### Indexes
```sql
CREATE INDEX idx_bill_items_line_no ON bill_items(bill_id, line_no);
```
This makes sorting by `line_no` fast even with many items.

---

## Order Flow Example

### User Action: Creates bill with 3 items
```
Frontend:          Backend:
┌─────────────┐   ┌─────────────────────────┐
│ Add Item A  │──→ line_no = 1
│ Add Item B  │──→ line_no = 2
│ Add Item C  │──→ line_no = 3
│ Click Save  │──→ POST /api/bills
└─────────────┘   └─────────────────────────┘
                   
Database (bill_items):
┌────────┬────────┬──────────┐
│ bill_id│ line_no│ description
├────────┼────────┼──────────┤
│ 5      │   1    │ Item A
│ 5      │   2    │ Item B
│ 5      │   3    │ Item C
└────────┴────────┴──────────┘
```

### User Action: Edits bill (reorder to C, A, B)
```
Frontend:          Backend:
┌─────────────┐   ┌──────────────────────────┐
│ Item C      │──→ line_no = 1 (was 3)
│ Item A      │──→ line_no = 2 (was 1)
│ Item B      │──→ line_no = 3 (was 2)
│ Click Save  │──→ DELETE old → INSERT new
└─────────────┘   └──────────────────────────┘
                   
Database (bill_items) - After update:
┌────────┬────────┬──────────┐
│ bill_id│ line_no│ description
├────────┼────────┼──────────┤
│ 5      │   1    │ Item C   ✨ NEW ORDER
│ 5      │   2    │ Item A
│ 5      │   3    │ Item B
└────────┴────────┴──────────┘
```

### User Action: Copy the bill
```
GET /api/bills/5?include=items    (fetch in order: C→line_no=1, A→line_no=2, B→line_no=3)
                 ↓
POST /api/bills/:id/copy          (insert into new bill 6)
                 ↓
Database (bill_items) for bill 6:
┌────────┬────────┬──────────┐
│ bill_id│ line_no│ description
├────────┼────────┼──────────┤
│ 6      │   1    │ Item C   ✨ ORDER PRESERVED
│ 6      │   2    │ Item A
│ 6      │   3    │ Item B
└────────┴────────┴──────────┘
```

---

## Summary

| Operation | Route | Order By | Frontend | Status |
|-----------|-------|----------|----------|--------|
| Edit Bill | GET /:id | `line_no ASC` | [bill/[id]/page.js:181](frontend/src/app/bill/[id]/page.js#L181) | ✅ Fixed |
| Create Bill | POST / | Sets `line_no` | [bill/[id]/page.js:333](frontend/src/app/bill/[id]/page.js#L333) | ✅ Fixed |
| Update Bill | PUT /:id | Sets `line_no` | [bill/[id]/page.js:323](frontend/src/app/bill/[id]/page.js#L323) | ✅ Fixed |
| Copy Bill | POST /:id/copy | `line_no ASC` | [bill/[id]/page.js](frontend/src/app/bill/[id]/page.js) | ✅ Fixed |
| Print Bill | GET /:id/print | `line_no ASC` | [bill/print/[id]/page.js](frontend/src/app/bill/print/[id]/page.js) | ✅ Fixed |

**All routes now consistently use `line_no` for ordering!** ✅
