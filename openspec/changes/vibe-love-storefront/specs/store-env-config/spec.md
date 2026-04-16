## ADDED Requirements

### Requirement: Store key read from environment variable
The CT store key used in all API call paths SHALL be read from the `NEXT_PUBLIC_CTP_STORE_KEY` environment variable. The value SHALL NOT be hardcoded anywhere in the application source code.

#### Scenario: Store key env var is set
- **WHEN** the application starts with `NEXT_PUBLIC_CTP_STORE_KEY=home-accessories-store` in the environment
- **THEN** all CT API calls use `/in-store/key=home-accessories-store/` as the path prefix

#### Scenario: Changing store key causes all calls to use new store
- **WHEN** `NEXT_PUBLIC_CTP_STORE_KEY` is changed to a different store key value and the application is restarted
- **THEN** all CT API calls use the new store key without any code changes

### Requirement: Missing store key env var does not silently fail
If `NEXT_PUBLIC_CTP_STORE_KEY` is not set, the application SHALL either fall back to non-store-scoped API calls (for backwards compatibility with a non-store deployment) or surface an error at startup, rather than silently sending malformed API paths.

#### Scenario: Store key env var is absent
- **WHEN** the application starts without `NEXT_PUBLIC_CTP_STORE_KEY` set
- **THEN** CT API calls either omit the store path prefix entirely (non-store mode) or the application logs a clear error identifying the missing variable
