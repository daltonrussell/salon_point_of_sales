# Bundle Products Feature Requirements

## Overview
Allow creation of "bundle" products (like gift baskets) that are composed of multiple individual inventory items. Bundles reserve component products when created and track them separately.

## Business Rules

### 1. Bundle Creation & Management
- Bundles are created and managed in the Inventory page as a special product type
- Each bundle has:
  - Unique name and SKU
  - List of component products (with quantities per bundle)
  - Sale price (can be custom or auto-calculated)
  - Quantity of bundles available
- When a bundle is created, component products are immediately reserved
- Bundles appear in inventory list with visual indicator (🎁 icon or "BUNDLE" badge)

### 2. Product Reservation System
- Individual products track two quantities:
  - **Total Quantity**: Physical inventory count
  - **Reserved Quantity**: Amount reserved in bundles (calculated)
  - **Available Quantity**: Total - Reserved (for individual sales)
- Product inventory display shows: "10 total (6 available, 4 reserved)"
- Tooltip on reserved products shows which bundles reserve them
- Reserved products cannot be sold individually (only available quantity can be sold)

### 3. Pricing
- Default bundle price = sum of component product sale prices
- User can manually override the calculated price
- Price can be set to create promotional/discount pricing

### 4. Stock Validation & Sales
- When selling a bundle:
  - Check if bundle quantity > 0
  - Check if sufficient component inventory exists
  - If insufficient: Show warning but allow sale to proceed
  - This may result in negative inventory (tracked for correction)
- Selling a bundle:
  - Reduces bundle quantity by 1
  - Reduces each component product's total quantity
  - Automatically recalculates reserved quantities

