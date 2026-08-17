# Reference Website UI Specification

## Goal

Recreate the overall layout, spacing, responsiveness, hierarchy, and visual feel of the provided reference image.

This is a clean, modern creative-agency / digital-studio landing page shown in three responsive breakpoints:

- wide desktop
- medium/tablet
- narrow mobile

The implementation should not copy the exact text, branding, or imagery from the reference. Use the image only as a structural and visual reference.

## Overall Visual Style

The site should feel:

- clean
- premium
- modern
- lightweight
- editorial
- spacious
- professional
- agency-oriented

Avoid:

- heavy dark UI
- glassmorphism
- excessive gradients
- oversized rounded cards
- generic SaaS dashboard styling
- neon Web3 aesthetics
- dense layouts

The page uses a mostly white background with occasional very pale blue/lavender sections.

Primary accent color:

- bright royal / electric blue

Supporting accents:

- pale blue
- pale lavender
- soft green
- soft pink
- soft gray

Typography should be a modern sans-serif with:

- bold, compact headings
- high contrast between headings and body text
- relatively small body copy
- generous white space

## Responsive Layout

### Desktop

- centered page container
- max-width roughly `1100px–1200px`
- wide horizontal sections
- 3-column and 4-column content grids
- large hero area
- generous vertical spacing

### Tablet / Medium

- narrower centered layout
- cards reduce in width
- some 3-column sections collapse to 2 columns where needed
- typography scales down moderately
- spacing remains generous

### Mobile

- single-column stack
- large centered headings
- compact navigation
- cards stack vertically
- horizontal carousels may become swipeable
- images and content blocks become full-width
- CTAs remain easy to tap
- footer becomes vertically stacked

The mobile version should feel intentionally designed, not just squeezed desktop content.

# Page Structure

## 1. Header / Navigation

A slim navigation bar at the top.

### Desktop

Structure:

- logo on the left
- 4–5 text navigation links centered/right
- one small primary CTA button on the far right

Visual style:

- white background
- no heavy border
- compact height
- subtle typography
- blue CTA button
- slightly rounded button, not pill-like
- restrained spacing

### Mobile

- logo on the left
- compact menu/hamburger or simplified actions on the right
- avoid forcing full desktop navigation into one row

## 2. Hero Section

Large centered intro area.

### Composition

- small eyebrow / category text above
- large bold multiline headline
- short centered paragraph underneath
- primary blue CTA button
- optional small icon or arrow inside CTA

The headline occupies roughly 2 lines on desktop and more on mobile.

Use a subtle, soft pastel background treatment behind or around the hero, such as:

- faint lavender
- faint blue
- soft blurred shapes
- very light gradient only if subtle

The background should remain mostly white and airy.

### Hero spacing

- large top padding
- generous space between headline, supporting text, and CTA
- centered text block with controlled max-width

## 3. Large Featured Visual / Showcase Card

Immediately below the hero.

A large wide rectangular image or showcase panel.

Characteristics:

- centered
- large width
- dark blue / purple visual content
- slight corner radius
- clean framing
- no excessive shadow

This should feel like a featured project, brand asset, or portfolio showcase.

Below or near the visual, optionally include very small slider dots or carousel indicators.

## 4. “3-Step Process” Section

Centered title introducing a simple workflow.

### Desktop

Use 3 evenly spaced columns.

Each column contains:

- small square icon container
- short bold heading
- 1–2 lines of explanatory text

Use soft icon backgrounds:

- green
- blue
- pink/purple

Keep icons minimal.

### Mobile

Stack the three steps vertically with generous spacing.

## 5. Full-Width CTA Band

A pale blue section stretching across the content width.

Content:

- centered bold headline
- 1–2 lines of supporting text
- small blue CTA button

The section should visually interrupt the white page without becoming visually heavy.

Use:

- very light blue background
- strong centered typography
- plenty of vertical padding

## 6. Services Intro / “What We Do” Section

Centered section heading and small supporting copy.

This should introduce the services area.

Use:

- small eyebrow label
- bold headline
- short centered paragraph

White background.

## 7. Split Image + Services Content

A two-column layout.

### Left

Large image block.

Reference feel:

- creative studio / design workspace imagery
- image occupies roughly 45–50% of row
- square or slightly portrait crop

### Right

Text content with:

- bold section title
- short intro paragraph
- 3 service items

Example categories:

- Web Design
- Digital Marketing
- Production

Each service item should contain:

- bold small heading
- 1–2 lines of supporting text

Do not put each service in a heavy card. Keep the layout editorial and open.

### Mobile

Image first, then text and services stacked.

## 8. Insights / Blog / Knowledge Section

Centered title:

- eyebrow label
- bold heading
- short supporting line

Below it, show content cards.

### Desktop

Use 3–4 cards in a row.

Each card:

- thumbnail image at top
- category label or metadata
- short bold title
- tiny supporting text or date
- optional small arrow/link

Cards should be light and clean.

No huge shadows.

The cards should feel more like editorial tiles than SaaS feature cards.

### Tablet

3 cards may remain visible.

### Mobile

Use:

- 1–2 cards at a time
- horizontal scroll / carousel is acceptable

Include small category filter pills above the cards if desired.

These pills should be compact and subtle.

## 9. Testimonials Section

Centered section.

### Heading

- small eyebrow label
- bold centered title

### Testimonial

Show:

- circular avatar
- customer name
- role/company
- quote text
- 5-star visual below or above quote

The quote should have a lot of white space around it.

Desktop may show partial previous/next testimonials near the edges to imply carousel behavior.

Mobile should show one testimonial clearly.

## 10. Footer

Desktop footer is a thin blue bar / compact horizontal footer.

Mobile footer becomes a larger vertical blue panel.

### Desktop

- blue background
- navigation links
- copyright
- compact height

### Mobile

- blue background
- stacked links
- centered or left-aligned depending on design
- larger vertical padding

# Spacing System

Use generous vertical rhythm.

Suggested section spacing:

```css
Desktop:
section padding-block: 72px–110px

Tablet:
section padding-block: 56px–80px

Mobile:
section padding-block: 42px–64px
```

Container:

```css
max-width: 1180px;
margin-inline: auto;
padding-inline: 20px;
```

Mobile:

```css
padding-inline: 16px;
```

Avoid placing sections too close together.

# Typography

Use a modern sans-serif such as:

- Inter
- Manrope
- Plus Jakarta Sans
- Geist
- DM Sans

Suggested hierarchy:

```css
Hero heading:
desktop: 56–72px
tablet: 44–56px
mobile: 34–42px
font-weight: 700–800
line-height: 1.0–1.1

Section headings:
desktop: 32–44px
mobile: 26–34px
font-weight: 700

Body:
desktop: 15–17px
mobile: 14–16px
line-height: 1.5–1.7

Eyebrow labels:
12–14px
font-weight: 600
letter-spacing: slight
```

# Buttons

Primary CTA:

- royal/electric blue background
- white text
- medium-small size
- slight radius
- optional arrow icon
- no oversized pill shape

Example:

```css
height: 40px–44px;
padding-inline: 18px–22px;
border-radius: 8px–10px;
```

Hover:

- slightly darker blue
- subtle translate or opacity change

Keep interaction restrained.

# Cards

Cards should be minimal.

Use:

- white background
- subtle border
- radius around `10px–14px`
- very subtle shadow or none
- small internal padding

Avoid large “floating” cards everywhere.

The visual reference relies more on layout and white space than card chrome.

# Imagery

Use large visual blocks strategically.

Preferred imagery:

- abstract digital artwork
- branding/mockups
- creative studio scenes
- design/production work
- editorial thumbnails

Main showcase image:

- high contrast
- deep blue/purple
- wide aspect ratio

Services image:

- bright creative studio / workspace style

Blog cards:

- varied but cohesive thumbnails

# Motion

Keep animation subtle.

Allowed:

- fade-up on section reveal
- slight image hover scale
- button hover transitions
- carousel slide transitions
- subtle underline/link motion

Avoid:

- large parallax
- excessive scroll effects
- floating blobs everywhere
- continuous decorative animation

# Accessibility

Implement:

- semantic heading order
- accessible contrast
- button/link focus states
- `alt` text for imagery
- keyboard-accessible navigation
- touch-friendly mobile controls

# Implementation Guidance

Recommended stack:

- React / Next.js
- Tailwind CSS
- responsive CSS grid/flex
- Framer Motion only if needed for subtle animation

Suggested components:

```text
Header
Hero
FeaturedShowcase
ProcessSteps
CTASection
ServicesIntro
ServicesSplit
InsightsSection
InsightCard
Testimonials
Footer
```

# Key Design Rule

The most important thing to reproduce from the reference is not the exact imagery or wording.

Reproduce:

1. the clean white visual system;
2. centered bold hero;
3. large showcase visual;
4. highly spaced sections;
5. simple 3-step process;
6. pale-blue CTA band;
7. editorial split services section;
8. compact blog cards;
9. spacious testimonial section;
10. strong responsive transformation from desktop to mobile.

The final result should feel like the same design language and composition, while remaining original in branding, copy, and imagery.
