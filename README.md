# TP-LP-5R — Toothpod landing page

Long-form, conversion-focused landing page for Toothpod Dental Smart Gum, built to the
Toothpod Landing Page PRD v1.0. Replaces the homepage as the destination for cold Meta traffic.

## Layout of this repo

| Path | What it is |
|---|---|
| `index.html` | **The whole page** — markup, CSS and JS in one file. No build step. |
| `assets/shoot/` | August 2026 product shoot images, resized to 600px and 1200px WebP (all ≤ 55 KB). |
| `assets/` | Headshots and the Bloomberg logo that aren't on the toothpod.co CDN. Press logos, clinician headshots and the research images still load from `toothpod.co/cdn/shop/files/…`. |
| `scripts/check-compliance.js` | Fails if a banned claim term appears in brand voice, if "Toothpods" appears outside a quote, if age ≠ 12+, if office count ≠ 500+, or if an aggregate rating sneaks in. |
| `scripts/serve.cjs` | Tiny static server for local preview. |

## Local preview

```bash
npm run dev
```

Then open <http://127.0.0.1:5178>. Off-Shopify the add-to-cart button runs in preview mode:
it shows the exact payload it *would* POST to `/cart/add.js` instead of sending it.

## Brand system (matched to toothpod.co)

| Token | Value | Used for |
|---|---|---|
| `--navy` | `#013165` | Primary buttons, selected states, badges, headings on light |
| `--navy-2` | `#002340` | Hero gradient top, dark sections (problem, timeline, close) |
| `--teal` | `#2FDBE4` | Bright cyan accent: promo bar, icons on dark, highlights |
| `--teal-deep` | `#108474` | Eyebrows, checkmarks, small labels on light |
| `--teal-soft` / `--teal-tint` | `#C5F7F0` / `#EDF5F5` | Mint badges, pale aqua section backgrounds (shop) |
| `--ink` / `--muted` | `#121212` / `#43474F` | Body text |

Type is Inter throughout. Headings are regular weight (400) like the live site, with 600 for emphasis.
Buttons are 5px radius, uppercase, weight 600: navy on light backgrounds, white on navy.

## Product / plan configuration

Everything the selector needs lives in `window.TP_CONFIG` at the bottom of `index.html`:

| Key | Value |
|---|---|
| 3 Pack variant | `45027773743276` — $40, was $60, 60 pieces, $0.67/piece |
| 5 Pack variant | `45027773776044` — $80, was $100, 100 pieces, $0.80/piece |
| One time purchase plan | `3311403180` (default) |
| Subscribe & Save plan | `3096707244` (monthly) |
| After add | `/cart` |

Set `plans.otp.id` to `null` to send one-time adds without a `selling_plan`.

## Tracking

Fires only if the host page has already loaded the pixels (`window.fbq` / `window.gtag`).

| Moment | Meta | GA4 |
|---|---|---|
| Page load | `PageView`, `ViewContent` (default variant) | `view_item` |
| Add to cart | `AddToCart` with `content_ids` = variant ID, `value` = tier price | `add_to_cart` |
| Purchase-type toggle | custom `PurchaseTypeToggle` `{purchase_type, tier}` | `purchase_type_toggle` |
| Scroll into `#problem`, `#shop`, `#faq` | custom `ScrollDepth` `{section}` (once each) | `scroll_depth` |
| Any CTA click | — | `cta_click` `{location}` |

## Images from the shoot

| Section | File | Shot |
|---|---|---|
| Hero | `hero` | Open box, "Can't brush? We have you covered." |
| Outcome | `outcome` | Hand pulling a pouch from a bag |
| Sensitivity | `sensitivity` | Dental model beside a pouch |
| Family | `family` | Pouch holding two toothbrushes |
| How to use | `howto` | Taking a piece from the pouch |
| Close | `close` | Box with pouches spilling out |

Originals are 1653×2480 JPGs in the shared Drive folder; the page crops to 4:5 with `object-fit`.

Run the checker any time copy changes:

```bash
npm run check
```
