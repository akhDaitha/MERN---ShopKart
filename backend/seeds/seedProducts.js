const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const newProducts = [
  {
    name: "Wireless Mechanical Keyboard",
    description: "Tactile mechanical keyboard with customizable RGB backlighting, hot-swappable switches, and multi-device Bluetooth connectivity.",
    price: 2999,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    stock: 25,
  },
  {
    name: "Ergonomic Wireless Mouse",
    description: "Precision optical mouse with comfortable ergonomic grip, programmable thumb buttons, and whisper-quiet clicks.",
    price: 1499,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    stock: 40,
  },
  {
    name: "Noise-Cancelling Headphones",
    description: "Over-ear wireless headphones with active noise cancellation, high-resolution audio drivers, and up to 40 hours of battery life.",
    price: 7999,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    stock: 18,
  },
  {
    name: "Curved Gaming Monitor 27-inch",
    description: "165Hz refresh rate, 1ms response time, QHD 2K resolution with AMD FreeSync Premium for seamless gameplay and productivity.",
    price: 21999,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    stock: 10,
  },
  {
    name: "USB-C Multiport Adapter Hub",
    description: "7-in-1 aluminium hub featuring 4K HDMI, 100W Power Delivery, SD/TF card slots, and high-speed USB 3.0 ports.",
    price: 1899,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80",
    stock: 35,
  },
  {
    name: "Smart Fitness Watch",
    description: "AMOLED touch display, heart rate & SpO2 monitoring, 5ATM water resistance, GPS tracking, and 12-day battery life.",
    price: 4499,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    stock: 22,
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Rugged waterproof outdoor speaker with deep bass, 360-degree stereo sound, and built-in power bank functionality.",
    price: 2499,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    stock: 30,
  },
  {
    name: "Fast Wireless Charging Pad 15W",
    description: "Ultra-slim Qi-certified wireless charging pad with temperature control and LED charging indicator.",
    price: 1199,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?auto=format&fit=crop&w=800&q=80",
    stock: 50,
  },
  {
    name: "Water-Resistant Laptop Backpack",
    description: "Minimalist anti-theft everyday backpack with dedicated padded sleeve for 16-inch laptops and hidden pockets.",
    price: 2299,
    category: "fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    stock: 25,
  },
  {
    name: "Classic Heavyweight Cotton Hoodie",
    description: "Cozy fleece-lined pullover hoodie made from 100% sustainable combed cotton with ribbed cuffs and kangaroo pocket.",
    price: 1799,
    category: "fashion",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    stock: 30,
  },
  {
    name: "Insulated Stainless Steel Bottle",
    description: "Double-walled vacuum insulated flask that keeps drinks ice cold for 24 hours or piping hot for 12 hours (750ml).",
    price: 899,
    category: "home",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
    stock: 45,
  },
  {
    name: "Dual-Sided PU Leather Desk Mat",
    description: "Extra large 90x40cm waterproof desk pad with smooth gliding surface, non-slip base, and easy clean finish.",
    price: 699,
    category: "home",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    stock: 60,
  },
  {
    name: "Smart RGB Ambient Desk Lamp",
    description: "Touch-controlled LED lamp with 16 million colors, stepless dimming, sleep timer, and smartphone app control.",
    price: 1999,
    category: "home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    stock: 20,
  },
  {
    name: "Ergonomic Lumbar Support Cushion",
    description: "High-density memory foam cushion contoured to alleviate back fatigue during long study and work sessions.",
    price: 1299,
    category: "home",
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
    stock: 35,
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    let addedCount = 0;
    for (const item of newProducts) {
      const exists = await Product.findOne({ name: item.name });
      if (!exists) {
        await Product.create(item);
        console.log(`+ Added: "${item.name}" (₹${item.price})`);
        addedCount++;
      } else {
        console.log(`= Already exists: "${item.name}"`);
      }
    }

    const total = await Product.countDocuments();
    console.log(`\nDone! Added ${addedCount} new products. Total products in database: ${total}`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
