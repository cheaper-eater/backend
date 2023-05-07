import { getDB } from "../database.mjs";

const getUserPastOrders = async (user) => {
  const db = await getDB();
  const orders = await db
    .collection("orders")
    .find({ user: user._id })
    .toArray();
  return orders;
};

export { getUserPastOrders };
