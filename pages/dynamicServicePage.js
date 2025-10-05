// Page Code for Bookings → Services dynamic item page
import { getAvailability } from 'backend/bookingBridge.jsw';

function detectTZ(){
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'; }
  catch { return 'America/Chicago'; }
}

$w.onReady(async () => {
  // Use the dynamic dataset that Wix adds for the Bookings service page.
  // If yours has a different ID, replace '#dynamicDataset' accordingly.
  const ds = $w('#dynamicDataset');

  await ds.onReady();
  const item = ds.getCurrentItem();
  if (!item) { console.error('No current item from Bookings dataset'); return; }

  // Bookings app item fields vary a bit by site; grab robustly:
  const serviceId =
      item._id
   || item.id
   || item.serviceId
   || item.bookingServiceId
   || '';

  if (!serviceId) {
    console.error('Could not resolve serviceId from Bookings item:', item);
    return;
  }

  const serviceName =
      item.name
   || item.title
   || item.serviceName
   || 'Service';

  // Price can live in different shapes; try a few common ones
  const price =
      Number(item.price)
   || Number(item?.pricing?.price)
   || Number(item?.priceAmount)
   || Number(item?.price?.amount)
   || 0;

  // Duration (minutes) — common shapes
  const durationMinutes =
      Number(item?.duration)
   || Number(item?.sessionLength)
   || Number(item?.durationMinutes)
   || Number(item?.duration?.minutes)
   || 0;

  // Category (for display only)
  const category =
      item?.category
   || item?.categories?.[0]?.name
   || item?.categoryName
   || '';

  const timeZone = detectTZ();

  const cal = $w('#htmlCalendar');
  const add = $w('#htmlAddons');

  // Push basic service context into both iframes
  const servicePayload = {
    type: 'SERVICE_DATA',
    data: { serviceId, name: serviceName, price, durationMinutes, category, timeZone }
  };

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
          serviceName,
          dateLabel: d.dateLabel || '',
          timeLabel: d.timeLabel || ''
        }
      });
    }
  });

  add?.onMessage((e) => {
    const d = e.data || {};
    if (d.type === 'READY') add.postMessage(servicePayload);

    if (d.type === 'vx:addons' || d.type === 'ADDONS_UPDATE') {
      const total   = d.type === 'vx:addons' ? (d.payload?.total || 0) : (d.payload?.addonsTotal || 0);
      const minutes = d.type === 'vx:addons' ? (d.payload?.minutes || 0) : (d.payload?.addonsMinutes || 0);

      // Forward to calendar (optional UI updates removed for simplicity)
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