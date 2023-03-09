import Postmates from "../services/Postmates.mjs";
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

const addPostmatesCart = async (item) => {
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
export { createPostmatesCart, addPostmatesCart, removeFromPostmatesCart };
