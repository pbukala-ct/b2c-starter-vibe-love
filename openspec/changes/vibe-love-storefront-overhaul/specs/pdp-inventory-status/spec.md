## ADDED Requirements

### Requirement: Available quantity exposed in product data
The `Variant` type SHALL include `availableQuantity?: number` and the product mapper SHALL populate it from CT's `ProductVariantAvailability.availableQuantity`.

#### Scenario: Mapper passes through quantity
- **WHEN** CT returns a variant with `availability.availableQuantity = 5`
- **THEN** the mapped variant has `availability.availableQuantity = 5`

### Requirement: Inventory status indicator on PDP
The PDP SHALL display a stock status indicator below the variant selector and above the add-to-cart button. The indicator SHALL use the following logic:

- `isOnStock = true` AND (`availableQuantity` is undefined OR `availableQuantity >= 10`): display **"In stock"** in sage/green
- `isOnStock = true` AND `1 <= availableQuantity <= 9`: display **"Low stock — only N left"** in amber/warning tone
- `isOnStock = false` OR `availableQuantity = 0`: display **"Out of stock"** in muted/red tone

#### Scenario: High stock product
- **WHEN** a user views a PDP for a product with `availableQuantity >= 10` or no quantity data
- **THEN** a green "In stock" indicator is displayed

#### Scenario: Low stock product
- **WHEN** a user views a PDP for a product with `availableQuantity` between 1 and 9 (inclusive)
- **THEN** an amber indicator displays "Low stock — only N left" where N is the exact quantity

#### Scenario: Out of stock product
- **WHEN** a user views a PDP for a product with `isOnStock = false`
- **THEN** a muted "Out of stock" indicator is displayed and the add-to-cart button is disabled
