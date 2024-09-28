const express = require("express");
const Cart = require("../models/CartModel");
const Product = require("../models/ProductModel");
const User = require("../models/UserModel");
const { AuthPermission } = require("../middleware/AuthPermission");

const router = express.Router();

router.post("/", AuthPermission("", true), async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [{ product: productId, quantity }],
      });
    } else {
      const productInCart = cart.products.find(
        (item) => item.product.toString() === productId
      );

      if (productInCart) {
        productInCart.quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
    }
    await cart.save();

    res
      .status(200)
      .json({ message: "Product added to cart successfully", cart });
  } catch (error) {
    res.status(500).json({ message: "Error adding product to cart", error });
  }
});

router.get("/:userId", AuthPermission("", true), async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "products.product",
      select: "id image price",
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }
    const productsWithQuantity = cart.products.map((item) => ({
      product: {
        id: item.product._id,
        image: item.product.image,
        price: item.product.price,
      },
      quantity: item.quantity,
    }));

    res.status(200).json({ products: productsWithQuantity });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart", error });
  }
});
router.delete("/", AuthPermission("", true), async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "User ID and Product ID are required" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }
    cart.products = cart.products.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    res
      .status(200)
      .json({ message: "Product removed from cart successfully", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing product from cart", error });
  }
});

router.put("/", AuthPermission("", true), async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (!userId || !productId || typeof quantity !== "number") {
      return res
        .status(400)
        .json({ message: "User ID, Product ID, and Quantity are required" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    const productInCart = cart.products.find(
      (item) => item.product.toString() === productId
    );

    if (!productInCart) {
      return res.status(404).json({ message: "Product not found in the cart" });
    }

    productInCart.quantity = quantity;

    await cart.save();

    res
      .status(200)
      .json({ message: "Product quantity updated successfully", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product quantity in cart", error });
  }
});

module.exports = router;