### 5. Bundle Editing
- Bundles can be edited after creation
- Editing only affects the bundle going forward (doesn't retroactively change sold bundles)
- Changes to components/pricing apply to remaining bundle inventory
- If bundle quantity is reduced, excess reserved products return to available

### 6. Bundle Deletion
- Deleting a bundle returns all reserved products to available inventory
- Should warn if bundle has been sold (historical data exists)
- Soft delete (showInUI: false) to maintain data integrity

### 7. Sales & Receipts
- Receipt displays:
  ```
  Holiday Gift Basket               $50.00
    - Hairspray (3)
    - Root Boost (1)
    - Dry Shampoo (1)
  ```
- Backend tracks:
  - Bundle sale item (main line)
  - Component sale items (children, linked to parent)

### 8. Reporting
- **Inventory Tax Reports**: Bundles appear as single line items with bundle price
- **Profit Calculations**:
  - Bundle sale price vs. sum of component purchase prices
  - Profit = Bundle Sale Price - Σ(Component Purchase Price × Component Quantity)
- **Sales Reports**: Show bundles as sold (with expandable component detail)

### 9. Restrictions
- Bundles cannot be used as "back bar" items
- Bundles cannot contain other bundles (no nesting)
- Component products must have sufficient quantity to create bundle

## Technical Implementation

### Database Schema

#### New `bundles` Table
```javascript
{
  id: String,                    // Unique ID (timestamp-based)
  bundleName: String,            // Display name
  sku: String,                   // Unique SKU for scanning/search
  salePrice: Number,             // Final bundle price
  calculatedPrice: Number,       // Auto-calculated from components (for reference)
  quantity: Number,              // Number of bundles available
  components: [                  // Array of component products
    {
      inventoryId: String,       // Reference to inventory item
      quantity: Number,          // Quantity needed per bundle
      productName: String,       // Cached for display (in case product deleted)
      purchasePrice: Number,     // Cached for profit calc
      salePrice: Number          // Cached for price calc
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  showInUI: Boolean              // Soft delete flag
}
```

#### Updates to `saleItems` Table
```javascript
{
  // ... existing fields
  BundleId: String,              // Reference if this sale item is a bundle
  parentSaleItemId: String,      // For component items, reference to bundle sale item
  isBundleComponent: Boolean     // Flag to identify component items
}
```

#### Inventory Calculations (No Schema Change)
- `quantityReserved`: Calculated on-the-fly by summing bundle components
- `quantityAvailable`: quantity - quantityReserved

### API Endpoints (IPC Handlers)

#### Bundle Management
- `get-all-bundles`: Fetch all visible bundles
- `get-bundle-by-id`: Fetch single bundle with full component details
- `search-bundles`: Search bundles by name or SKU
- `create-bundle`: Create new bundle with validation
- `update-bundle`: Edit existing bundle
- `delete-bundle`: Soft delete bundle (return reserved inventory)
- `get-bundle-availability`: Check if bundle can be created with current stock

#### Inventory Queries
- `get-inventory-reserved-quantity`: Calculate reserved quantity for a product
- `get-inventory-with-availability`: Get inventory items with available/reserved breakdown
- `get-bundles-using-product`: Get list of bundles that use a specific product

#### Sales
- `validate-bundle-sale`: Check if bundle can be sold (stock validation)
- Update `create-sale`: Handle bundle items differently (create parent + children)

### UI Components

#### 1. Inventory Page Updates
**Location**: `/src/pages/InventoryPage.jsx`

- Add "Create Bundle" button next to "Receive Inventory"
- Update inventory table to show:
  - Bundle indicator (icon/badge) for bundle products
  - Available vs Reserved quantities for regular products
  - Tooltip showing bundle reservations
- Add bundle-specific actions (Edit Bundle, Delete Bundle)

#### 2. Create/Edit Bundle Modal
**New Component**: `/src/components/inventory/BundleModal.jsx`

- Bundle information fields (name, SKU)
- Component product selector:
  - Search/autocomplete for products
  - Quantity input per product
  - Show available quantity for each product
  - Remove component button
- Price section:
  - Show auto-calculated price
  - Override checkbox + custom price input
- Availability check:
  - "You can create X bundles with current inventory"
  - Warning if insufficient stock
- Bundle quantity input
- Create/Update button

#### 3. Inventory Table Component Updates
**Location**: `/src/components/inventory/InventoryTable.jsx`

- Add "Type" column (Product/Bundle)
- Update "Quantity" column:
  - For products: "10 total (6 available, 4 reserved)"
  - For bundles: "5 bundles"
- Add hover tooltip for reserved quantities
- Update action buttons based on type

#### 4. Product Selection in Sales
**Location**: `/src/components/sales/ProductsSection.jsx`

- Include bundles in product autocomplete
- Visual indicator for bundles in dropdown
- Show bundle components when selected
- Display availability warning if applicable

#### 5. Cart Display Updates
**Location**: `/src/components/sales/CartSummary.jsx`

- Bundle items show expandable/collapsible component list
- Indented display of components

#### 6. Receipt Updates
**Location**: `/src/components/sales/Receipt.jsx`

- Format bundle items with component list underneath
- Indented component display

### Implementation Steps

#### Phase 1: Database & Backend (Priority 1)
1. Add bundles table to database schema
2. Create IPC handlers for bundle CRUD operations
3. Implement inventory reservation calculations
4. Update sale creation handler to support bundles

#### Phase 2: Bundle Management UI (Priority 2)
5. Create BundleModal component
6. Update InventoryPage with bundle management
7. Update InventoryTable to show availability/reserved
8. Add bundle search functionality

#### Phase 3: Sales Integration (Priority 3)
9. Update ProductsSection to include bundles
10. Update cart to display bundle components
11. Update sale creation flow to handle bundles
12. Add stock validation warnings

#### Phase 4: Display & Reporting (Priority 4)
13. Update Receipt component for bundles
14. Update sales history to show bundles correctly
15. Update inventory reports
16. Add profit calculation for bundles

#### Phase 5: Edge Cases & Polish (Priority 5)
17. Handle bundle deletion (return inventory)
18. Handle bundle editing (recalculate reservations)
19. Add tooltips showing bundle reservations
20. Testing & bug fixes

## Test Scenarios

### Happy Path
1. Create bundle with 3 hairsprays, 1 root boost, 1 dry shampoo (qty: 3)
2. Verify inventory shows reserved quantities
3. Sell 1 bundle
4. Verify bundle quantity reduced and component inventory reduced
5. Verify receipt shows bundle with components

### Edge Cases
1. Try to sell bundle with insufficient component stock (should warn but allow)
2. Delete bundle and verify inventory returned
3. Edit bundle and verify reservations recalculated
4. Create bundle with product that's already mostly reserved
5. Try to sell more individual products than available (reserved should block)

## Example Use Case

**Scenario**: Holiday Gift Basket

**Components**:
- Hairspray (SKU: HS-001): $15 each, 10 in stock
- Root Boost (SKU: RB-001): $12 each, 8 in stock
- Dry Shampoo (SKU: DS-001): $18 each, 6 in stock

**Bundle Creation**:
- Name: "Holiday Gift Basket"
- SKU: BUNDLE-HOLIDAY-001
- Components: 3x Hairspray, 1x Root Boost, 1x Dry Shampoo
- Calculated Price: (3×$15) + $12 + $18 = $75
- Override Price: $60 (20% discount)
- Quantity to Create: 3 bundles

**After Creation**:
- Hairspray: 10 total (1 available, 9 reserved)
- Root Boost: 8 total (5 available, 3 reserved)
- Dry Shampoo: 6 total (3 available, 3 reserved)
- Holiday Gift Basket: 3 bundles available at $60 each

**After Selling 1 Bundle**:
- Hairspray: 7 total (1 available, 6 reserved in 2 bundles)
- Root Boost: 7 total (5 available, 2 reserved in 2 bundles)
- Dry Shampoo: 5 total (3 available, 2 reserved in 2 bundles)
- Holiday Gift Basket: 2 bundles available

**Profit Calculation for 1 Bundle**:
- Sale Price: $60
- Cost: (3×$purchasePrice_HS) + $purchasePrice_RB + $purchasePrice_DS
- Profit: $60 - Cost
