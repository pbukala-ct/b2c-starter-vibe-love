## ADDED Requirements

### Requirement: Store key injected into all CT API paths
All CT API calls made by the BFF API routes SHALL include the store key as a path segment in the format `/in-store/key=<storeKey>/` before the resource path. The store key SHALL be read from the `NEXT_PUBLIC_CTP_STORE_KEY` environment variable.

#### Scenario: Product listing uses store-scoped path
- **WHEN** the PLP API route queries CT for products
- **THEN** the request path includes `/in-store/key=home-accessories-store/` and only products in the store's Product Selection are returned

#### Scenario: PDP uses store-scoped path
- **WHEN** the PDP API route queries CT for a single product by slug
- **THEN** the request path includes `/in-store/key=home-accessories-store/` and the price returned matches the store's price channel

#### Scenario: Cart creation uses store-scoped path
- **WHEN** a cart is created via the cart API route
- **THEN** the POST request path includes `/in-store/key=home-accessories-store/me/carts`

#### Scenario: Cart update uses store-scoped path
- **WHEN** a cart update action (add line item, set shipping address, set shipping method) is submitted
- **THEN** the POST request path includes `/in-store/key=home-accessories-store/`

#### Scenario: Order creation uses store-scoped path
- **WHEN** checkout is confirmed and an order is created from the cart
- **THEN** the POST request path includes `/in-store/key=home-accessories-store/` and the resulting CT order has `storeRef.key = home-accessories-store`

### Requirement: Out-of-selection products return 404
Products that exist in the CT catalogue but are NOT in the `home-accessories-store` Product Selection SHALL not be accessible via any storefront route.

#### Scenario: Direct PDP URL for out-of-selection product
- **WHEN** a user navigates directly to the PDP URL of a product not in the Product Selection
- **THEN** the page returns a 404 response

### Requirement: Store-scoped inventory displayed
Stock availability shown on PDP and in cart SHALL reflect the inventory channel assigned to `home-accessories-store`, not a global aggregate.

#### Scenario: In-stock product shows correct availability
- **WHEN** a product has stock in the store's inventory channel
- **THEN** the PDP displays "In stock" (or equivalent)

#### Scenario: Out-of-stock product shows correct availability
- **WHEN** a product has zero stock in the store's inventory channel
- **THEN** the PDP displays "Out of stock" and the add-to-cart button is disabled
