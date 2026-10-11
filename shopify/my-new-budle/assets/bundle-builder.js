/**
 * Bundle Builder - vanilla JS, no dependencies.
 * - Tracks 1 selection per group (native radios = free keyboard support)
 * - Updates total price (cents -> formatted via Intl)
 * - Adds all 3 items in ONE request to /cart/add.js (atomic: all or nothing)
 */
(function () {
  'use strict';

  class BundleBuilder {
    constructor(root) {
      this.root = root;
      this.addUrl = root.dataset.addUrl;
      this.cartUrl = root.dataset.cartUrl;
      this.discount = Number(root.dataset.discount) || 0;
      this.bundleName = root.dataset.bundleName || 'Bundle';
      this.groups = root.querySelectorAll('[data-group]').length;

      this.fmt = new Intl.NumberFormat(root.dataset.locale || undefined, {
        style: 'currency',
        currency: root.dataset.currency || 'USD',
      });

      this.btn = root.querySelector('[data-add]');
      this.label = root.querySelector('[data-btn-label]');
      this.spinner = root.querySelector('[data-spinner]');
      this.totalEl = root.querySelector('[data-total]');
      this.oldEl = root.querySelector('[data-old-total]');
      this.statusEl = root.querySelector('[data-status]');
      this.loading = false;

      // Event delegation: one listener each, not one per product
      root.addEventListener('change', (e) => {
        if (e.target.matches('.bb__radio')) this.update();
      });
      this.btn.addEventListener('click', () => this.addToCart());
    }

    /** Currently checked radio of every group */
    selected() {
      return [...this.root.querySelectorAll('.bb__radio:checked')];
    }

    update() {
      const picks = this.selected();
      const ready = picks.length === this.groups;
      const sum = picks.reduce((t, el) => t + Number(el.dataset.price), 0);

      if (picks.length && this.discount > 0) {
        this.oldEl.hidden = false;
        this.oldEl.textContent = this.fmt.format(sum / 100);
        this.totalEl.textContent = this.fmt.format((sum * (100 - this.discount)) / 10000);
      } else {
        this.oldEl.hidden = true;
        this.totalEl.textContent = picks.length ? this.fmt.format(sum / 100) : '—';
      }

      this.setButton(ready && !this.loading);
      this.say(ready ? '' : `Select ${this.groups - picks.length} more item(s) to complete your bundle.`);
    }

    setButton(enabled) {
      this.btn.disabled = !enabled;
      this.btn.setAttribute('aria-disabled', String(!enabled));
    }

    setLoading(state) {
      this.loading = state;
      this.btn.setAttribute('aria-busy', String(state));
      this.spinner.hidden = !state;
      this.setButton(!state && this.selected().length === this.groups);
    }

    say(msg, isError) {
      this.statusEl.textContent = msg;
      this.statusEl.classList.toggle('bb__status--error', Boolean(isError));
    }

    async addToCart() {
      const picks = this.selected();
      if (picks.length !== this.groups || this.loading) return;

      // Same id on every line links them as one bundle
      const bundleId = `bundle-${Date.now().toString(36)}`;
      const items = picks.map((el, i) => ({
        id: Number(el.value),
        quantity: 1,
        properties: {
          Bundle: this.bundleName, // visible at checkout
          _bundle_id: bundleId, // "_" prefix = hidden from customer
          _bundle_slot: String(i + 1),
        },
      }));

      this.setLoading(true);
      this.say('Adding to cart…');

      try {
        const res = await fetch(this.addUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // 422 e.g. sold out between page load and click: nothing was added
          throw new Error(data.description || data.message || 'Could not add the bundle.');
        }

        this.say('Bundle added to cart.');
        document.dispatchEvent(new CustomEvent('bundle:added', { detail: { bundleId, items } }));
        window.location.assign(this.cartUrl);
      } catch (err) {
        const offline = err instanceof TypeError; // fetch network failure
        this.say(
          offline ? 'Network error. Check your connection and try again.' : err.message,
          true
        );
        this.setLoading(false);
      }
    }
  }

  document.querySelectorAll('[data-bundle-builder]').forEach((el) => new BundleBuilder(el));
})();
