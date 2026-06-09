import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSellerWorkspace2026Orders } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026Orders.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export function Seller2026OrdersPreviewPage({ productionMode = false }) {
  const { storeSlug } = useParams();
  const { 
    data, 
    loading, 
    error, 
    usingFallback, 
    filters, 
    setFilters, 
    selectedOrderId, 
    setSelectedOrderId,
    selectedOrder,
    loadingDetail,
    refetch,
    actions,
    actionState
  } = useSellerWorkspace2026Orders(storeSlug);

  const [trackingInput, setTrackingInput] = useState("");

  if (error && !data) {
    return (
      <Seller2026Shell section="operations" productionMode={productionMode}>
        <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
          <h2>Error Loading Orders</h2>
          <p>{error.message || "Failed to load orders information."}</p>
        </div>
      </Seller2026Shell>
    );
  }

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status: prev.status === status ? "" : status }));
  };

  const handleRowClick = (id) => {
    if (selectedOrderId === id) {
      setSelectedOrderId(null);
    } else {
      setSelectedOrderId(id);
      setTrackingInput("");
    }
  };

  return (
    <Seller2026Shell section="operations" productionMode={productionMode}>
      <div style={{ display: "flex", gap: "24px" }}>
      
      {/* Main List Column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            {usingFallback && (
              <Seller2026FallbackBanner 
                compact 
                message={productionMode ? "Live order data is unavailable. Showing fallback data." : undefined}
              />
            )}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={refetch} style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #d1d5db", cursor: "pointer", fontWeight: 500 }}>
              Refresh
            </button>
            <button disabled title={productionMode ? "Bulk Actions disabled" : "Bulk Actions disabled in preview"} style={{ padding: "8px 16px", borderRadius: "8px", background: "#f3f4f6", color: "#9ca3af", border: "1px solid #d1d5db", cursor: "not-allowed", fontWeight: 500 }}>
              Bulk Shipment
            </button>
            <button disabled title={productionMode ? "Export disabled" : "Export disabled in preview"} style={{ padding: "8px 16px", borderRadius: "8px", background: "#f3f4f6", color: "#9ca3af", border: "1px solid #d1d5db", cursor: "not-allowed", fontWeight: 500 }}>
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "New", key: "newOrders", filterVal: "pending" },
            { label: "Processing", key: "processing", filterVal: "processing" },
            { label: "Ready to Ship", key: "readyToShip", filterVal: "ready_to_ship" },
            { label: "Shipped", key: "shipped", filterVal: "shipped" },
            { label: "Completed", key: "completed", filterVal: "completed" },
            { label: "Return", key: "returns", filterVal: "returned" },
          ].map(stat => (
            <div 
              key={stat.key} 
              onClick={() => handleStatusFilter(stat.filterVal)}
              style={{ 
                background: filters.status === stat.filterVal ? "#eef2ff" : "#fff", 
                border: filters.status === stat.filterVal ? "1px solid #6366f1" : "1px solid #e5e7eb", 
                padding: "16px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: 700, color: filters.status === stat.filterVal ? "#4f46e5" : "#111827" }}>
                {data?.summary?.[stat.key] || 0}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <input 
            type="text" 
            placeholder="Search order ID, customer..." 
            value={filters.search}
            onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
            style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db" }}
          />
        </div>

        {/* Orders Table */}
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <tr>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Order ID</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Product</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Total</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Payment</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data?.orders?.length ? (
                <tr><td colSpan="5" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading orders...</td></tr>
              ) : data?.orders?.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>No orders found</td></tr>
              ) : (
                data?.orders?.map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => handleRowClick(order.id)}
                    style={{ 
                      borderBottom: "1px solid #e5e7eb", 
                      background: selectedOrderId === order.id ? "#f3f4f6" : "#fff",
                      cursor: "pointer" 
                    }}
                  >
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>{order.suborderId || order.orderId}</div>
                      <div style={{ color: "#6b7280", fontSize: "12px" }}>{order.customerName}</div>
                      <div style={{ color: "#9ca3af", fontSize: "11px", marginTop: "4px" }}>{new Date(order.orderedAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: "16px", color: "#4b5563" }}>{order.productSummary}</td>
                    <td style={{ padding: "16px", fontWeight: 500 }}>Rp {order.total?.toLocaleString("id-ID")}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                        background: order.paymentStatus === "Paid" ? "#d1fae5" : "#fef3c7",
                        color: order.paymentStatus === "Paid" ? "#065f46" : "#92400e"
                      }}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ 
                        display: "inline-block", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                        background: order.fulfillmentStatus === "Completed" ? "#d1fae5" : "#e0e7ff",
                        color: order.fulfillmentStatus === "Completed" ? "#065f46" : "#3730a3",
                        marginBottom: "4px"
                      }}>
                        {order.fulfillmentStatus}
                      </div>
                      {order.slaStatus === "error" && (
                        <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: 600 }}>{order.slaLabel}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer / Panel */}
      {selectedOrderId && (
        <div style={{ width: "380px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", flexDirection: "column", height: "fit-content", position: "sticky", top: "24px" }}>
          
          {loadingDetail && !selectedOrder ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#6b7280" }}>Loading detail...</div>
          ) : selectedOrder ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Order Detail</h2>
                <button onClick={() => setSelectedOrderId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>×</button>
              </div>

              {/* Status Banner */}
              <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>Payment</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: selectedOrder.payment.status === "Paid" ? "#10b981" : "#f59e0b" }}>{selectedOrder.payment.status}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>Fulfillment</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#6366f1" }}>{selectedOrder.fulfillment.status}</span>
                </div>
              </div>

              {/* Customer & Shipping */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600 }}>Customer</h3>
                <div style={{ fontSize: "13px", color: "#4b5563" }}>
                  <div>{selectedOrder.customer.name}</div>
                  <div>{selectedOrder.customer.phone}</div>
                </div>
                <h3 style={{ margin: "16px 0 8px", fontSize: "14px", fontWeight: 600 }}>Shipping Address</h3>
                <div style={{ fontSize: "13px", color: "#4b5563" }}>
                  {selectedOrder.shippingAddress}
                </div>
              </div>

              {/* Products */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600 }}>Products</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedOrder.products.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ color: "#4b5563", flex: 1, paddingRight: "12px" }}>
                        <div>{p.productName || `Product #${p.productId}`}</div>
                        <div style={{ color: "#9ca3af", fontSize: "12px" }}>{p.qty} x Rp {p.price?.toLocaleString("id-ID")}</div>
                      </div>
                      <div style={{ fontWeight: 500 }}>Rp {p.totalPrice?.toLocaleString("id-ID")}</div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, paddingTop: "8px" }}>
                    <span>Total</span>
                    <span>Rp {selectedOrder.payment.total?.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              {/* Courier & Tracking */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600 }}>Shipping & Tracking</h3>
                <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "12px" }}>
                  {selectedOrder.fulfillment.courier} - {selectedOrder.fulfillment.service}
                </div>
                
                {selectedOrder.fulfillment.trackingNumber ? (
                  <div style={{ background: "#f3f4f6", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, textAlign: "center" }}>
                    {selectedOrder.fulfillment.trackingNumber}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      placeholder="Input Tracking Number" 
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                    />
                    <button 
                      onClick={() => actions.updateTrackingNumber(trackingInput, selectedOrder.fulfillment.courier, selectedOrder.fulfillment.service)}
                      disabled={!trackingInput || !selectedOrder.allowedActions.includes("MARK_SHIPPED") || usingFallback || actionState.isUpdating}
                      style={{ 
                        padding: "8px 12px", borderRadius: "6px", 
                        background: (!trackingInput || !selectedOrder.allowedActions.includes("MARK_SHIPPED") || usingFallback) ? "#f3f4f6" : "#6366f1",
                        color: (!trackingInput || !selectedOrder.allowedActions.includes("MARK_SHIPPED") || usingFallback) ? "#9ca3af" : "#fff",
                        border: "none", cursor: (!trackingInput || !selectedOrder.allowedActions.includes("MARK_SHIPPED") || usingFallback) ? "not-allowed" : "pointer",
                        fontWeight: 500, fontSize: "13px"
                      }}
                    >
                      Save
                    </button>
                  </div>
                )}
                {(!selectedOrder.allowedActions.includes("MARK_SHIPPED") && !selectedOrder.fulfillment.trackingNumber) && (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "6px" }}>Tracking input not available in current lifecycle.</div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {actionState.error && (
                  <div style={{ padding: "8px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "12px", textAlign: "center" }}>
                    {actionState.error}
                  </div>
                )}
                {actionState.successMessage && (
                  <div style={{ padding: "8px", background: "#ecfdf5", color: "#047857", borderRadius: "6px", fontSize: "12px", textAlign: "center" }}>
                    {actionState.successMessage}
                  </div>
                )}
                
                {/* Dynamically show allowed buttons based on governance */}
                {selectedOrder.allowedActions.includes("MARK_PROCESSING") && (
                  <button 
                    onClick={() => actions.updateFulfillmentStatus("MARK_PROCESSING")}
                    disabled={usingFallback || actionState.isUpdating}
                    style={{ 
                      width: "100%", padding: "10px", borderRadius: "8px", 
                      background: usingFallback ? "#f3f4f6" : "#6366f1", color: usingFallback ? "#9ca3af" : "#fff", 
                      border: "none", fontWeight: 600, cursor: usingFallback || actionState.isUpdating ? "not-allowed" : "pointer" 
                    }}
                  >
                    Process Order
                  </button>
                )}
                
                {selectedOrder.allowedActions.includes("MARK_SHIPPED") && (
                  <button 
                    onClick={() => actions.updateFulfillmentStatus("MARK_SHIPPED")}
                    disabled={usingFallback || actionState.isUpdating}
                    style={{ 
                      width: "100%", padding: "10px", borderRadius: "8px", 
                      background: usingFallback ? "#f3f4f6" : "#6366f1", color: usingFallback ? "#9ca3af" : "#fff", 
                      border: "none", fontWeight: 600, cursor: usingFallback || actionState.isUpdating ? "not-allowed" : "pointer" 
                    }}
                  >
                    Mark as Shipped
                  </button>
                )}
                
                {selectedOrder.allowedActions.includes("MARK_DELIVERED") && (
                  <button 
                    onClick={() => actions.updateFulfillmentStatus("MARK_DELIVERED")}
                    disabled={usingFallback || actionState.isUpdating}
                    style={{ 
                      width: "100%", padding: "10px", borderRadius: "8px", 
                      background: usingFallback ? "#f3f4f6" : "#6366f1", color: usingFallback ? "#9ca3af" : "#fff", 
                      border: "none", fontWeight: 600, cursor: usingFallback || actionState.isUpdating ? "not-allowed" : "pointer" 
                    }}
                  >
                    Mark Delivered
                  </button>
                )}

                <button 
                  disabled
                  title={productionMode ? "Print Label is disabled." : "Print Label is disabled in preview."}
                  style={{ 
                    width: "100%", padding: "10px", borderRadius: "8px", 
                    background: "#fff", color: "#4b5563", border: "1px solid #d1d5db", 
                    fontWeight: 600, cursor: "not-allowed" 
                  }}
                >
                  Print Label
                </button>
                
                {usingFallback && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                    Fulfillment actions will be connected after lifecycle validation.
                  </p>
                )}
              </div>

            </>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#ef4444" }}>Detail not found.</div>
          )}
        </div>
      )}

      </div>
    </Seller2026Shell>
  );
}
