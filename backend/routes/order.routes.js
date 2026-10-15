const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
} = require("../controllers/order.controller");

router.post("/create-payment-order", authMiddleware, createPaymentOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);
router.get("/", authMiddleware, getOrders);
router.get("/:id", authMiddleware, getOrderById);

module.exports = router;
