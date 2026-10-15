const crypto = require("crypto");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Cart = require("../models/cart.model");
const razorpay = require("../config/razorpay");

async function createPaymentOrder(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required.",
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    // Validate required fields
    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All shipping address fields are required.",
      });
    }

    // Validate phone: must be valid 10 digits
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number.",
      });
    }

    // Validate pincode: exactly 6 digits
    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain 6 digits.",
      });
    }

    // Load user cart
    const userCart = await Cart.findOne({ user_id: userId });
    if (!userCart || !userCart.cart || userCart.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Add items before checking out.",
      });
    }

    // Load products and verify existence and stock
    const productIds = userCart.cart.map((item) => item.product_id);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    let totalAmount = 0;

    for (const item of userCart.cart) {
      const productIdStr = item.product_id.toString();
      const product = productMap.get(productIdStr);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart are no longer available.",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}.`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });

      totalAmount += product.price * item.quantity;
    }

    // Create pending ShopKart order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    // Save razorpayOrderId
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully. Please complete payment.",
      order,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment order.",
    });
  }
}

async function verifyPayment(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters.",
      });
    }

    // Verify HMAC SHA256 signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark as failed if order exists
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, user: userId },
        { paymentStatus: "FAILED" }
      );
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Payment verification failed.",
      });
    }

    // Find and update the order
    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Clear user cart only after successful payment verification
    const userCart = await Cart.findOne({ user_id: userId });
    if (userCart) {
      userCart.cart = [];
      await userCart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Order confirmed.",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while verifying payment.",
    });
  }
}

async function getOrders(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders.",
    });
  }
}

async function getOrderById(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Ensure order belongs to current authenticated user
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order details.",
    });
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
};