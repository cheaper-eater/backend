import Postmates from "../services/Postmates.mjs";
import Grubhub from "../services/Grubhub.mjs";

//Postmates Cart Mutations

const createPostmatesCart = async (item, itemQuantity) => {
  const postmates = new Postmates();
  return (await postmates.createCart(item, itemQuantity)).data;
};

const addToPostmatesCart = async (item) => {
  const postmates = new Postmates();
  return (await postmates.addToCart(item)).data;
};

const removeFromPostmatesCart = async (item) => {
  const postmates = new Postmates();
  return (await postmates.removeItem(item)).data;
};

const getItemDetails = async (item) => {
  const postmates = new Postmates();
  return (await postmates.getItemDetails(item)).data;
};

const getFee = async (item, cookies) => {
  const postmates = new Postmates();
  return (await postmates.getFee(item, cookies)).data;
};

//Grubhub Cart Mutations

const createGrubhubCart = async (item) => {
  const grubhub = new Grubhub();
  return (await grubhub.createCart(item)).data;
};

const addToGrubhubCart = async (item) => {
  const grubhub = new Grubhub();
  return await grubhub.addToCart(item);
};

const removeFromGrubhubCart = async (item) => {
  const grubhub = new Grubhub();
  return (await grubhub.removeItem(item)).data;
};

const getGrubhubFee = async (item) => {
  const grubhub = new Grubhub();
  return (await grubhub.getFee(item)).data;
};

const getGrubhubDetails = async (item) => {
  const grubhub = new Grubhub();
  return (await grubhub.getItemDetails(item)).data;
};

export {
  //Postmates
  createPostmatesCart,
  addToPostmatesCart,
  removeFromPostmatesCart,
  getItemDetails,
  getFee,
  //Grubhub
  createGrubhubCart,
  addToGrubhubCart,
  removeFromGrubhubCart,
  getGrubhubFee,
  getGrubhubDetails,
};
