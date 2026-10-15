import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/CartItem.css";

export default function CartItem({ item, onUpdateQty, onRemove }) {
  const [loadingAction, setLoadingAction] = useState(false);

  if (!item) return null;

  const product = item.product_id || {};
  const productId = product._id || item.product_id;
  const name = product.name || "Product";
  const image = product.image || "https://placehold.co/150x150?text=Product";
  const price = Number(product.price || 0);
  const stock = typeof product.stock === "number" ? product.stock : 99;
  const quantity = item.quantity || 1;
  const lineTotal = price * quantity;

  const handleDecrease = async () => {
    if (loadingAction) return;
    try {
      setLoadingAction(true);
      if (quantity > 1) {
        await onUpdateQty(productId, quantity - 1);
      } else {
        await onRemove(productId);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleIncrease = async () => {
    if (loadingAction) return;
    try {
      setLoadingAction(true);
      await onUpdateQty(productId, quantity + 1);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemove = async () => {
    if (loadingAction) return;
    try {
      setLoadingAction(true);
      await onRemove(productId);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="cart-item-card">
      <div className="cart-item-image-wrapper">
        <img
          src={image}
          alt={name}
          className="cart-item-image"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/150x150?text=Product";
          }}
        />
      </div>

      <div className="cart-item-details">
        <div className="cart-item-info">
          <Link to={`/products/${productId}`} className="cart-item-title">
            {name}
          </Link>
          <div className="cart-item-unit-price">
            ₹{price.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="cart-item-controls-row">
          <div className="cart-item-qty-and-remove">
            <div className="cart-qty-selector">
              <button
                type="button"
                className="cart-qty-btn"
                onClick={handleDecrease}
                disabled={loadingAction}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="cart-qty-value">{quantity}</span>
              <button
                type="button"
                className="cart-qty-btn"
                onClick={handleIncrease}
                disabled={loadingAction || stock <= 0}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="cart-remove-btn"
              onClick={handleRemove}
              disabled={loadingAction}
            >
              Remove
            </button>
          </div>

          <div className="cart-item-line-total">
            ₹{lineTotal.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
