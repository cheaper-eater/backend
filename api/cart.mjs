import Postmates from "../services/Postmates.mjs";

/* Search postmates
 * @param {item} postmates item{} used to initailize cart
 * @return {object} either success json or error
 */
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

export {
  createPostmatesCart,
  addToPostmatesCart,
  removeFromPostmatesCart,
  getItemDetails,
  getFee,
};
