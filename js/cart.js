/**
 * PrintBuddy cart
 *
 * Universal client-side cart for any store theme. No backend required —
 * checkout submits to a Netlify Form named "checkout".
 *
 * Theme integration:
 *   1. <link rel="stylesheet" href="/js/cart.css">
 *   2. Each photo card markup:
 *        <div data-photo-card data-cart-id="anna-mori-1">
 *          <img/div data-photo-slot="0">  ← image source
 *          <span data-photo-title="0">    ← title source
 *          <span data-photo-price="0">    ← price source
 *          ...
 *          <button data-cart-add>Add</button>
 *        </div>
 *      The cart auto-derives item id, title, price, and image from the card.
 *   3. Cart toggle (in your header):
 *        <a data-cart-toggle>CART (<span data-cart-count>0</span>)</a>
 *   4. <script src="/js/cart.js"></script>
 *
 * Optional:
 *   <body data-store="anna-mori">     — namespaces the cart per store
 *   <body data-pb-cart-theme="dark">  — dark drawer/modal
 */

(function () {
    'use strict';

    // ── Storage ────────────────────────────────────────────
    const storeKey = () => {
        const ns = document.body.dataset.store
            || (location.pathname.split('/').pop() || 'default').replace(/\.html?$/, '');
        return `pb:cart:${ns}`;
    };

    const load = () => {
        try { return JSON.parse(localStorage.getItem(storeKey())) || []; }
        catch { return []; }
    };

    const save = items => {
        localStorage.setItem(storeKey(), JSON.stringify(items));
    };

    // ── Helpers ─────────────────────────────────────────────
    const parsePrice = (str) => {
        if (str == null) return null;
        const n = String(str).replace(/[^\d.,]/g, '').replace(',', '.');
        const v = parseFloat(n);
        return isNaN(v) ? null : v;
    };

    const formatPrice = (n, sample) => {
        // try to mimic the sample's format (e.g. "3 200 ₽" or "¥ 3,200" or "€ 320")
        if (sample == null) return String(n);
        const m = String(sample).match(/(\D*)([\d.,\s]+)(\D*)/);
        if (!m) return String(n);
        const [, prefix, , suffix] = m;
        const grouped = Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');
        return `${prefix}${grouped}${suffix}`;
    };

    const itemFromCard = (card) => {
        const id = card.dataset.cartId
            || `${storeKey()}:${[...card.parentNode.children].indexOf(card)}`;

        const titleEl = card.querySelector('[data-photo-title], [data-cart-title]');
        const priceEl = card.querySelector('[data-photo-price], [data-cart-price]');
        const imgEl   = card.querySelector('[data-photo-slot], [data-cart-image]');

        const title = titleEl ? titleEl.textContent.trim() : 'Untitled';
        const priceText = priceEl ? priceEl.textContent.trim() : '';
        const priceNum = parsePrice(priceText);

        let image = '';
        if (imgEl) {
            const bg = imgEl.style.backgroundImage || getComputedStyle(imgEl).backgroundImage;
            const m = bg.match(/url\(["']?(.+?)["']?\)/);
            if (m) image = m[1];
        }

        return {
            id, title, image,
            price: priceNum,
            priceFormat: priceText,
            qty: 1
        };
    };

    // ── Cart core ──────────────────────────────────────────
    const Cart = {
        items: load(),

        save() { save(this.items); this.render(); },

        add(item) {
            const ex = this.items.find(i => i.id === item.id);
            if (ex) ex.qty++;
            else this.items.push({ ...item, qty: 1 });
            this.save();
            this.pulseCount();
        },

        remove(id) {
            this.items = this.items.filter(i => i.id !== id);
            this.save();
        },

        setQty(id, qty) {
            const it = this.items.find(i => i.id === id);
            if (!it) return;
            if (qty <= 0) return this.remove(id);
            it.qty = qty;
            this.save();
        },

        clear() {
            this.items = [];
            this.save();
        },

        count() {
            return this.items.reduce((s, i) => s + i.qty, 0);
        },

        total() {
            return this.items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
        },

        // ── Rendering ──
        render() {
            // Update count badges
            const c = this.count();
            document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = c);

            // Drawer body
            const body = document.querySelector('.pb-cart-body');
            const foot = document.querySelector('.pb-cart-foot');
            if (!body) return;

            if (!this.items.length) {
                body.innerHTML = `<div class="pb-cart-empty">Корзина пуста.<br>Добавьте принт со страницы магазина.</div>`;
                foot.style.display = 'none';
                return;
            }

            const sample = this.items[0].priceFormat;
            body.innerHTML = this.items.map(i => `
                <div class="pb-cart-item" data-id="${escapeHtml(i.id)}">
                    <div class="pb-cart-item-img" style="background-image:url('${escapeAttr(i.image)}')"></div>
                    <div class="pb-cart-item-info">
                        <div class="pb-cart-item-title">${escapeHtml(i.title)}</div>
                        <div class="pb-cart-item-meta">${escapeHtml(i.priceFormat || '')}</div>
                        <div class="pb-cart-qty">
                            <button data-act="dec" aria-label="−">−</button>
                            <span>${i.qty}</span>
                            <button data-act="inc" aria-label="+">+</button>
                        </div>
                    </div>
                    <div class="pb-cart-item-side">
                        <div class="pb-cart-item-price">${escapeHtml(formatPrice(i.price * i.qty, sample))}</div>
                        <button class="pb-cart-remove" data-act="rm">убрать</button>
                    </div>
                </div>
            `).join('');

            const totalEl = document.querySelector('.pb-cart-total');
            if (totalEl) totalEl.textContent = formatPrice(this.total(), sample);
            foot.style.display = '';
        },

        pulseCount() {
            document.querySelectorAll('[data-cart-count]').forEach(el => {
                el.classList.remove('pb-cart-pulse');
                void el.offsetWidth;
                el.classList.add('pb-cart-pulse');
            });
        },

        open() { document.documentElement.classList.add('pb-cart-open'); this.render(); },
        close() { document.documentElement.classList.remove('pb-cart-open'); }
    };

    // ── DOM scaffolding ────────────────────────────────────
    function injectDrawer() {
        if (document.querySelector('.pb-cart-drawer')) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <div class="pb-cart-overlay" data-cart-close></div>
            <aside class="pb-cart-drawer" role="dialog" aria-label="Корзина">
                <div class="pb-cart-head">
                    <h2>Корзина</h2>
                    <button class="pb-cart-close" data-cart-close aria-label="Закрыть">×</button>
                </div>
                <div class="pb-cart-body"></div>
                <div class="pb-cart-foot">
                    <div class="pb-cart-totals">
                        <span class="pb-cart-total-label">Итого</span>
                        <span class="pb-cart-total"></span>
                    </div>
                    <button class="pb-cart-checkout" data-cart-checkout>Оформить заказ</button>
                    <p class="pb-cart-foot-note">Оплата не списывается. Менеджер свяжется с вами в течение суток.</p>
                </div>
            </aside>

            <div class="pb-cart-modal-bg" data-cart-modal-close>
                <div class="pb-cart-modal" role="dialog" aria-label="Оформление заказа">
                    <div class="pb-cart-modal-form-wrap"></div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    }

    function renderCheckoutForm() {
        const wrap = document.querySelector('.pb-cart-modal-form-wrap');
        if (!wrap) return;
        const sample = (Cart.items[0] || {}).priceFormat;
        const summary = Cart.items.map(i =>
            `<div class="pb-cart-summary-row"><span>${escapeHtml(i.title)} × ${i.qty}</span><span>${escapeHtml(formatPrice((i.price || 0) * i.qty, sample))}</span></div>`
        ).join('') + `<div class="pb-cart-summary-row pb-cart-summary-total"><span>Итого</span><span>${escapeHtml(formatPrice(Cart.total(), sample))}</span></div>`;

        const storeName = (document.body.dataset.store || (location.pathname.split('/').pop() || '').replace(/\.html?$/, ''));
        const orderJson = JSON.stringify(Cart.items.map(i => ({
            id: i.id, title: i.title, price: i.price, qty: i.qty
        })));

        wrap.innerHTML = `
            <h3>Оформление заказа</h3>
            <p class="pb-cart-modal-sub">Оплата не списывается. Менеджер свяжется с вами и согласует доставку и способ оплаты.</p>
            <div class="pb-cart-summary">${summary}</div>
            <form class="pb-cart-form" name="checkout" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="bot-field" novalidate>
                <input type="hidden" name="form-name" value="checkout">
                <input type="hidden" name="store" value="${escapeAttr(storeName)}">
                <input type="hidden" name="order_json" value='${escapeAttr(orderJson)}'>
                <input type="hidden" name="order_total" value="${Cart.total()}">
                <p style="display:none"><label>Не заполнять: <input name="bot-field"></label></p>

                <div class="pb-cart-field">
                    <label>Имя</label>
                    <input type="text" name="name" required autocomplete="name">
                </div>
                <div class="pb-cart-field">
                    <label>Email</label>
                    <input type="email" name="email" required autocomplete="email">
                </div>
                <div class="pb-cart-field">
                    <label>Телефон / Telegram</label>
                    <input type="text" name="phone" required autocomplete="tel">
                </div>
                <div class="pb-cart-field">
                    <label>Комментарий <span style="text-transform:none;letter-spacing:0">(необязательно)</span></label>
                    <textarea name="message" rows="2"></textarea>
                </div>

                <div class="pb-cart-modal-actions">
                    <button type="button" data-cart-modal-close>Назад</button>
                    <button type="submit" class="pb-cart-submit">Отправить заявку</button>
                </div>
            </form>
        `;
    }

    function renderSuccess(submittedEmail) {
        const wrap = document.querySelector('.pb-cart-modal-form-wrap');
        if (!wrap) return;
        const safeEmail = submittedEmail ? escapeHtml(submittedEmail) : '';
        wrap.innerHTML = `
            <div class="pb-cart-success">
                <div class="pb-cart-success-icon">✓</div>
                <h3>Спасибо, заявка получена!</h3>
                <p>Мы свяжемся с вами в течение&nbsp;1 рабочего дня${safeEmail ? ` по адресу <strong>${safeEmail}</strong>` : ''}, чтобы согласовать формат печати, доставку и оплату.</p>
                <p class="pb-cart-success-quiet">Если в течение суток ответа нет&nbsp;— напишите нам напрямую, иногда письма теряются.</p>
                <button class="pb-cart-checkout" data-cart-modal-close>Понятно, закрыть</button>
            </div>
        `;
        // Close the cart drawer behind the modal so user sees a clean confirmation
        Cart.close();
    }

    // ── Config loader (cached) ─────────────────────────────
    let _configPromise = null;
    function getConfig() {
        if (!_configPromise) {
            _configPromise = fetch('/config.json', { cache: 'no-cache' })
                .then(r => r.ok ? r.json() : {})
                .catch(() => ({}));
        }
        return _configPromise;
    }

    async function postToGoogleSheet(url, form) {
        const data = Object.fromEntries(new FormData(form));
        // Add metadata not present in the form
        const portfolio = (new URLSearchParams(location.search).get('portfolio')) || '';
        const payload = {
            ...data,
            portfolio,
            user_agent: navigator.userAgent
        };
        try {
            // text/plain to avoid CORS preflight (Apps Script allows simple requests)
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
                redirect: 'follow'
            });
            return res.ok;
        } catch (err) {
            console.warn('[cart] google-sheets webhook failed:', err);
            return false;
        }
    }

    async function postToNetlifyForms(form) {
        const data = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of data) params.append(k, v);
        try {
            const res = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            return res.ok;
        } catch (err) {
            console.warn('[cart] netlify forms submit failed:', err);
            return false;
        }
    }

    // ── Form submission ───────────────────────────────────
    async function submitCheckout(form) {
        const cfg = await getConfig();
        const sheetUrl = cfg?.checkout?.google_sheets_webhook;
        const isLocal = /^(localhost|127\.|\[?::1)/.test(location.hostname);

        // Local dev: log instead of hitting external services (sheet webhook still
        // works from localhost since CORS is bypassed by text/plain — opt in by
        // setting ?live=1 to actually send during local testing).
        const live = new URLSearchParams(location.search).get('live') === '1';

        if (isLocal && !live) {
            console.info('[cart] would submit:', Object.fromEntries(new FormData(form)));
            const log = JSON.parse(localStorage.getItem('pb:orders:log') || '[]');
            log.unshift({ ts: new Date().toISOString(), data: Object.fromEntries(new FormData(form)) });
            localStorage.setItem('pb:orders:log', JSON.stringify(log.slice(0, 20)));
            return true;
        }

        // Fire both in parallel; succeed if either lands.
        const targets = [];
        targets.push(postToNetlifyForms(form));
        if (sheetUrl) targets.push(postToGoogleSheet(sheetUrl, form));

        const results = await Promise.all(targets);
        return results.some(Boolean);
    }

    // ── Event delegation ───────────────────────────────────
    function bind() {
        document.addEventListener('click', async (e) => {
            // Add to cart
            const addBtn = e.target.closest('[data-cart-add]');
            if (addBtn) {
                e.preventDefault();
                const card = addBtn.closest('[data-photo-card], [data-cart-card]');
                if (!card) return;
                const item = itemFromCard(card);
                Cart.add(item);
                addBtn.classList.add('pb-added');
                const labelEl = addBtn.querySelector('.pb-cart-add-label');
                const old = labelEl ? labelEl.textContent : addBtn.textContent;
                if (labelEl) labelEl.textContent = 'В корзине';
                else addBtn.textContent = '✓ В корзине';
                setTimeout(() => {
                    addBtn.classList.remove('pb-added');
                    if (labelEl) labelEl.textContent = old;
                    else addBtn.textContent = old;
                }, 1400);
                return;
            }

            // Open cart
            if (e.target.closest('[data-cart-toggle]')) {
                e.preventDefault();
                Cart.open();
                return;
            }

            // Close drawer
            if (e.target.closest('[data-cart-close]')) {
                Cart.close();
                return;
            }

            // Item qty / remove
            const qtyBtn = e.target.closest('.pb-cart-item [data-act]');
            if (qtyBtn) {
                const id = qtyBtn.closest('.pb-cart-item').dataset.id;
                const it = Cart.items.find(i => i.id === id);
                if (!it) return;
                const act = qtyBtn.dataset.act;
                if (act === 'inc') Cart.setQty(id, it.qty + 1);
                else if (act === 'dec') Cart.setQty(id, it.qty - 1);
                else if (act === 'rm') Cart.remove(id);
                return;
            }

            // Checkout open
            if (e.target.closest('[data-cart-checkout]')) {
                if (!Cart.items.length) return;
                renderCheckoutForm();
                document.querySelector('.pb-cart-modal-bg').classList.add('pb-cart-modal-open');
                return;
            }

            // Modal close
            if (e.target.matches('[data-cart-modal-close]') || e.target.closest('[data-cart-modal-close]')) {
                if (e.target.classList.contains('pb-cart-modal-bg') || e.target.closest('button')) {
                    document.querySelector('.pb-cart-modal-bg').classList.remove('pb-cart-modal-open');
                }
            }
        });

        // Form submit
        document.addEventListener('submit', async (e) => {
            const form = e.target.closest('.pb-cart-form');
            if (!form) return;
            e.preventDefault();
            const submitBtn = form.querySelector('.pb-cart-submit');

            // simple HTML5 validation
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка…';

            const submittedEmail = form.querySelector('[name="email"]')?.value || '';
            const ok = await submitCheckout(form);
            if (ok) {
                Cart.clear();
                renderSuccess(submittedEmail);
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить заявку';
                alert('Не удалось отправить заявку. Попробуйте ещё раз или напишите на почту магазина.');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelector('.pb-cart-modal-bg.pb-cart-modal-open')?.classList.remove('pb-cart-modal-open');
                Cart.close();
            }
        });
    }

    // ── Tiny escapers ──────────────────────────────────────
    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

    // ── Init ───────────────────────────────────────────────
    function init() {
        injectDrawer();
        bind();
        Cart.render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // expose for debugging
    window.PBCart = Cart;
})();
