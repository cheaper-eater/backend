import { Router } from "express";
import { getUserPastOrders } from "../api/user.mjs";
import { requireAuthentication } from "../middleware.mjs";

const userRouter = Router();

userRouter.get("/pastViewed", requireAuthentication, async (req, res) => {
  try {
    const orders = await getUserPastOrders(req.user);
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong." });
  }
});

export default userRouter;
