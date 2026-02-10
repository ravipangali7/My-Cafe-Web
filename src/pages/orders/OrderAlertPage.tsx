import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";

const SWIPE_THRESHOLD_PX = 80;
const SWIPE_THRESHOLD_RATIO = 0.25;
const PENDING_ORDERS_PAGE_SIZE = 50;

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

/** Order type label and distinct badge style for Table / Packing / Delivery */
function getOrderTypeBadge(orderType: string | undefined): {
  label: string;
  className: string;
  style: React.CSSProperties;
} {
  const t = orderType ?? "table";
  if (t === "delivery") {
    return {
      label: "Delivery",
      className: "",
      style: {
        backgroundColor: "rgba(34, 197, 94, 0.4)",
        color: "#bbf7d0",
        border: "2px solid rgba(34, 197, 94, 0.8)",
        padding: "10px 20px",
        fontSize: "1.125rem",
        fontWeight: 700,
        borderRadius: 12,
        textAlign: "center" as const,
        display: "block",
      },
    };
  }
  if (t === "packing") {
    return {
      label: "Packing",
      className: "",
      style: {
        backgroundColor: "rgba(59, 130, 246, 0.4)",
        color: "#bfdbfe",
        border: "2px solid rgba(59, 130, 246, 0.8)",
        padding: "10px 20px",
        fontSize: "1.125rem",
        fontWeight: 700,
        borderRadius: 12,
        textAlign: "center" as const,
        display: "block",
      },
    };
  }
  return {
    label: "Table",
    className: "",
    style: {
      backgroundColor: "rgba(212, 129, 59, 0.45)",
      color: "#F5E6D3",
      border: "2px solid rgba(212, 129, 59, 0.75)",
      padding: "10px 20px",
      fontSize: "1.125rem",
      fontWeight: 700,
      borderRadius: 12,
      textAlign: "center" as const,
      display: "block",
    },
  };
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

/** Map API order (list or detail) to OrderDisplay */
function apiOrderToDisplay(o: any): OrderDisplay {
  const items = (o.items || []).map((item: any) => ({
    n: item.product_name ?? "",
    v: item.variant_info?.unit_symbol ?? "",
    q: String(item.quantity ?? 1),
    p: String(item.price ?? 0),
    t: String(item.total ?? 0),
    op: String(item.variant_info?.price ?? item.price ?? 0),
  }));
  return {
    orderId: String(o.id),
    name: o.name ?? "",
    table_no: o.table_no ?? "",
    phone: o.phone ?? "",
    total: String(o.total ?? 0),
    itemsCount: String((o.items || []).length),
    items,
    order_type: o.order_type ?? undefined,
    address: o.address ?? undefined,
  };
}

export default function OrderAlertPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdFromUrl = searchParams.get("orderId");
  const [pendingOrders, setPendingOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const singleOrder = pendingOrders.length === 1 ? pendingOrders[0] : null;
  const orderId = singleOrder?.orderId ?? orderIdFromUrl ?? null;

  const fetchPendingOrders = useCallback(async () => {
    const response = await api.get<{ data: any[] }>(
      `/api/orders/?status=pending&page_size=${PENDING_ORDERS_PAGE_SIZE}`
    );
    if (response.error || !response.data) {
      setError("Failed to load pending orders");
      setLoading(false);
      return;
    }
    const list = (response.data.data || []).map(apiOrderToDisplay);
    setPendingOrders(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fromWindow = getOrderFromWindow();
    if (fromWindow) {
      if (!orderIdFromUrl) {
        navigate(`/order-alert?orderId=${fromWindow.orderId}`, { replace: true });
      }
    }
    fetchPendingOrders();
  }, [orderIdFromUrl, fetchPendingOrders, navigate]);

  const stopSoundAndNavigate = useCallback(
    (
      targetOrderId: string,
      status: "accepted" | "rejected",
      setProcessingFalse: () => void
    ) => {
      window.StopOrderAlertSound?.postMessage?.("");
      const isMultiple = pendingOrders.length > 1;
      const remaining = pendingOrders.filter((o) => o.orderId !== targetOrderId);

      if (status === "accepted") {
        toast.success("Order accepted");
      } else {
        toast.success("Order rejected");
      }

      if (!isMultiple) {
        // Single order: close immediately (navigate away)
        if (status === "accepted") {
          navigate(`/orders/${targetOrderId}`, { replace: true });
        } else {
          navigate("/orders", { replace: true });
        }
        return;
      }

      // Multiple orders: stay on screen until list is empty
      if (remaining.length === 0) {
        if (status === "accepted") {
          navigate(`/orders/${targetOrderId}`, { replace: true });
        } else {
          navigate("/orders", { replace: true });
        }
      } else {
        setPendingOrders(remaining);
        setProcessingFalse();
      }
    },
    [navigate, pendingOrders]
  );

  const performAction = useCallback(
    async (targetOrderId: string, status: "accepted" | "rejected") => {
      if (isProcessing) return;
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append("status", status);
        const response = await api.post(
          `/api/orders/${targetOrderId}/edit/`,
          formData,
          true
        );
        if (response.error) {
          toast.error("Failed to update order status");
          setIsProcessing(false);
          return;
        }
        stopSoundAndNavigate(targetOrderId, status, () =>
          setIsProcessing(false)
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update order"
        );
        setIsProcessing(false);
      }
    },
    [isProcessing, stopSoundAndNavigate]
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
      performAction(singleOrder!.orderId, "accepted");
    } else if (dragOffset <= -threshold) {
      performAction(singleOrder!.orderId, "rejected");
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
      performAction(singleOrder!.orderId, "accepted");
    } else if (dragOffset <= -threshold) {
      performAction(singleOrder!.orderId, "rejected");
    } else {
      setDragOffset(0);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%)",
        }}
      >
        <p className="text-white/80">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
        style={{
          background: "linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%)",
        }}
      >
        <p className="text-white/80">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="px-4 py-2 rounded-lg bg-white/20 text-white"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
        style={{
          background: "linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%)",
        }}
      >
        <p className="text-white/80">No pending orders</p>
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="px-4 py-2 rounded-lg bg-white/20 text-white"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const backgroundStyle = {
    background: "linear-gradient(to bottom, #3D2314 0%, #2A1810 100%)",
  };

  if (pendingOrders.length === 1 && singleOrder) {
    const order = singleOrder;
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
        style={backgroundStyle}
      >
        <div className="flex-1 overflow-auto p-4 pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🍽️</span>
            <h1 className="text-xl font-semibold text-white/95">
              Incoming order
            </h1>
          </div>

          <div className="rounded-2xl bg-[#4A3328] p-4 shadow-lg mb-4">
            <div
              className="mb-4"
              style={getOrderTypeBadge(order.order_type).style}
            >
              {getOrderTypeBadge(order.order_type).label}
            </div>
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
              {(order.order_type === "table" ||
                order.order_type === "packing") && (
                <p className="pt-0.5">
                  <span className="text-white/65">Table:</span>{" "}
                  <span className="font-medium text-white">
                    {order.table_no || "—"}
                  </span>
                </p>
              )}
              {order.order_type === "delivery" && order.address && (
                <p className="pt-0.5">
                  <span className="text-white/65">Address:</span>{" "}
                  <span className="font-medium text-white">
                    {order.address}
                  </span>
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
              <span className="text-lg font-bold text-white">
                ₹{order.total}
              </span>
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
                  opacity:
                    dragOffset < 0
                      ? 0.4 + (-dragOffset / threshold) * 0.6
                      : 0.2,
                }}
              >
                Reject
              </span>
              <span
                className="text-lg text-green-400 transition-opacity"
                style={{
                  opacity:
                    dragOffset > 0
                      ? 0.4 + (dragOffset / threshold) * 0.6
                      : 0.2,
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

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={backgroundStyle}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth p-4 pb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">🍽️</span>
          <h1 className="text-xl font-semibold text-white/95">
            Incoming orders ({pendingOrders.length})
          </h1>
        </div>

        <div className="space-y-4">
          {pendingOrders.map((order) => (
            <OrderAlertCard
              key={order.orderId}
              order={order}
              onAccept={() => performAction(order.orderId, "accepted")}
              onReject={() => performAction(order.orderId, "rejected")}
              disabled={isProcessing}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderAlertCard({
  order,
  onAccept,
  onReject,
  disabled,
}: {
  order: OrderDisplay;
  onAccept: () => void;
  onReject: () => void;
  disabled: boolean;
}) {
  const badge = getOrderTypeBadge(order.order_type);
  return (
    <div className="rounded-2xl bg-[#4A3328] p-4 shadow-lg">
      <div className="mb-3" style={badge.style}>
        {badge.label}
      </div>
      <div className="rounded-xl bg-[#3d2a1f] p-3 mb-3">
        <p className="text-xs font-bold text-white/70 tracking-wide mb-2">
          CUSTOMER
        </p>
        <p className="text-sm text-white/90">
          <span className="text-white/65">Name:</span> {order.name || "—"}
        </p>
        <p className="text-sm text-white/90">
          <span className="text-white/65">Phone:</span> {order.phone || "—"}
        </p>
        {(order.order_type === "table" || order.order_type === "packing") && (
          <p className="text-sm text-white/90">
            <span className="text-white/65">Table:</span>{" "}
            {order.table_no || "—"}
          </p>
        )}
        {order.order_type === "delivery" && order.address && (
          <p className="text-sm text-white/90">
            <span className="text-white/65">Address:</span> {order.address}
          </p>
        )}
      </div>

      <p className="text-base font-bold text-white mb-2">
        Order ID: #{order.orderId}
      </p>
      {order.items.length > 0 ? (
        <ul className="space-y-2 text-sm mb-3">
          {order.items.slice(0, 5).map((item, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="text-white/90 truncate">
                {item.n}
                {item.v ? ` (${item.v})` : ""}
              </span>
              <span className="text-white/80 shrink-0">
                {item.q} × ₹{item.p}
              </span>
            </li>
          ))}
          {order.items.length > 5 && (
            <li className="text-white/60 text-xs">
              +{order.items.length - 5} more items
            </li>
          )}
        </ul>
      ) : (
        <p className="text-white/80 text-sm mb-3">
          {order.itemsCount} item(s)
        </p>
      )}
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold text-white/90">Total</span>
        <span className="text-lg font-bold text-white">₹{order.total}</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReject}
          disabled={disabled}
          className="flex-1 py-3 rounded-xl font-semibold text-white/90 bg-red-500/30 hover:bg-red-500/50 disabled:opacity-50 border border-red-400/50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={disabled}
          className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
