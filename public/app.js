const state = { cart: [], lookbookIndex: 0 };
const sessionId = localStorage.getItem('loom-session') || crypto.randomUUID();
localStorage.setItem('loom-session', sessionId);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function updateCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $('.cart-count').textContent = count;
  $('.drawer-count').textContent = `(${count})`;
  $('.cart-items').innerHTML = state.cart.length ? state.cart.map(item => `<div class="cart-item"><img src="${item.image}" alt="${item.name}" /><div><div class="cart-item-name">${item.name}</div><div class="cart-item-detail">Quantity ${item.quantity}</div></div><span class="cart-item-price">$${item.price}</span></div>`).join('') : '<div class="empty-cart"><span class="empty-mark">L</span><p>Your bag is waiting.</p><button class="text-link" data-close-cart>Continue shopping <span>↗</span></button></div>';
  $('.cart-items').querySelector('[data-close-cart]')?.addEventListener('click', closeCart);
  $('[data-cart-total]').textContent = `$${state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}`;
}

function showToast(message) { const toast = $('[data-toast]'); toast.firstChild.textContent = `${message} `; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
function openCart() { $('[data-cart-drawer]').classList.add('open'); $('[data-overlay]').classList.add('active'); }
function closeCart() { $('[data-cart-drawer]').classList.remove('open'); $('[data-overlay]').classList.remove('active'); }
function addToCart(button) {
  const product = { id: button.closest('[data-product-id]').dataset.productId, name: button.dataset.name, price: Number(button.dataset.price), image: button.dataset.image, quantity: 1 };
  const existing = state.cart.find(item => item.id === product.id);
  existing ? existing.quantity += 1 : state.cart.push(product);
  updateCart(); showToast(`${product.name} added to your bag`);
  fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, product }) }).catch(() => {});
}

$$('[data-add-product]').forEach(button => button.addEventListener('click', () => addToCart(button)));
$('[data-open-cart]').addEventListener('click', openCart); $('[data-close-cart]').addEventListener('click', closeCart); $('[data-overlay]').addEventListener('click', closeCart);

const modal = $('[data-newsletter-modal]');
function openNewsletter() { modal.classList.add('open'); $('[data-overlay]').classList.add('active'); }
function closeNewsletter() { modal.classList.remove('open'); $('[data-overlay]').classList.remove('active'); }
$$('[data-open-newsletter]').forEach(button => button.addEventListener('click', openNewsletter)); $('[data-close-newsletter]').addEventListener('click', closeNewsletter);
$('[data-newsletter-form]').addEventListener('submit', event => { event.preventDefault(); event.currentTarget.innerHTML = '<p class="section-kicker">Welcome to Loom</p><h2>You are<br /><em>on the list.</em></h2><p>We will be in touch soon.</p>'; setTimeout(closeNewsletter, 2600); });

const slides = $$('.look-slide');
function moveLookbook(direction) { state.lookbookIndex = (state.lookbookIndex + direction + slides.length) % slides.length; $('.lookbook-track').style.transform = `translateX(-${state.lookbookIndex * 100}%)`; $('.carousel-index').innerHTML = `0${state.lookbookIndex + 1} <i>/</i> 0${slides.length}`; }
$('[data-lookbook-prev]').addEventListener('click', () => moveLookbook(-1)); $('[data-lookbook-next]').addEventListener('click', () => moveLookbook(1));

const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('revealed'); }), { threshold: .12 });
$$('.reveal-section').forEach((section, index) => { section.style.transitionDelay = `${Math.min(index * 70, 350)}ms`; observer.observe(section); });
if (window.innerWidth > 800) $$('.magnetic').forEach(button => {
  button.addEventListener('mousemove', event => { const box = button.getBoundingClientRect(); button.style.transform = `translate(${(event.clientX - box.left - box.width / 2) * .14}px, ${(event.clientY - box.top - box.height / 2) * .14}px)`; });
  button.addEventListener('mouseleave', () => { button.style.transform = ''; });
});
setTimeout(() => { if (!sessionStorage.getItem('loom-newsletter-seen')) { openNewsletter(); sessionStorage.setItem('loom-newsletter-seen', 'true'); } }, 6500);
updateCart();
