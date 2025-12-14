# Files-V2 Backend API Documentation

## Overview
Fresh, robust backend logic for file management with proper bill handling. All endpoints use type conversion and handle company relationships properly.

**Base URL:** `/api/v2`

---

## Endpoints

### 1. GET `/files/context/:userId`
Load user's company links and context for file creation/editing.

**Response:**
```json
{
  "success": true,
  "userId": 123,
  "companyLinks": [
    {
      "link_id": 1,
      "company_id": 5,
      "company_slot": 1,
      "designation": "Sales Engineer",
      "engineer_name": "John Doe",
      "mobile": "9876543210",
      "company_name": "ABC Company"
    }
  ]
}
```

---

### 2. GET `/files/products/:userId?companyId=X`
Load all products for a user + company combination.

**Parameters:**
- `userId` (path param, required): User ID
- `companyId` (query param, required): Company ID

**Response:**
```json
{
  "success": true,
  "userId": 123,
  "companyId": 5,
  "products": [
    {
      "product_id": 101,
      "description_of_good": "Drip Line 16mm",
      "hsn_code": "39171",
      "selling_rate": 25.50,
      "gst_percent": 5,
      "unit_of_measure": "Meter",
      "qty": 500,
      "gov_rate": 20,
      "company_rate": 22
    }
  ]
}
```

**Note:** All numeric fields (product_id, selling_rate, gst_percent, etc.) are properly converted to numbers.

---

### 3. GET `/files/:fileId/bill?userId=X&companyId=Y`
Load a file with its bill and items for a specific company.

**Parameters:**
- `fileId` (path param, required): File ID
- `userId` (query param, required): User ID
- `companyId` (query param, required): Company ID

**Response:**
```json
{
  "success": true,
  "file": {
    "id": 1,
    "owner_id": 123,
    "title": "File Title",
    "form": { "farmerName": "..." },
    "shapes_json": []
  },
  "bill": {
    "bill_id": 10,
    "file_id": 1,
    "bill_no": "2025DEC_01",
    "bill_date": "2025-12-14",
    "owner_id": 123,
    "company_id": 5,
    "farmer_name": "John Smith",
    "farmer_mobile": "9111111111",
    "status": "draft"
  },
  "billItems": [
    {
      "item_id": 50,
      "bill_id": 10,
      "product_id": 101,
      "description": "Drip Line 16mm",
      "qty": 100,
      "sales_rate": 25.50,
      "gst_percent": 5,
      "amount": 2550.00
    }
  ]
}
```

**Note:** If file exists but no bill for this company, `bill` and `billItems` will be empty arrays.

---

### 4. POST `/files`
Create a new file with optional bill.

**Request Body:**
```json
{
  "owner_id": 123,
  "title": "File Title",
  "form": { 
    "farmerName": "John Smith",
    "mobile": "9111111111",
    "billNo": "2025DEC_01",
    "billDate": "2025-12-14"
  },
  "shapes": [],
  "billItems": [
    {
      "product_id": 101,
      "description": "Drip Line 16mm",
      "hsn": "39171",
      "batch_no": "BATCH001",
      "size": "16mm",
      "gov_rate": 20,
      "sales_rate": 25.50,
      "uom": "Meter",
      "gst_percent": 5,
      "qty": 100,
      "amount": 2550.00
    }
  ],
  "companyId": 5
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": 1,
    "owner_id": 123,
    "title": "File Title"
  },
  "billId": 10
}
```

---

### 5. PUT `/files/:fileId`
Update file details (form, shapes, title).

**Request Body:**
```json
{
  "owner_id": 123,
  "title": "Updated Title",
  "form": { ... },
  "shapes": [...]
}
```

**Response:**
```json
{
  "success": true,
  "file": { ... }
}
```

---

### 6. POST `/v2/bills`
Create a new bill for a file + company. **Automatically deletes any existing bill for this file+company.**

**Request Body:**
```json
{
  "file_id": 1,
  "owner_id": 123,
  "company_id": 5,
  "bill_no": "2025DEC_01",
  "bill_date": "2025-12-14",
  "farmer_name": "John Smith",
  "farmer_mobile": "9111111111",
  "billItems": [
    {
      "product_id": 101,
      "description": "Drip Line 16mm",
      "qty": 100,
      "sales_rate": 25.50,
      "gst_percent": 5,
      "amount": 2550.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "billId": 10,
  "message": "Bill created successfully"
}
```

**Key Behavior:**
- Only inserts items with `qty > 0`
- Automatically deletes previous bill for same file+company
- Proper type conversion on all numeric fields

---

### 7. PUT `/v2/bills/:billId`
Update bill header and items. **Deletes all previous items and replaces with new ones.**

**Request Body:**
```json
{
  "bill_date": "2025-12-15",
  "farmer_name": "Jane Smith",
  "farmer_mobile": "9222222222",
  "billItems": [
    {
      "product_id": 101,
      "description": "Drip Line 16mm",
      "qty": 150,
      "sales_rate": 25.50,
      "gst_percent": 5,
      "amount": 3825.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bill updated successfully"
}
```

---

## Data Flow

### Create New File:
1. `GET /files/context/:userId` → Load companies
2. `GET /files/products/:userId?companyId=X` → Load products
3. User selects products and enters quantities
4. `POST /files` → Create file + bill with items

### Edit File:
1. `GET /files/:fileId/bill?userId=X&companyId=Y` → Load file + bill + items
2. Display products merged with bill items (qty)
3. If company changes:
   - User selects new company
   - Call `POST /v2/bills` → Creates new bill, deletes old one
   - `GET /files/products/:userId?companyId=NewCompanyId` → Load new products
4. When saving:
   - `PUT /files/:fileId` → Update file
   - `PUT /v2/bills/:billId` → Update bill + items

---

## Type Conversions
All numeric fields are automatically converted from string to number:
- `product_id`, `bill_id`, `item_id` → Numbers
- `qty`, `sales_rate`, `gst_percent`, `amount`, `gov_rate` → Numbers
- Text fields remain as strings

---

## Error Responses
All errors return `{ "success": false, "error": "Error message" }`

Example:
```json
{
  "success": false,
  "error": "Invalid userId"
}
```

---

## Notes
- All dates should be in format: `YYYY-MM-DD`
- Only bill items with `qty > 0` are saved
- When changing company, old bill items are automatically deleted
- Transactions are used for atomic operations (all-or-nothing)
