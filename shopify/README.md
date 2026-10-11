# Shopify Bundle Builder Section

An Online Store 2.0 section where customers pick **1 product from each of 3 groups** to build a 3-pack bundle. All 3 items are added to the cart in a single Ajax request, linked by line item properties.

- **Preview:** `https://<your-store>.myshopify.com/?preview_theme_id=<THEME_ID>`
- **Storefront password (if enabled):** `<password>`

**Custom files (everything else is the starter theme):**
- `sections/bundle-builder.liquid`
- `assets/bundle-builder.js`
- `assets/bundle-builder.css`

---

## Part 1: Using the section in the Theme Editor (merchant guide)

### 1. Prepare your products
1. In Shopify admin, go to **Products** and make sure the products you want are **Active**.
2. Under **Sales channels**, make sure each product is available on **Online Store**.
3. (Optional) Create 3 collections, e.g. *Tops*, *Bottoms*, *Accessories* (**Products -> Collections**).

### 2. Open the Theme Editor
1. Go to **Online Store -> Themes**.
2. On your theme, click **Customize**.
3. Use the page picker at the top and open the page where the bundle should appear (Home, or a custom page/template).

### 3. Add the section
1. In the left sidebar click **Add section**.
2. Search for **Bundle builder** and click it.
3. Drag it to the position you want on the page.

### 4. Configure the section
Click **Bundle builder** in the sidebar. Settings:

| Setting | What it does |
|---|---|
| Heading | Title shown above the groups |
| Bundle name | Saved on each cart line as the `Bundle` property (visible at checkout) |
| Button label | Text of the add-to-cart button |
| Bundle discount | Percentage shown in the UI total (display only, see note below) |
| Max products per group | Limits how many products are rendered per group |

For **each of Group 1, 2 and 3**:
- **Title**: heading for that group (e.g. "Pick your top").
- **Collection**: shows all products of the collection.
- **Or specific products**: hand-pick products. If set, this **overrides** the collection.

> Each group needs at least one product. The customer picks exactly one item per group.

### 5. Save and test
1. Click **Save**.
2. Click **Preview** (or open the store URL) and test:
   - Select one item in each group: the bundle total updates.
   - Sold-out items show a "Sold out" badge and cannot be selected.
   - The button stays disabled until all 3 groups have a selection.
   - Click **Add bundle to cart**, then open `/cart` and confirm 3 lines with the `Bundle` property.
3. When happy, click **Publish** (if the theme is not live yet): **Online Store -> Themes -> ... -> Publish**.

### 6. Make the discount real (important)
The discount % in the section is **display only**. To apply it at checkout:
1. Go to **Discounts -> Create discount -> Automatic discount**.
2. Create a percentage discount that matches the section setting, e.g. 10% off, with a minimum quantity of 3 items.
3. For a strict "bundle only" rule, use a Shopify Function that targets cart lines with the `_bundle_id` property.

### Troubleshooting
| Problem | Fix |
|---|---|
| Section not in "Add section" list | Confirm `sections/bundle-builder.liquid` exists and has `presets` in its schema |
| Group is empty | Add a collection/products in the editor; make sure products are on the Online Store channel |
| Total shows "-" | Total appears after selecting an item; do a hard refresh (Ctrl+Shift+R) and check the browser console for errors |
| Item cannot be selected | The variant is sold out (disabled by design) |
| "Could not add the bundle" | A product sold out after page load; nothing was added. Refresh and pick again |

---

## Part 2: Developer setup

```bash
npm install -g @shopify/cli@latest
shopify theme init            # or clone this repo
cd bundle-builder-theme
shopify theme dev --store your-store.myshopify.com
```

Open the local preview (`http://127.0.0.1:9292`) or the theme editor link printed in the terminal.

Push to the store without publishing:
```bash
shopify theme push --unpublished --theme "bundle-builder-theme"
```

## How it works
- Group source: `product_list` (if set) overrides `collection`.
- Each group is a `<fieldset>` of native radio inputs (keyboard + screen reader friendly).
- `POST /cart/add.js` sends all 3 items at once. Shopify handles this atomically: if any item is unavailable, nothing is added.
- Line item properties on every line:
  - `Bundle`: visible bundle name
  - `_bundle_id`: shared ID linking the 3 lines (hidden at checkout because of the `_` prefix)
  - `_bundle_slot`: 1, 2, 3

## Edge cases handled
- Sold-out variants: disabled input and "Sold out" badge
- Stock changes after page load: API error shown in an `aria-live` region
- Network failure: separate message, button re-enabled
- Loading state: `aria-busy` and spinner on the button
- Empty group: friendly message (editor hint in design mode)
- Theme editor re-render: JS re-initialises on `shopify:section:load`

## Accessibility
`fieldset`/`legend` per group, visible focus ring, `role="status"` live region, `aria-disabled` / `aria-busy` on the button, `prefers-reduced-motion` support.

## Limitations
- Uses each product's first available variant (no variant picker yet).
- Discount shown in the UI needs a matching automatic discount for checkout.
