import userModel from "../models/userModel.js"

// add products to user cart (atomic increment)
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;
    const field = `cartData.${itemId}.${size}`;
    await userModel.findByIdAndUpdate(
      userId,
      { $inc: { [field]: 1 } },
      { upsert: true }
    );
    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update user cart (atomic set)
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;
    const field = `cartData.${itemId}.${size}`;
    await userModel.findByIdAndUpdate(
      userId,
      { $set: { [field]: quantity } }
    );
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get user cart data (projection)
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId, { cartData: 1, _id: 0 });
    res.json({ success: true, cartData: userData?.cartData || {} });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart }