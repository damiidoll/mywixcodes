// Service Item page code
import { getAvailability } from 'backend/bookingBridge.jsw';

function detectTZ(){
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'; }
  catch { return 'America/Chicago'; }
}

$w.onReady(async () => {
  await $w('#dsServiceItem').onReady();
  const item = $w('#dsServiceItem').getCurrentItem();
  const serviceId = item.bookingServiceId || '';
  if (!serviceId) { console.error('Missing bookingServiceId on this CMS item.'); return; }

  const timeZone = detectTZ();

  // Prep one message router per iframe
  const cal = $w('#htmlCalendar');
  const add = $w('#htmlAddons');

  const servicePayload = {
    type: 'SERVICE_DATA',
    data: {
      serviceId,
      name: item.name || '',
      price: Number(item.price || 0),
      durationMinutes: Number(item.durationMinutes || 0),
      bookingUrl: item.bookingUrl || '',
      category: item.category?.title || '',
      timeZone
    }
  };

  // ---- Calendar iframe messaging (READY, MONTH_CHANGE, TIME_SELECTED passthrough)
  cal?.onMessage(async (e) => {
    const d = e.data || {};
    if (d.type === 'READY') {
      cal.postMessage(servicePayload);
      await refreshMonth(new Date(), serviceId, timeZone);
    }
    if (d.type === 'MONTH_CHANGE') {
      const y = Number(d.payload?.year);
      const m = Number(d.payload?.month);
      if (Number.isFinite(y) && Number.isFinite(m)) {
        await refreshMonth(new Date(y, m, 1), serviceId, timeZone);
      }
    }
    if (d.type === 'TIME_SELECTED') {
      add?.postMessage({
        type: 'vx:context',
        payload: {
          serviceName: item.name || '',
          dateLabel: d.dateLabel || '',
          timeLabel: d.timeLabel || ''
        }
      });
    }
  });

  // ---- Add-ons iframe messaging (READY, totals to calendar + optional page UI)
  add?.onMessage((e) => {
    const d = e.data || {};
    if (d.type === 'READY') add.postMessage(servicePayload);

    if (d.type === 'vx:addons' || d.type === 'ADDONS_UPDATE') {
      const total   = d.type === 'vx:addons' ? (d.payload?.total || 0) : (d.payload?.addonsTotal || 0);
      const minutes = d.type === 'vx:addons' ? (d.payload?.minutes || 0) : (d.payload?.addonsMinutes || 0);

      // Optional: reflect on-page
      if ($w('#txtTotalPrice')) {
        const base = Number(item.price || 0);
        $w('#txtTotalPrice').text = `$${(base + Number(total)).toFixed(0)}`;
      }

      // Forward to calendar
      cal?.postMessage({
        type: 'ADDONS_UPDATE',
        payload: {
          addonsItems: d.payload?.items || d.payload?.addonsItems || [],
          addonsTotal: total,
          addonsMinutes: minutes
        }
      });
    }
  });
});

async function refreshMonth(dateObj, serviceId, timeZone){
  const startISO = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString();
  const endISO   = new Date(dateObj.getFullYear(), dateObj.getMonth()+1, 1).toISOString();
  try {
    const days = await getAvailability(serviceId, startISO, endISO, timeZone);
    $w('#htmlCalendar')?.postMessage({ type: 'AVAILABILITY', data: days, timeZone });
  } catch (err) {
    console.error('Availability error', err);
    $w('#htmlCalendar')?.postMessage({ type: 'AVAILABILITY_ERROR', message: String(err?.message || err), timeZone });
  }
}