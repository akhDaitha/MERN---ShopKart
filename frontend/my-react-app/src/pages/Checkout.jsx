import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCart, createPaymentOrder, verifyPayment } from "../services/api";
import { useCart } from "../context/CartContext";
import "../css/Checkout.css";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { clearCartLocally, refreshCart } = useCart();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadCartData() {
      try {
        setLoading(true);
        const res = await getCart();
        const items = res.data?.userCart?.cart || [];
        setCartItems(items);
      } catch (err) {
        setServerError(
          err.response?.data?.message || "Failed to load checkout cart details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCartData();
    loadRazorpayScript();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone should contain a valid 10-digit number.";
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Pincode must contain 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.product_id?.price || 0);
      return sum + price * (item.quantity || 0);
    }, 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError("");

    // 1. Basic client validation - DO NOT call backend if basic client validation fails
    if (!validate()) {
      return;
    }

    if (cartItems.length === 0) {
      setServerError("Your cart is empty. Please add items to your cart first.");
      return;
    }

    setSubmitting(true);

    try {
      // Load script if not ready yet
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setServerError("Failed to load Razorpay payment gateway. Please check your internet connection.");
        setSubmitting(false);
        return;
      }

      // 2. Call backend to create pending ShopKart order and Razorpay order
      const res = await createPaymentOrder({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      });

      const { order, razorpayOrder, key } = res.data;

      // 3. Configure and open Razorpay Checkout
      const options = {
        key: key || "rzp_test_TmtESBCxoxl3DR",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "ShopKart",
        description: `Order #${order._id}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: formData.fullName.trim(),
          contact: formData.phone.trim(),
        },
        theme: {
          color: "#1976d2",
        },
        handler: async function (response) {
          try {
            setSubmitting(true);
            // 4. Verify payment signature on backend
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              // Clear global cart state
              clearCartLocally();
              refreshCart();
              // Navigate to Order Success screen
              navigate(`/order-success/${order._id}`);
            } else {
              setServerError("Payment verification failed. Please contact support.");
              setSubmitting(false);
            }
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            setServerError(
              verifyErr.response?.data?.message ||
                "Payment verification failed. Your cart was not cleared."
            );
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        setServerError(`Payment failed: ${response.error?.description || "Transaction declined"}`);
        setSubmitting(false);
      });

      paymentObject.open();
    } catch (err) {
      console.error("Create order failed:", err);
      setServerError(
        err.response?.data?.message || "Failed to initialize payment order. Please try again."
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="checkout-status-box">
          <div className="checkout-spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-status-box">
          <h2>Your Cart is Empty</h2>
          <p>You need items in your cart before you can check out.</p>
          <Link to="/products" className="place-order-btn" style={{ display: "inline-block", textDecoration: "none", width: "auto", marginTop: "1rem" }}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1 className="checkout-title">Checkout</h1>
      </div>

      {serverError && (
        <div className="form-error-banner" role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} noValidate>
        <div className="checkout-grid">
          {/* Shipping Address Section */}
          <div className="checkout-section">
            <h2 className="section-title">Shipping Details</h2>

            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-input ${errors.fullName ? "has-error" : ""}`}
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Aarav Sharma"
                disabled={submitting}
              />
              {errors.fullName && <p className="field-error">{errors.fullName}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-input ${errors.phone ? "has-error" : ""}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                disabled={submitting}
              />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="addressLine1" className="form-label">
                Address
              </label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                className={`form-input ${errors.addressLine1 ? "has-error" : ""}`}
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="e.g. 22 MG Road"
                disabled={submitting}
              />
              {errors.addressLine1 && (
                <p className="field-error">{errors.addressLine1}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="city" className="form-label">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className={`form-input ${errors.city ? "has-error" : ""}`}
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Bengaluru"
                disabled={submitting}
              />
              {errors.city && <p className="field-error">{errors.city}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className={`form-input ${errors.state ? "has-error" : ""}`}
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Karnataka"
                disabled={submitting}
              />
              {errors.state && <p className="field-error">{errors.state}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="pincode" className="form-label">
                Pincode
              </label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                className={`form-input ${errors.pincode ? "has-error" : ""}`}
                value={formData.pincode}
                onChange={handleChange}
                placeholder="e.g. 560001"
                maxLength={6}
                disabled={submitting}
              />
              {errors.pincode && <p className="field-error">{errors.pincode}</p>}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="checkout-section">
            <h2 className="section-title">Order Summary</h2>

            <div className="checkout-items-list">
              {cartItems.map((item) => {
                const product = item.product_id || {};
                const pId = product._id || item._id;
                const name = product.name || "Product";
                const qty = item.quantity || 1;
                const price = Number(product.price || 0);
                const itemTotal = price * qty;

                return (
                  <div key={pId} className="checkout-item-row">
                    <div>
                      <span className="checkout-item-name">{name}</span>
                      <span className="checkout-item-qty">× {qty}</span>
                    </div>
                    <span className="checkout-item-price">
                      ₹{itemTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="checkout-total-row">
              <span>Total</span>
              <span className="checkout-total-amount">
                ₹{calculateTotal().toLocaleString("en-IN")}
              </span>
            </div>

            <button
              type="submit"
              className="place-order-btn"
              disabled={submitting}
            >
              {submitting ? "Processing Payment..." : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
