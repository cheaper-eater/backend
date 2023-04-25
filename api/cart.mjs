import Postmates from "../services/Postmates.mjs";
import Grubhub from "../services/Grubhub.mjs";

//Postmates Cart Mutations

const createPostmatesCart = async (item, itemQuantity) => {
  const postmates = new Postmates();
  return (await postmates.createCart(item, itemQuantity)).data;
};

/*Add an item to a Postmates Cart
/@param(item) - params needed for Postmates.addToCart()
@return - returns the JSON response from Postmates.addToCart() 
*/
const addToPostmatesCart = async (item) => {
  const postmates = new Postmates();
  return (await postmates.addToCart(item)).data;
};

/*Remove an item from Postmates Cart
/@param(item) - params needed for Postmates.removeFromCart()
/@return - returns the JSON response from Postmates.removeFromCart() 
*/
const removeFromPostmatesCart = async (item) => {
  const postmates = new Postmates();
  return (await postmates.removeItem(item)).data;
};

/*Get Item Details from Postmates Menu
/@param(item) - params needed for Postmates.getItemDetails()
/@return - returns the JSON response from Postmates.getItemDetails()
*/
const getItemDetails = async (item) => {
  const postmates = new Postmates();
  return (await postmates.getItemDetails(item)).data;
};

/*Get Item Details from Postmates Menu
/@param(item) - params needed for Postmates.getItemDetails()
/@return - returns the JSON response from Postmates.getItemDetails()
*/
const getFee = async (item, cookies) => {
  const postmates = new Postmates();
  return (await postmates.getFee(item, cookies)).data;
};

//Grubhub Cart Mutations

/*Create a Grubhub Cart
/@param(item) - params needed for Grubhub.createCart()
/@return - returns the JSON response from Grubhub.createCart()
*/
const createGrubhubCart = async (item) => {
  const grubhub = new Grubhub();
  return (await grubhub.createCart(item)).data;
};

/*Add an item to a Grubhub Cart
/@param(item) - params needed for Grubhub.createCart() (nothing needed I think)
/@return - returns the JSON response from Grubhub.createCart()
*/
const addToGrubhubCart = async (item) => {
  const grubhub = new Grubhub();
  return await grubhub.addToCart(item);
};

/*Remove an item from a Grubhub Cart
/@param(item) - params needed for Grubhub.removeItem()
/@return - returns the JSON response from Grubhub.createCart()
*/
const removeFromGrubhubCart = async (item) => {
  const grubhub = new Grubhub();
  return (await grubhub.removeItem(item)).data;
};

/*Get subtotal + additional fees from Grubhub Cart
/@param(item) - params needed for Grubhub.getFee()
/@return - returns the JSON response from Grubhub.createCart()
*/
const getGrubhubFee = async (item) => {
  const grubhub = new Grubhub();
  return (await grubhub.getFee(item)).data;
};

/*Get item details + customizations from a Grubhub Menu
/@param(item) - params needed for Grubhub.getFee()
/@return - returns the JSON response from Grubhub.createCart()
*/
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
