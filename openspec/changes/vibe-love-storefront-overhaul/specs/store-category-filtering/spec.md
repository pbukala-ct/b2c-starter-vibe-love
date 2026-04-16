## ADDED Requirements

### Requirement: Nav categories filtered to store products
When `NEXT_PUBLIC_CTP_STORE_KEY` is set, the MegaMenu and mobile nav SHALL only display categories that contain at least one product in the store-scoped product search results. Categories with no store products SHALL be hidden from navigation.

#### Scenario: MegaMenu hides out-of-store categories
- **WHEN** a user opens the MegaMenu on any page
- **THEN** only categories that have products in the configured store are listed
- **THEN** categories with no store products do not appear

#### Scenario: Mobile nav hides out-of-store categories
- **WHEN** a user opens the mobile menu
- **THEN** only store-relevant categories are listed; irrelevant categories are absent

### Requirement: Homepage category section filtered to store products
The "Shop by Category" section on the homepage SHALL only display categories that have products in the configured store.

#### Scenario: Homepage category grid shows store-relevant categories only
- **WHEN** a user visits the homepage
- **THEN** the category grid displays only categories that contain store products
- **THEN** no categories with zero store products appear in the grid

### Requirement: Fallback to full category tree when no store key set
When `NEXT_PUBLIC_CTP_STORE_KEY` is not set, all categories SHALL be displayed (original behaviour preserved).

#### Scenario: No store key configured
- **WHEN** the storefront runs without `NEXT_PUBLIC_CTP_STORE_KEY`
- **THEN** the full category tree is displayed in the MegaMenu and homepage, unchanged from the original behaviour
