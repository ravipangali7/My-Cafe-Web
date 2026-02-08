import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";

const SWIPE_THRESHOLD_PX = 80;
const SWIPE_THRESHOLD_RATIO = 0.25;

interface IncomingOrderItem {
  n: string;
  v: string;
  q: string;
  p: string;
  t: string;
  op?: string;
}

interface OrderDisplay {
  orderId: string;
  name: string;
  table_no: string;
  phone: string;
  total: string;
  itemsCount: string;
  items: IncomingOrderItem[];
  order_type?: string;
  address?: string;
}

function parseIncomingItems(itemsRaw: string | undefined): IncomingOrderItem[] {
  if (!itemsRaw) return [];
  try {
    const parsed = JSON.parse(itemsRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getOrderFromWindow(): OrderDisplay | null {
  const w = window.__INCOMING_ORDER__;
  if (!w?.order_id) return null;
  const items = typeof w.items === "string" ? parseIncomingItems(w.items) : [];
  return {
    orderId: w.order_id,
    name: w.name ?? "",
    table_no: w.table_no ?? "",
    phone: w.phone ?? "",
    total: w.total ?? "0",
    itemsCount: w.items_count ?? String(items.length),
    items,
    order_type: w.order_type ?? undefined,
    address: w.address ?? undefined,
  };
}

export default function OrderAlertPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdFromUrl = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const orderId = order?.orderId ?? orderIdFromUrl ?? null;

  const fetchOrder = useCallback(async (orderIdOverride?: string) => {
    const id = orderIdOverride ?? orderId;
    if (!id) return;
    const response = await api.get<{ order: any }>(`/api/orders/${id}/`);
    if (response.error || !response.data) {
      setError("Order not found");
      setLoading(false);
      return;
    }
    const o = response.data.order;
    const items = (o.items || []).map((item: any) => ({
      n: item.product_name ?? "",
      v: item.variant_info?.unit_symbol ?? "",
      q: String(item.quantity ?? 1),
      p: String(item.price ?? 0),
      t: String(item.total ?? 0),
      op: String(item.variant_info?.price ?? item.price ?? 0),
    }));
    setOrder({
      orderId: String(o.id),
      name: o.name ?? "",
      table_no: o.table_no ?? "",
      phone: o.phone ?? "",
      total: String(o.total ?? 0),
      itemsCount: String((o.items || []).length),
      items,
      order_type: o.order_type ?? undefined,
      address: o.address ?? undefined,
    });
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    return () => {
      window.__INCOMING_ORDER__ = undefined;
    };
  }, []);

  // Alert screen is notification-triggered only: show only when window.__INCOMING_ORDER__
  // is set (by Flutter on notification tap). Otherwise redirect and do not show the alert.
  useEffect(() => {
    const fromWindow = getOrderFromWindow();
    if (fromWindow) {
      setOrder(fromWindow);
      setLoading(false);
      if (!orderIdFromUrl) {
        navigate(`/order-alert?orderId=${fromWindow.orderId}`, { replace: true });
      }
      fetchOrder(fromWindow.orderId);
      return;
    }
    if (orderIdFromUrl) {
      navigate(`/orders/${orderIdFromUrl}`, { replace: true });
      return;
    }
    setError("No order specified");
    setLoading(false);
  }, [orderIdFromUrl, fetchOrder, navigate]);

  const performAction = useCallback(
    async (status: "accepted" | "rejected") => {
      if (!orderId || isProcessing) return;
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append("status", status);
        const response = await api.post(
          `/api/orders/${orderId}/edit/`,
          formData,
          true
        );
        if (response.error) {
          toast.error("Failed to update order status");
          setIsProcessing(false);
          return;
        }
        window.StopOrderAlertSound?.postMessage?.("");
        if (status === "accepted") {
          toast.success("Order accepted");
        } else {
          toast.success("Order rejected");
        }
        navigate(`/orders/${orderId}`, { replace: true });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update order"
        );
        setIsProcessing(false);
      }
    },
    [orderId, isProcessing, navigate]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isProcessing) return;
    touchStartX.current = e.touches[0].clientX;
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isProcessing) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    const width = containerRef.current?.offsetWidth ?? 300;
    const max = Math.max(SWIPE_THRESHOLD_PX, width * SWIPE_THRESHOLD_RATIO);
    setDragOffset(Math.max(-max, Math.min(max, delta)));
  };

  const handleTouchEnd = () => {
    if (isProcessing) return;
    const width = containerRef.current?.offsetWidth ?? 300;
    const threshold = Math.max(SWIPE_THRESHOLD_PX, width * SWIPE_THRESHOLD_RATIO);
    if (dragOffset >= threshold) {
      performAction("accepted");
    } else if (dragOffset <= -threshold) {
      performAction("rejected");
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isProcessing) return;
    touchStartX.current = e.clientX;
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isProcessing) return;
    if (e.buttons !== 1) return;
    const delta = e.clientX - touchStartX.current;
    const width = containerRef.current?.offsetWidth ?? 300;
    const max = Math.max(SWIPE_THRESHOLD_PX, width * SWIPE_THRESHOLD_RATIO);
    setDragOffset(Math.max(-max, Math.min(max, delta)));
  };

  const handleMouseUp = () => {
    if (isProcessing) return;
    const width = containerRef.current?.offsetWidth ?? 300;
    const threshold = Math.max(SWIPE_THRESHOLD_PX, width * SWIPE_THRESHOLD_RATIO);
    if (dragOffset >= threshold) {
      performAction("accepted");
    } else if (dragOffset <= -threshold) {
      performAction("rejected");
    } else {
      setDragOffset(0);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%)",
        }}
      >
        <p className="text-white/80">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
        style={{
          background:
            "linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%)",
        }}
      >
        <p className="text-white/80">{error ?? "No order specified"}</p>
        <button
          type="button"
          onClick={() => navigate("/orders", { replace: true })}
          className="px-4 py-2 rounded-lg bg-white/20 text-white"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const width = containerRef.current?.offsetWidth ?? 300;
  const threshold = Math.max(SWIPE_THRESHOLD_PX, width * SWIPE_THRESHOLD_RATIO);
  const swipeHint =
    dragOffset >= threshold * 0.5
      ? "Release to accept"
      : dragOffset <= -threshold * 0.5
        ? "Release to reject"
        : "← Swipe to reject  |  Swipe to accept →";

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{
        background:
          "linear-gradient(to bottom, #3D2314 0%, #2A1810 100%)",
      }}
    >
      <div className="flex-1 overflow-auto p-4 pb-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">🍽️</span>
          <h1 className="text-xl font-semibold text-white/95">
            Incoming order
          </h1>
        </div>

        <div className="rounded-2xl bg-[#4A3328] p-4 shadow-lg mb-4">
          <p className="text-xs font-bold text-white/70 tracking-wide mb-3">
            CUSTOMER
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-white/65">Name:</span>{" "}
              <span className="font-medium text-white">
                {order.name || "—"}
              </span>
            </p>
            <p>
              <span className="text-white/65">Phone:</span>{" "}
              <span className="font-medium text-white">
                {order.phone || "—"}
              </span>
            </p>
            <p className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
                style={{
                  backgroundColor: "rgba(212, 129, 59, 0.35)",
                  color: "#F5E6D3",
                  border: "1px solid rgba(212, 129, 59, 0.6)",
                }}
              >
                {order.order_type === "delivery"
                  ? "Delivery"
                  : order.order_type === "packing"
                    ? "Packing"
                    : "Table"}
              </span>
            </p>
            {order.order_type === "delivery" && order.address && (
              <p className="pt-0.5">
                <span className="text-white/65">Address:</span>{" "}
                <span className="font-medium text-white">{order.address}</span>
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[#4A3328] p-4 shadow-lg mb-4">
          <p className="text-lg font-bold text-white tracking-wide mb-3">
            Order ID: #{order.orderId}
          </p>
          {order.items.length > 0 ? (
            <ul className="space-y-3">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-2 text-sm">
                  <span className="text-white font-medium">
                    {item.n}
                    {item.v ? ` (${item.v})` : ""}
                  </span>
                  <span className="text-white/85 shrink-0">
                    {item.q} × ₹{item.p} = ₹{item.t}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/90">{order.itemsCount} item(s)</p>
          )}
          <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center">
            <span className="font-bold text-white/90">Total</span>
            <span className="text-lg font-bold text-white">₹{order.total}</span>
          </div>
        </div>

        <p className="text-center text-sm text-white/60 mb-2">{swipeHint}</p>
      </div>

      <div
        ref={containerRef}
        className="p-4 pt-0 pb-8 touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative h-16 rounded-full mx-2 overflow-hidden"
          style={{ backgroundColor: "#5C3D2E" }}
        >
          <div
            className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
            aria-hidden
          >
            <span
              className="text-lg transition-opacity"
              style={{
                opacity: dragOffset < 0 ? 0.4 + (-dragOffset / threshold) * 0.6 : 0.2,
              }}
            >
              Reject
            </span>
            <span
              className="text-lg text-green-400 transition-opacity"
              style={{
                opacity: dragOffset > 0 ? 0.4 + (dragOffset / threshold) * 0.6 : 0.2,
              }}
            >
              Accept
            </span>
          </div>
          <div
            className="absolute top-1 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform duration-75"
            style={{
              left: `calc(50% - 28px + ${dragOffset}px)`,
              backgroundColor:
                dragOffset >= threshold * 0.3
                  ? "#22c55e"
                  : dragOffset <= -threshold * 0.3
                    ? "#ef4444"
                    : "#D4813B",
            }}
          >
            ⇄
          </div>
        </div>
      </div>
    </div>
  );
}
