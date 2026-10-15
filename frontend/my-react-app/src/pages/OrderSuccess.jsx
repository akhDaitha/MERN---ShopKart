import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/api";
import "../css/OrderSuccess.css";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getOrderById(id);
        if (res.data?.success) {
          setOrder(res.data.order);
        } else {
          setError("Failed to fetch order details.");
        }
      } catch (err) {
        console.error("Error fetching confirmed order:", err);
        setError(
          err.response?.data?.message || "Could not retrieve order details."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="success-container">
        <div className="success-loading">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="success-container">
        <h2 style={{ color: "#dc2626" }}>Unable to load order</h2>
        <p>{error || "Order not found."}</p>
        <div className="success-actions" style={{ marginTop: "1.5rem" }}>
          <Link to="/orders" className="btn-primary">
            View My Orders
          </Link>
          <Link to="/products" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-icon-badge">✓</div>
      <h1 className="success-title">Order Placed Successfully</h1>
      <p className="success-message">
        Your order has been saved successfully.
      </p>

      <div className="order-details-card">
        <div className="detail-row">
          <span className="detail-label">Order ID:</span>
          <span className="detail-value">{order._id}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Total:</span>
          <span className="detail-value" style={{ color: "#16a34a", fontSize: "1.1rem" }}>
            ₹{order.totalAmount?.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">
            <span
              className={`order-status-tag ${
                order.status === "PLACED" ? "status-placed" : ""
              }`}
            >
              {order.status}
            </span>
          </span>
        </div>

        {order.shippingAddress && (
          <div className="detail-row">
            <span className="detail-label">Deliver To:</span>
            <span className="detail-value" style={{ textAlign: "right" }}>
              {order.shippingAddress.fullName}, {order.shippingAddress.city} -{" "}
              {order.shippingAddress.pincode}
            </span>
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <div className="order-items-preview">
            <div className="order-items-heading">Items:</div>
            {order.items.map((item, index) => (
              <div key={index} className="preview-item">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="success-actions">
        <Link to="/orders" className="btn-primary">
          View My Orders
        </Link>
        <Link to="/products" className="btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
