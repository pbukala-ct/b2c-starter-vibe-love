## MODIFIED Requirements

### Requirement: Store key injected into all CT API paths
All CT API calls made by the BFF API routes SHALL include the store key as a path segment in the format `/in-store/key=<storeKey>/` before the resource path. The store key SHALL be read from the `NEXT_PUBLIC_CTP_STORE_KEY` environment variable.

When the in-store product search endpoint returns a 404 (store not yet configured in CT), the fallback SHALL use the plain product search body WITHOUT `storeProjection`, ensuring prices are always returned.

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

#### Scenario: Fallback search returns prices when store not configured
- **WHEN** the in-store product search endpoint returns 404 (store not yet in CT)
- **THEN** the fallback search uses the plain request body without `storeProjection`
- **THEN** products are returned with price and availability data intact
