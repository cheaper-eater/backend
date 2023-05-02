import Postmates from "../services/Postmates.mjs";
import Grubhub from "../services/Grubhub.mjs";
import { HTTPResponseError } from "../errors/http.mjs";

/* Search postmates
 * @param {item} postmates item{} used to initailize cart
 * @return {object} either success json or error
 */
const createPostmatesCart = async (item, itemQuantity) => {
  try {
    const postmates = new Postmates();
    return (await postmates.createCart(item, itemQuantity)).data;
  } catch (e) {
    if (e instanceof HTTPResponseError) {
      return { error: await e.getError() };
    } else {
      console.error(e);
    }
  }
};

const addToPostmatesCart = async (item) => {
  try {
    const postmates = new Postmates();
    return (await postmates.addToCart(item)).data;
  } catch (e) {
    if (e instanceof HTTPResponseError) {
      return { error: await e.getError() };
    } else {
      console.error(e);
    }
  }
};

const removeFromPostmatesCart = async (item) => {
  try {
    const postmates = new Postmates();
    return (await postmates.removeItem(item)).data;
  } catch (e) {
    if (e instanceof HTTPResponseError) {
      return { error: await e.getError() };
    } else {
      console.error(e);
    }
  }
};

const getItemDetails = async (item) => {
  try {
    console.log(
      "ASDFASDFASDFASDFASDFASDFASDFASDFASDFASDFASDFASDFASDFASDFASDFASDF"
    );
    const postmates = new Postmates();
    return (await postmates.getItemDetails(item)).data;
  } catch (e) {
    if (e instanceof HTTPResponseError) {
      return { error: await e.getError() };
    } else {
      console.error(e);
    }
  }
};

const getFee = async (item, cookies) => {
  try {
    const postmates = new Postmates();
    return (await postmates.getFee(item, cookies)).data;
  } catch (e) {
    if (e instanceof HTTPResponseError) {
      return { error: await e.getError() };
    } else {
      console.error(e);
    }
  }
};

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
