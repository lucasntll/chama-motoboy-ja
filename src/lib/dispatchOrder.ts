import { supabase } from "@/integrations/supabase/client";
import { sendPushNotification } from "@/lib/sendPushNotification";

/**
 * Dispatch an order to up to 2 available motoboys.
 * Returns the IDs of dispatched motoboys.
 */
export async function dispatchOrderToMotoboys(
  orderId: string,
  cityId?: string | null
): Promise<string[]> {
  // 1. Find available motoboys (online, no active ride)
  // Find available motoboys - try city-specific first, then all available
  // Online = is_available=true (controlled only by motoboy toggle/logout).
  // "busy" check is done below via active orders, NOT via motoboys.status,
  // so accepting a ride no longer drops the motoboy from the online pool.
  let query = supabase
    .from("motoboys")
    .select("id, name, phone, city_id")
    .eq("is_available", true);

  if (cityId) {
    query = query.eq("city_id", cityId);
  }

  let { data: available } = await query;

  // If city filter returns nothing, try without city filter
  if ((!available || available.length === 0) && cityId) {
    const { data: allAvailable } = await supabase
      .from("motoboys")
      .select("id, name, phone, city_id")
      .eq("is_available", true);
    if (allAvailable && allAvailable.length > 0) {
      available = allAvailable;
    }
  }

  if (!available || available.length === 0) return [];

  // 2. Count active rides per motoboy (max 2 simultâneas)
  const MAX_ACTIVE = 2;
  const motoboyIds = available.map((m) => m.id);
  const { data: activeOrders } = await supabase
    .from("orders")
    .select("motoboy_id")
    .in("motoboy_id", motoboyIds)
    .in("status", ["accepted", "picking_up", "delivering"]);

  const counts: Record<string, number> = {};
  (activeOrders || []).forEach((o) => {
    if (o.motoboy_id) counts[o.motoboy_id] = (counts[o.motoboy_id] || 0) + 1;
  });
  const free = available.filter((m) => (counts[m.id] || 0) < MAX_ACTIVE);

  if (free.length === 0) return [];

  // 3. Randomly select up to 2
  const shuffled = free.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 2);
  const selectedIds = selected.map((m) => m.id);

  // 4. Update order with dispatched_to
  await supabase
    .from("orders")
    .update({
      dispatched_to: selectedIds,
      dispatched_at: new Date().toISOString(),
    } as any)
    .eq("id", orderId);

  // 5. Send push notifications to selected motoboys
  for (const motoboy of selected) {
    sendPushNotification({
      event: "new_order",
      order_id: orderId,
      city_id: cityId || null,
      motoboy_id: motoboy.id,
    });
  }

  return selectedIds;
}

/**
 * Re-dispatch an order that wasn't accepted in time.
 * Excludes previously dispatched motoboys.
 */
export async function redispatchOrder(
  orderId: string,
  excludeIds: string[],
  cityId?: string | null
): Promise<string[]> {
  let query = supabase
    .from("motoboys")
    .select("id, name, phone")
    .eq("is_available", true);

  if (cityId) {
    query = query.eq("city_id", cityId);
  }

  const { data: available } = await query;
  if (!available || available.length === 0) return [];

  const MAX_ACTIVE = 2;
  const motoboyIds = available.map((m) => m.id);
  const { data: activeOrders } = await supabase
    .from("orders")
    .select("motoboy_id")
    .in("motoboy_id", motoboyIds)
    .in("status", ["accepted", "picking_up", "delivering"]);

  const counts: Record<string, number> = {};
  (activeOrders || []).forEach((o) => {
    if (o.motoboy_id) counts[o.motoboy_id] = (counts[o.motoboy_id] || 0) + 1;
  });
  const excludeSet = new Set(excludeIds);
  const free = available.filter((m) => (counts[m.id] || 0) < MAX_ACTIVE && !excludeSet.has(m.id));

  if (free.length === 0) {
    // If no new motoboys, try all available again
    const allFree = available.filter((m) => (counts[m.id] || 0) < MAX_ACTIVE);
    if (allFree.length === 0) return [];
    const shuffled = allFree.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);
    const selectedIds = selected.map((m) => m.id);

    await supabase
      .from("orders")
      .update({
        dispatched_to: selectedIds,
        dispatched_at: new Date().toISOString(),
      } as any)
      .eq("id", orderId);

    return selectedIds;
  }

  const shuffled = free.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 2);
  const selectedIds = selected.map((m) => m.id);

  await supabase
    .from("orders")
    .update({
      dispatched_to: selectedIds,
      dispatched_at: new Date().toISOString(),
    } as any)
    .eq("id", orderId);

  return selectedIds;
}
