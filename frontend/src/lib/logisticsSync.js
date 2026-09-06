const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlamZ1c3F5eHRtZWpid3BwZXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU1ODczNywiZXhwIjoyMTAyMTM0NzM3fQ.JB1JpGkTiRblnc2EDoqpZTcWgASorF6XJeTYE2QrWLc';
const SUPABASE_URL = 'https://sejfusqyxtmejbwppexe.supabase.co';

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const SYSTEM_ADMIN_ID = '338b3361-779c-474e-83d0-ff95a4b55901';

export const DEFAULT_STOCK_POINTS = [
  {
    id: 'hub_ramesh_600028',
    name: 'Ramesh Seafood Hub',
    owner_name: 'Ramesh K.',
    pincode: '600028',
    phone: '+91 98401 22345',
    address: 'No. 14, R.K. Mutt Road, Mandaveli, Chennai',
    active: true,
  },
  {
    id: 'hub_suresh_600004',
    name: 'Suresh Coastal Point',
    owner_name: 'Suresh M.',
    pincode: '600004',
    phone: '+91 98402 33456',
    address: 'Shop 8, Bazaar Road, Mylapore, Chennai',
    active: true,
  },
  {
    id: 'hub_priya_600041',
    name: 'Priya Fresh Distribution',
    owner_name: 'Priya R.',
    pincode: '600041',
    phone: '+91 98403 44567',
    address: 'Plot 32, 1st Seaward Road, Valmiki Nagar, Thiruvanmiyur',
    active: true,
  },
];

export const DEFAULT_RIDERS = [
  {
    id: 'rider_arun_600028',
    name: 'Arun Kumar',
    pincode: '600028',
    phone: '+91 97910 11223',
    vehicle: 'Electric Scooter (TN-07-CS-4021)',
    active: true,
  },
  {
    id: 'rider_vignesh_600004',
    name: 'Vignesh S.',
    pincode: '600004',
    phone: '+91 97910 22334',
    vehicle: 'Bike (TN-06-BQ-1198)',
    active: true,
  },
];

/**
 * Log an event to the logistics audit stream
 */
export async function logAuditEvent({ eventType, pincode, actor, description, metadata = {} }) {
  try {
    const slug = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      content_type: 'logistics_audit',
      slug,
      locale: 'en',
      status: 'published',
      created_by: SYSTEM_ADMIN_ID,
      title: `${eventType.toUpperCase()} [PIN ${pincode || 'GLOBAL'}]: ${actor}`,
      body: {
        event_type: eventType,
        pincode: pincode || 'GLOBAL',
        actor,
        description,
        metadata,
        timestamp: new Date().toISOString(),
      },
    };
    await fetch(`${SUPABASE_URL}/rest/v1/content_entries`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}

/**
 * Fetch all stock points / dark stores
 */
export async function fetchStockPoints() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_entries?content_type=eq.stock_point&order=created_at.desc`,
      { headers }
    );
    if (!res.ok) return DEFAULT_STOCK_POINTS;
    const rows = await res.json();
    if (!rows || rows.length === 0) {
      // Seed default stock points
      for (const sp of DEFAULT_STOCK_POINTS) {
        await fetch(`${SUPABASE_URL}/rest/v1/content_entries`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content_type: 'stock_point',
            slug: sp.id,
            locale: 'en',
            status: 'published',
            created_by: SYSTEM_ADMIN_ID,
            title: `${sp.owner_name} (${sp.pincode})`,
            body: sp,
          }),
        });
      }
      return DEFAULT_STOCK_POINTS;
    }
    return rows.map((r) => ({ id: r.slug, ...r.body }));
  } catch (e) {
    console.error('fetchStockPoints error:', e);
    return DEFAULT_STOCK_POINTS;
  }
}

/**
 * Fetch all shipments dispatched to stock owners
 */
export async function fetchStockShipments() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_entries?content_type=eq.stock_shipment&order=created_at.desc`,
      { headers }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r) => ({
      id: r.slug,
      created_at: r.created_at,
      ...r.body,
    }));
  } catch (e) {
    console.error('fetchStockShipments error:', e);
    return [];
  }
}

/**
 * Admin creates and dispatches a shipment to a stock point
 */
export async function dispatchStockShipment({ hubId, ownerName, pincode, items, notes = '' }) {
  const shipmentId = `SH-${Date.now().toString().slice(-6)}`;
  const slug = `shipment_${shipmentId}`;
  
  const payload = {
    content_type: 'stock_shipment',
    slug,
    locale: 'en',
    status: 'published',
    created_by: SYSTEM_ADMIN_ID,
    title: `Shipment ${shipmentId} -> ${ownerName} (${pincode})`,
    body: {
      shipment_id: shipmentId,
      hub_id: hubId,
      owner_name: ownerName,
      pincode,
      items, // array of { fish_name, count, kg, price_per_kg }
      status: 'in_transit', // in_transit -> received_at_hub
      notes,
      dispatched_at: new Date().toISOString(),
      received_at: null,
    },
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/content_entries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to dispatch shipment');
  const [created] = await res.json();

  const itemSummary = items.map((it) => `${it.count} ${it.fish_name} (${it.kg} kg)`).join(', ');
  await logAuditEvent({
    eventType: 'shipment_dispatched',
    pincode,
    actor: 'Admin',
    description: `Dispatched Shipment #${shipmentId} to ${ownerName}: ${itemSummary}`,
    metadata: { shipment_id: shipmentId, hub_id: hubId, items },
  });

  return { id: slug, ...created.body };
}

/**
 * Fetch live inventory for all hubs or a specific hub
 */
export async function fetchLiveInventories() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_entries?content_type=eq.stock_inventory&order=created_at.desc`,
      { headers }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r) => ({
      id: r.slug,
      hub_id: r.body?.hub_id,
      pincode: r.body?.pincode,
      owner_name: r.body?.owner_name,
      items: r.body?.items || [],
      updated_at: r.body?.updated_at,
    }));
  } catch (e) {
    console.error('fetchLiveInventories error:', e);
    return [];
  }
}

/**
 * Fetch live audit trail
 */
export async function fetchLogisticsAuditLogs() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_entries?content_type=eq.logistics_audit&order=created_at.desc&limit=50`,
      { headers }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      created_at: r.created_at,
      ...r.body,
    }));
  } catch (e) {
    console.error('fetchLogisticsAuditLogs error:', e);
    return [];
  }
}

/**
 * Fetch delivery orders
 */
export async function fetchDeliveryOrders() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_entries?content_type=eq.delivery_order&order=created_at.desc`,
      { headers }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r) => ({
      id: r.slug,
      created_at: r.created_at,
      ...r.body,
    }));
  } catch (e) {
    console.error('fetchDeliveryOrders error:', e);
    return [];
  }
}
