import { Router } from "express";
import { detailLocation, detailStore, detailItem } from "../api/detail.mjs";

const detailRouter = Router();

detailRouter.post("/location", async (req, res) => {
  res.json(await detailLocation(req.body));
});

detailRouter.post("/store", async (req, res) => {
  res.json(
    await detailStore(
      Object.keys(req.body.ids).map((key) => ({
        id: req.body.ids[key],
        service: key,
      })),
      req.body.isRetail
    )
  );
});

detailRouter.post("/item", async (req, res) => {
  res.json(
    await detailItem(
      Object.keys(req.body).map((key) => ({
        itemData: req.body[key],
        service: key,
      }))
    )
  );
});

export default detailRouter;
