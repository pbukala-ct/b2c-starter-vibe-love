## MODIFIED Requirements

### Requirement: Vibe Love colour palette applied globally
All primary UI colours (backgrounds, text, buttons, links, accents) SHALL use the Vibe Love palette — calm, muted, and premium in tone. The `charcoal` token SHALL be warm espresso (`#2c1a10`), not cold near-black. No original brand colours SHALL appear in the UI.

#### Scenario: Primary button uses Vibe Love colour
- **WHEN** any page containing a primary CTA button is rendered
- **THEN** the button uses the Vibe Love accent colour (dusty rose, `#b5768a`)

#### Scenario: Page background and text use Vibe Love palette
- **WHEN** any page is rendered
- **THEN** the background uses warm cream and text/headings use warm espresso brown, not cold black
