import { Router } from "express";
import {
  createPostmatesCart,
  addToPostmatesCart,
  removeFromPostmatesCart,
  getItemDetails,
  getFee,
  addToGrubhubCart,
  getGrubhubFee,
  removeFromGrubhubCart,
  getGrubhubDetails,
  createGrubhubCart,
} from "../api/cart.mjs";

const cartRouter = Router();

cartRouter.post("/createPostmatesCart", async (req, res) => {
  res.json(await createPostmatesCart(req.body));
});

cartRouter.post("/addToPostmatesCart", async (req, res) => {
  res.json(await addToPostmatesCart(req.body));
});

cartRouter.post("/removeFromPostmatesCart", async (req, res) => {
  res.json(await removeFromPostmatesCart(req.body));
});

cartRouter.post("/getItemDetails", async (req, res) => {
  res.json(await getItemDetails(req.body));
});

cartRouter.post("/getFee", async (req, res) => {
  res.json(await getFee(req.body));
});

//Grubhub Routes

cartRouter.post("/addToGrubhubCart", async (req, res) => {
  res.json(await addToGrubhubCart(req.body));
});

cartRouter.post("/removeFromGrubhubCart", async (req, res) => {
  res.json(await removeFromGrubhubCart(req.body));
});

cartRouter.post("/getGrubhubFee", async (req, res) => {
  res.json(await getGrubhubFee(req.body));
});

cartRouter.post("/getGrubhubDetails", async (req, res) => {
  res.json(await getGrubhubDetails(req.body));
});

cartRouter.post("/createGrubhubCart", async (req, res) => {
  res.json(await createGrubhubCart(req.body));
});

export default cartRouter;
