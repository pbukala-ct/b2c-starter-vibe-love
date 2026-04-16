## ADDED Requirements

### Requirement: Serif heading font applied globally
The storefront SHALL load Playfair Display from Google Fonts and apply it to all `h1`, `h2`, and `h3` elements via a `--font-heading` CSS variable in the `@theme` block.

#### Scenario: Product name on PDP uses serif font
- **WHEN** a user visits a product detail page
- **THEN** the product name heading renders in Playfair Display, visually distinct from body text

#### Scenario: Homepage hero headline uses serif font
- **WHEN** a user visits the homepage
- **THEN** the hero headline renders in Playfair Display

### Requirement: Warm charcoal colour token
The `--color-charcoal` token SHALL be `#2c1a10` (warm espresso brown) instead of cold near-black, so that all dark surfaces (top bar, footer, primary buttons) read as warm rather than neutral.

#### Scenario: Footer background is warm dark
- **WHEN** any page is rendered
- **THEN** the footer background has a warm brown/espresso tone, not cold black

#### Scenario: Top bar background is warm dark
- **WHEN** any page is rendered
- **THEN** the header top bar uses the charcoal token and reads as warm, not neutral black

### Requirement: Dusty-rose top bar
The header top bar SHALL use `bg-terra` (dusty rose) as its background colour and SHALL display a Vibe Love brand tagline, not a generic shipping message.

#### Scenario: Top bar colour
- **WHEN** any page is rendered
- **THEN** the top bar background is dusty rose (`#b5768a`), not charcoal

#### Scenario: Top bar text is brand-appropriate
- **WHEN** any page is rendered
- **THEN** the top bar displays a tagline referencing home accessories or the Vibe Love brand (e.g. "Curated home accessories — crafted with love")

### Requirement: Header uses cream background
The main header (below the top bar) SHALL use `bg-cream` as its background, not `bg-white`, to reinforce the warm brand palette.

#### Scenario: Header background on desktop
- **WHEN** any page is rendered on a desktop viewport
- **THEN** the header background is the warm cream colour token, not pure white
