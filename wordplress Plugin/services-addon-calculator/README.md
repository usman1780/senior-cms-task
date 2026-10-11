# Services Add-on Calculator

A lightweight WordPress plugin that registers a **Services** custom post type, shows the 3 most recently updated services on the front end, and lets visitors toggle optional add-ons to see a **live estimated price**.

---

## Features

- Custom post type **Services** with two custom meta fields:
  - `base_price` (decimal)
  - `delivery_time_days` (integer)
- Shortcode `[recent_services]` that fetches the **3 most recently updated** services using `WP_Query` (`orderby = modified`).
- Client-side calculator written in **vanilla JavaScript**. Ticking an add-on updates the price instantly, with no page reload.
- Security:
  - No raw SQL, only `WP_Query` and `get_post_meta` / `update_post_meta`
  - Nonce, capability check and sanitization on save
  - All output escaped with `esc_html()` / `esc_attr()`
  - Assets registered with `wp_register_script` / `wp_register_style` and loaded with `wp_enqueue_*` only on pages that use the shortcode

---

## Requirements

- WordPress 6.3 or higher (uses the `strategy` / `in_footer` script arguments)
- PHP 7.4 or higher

---

## Folder Structure

```
services-addon-calculator/
├── services-addon-calculator.php
├── README.md
└── assets/
    ├── calculator.js
    └── calculator.css
```

---

## Installation

1. Copy the `services-addon-calculator` folder into `wp-content/plugins/`.
   (Or zip the folder and use **Plugins → Add New → Upload Plugin**.)
2. Go to **Plugins** in the WordPress admin and click **Activate** on *Services Add-on Calculator*.
3. A new **Services** menu (hammer icon) appears in the admin sidebar.

---

## How to Use

### Step 1: Add Services

1. Go to **Services → Add New**.
2. Enter a **title** (for example, "Logo Design").
3. Scroll down to the **Service Details** box and fill in:
   - **Base Price ($)**, for example `100`
   - **Delivery Time (days)**, for example `3`
4. Click **Publish** (or **Update**).

> If you don't see the *Service Details* box, click the **⋮** menu at the top right of the editor, go to **Preferences → Panels**, and enable **Service Details**.

Repeat for as many services as you like. Only the 3 most recently *updated* ones are shown on the front end.

### Step 2: Show Services on a Page

1. Create or edit any page or post.
2. Add a **Shortcode** block (or paste into the classic editor):

   ```
   [recent_services]
   ```
3. Publish the page and open it.

### Step 3: Use the Calculator

Each service card shows its title, delivery time and the add-ons. Tick or untick an add-on and the **Estimated** price updates immediately:

| Add-on              | Price |
|---------------------|-------|
| Priority Turnaround | +$50  |
| Extra Revision      | +$20  |
| 30-Day Support      | +$30  |

Example: base price `$100` + Priority Turnaround + 30-Day Support = **$180.00**

---

## Customizing Add-ons

Open `services-addon-calculator.php` and find the `$addons` array inside the shortcode:

```php
$addons = [
    'priority' => ['label' => 'Priority Turnaround', 'price' => 50],
    'revision' => ['label' => 'Extra Revision',      'price' => 20],
    'support'  => ['label' => '30-Day Support',      'price' => 30],
];
```

Edit labels and prices, or add a new line. The calculator picks up changes automatically, as the JavaScript reads each price from the checkbox's `data-price` attribute.

---

## How Updates Are Ordered

Services are sorted by **last modified date**, not by creation date. If you edit and update an older service, it moves to the top of the list.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Front end shows `Delivery: 0 days` and `$0.00` | The service has no saved meta. Open it in the admin, fill in *Service Details* and click **Update**. |
| *Service Details* box is missing | Enable it from **⋮ → Preferences → Panels**. |
| Values don't appear in `wp_postmeta` | Make sure the plugin is active, then re-save the service. Check `wp-content/debug.log` for the line `SAC save fired`. |
| Calculator doesn't update | Confirm `[recent_services]` is on the page and that `assets/calculator.js` loads (check the browser's Network tab). |
| "No services found." message | No published Services exist yet. Add at least one. |
| Services page 404 | Go to **Settings → Permalinks** and click **Save Changes** once. |

### Enable debug logging (optional)

Add to `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Logs are written to `wp-content/debug.log`. Remember to remove the `error_log(...)` line from the `save_post_service` function and turn debugging off before going live.

---

## Security Notes

- Saving meta requires a valid nonce (`sac_nonce`) and the `edit_post` capability.
- Autosaves and revisions are ignored.
- Numeric values are cast with `(float)` and `absint()` before being stored.
- All values printed on the front end go through `esc_html()` or `esc_attr()`.

---

## Possible Improvements

- Convert the shortcode into a dynamic Gutenberg block (`block.json` + `render_callback`)
- Move add-ons into an admin settings page or per-service meta
- Save the visitor's selected quote to the database (AJAX + nonce)

---

## Uninstall

Deactivate and delete the plugin from **Plugins**. Service posts and their meta remain in the database. Delete them from **Services → Trash** if you no longer need them.

---

## License

GPL-2.0-or-later
