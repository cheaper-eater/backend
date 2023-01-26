import express from "express";
import { insertOne, find } from "../api/db.mjs";
import { search } from "../api/search.mjs";
import { autocompleteLocation } from "../api/autocomplete.mjs";
import { detailLocation } from "../api/detail.mjs";
import { setLocation } from "../api/set.mjs";

const router = express.Router();

router.post("/set/location", async (req, res) => {
  try {
    res.setHeader("Set-Cookie", await setLocation(req.body.locationDetails));
    res.send();
  } catch (e) {
    console.error(e);
  }
});

router.get("/detail/location", async (req, res) => {
  try {
    res.json(await detailLocation(req.body.locationData));
  } catch (e) {
    console.error(e);
  }
});

router.get("/autocomplete/location", async (req, res) => {
  try {
    res.json(await autocompleteLocation(req.body.query));
  } catch (e) {
    console.error(e);
  }
});

router.get("/search", async (req, res) => {
  try {
    res.json(await search(req.body));
  } catch (e) {
    console.error(e);
  }
});

router.get("/db/get/", async (req, res) => {
  try {
    const results = await find();
    res.status(200).send({ response: results });
  } catch (e) {
    console.error(e);
    res.status(400).send({ message: e });
  }
});

router.post("/db/add/", async (req, res) => {
  try {
    const insertedId = await insertOne({ data: req.body.data });
    res.status(200).send({
      message: insertedId,
    });
  } catch (e) {
    console.error(e);
    res.status(400).send({ message: e });
  }
});

export default router;
