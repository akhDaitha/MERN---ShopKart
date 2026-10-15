import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCart } from "../services/api";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await getCart();
      const items = res.data?.userCart?.cart || [];
      const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(total);
    } catch {
      // If error or unauthenticated, cart count might be 0
      setCartCount(0);
    }
  }, []);

  const clearCartLocally = useCallback(() => {
    setCartCount(0);
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart, clearCartLocally }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
