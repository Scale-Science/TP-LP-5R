# TP-LP-5R — Toothpod landing page

Long-form, conversion-focused landing page for Toothpod Dental Smart Gum, built to the
[Toothpod Landing Page PRD v1.0](https://github.com/Scale-Science/TP-LP-5R). Replaces the
homepage as the destination for cold Meta traffic.

## Layout of this repo

| Path | What it is |
|---|---|
| `index.html` | **Source of truth.** The whole page: markup, CSS and JS in one file. Previewable locally with no build step. |
| `assets/` | The three images not already on the toothpod.co CDN (Heather Alexander headshot, Dr. Mohanta headshot, Bloomberg logo). Everything else loads from `toothpod.co/cdn/shop/files/…`. |
| `scripts/build-shopify.js` | Generates the Shopify theme files under `shopify/` from `index.html`. |
| `scripts/check-compliance.js` | Fails if a banned claim term appears in brand voice, if "Toothpods" appears outside a quote, if age ≠ 12+, if office count ≠ 500+, or if an aggregate rating sneaks in. |
| `scripts/serve.cjs` | Tiny static server for local preview. |
| `shopify/` | **Generated.** Section, layout, template and assets ready to drop into the theme. Don't edit by hand. |

## Local preview

```bash
npm run dev
```

Then open <http://127.0.0.1:5178>. Off-Shopify the add-to-cart button runs in preview mode:
it shows which variant and selling plan it *would* have sent instead of calling `/cart/add.js`.

## Deploying to the Shopify store

1. Build the theme files:

   ```bash
   npm run build
   ```

2. Copy into the live theme (or a duplicate for staging), keeping the paths:

   - `shopify/sections/tp-lp-5r.liquid` → `sections/`
   - `shopify/layout/tp-lp-5r.liquid` → `layout/`
   - `shopify/templates/page.tp-lp-5r.json` → `templates/`
   - `shopify/assets/*` → `assets/`

   With Shopify CLI from inside the theme folder: `shopify theme push --only sections/tp-lp-5r.liquid layout/tp-lp-5r.liquid templates/page.tp-lp-5r.json assets/heather-alexander.webp assets/dr-sanj-mohanta.webp assets/bnn-bloomberg.png`

3. In Shopify admin → Online Store → Pages, create a page (e.g. handle `dental-smart-gum-5r`) and set its
   **Theme template** to `page.tp-lp-5r`. The page body can stay empty; all content is in the section.

4. Point Meta ads at `https://toothpod.co/pages/<handle>`.

The layout intentionally omits the theme header, footer and cart drawer, so the page has one
exit: the cart. A successful add redirects to `/cart`.

## Product / plan configuration

Everything the selector needs lives in `window.TP_CONFIG` at the bottom of `index.html`:

| Key | Value |
|---|---|
| 3 Pack variant | `45027773743276` — $40, was $60, 60 pieces, $0.67/piece |
| 5 Pack variant | `45027773776044` — $80, was $100, 100 pieces, $0.80/piece |
| One time purchase plan | `3311403180` (default) |
| Subscribe & Save plan | `3096707244` (monthly) |
| After add | `/cart` |

The 1-pack (`45027773710508`) and the preorder plan (`1824063660`) are out of scope and not referenced.

**Verify on staging before go-live:** the PRD specifies that one-time purchases send selling plan
`3311403180`. If the store's subscription app rejects a selling plan on a one-time add, set
`plans.otp.id` to `null` and the JS will omit `selling_plan` from the payload.

## Tracking

Fires only if the theme has already loaded the pixels (`window.fbq` / `window.gtag`); the page
never installs its own pixel code.

| Moment | Meta | GA4 |
|---|---|---|
| Page load | `PageView`, `ViewContent` (default variant) | `view_item` |
| Add to cart | `AddToCart` with `content_ids` = variant ID, `value` = tier price | `add_to_cart` |
| Purchase-type toggle | custom `PurchaseTypeToggle` `{purchase_type, tier}` | `purchase_type_toggle` |
| Scroll into `#problem`, `#shop`, `#faq` | custom `ScrollDepth` `{section}` (once each) | `scroll_depth` |
| Any CTA click | — | `cta_click` `{location}` |

## Acceptance criteria → how they're met

| # | Criterion | Where |
|---|---|---|
| 1 | 375px, no horizontal scroll | Checked in browser; `overflow-x:hidden` on body, carousel is the only horizontally scrolling element |
| 2 | Every CTA scrolls to `#shop`, guarantee line in same viewport | All `data-scroll-shop` links; every `.btn` sits in a `.cta-stack` / `.atc` / `.sticky` with the guarantee line directly beneath (`check-compliance.js` counts them) |
| 3 | Defaults to 3 Pack, one-time | `TP_CONFIG.defaults` |
| 4 | Correct variant + selling plan | `addToCart()` posts `{items:[{id, quantity:1, selling_plan}]}` to `/cart/add.js` |
| 5 | Cancel-anytime visible without expanding | `.plan__copy` is always rendered under the toggle |
| 6 | No aggregate rating / review count | None rendered; checker greps for one |
| 7 | Age is 12+ everywhere | Checker |
| 8 | 500+ dental offices everywhere | Checker |
| 9 | No banned term in brand voice | Checker (blockquotes and review cards exempt) |
| 10 | LCP < 2.5s on 4G | Single file, hero image preloaded with `fetchpriority=high`, all other images lazy with explicit dimensions, hero animates via CSS only (not gated on JS) |
| 11 | Sticky mobile ATC after hero, reflects selection | `#sticky`, driven by `IntersectionObserver` on `#hero` and `#shop` |

Run the checker any time copy changes:

```bash
npm run check
```

## Open items (from PRD §8)

- **Family block lifestyle image** — currently uses `IMG-4139.jpg` (hand + pouch over bag) as a stand-in. Swap for the August 2026 photoshoot image once sourced; it's the `<img>` inside `#family .family__media`.
- **BNN Bloomberg logo** — the only file available locally is the plain *Bloomberg* wordmark (`assets/bnn-bloomberg.png`). Replace with the BNN Bloomberg lockup if one exists.
- **Enamel tubules before/after** (`ebb05bc8-dental-tubules-before-after-desktop.webp`) is available on the CDN but not placed; the sensitivity callout is spec'd as a short single card. Easy to add to `#research` if wanted.
