'use strict';
(function () {
  const imgs = Array.from(document.querySelectorAll('img[data-zoom-src]'));
  if (!imgs.length) return;
  const MIN = 1, MAX = 5, STEP = 1.5;

  const box = document.createElement('div');
  box.className = 'lb';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'lb-title');
  box.innerHTML =
    '<div class="lb-backdrop" data-lb-close></div>' +
    '<div class="lb-panel">' +
      '<div class="lb-bar">' +
        '<p class="lb-title" id="lb-title"></p>' +
        '<div class="lb-tools" role="group" aria-label="Zoom">' +
          '<button type="button" class="lb-btn" data-lb="out" aria-label="Verkleinern">−</button>' +
          '<button type="button" class="lb-btn lb-level" data-lb="reset" aria-label="Zoom zurücksetzen">100 %</button>' +
          '<button type="button" class="lb-btn" data-lb="in" aria-label="Vergrößern">+</button>' +
          '<button type="button" class="lb-btn lb-close" data-lb-close aria-label="Schließen">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="lb-stage" tabindex="0" aria-label="Bildbereich. Pfeiltasten verschieben, Plus und Minus zoomen, 0 setzt zurück.">' +
        '<img class="lb-img" alt="" draggable="false"/>' +
      '</div>' +
      '<p class="lb-caption"></p>' +
    '</div>';
  document.body.appendChild(box);

  const stage = box.querySelector('.lb-stage');
  const big = box.querySelector('.lb-img');
  const title = box.querySelector('.lb-title');
  const caption = box.querySelector('.lb-caption');
  const level = box.querySelector('.lb-level');
  let scale = 1, x = 0, y = 0, opener = null;
  const pointers = new Map();
  let pinchStart = null, dragStart = null;

  function clampPan() {
    const r = stage.getBoundingClientRect();
    const w = big.offsetWidth * scale, h = big.offsetHeight * scale;
    const mx = Math.max(0, (w - r.width) / 2), my = Math.max(0, (h - r.height) / 2);
    x = Math.min(mx, Math.max(-mx, x));
    y = Math.min(my, Math.max(-my, y));
  }
  function apply() {
    clampPan();
    big.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
    level.textContent = Math.round(scale * 100) + ' %';
    stage.classList.toggle('is-zoomed', scale > 1);
    box.querySelector('[data-lb="out"]').disabled = scale <= MIN;
    box.querySelector('[data-lb="in"]').disabled = scale >= MAX;
  }
  function zoomTo(s, cx, cy) {
    s = Math.min(MAX, Math.max(MIN, s));
    if (cx !== undefined) {
      const r = stage.getBoundingClientRect();
      const px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2);
      x = px - (px - x) * (s / scale);
      y = py - (py - y) * (s / scale);
    }
    scale = s;
    if (scale === 1) { x = 0; y = 0; }
    apply();
  }
  function focusables() {
    return Array.from(box.querySelectorAll('button:not([disabled]), [tabindex="0"]'));
  }
  function open(img) {
    opener = img.closest('button') || img;
    big.src = img.getAttribute('data-zoom-src');
    big.alt = img.alt;
    title.textContent = img.getAttribute('data-zoom-title') || img.alt;
    const fc = img.closest('figure') && img.closest('figure').querySelector('figcaption');
    caption.textContent = img.alt + (fc ? ' · ' + fc.textContent.trim() : '');
    scale = 1; x = 0; y = 0; apply();
    box.hidden = false;
    document.documentElement.classList.add('lb-open');
    box.querySelector('.lb-close').focus();
  }
  function close() {
    box.hidden = true;
    document.documentElement.classList.remove('lb-open');
    pointers.clear();
    if (opener) opener.focus();
  }

  imgs.forEach(img => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zoom-trigger';
    btn.setAttribute('aria-label', 'Bild vergrößern: ' + (img.getAttribute('data-zoom-title') || img.alt));
    btn.setAttribute('aria-haspopup', 'dialog');
    img.parentNode.insertBefore(btn, img);
    btn.appendChild(img);
    const hint = document.createElement('span');
    hint.className = 'zoom-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = '⤢ Zoom';
    btn.appendChild(hint);
    btn.addEventListener('click', () => open(img));
  });

  box.addEventListener('click', e => {
    if (e.target.closest('[data-lb-close]')) return close();
    const b = e.target.closest('[data-lb]');
    if (!b) return;
    const a = b.getAttribute('data-lb');
    if (a === 'in') zoomTo(scale * STEP);
    else if (a === 'out') zoomTo(scale / STEP);
    else zoomTo(1);
  });

  box.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); return close(); }
    if (e.key === 'Tab') {
      const f = focusables(); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(scale * STEP); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomTo(scale / STEP); }
    else if (e.key === '0') { e.preventDefault(); zoomTo(1); }
    else if (document.activeElement === stage && scale > 1 && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = 40;
      if (e.key === 'ArrowLeft') x += d; if (e.key === 'ArrowRight') x -= d;
      if (e.key === 'ArrowUp') y += d; if (e.key === 'ArrowDown') y -= d;
      apply();
    }
  });

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    zoomTo(scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
  }, { passive: false });
  stage.addEventListener('dblclick', e => zoomTo(scale > 1 ? 1 : 2.5, e.clientX, e.clientY));

  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), s: scale };
      dragStart = null;
    } else if (pointers.size === 1) {
      dragStart = { px: e.clientX, py: e.clientY, x, y };
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinchStart) {
      const [a, b] = Array.from(pointers.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStart.d > 0) zoomTo(pinchStart.s * d / pinchStart.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (dragStart && scale > 1) {
      x = dragStart.x + e.clientX - dragStart.px;
      y = dragStart.y + e.clientY - dragStart.py;
      apply();
    }
  });
  function up(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 1) {
      const p = Array.from(pointers.values())[0];
      dragStart = { px: p.x, py: p.y, x, y };
    } else if (!pointers.size) dragStart = null;
  }
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  window.addEventListener('resize', () => { if (!box.hidden) apply(); });
})();
