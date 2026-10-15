import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../services/api";
import "../css/MyOrders.css";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOrders();
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      } else {
        setError("Failed to load orders.");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        err.response?.data?.message ||
          (err.response?.status === 401
            ? "Please log in to view your orders."
            : "Failed to load orders.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PLACED":
      case "CONFIRMED":
      case "SHIPPED":
      case "DELIVERED":
        return "status-placed";
      case "PENDING_PAYMENT":
        return "status-pending";
      case "FAILED":
        return "status-failed";
      default:
        return "";
    }
  };

  return (
    <div className="orders-page-container">
      <div className="orders-page-header">
        <h1 className="orders-page-title">My Orders</h1>
      </div>

      {loading && (
        <div className="orders-status-box">
          <div className="spinner"></div>
          <p>Loading your orders...</p>
        </div>
      )}

      {!loading && error && (
        <div className="orders-status-box">
          <p style={{ color: "#dc2626" }}>{error}</p>
          <button type="button" className="orders-retry-btn" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="orders-status-box">
          <h2 className="orders-empty-heading">No Orders Placed Yet</h2>
          <p className="orders-empty-text">You have not placed any orders yet.</p>
          <Link to="/products" className="orders-start-shopping-btn">
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div>
                  <div className="order-card-id">Order #{order._id}</div>
                  <div className="order-card-date">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <span
                  className={`order-card-status ${getStatusClass(order.status)}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-card-items">
                {order.items &&
                  order.items.map((item, idx) => (
                    <div key={idx} className="order-card-item-row">
                      <span className="order-card-item-name">
                        {item.name} × {item.quantity}
                      </span>
                      <span>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="order-card-footer">
                <div className="order-card-total">
                  Total: ₹{order.totalAmount?.toLocaleString("en-IN")}
                </div>
                <Link
                  to={`/order-success/${order._id}`}
                  className="order-card-view-btn"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
