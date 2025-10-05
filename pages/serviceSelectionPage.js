// CUSTOM SERVICE PAGE (Wix Bookings Variant) → push to your custom calendar page
import wixLocation from 'wix-location';
import wixStores from 'wix-stores';

$w.onReady(async () => {
  const ds = await getServiceDataset();     // auto-detect dataset
  if (!ds) { console.warn('No dataset found on this page.'); return; }
  await ds.onReady();

  const item = safeItem(ds.getCurrentItem());
  // Map common Wix Bookings fields (with safe fallbacks)
  const serviceId    = item._id || item.serviceId || item.slug || '';
  const serviceName  = item.title || item.name || item.serviceName || '';
  const price        = num(item.price || item.basePrice || item.pricing?.price || 0);
  const duration     = item.duration || item.durationInMinutes || '';
  const depositAmt   = num(item.deposit || item.depositAmount || 0); // optional
  const depositSku   = item.depositProductId || item.depositSku || ''; // optional Wix Stores product id

  // 1) BOOK NOW → go to your custom calendar with query params
  hookup('#bookingUrl', ($btn) => {
    $btn.link = undefined; // kill any data-linked URL
    $btn.onClick(() => {
      toCalendar({ serviceId, serviceName, price, duration, depositAmt });
    });
  });

  // 2) ADD TO CART (optional) → add deposit product; else fall back to calendar
  hookup('#button1', ($btn) => {
    $btn.link = undefined;
    $btn.onClick(async () => {
      if (depositSku) {
        try {
          await wixStores.cart.addProducts([{ productId: depositSku, quantity: 1 }]);
          wixLocation.to('/cart');
        } catch (e) {
          console.error('Add to cart failed:', e);
          toCalendar({ serviceId, serviceName, price, duration, depositAmt });
        }
      } else {
        // no deposit product configured → just proceed to calendar
        toCalendar({ serviceId, serviceName, price, duration, depositAmt });
      }
    });
  });

  // ——— helpers ———
  function toCalendar({ serviceId, serviceName, price, duration, depositAmt }) {
    const q = new URLSearchParams({
      serviceId: String(serviceId || ''),
      service:   String(serviceName || ''),
      price:     String(num(price)),
      duration:  String(duration || ''),
      deposit:   String(num(depositAmt))
    }).toString();
    // CHANGE this to your actual custom calendar page slug if different
    wixLocation.to(`/booking-calendar?${q}`);
  }

  function safeItem(x){ return (x && typeof x === 'object') ? x : {}; }
  function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }

  async function getServiceDataset(){
    // Prefer a dataset explicitly named #servicesDataset; else take the first dataset on the page
    if ($w('#servicesDataset')) return $w('#servicesDataset');
    const list = $w('Dataset');
    if (Array.isArray(list) && list.length) return list[0];
    return null;
  }

  function hookup(id, fn){
    if ($w(id)) try { fn($w(id)); } catch(e){ console.warn('Hookup failed for', id, e); }
  }
});