Patients Module
The patients will be registered under this module, And for their appointmnments that can be booker from the patients module.
If any patients which doesn't exists can be directly added in appointments module through "Schedule Apoointment"

// MEDICINE (Master)
Medicine {
id: UUID
name: string              // Paracetamol 500mg
genericName: string       // Acetaminophen
manufacturer: string      // XYZ Pharma
type: enum                // Tablet, Syrup, Injection, Capsule
strength: string          // 500mg
unit: string              // Strip, Bottle, Box

// Stock
currentStock: number
reorderLevel: number      // Alert when stock below this
expiryDate: date
batchNumber: string

// Pricing
purchasePrice: decimal
sellingPrice: decimal
mrp: decimal

// Timestamps
createdAt: DateTime
updatedAt: DateTime
}

// DISEASE/CATEGORY
Category {
id: UUID
name: string              // Fever, Diabetes, Hypertension
description: string
type: enum                // Disease, Symptom, BodySystem
}

// MANY-TO-MANY RELATIONSHIP
MedicineCategory {
id: UUID
medicineId: UUID
categoryId: UUID
}

// STOCK TRANSACTION
StockTransaction {
id: UUID
medicineId: UUID
type: enum                // IN, OUT, ADJUSTMENT
quantity: number
balanceAfter: number
reason: string
patientId: UUID?          // If sold via prescription
userId: UUID              // Who made the transaction
transactionDate: DateTime
}

// PRESCRIPTION (Future)
Prescription {
id: UUID
patientId: UUID
doctorId: UUID?
medicines: JSON[]         // Array of {medicineId, quantity, dosage}
totalAmount: decimal
status: enum
createdAt: DateTime
}
```

### **4. Key Features to Include:**

#### **✅ Must-Have:**
1. **Search & Filters**
   - By name, category, manufacturer
   - By stock status (in stock, low stock, out of stock)
   - By expiry date

2. **Stock Management**
   - Add stock (with batch number & expiry)
   - Remove/Adjust stock
   - Stock history/audit trail
   - Low stock alerts

3. **Medicine Details**
   - Comprehensive medicine info
   - Multiple categories per medicine
   - Pricing tiers

#### **🎯 Nice-to-Have (Phase 2):**
1. **Barcode/QR Code** scanning
2. **Expiry Notifications** (30/60/90 days before)
3. **Purchase Orders** to suppliers
4. **Stock Reports** (valuation, movement, dead stock)
5. **Prescription Integration** (auto-deduct from stock)

### **5. UI/UX Flow:**
```
PHARMACY DASHBOARD
├─ Quick Stats (Total Medicines, Low Stock, Expiring Soon, Today's Sales)
├─ Quick Actions (Add Medicine, Record Sale, Adjust Stock)
└─ Alerts Section

MEDICINE INVENTORY PAGE
├─ Search Bar (with filters)
├─ Grid/List View Toggle
├─ Medicine Cards showing:
│   ├─ Medicine Name & Strength
│   ├─ Current Stock (with color coding)
│   ├─ Price
│   ├─ Categories/Tags
│   └─ Quick Actions (Edit, Adjust Stock, View History)
└─ Pagination

ADD/EDIT MEDICINE MODAL
├─ Basic Info (Name, Generic, Manufacturer, Type)
├─ Stock Info (Quantity, Unit, Reorder Level)
├─ Pricing (Purchase, Selling, MRP)
├─ Categories (Multi-select dropdown)
└─ Additional Details (Batch, Expiry)

CATEGORIES MANAGEMENT
├─ List of all categories
├─ Add/Edit/Delete
└─ View medicines under each category
```

### **6. Workflow Comparison:**

**❌ Your Original Flow:**
```
Disease → Medicines
(Rigid, difficult to manage)
```

**✅ Recommended Flow:**
```
1. Add Medicine to Inventory (master data)
2. Tag Medicine with Categories (diseases/conditions)
3. Manage Stock (in/out/adjust)
4. Create Prescriptions (optional, auto-deduct stock)

PHARMACY MODULE
│
├─ 1️⃣ INVENTORY MANAGEMENT
│   ├─ Add Medicine (Master data)
│   ├─ Update Stock (Purchase/Adjustment)
│   ├─ Low Stock Alerts
│   ├─ Expiry Tracking
│   └─ Search & Filter
│
├─ 2️⃣ MEDICINE CATEGORIES
│   ├─ Disease/Condition Tags
│   ├─ Medicine Type (Tablet, Syrup, Injection)
│   └─ Tag Assignment to Medicines
│
├─ 3️⃣ STOCK TRANSACTIONS
│   ├─ Stock In (Purchase Entry)
│   ├─ Stock Out (Sales/Prescription)
│   ├─ Stock Adjustment
│   └─ Transaction History
│
└─ 4️⃣ PRESCRIPTION INTEGRATION
├─ Create Prescription for Patient
├─ Auto-deduct from Stock
└─ Billing



