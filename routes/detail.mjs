import { Router } from "express";
import {
  detailLocation,
  detailStore,
  detailItem,
  detailNutrition,
} from "../api/detail.mjs";

const detailRouter = Router();

detailRouter.post("/location", async (req, res) => {
  res.json(await detailLocation(req.body));
});

detailRouter.post("/store", async (req, res) => {
  res.json(
    await detailStore(
      Object.keys(req.body).map((key) => ({
        id: req.body[key],
        service: key,
      }))
    )
  );
});

detailRouter.post("/item", async (req, res) => {
  res.json(await detailItem());
});

detailRouter.post("/nutrition", async (req, res) => {
  res.json(await detailNutrition(req.body));
});

export default detailRouter;
