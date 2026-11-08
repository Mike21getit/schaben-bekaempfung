'use strict';
document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('nav-menu');
if (toggle && menu) {
  toggle.hidden = false;
  const close = () => { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('open')) { close(); toggle.focus(); } });
  window.matchMedia('(min-width: 851px)').addEventListener('change', close);
}
