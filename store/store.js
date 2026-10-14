/*
 * STORE CONFIG — the only place to edit buy links.
 * Keys match data-product on each card in index.html.
 * Replace "#" with a WooCommerce product URL (https://shop.example.com/product/slug/)
 * or a direct add-to-cart URL (https://shop.example.com/checkout/?add-to-cart=PRODUCT_ID).
 * Any product left as "#" stays shown as "Coming soon" with a disabled button.
 */
const STORE_CONFIG = {
  "creator-launch-checklist":   "#",
  "brand-story-playbook":       "#",
  "social-content-vault":       "#",
  "video-hook-templates":       "#",
  "creator-monetization-guide": "#",
  "otv-merch":                  "#",
};

document.querySelectorAll(".product[data-product]").forEach((card) => {
  const url = STORE_CONFIG[card.dataset.product] || "#";
  const btn = card.querySelector(".buy");
  if (!btn) return;
  if (url && url !== "#") {
    btn.href = url;
    btn.removeAttribute("aria-disabled");
    card.classList.add("is-live");
  } else {
    btn.addEventListener("click", (e) => e.preventDefault());
  }
});
