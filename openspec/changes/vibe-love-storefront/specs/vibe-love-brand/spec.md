## ADDED Requirements

### Requirement: Vibe Love logo in header
The site header SHALL display "Vibe Love" as the brand name. No reference to the original brand name SHALL be visible on any page.

#### Scenario: Header logo on all pages
- **WHEN** any page is rendered
- **THEN** the header logo area displays "Vibe Love" text or a Vibe Love wordmark
- **THEN** no text or image referencing the original brand name is visible

### Requirement: Vibe Love colour palette applied globally
All primary UI colours (backgrounds, text, buttons, links, accents) SHALL use the Vibe Love palette — calm, muted, and premium in tone, referencing the aesthetic of myhoneyhome.pl. No original brand colours SHALL appear in the UI.

#### Scenario: Primary button uses Vibe Love colour
- **WHEN** any page containing a primary CTA button is rendered
- **THEN** the button uses the Vibe Love accent colour (not the original brand colour)

#### Scenario: Page background and text use Vibe Love palette
- **WHEN** any page is rendered
- **THEN** the background, body text, and heading colours are from the Vibe Love palette

### Requirement: Homepage hero copy references home accessories
The homepage hero section SHALL display a headline, subheadline, and CTA appropriate to a premium home accessories brand. The copy SHALL NOT reference furniture or any product category unrelated to home accessories.

#### Scenario: Hero headline on homepage
- **WHEN** a user visits the homepage
- **THEN** the hero section displays a headline that communicates the Vibe Love home accessories brand proposition

#### Scenario: Hero CTA on homepage
- **WHEN** a user visits the homepage
- **THEN** the hero section contains a call-to-action that links to the product listing or a featured category
