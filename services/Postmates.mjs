import { env } from "node:process";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import Service from "./Service.mjs";

class Postmates extends Service {
  constructor() {
    super();
    this.service = "postmates";
    this.commonHeaders = {
      authority: "postmates.com",
      accept: "*/*",
      "accept-language": "en-US,en;q=0.8",
      "content-type": "application/json",
      origin: "https://postmates.com",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
      "x-csrf-token": "x",
    };
  }

  /* Autocomplete location information
   * @param {String} query the search location
   * @return {Array} of autocomplete result
   */
  async getLocationAutocomplete(query) {
    return await (
      await this.callServiceAPI(() =>
        fetch("https://postmates.com/api/getLocationAutocompleteV1", {
          method: "POST",
          headers: this.commonHeaders,
          body: JSON.stringify({ query: query }),
        })
      )
    ).json();
  }

  /* Get detailed location information
   * @param {Object} locationData location data from getLocationAutocomplete
   * @param {Object} location details
   */
  async getLocationDetails(locationData) {
    return await (
      await this.callServiceAPI(() =>
        fetch("https://postmates.com/api/getLocationDetailsV1", {
          method: "POST",
          headers: this.commonHeaders,
          body: JSON.stringify(locationData),
        })
      )
    ).json();
  }

  /* Get detailed delivery location information
   * @param {Object} payload
   * @param {String} payload.id location id (placeId)
   * @param {String} payload.provider location provider
   * @return {Object} detailed location data
   */
  async getDeliveryLocationDetails({ id, provider }) {
    return await (
      await this.callServiceAPI(() =>
        fetch("https://postmates.com/api/getDeliveryLocationV1", {
          method: "POST",
          headers: this.commonHeaders,
          body: JSON.stringify({
            placeId: id,
            provider: provider,
            source: "manual_auto_complete",
          }),
        })
      )
    ).json();
  }

  /*Replace the domain of cookies to the applicaiton domain
   * @param {Array} cookies the cookies to modify
   * @return {Array} modified cookies
   */
  replaceCookieDomain(cookies) {
    return cookies.map((cookie) =>
      cookie.replace(this.commonHeaders.authority, env.DOMAIN)
    );
  }

  /*Conver array of cookie strings in standard format to JSON object
   * @param {Array} cookies
   * @return {Object} converted key value pair JSON object
   */
  cookiesToJson(cookies) {
    return cookies.reduce((cookiesJson, cookie) => {
      const [prop, value] = cookie.split(";")[0].split("=");
      cookiesJson[prop] = value;
      return cookiesJson;
    }, {});
  }

  /* Convert Json cookie to a format Postmate's server understands
   *@param {Object, String} json the json data to convert
   *@Param {Booleam} isString a value indicating if the json data is string
   *@return {String} Json formatted as cookie
   */
  jsonToCookie(json, isString = false) {
    if (!isString) {
      json = JSON.stringify(json);
    }
    return json
      .replaceAll("\t", "")
      .replaceAll("\n", "")
      .replaceAll('"', "%22")
      .replaceAll(" ", "")
      .replaceAll("\\", "");
  }

  /*Convert Object of cookie name to value to string format
   * of pattern 'name-value;'
   * @param {Object} cookies
   * @return {String}
   */
  CookiesObjectToString(cookies) {
    return Object.keys(cookies).reduce(
      (acc, key) => (acc += `${key}=${cookies[key]}; `),
      ""
    );
  }

  /*Set location for instance
   * @param {String} locationDetails from getLocationDetails
   * @return {Array} session cookies containing location info
   */
  async setLocation(locationDetails) {
    return {
      responseCookies: this.cookiesToJson(
        (
          await this.callServiceAPI(() =>
            fetch("https://postmates.com/api/setTargetLocationV1", {
              method: "POST",
              headers: {
                authority: "postmates.com",
                accept: "*/*",
                "accept-language": "en-US,en;q=0.6",
                "content-type": "application/json",
                cookie: `uev2.loc=${this.jsonToCookie(locationDetails)}`,
                origin: "https://postmates.com",
                referer: "https://postmates.com/",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "user-agent":
                  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
                "x-csrf-token": "x",
              },
              body: "{}",
            })
          )
        ).headers.raw()["set-cookie"]
      ),
    };
  }

  /* Search query
   * @param {Object} payload
   * @param {String} payload.query the query to search
   * @param {Object} payload.cookies request cookies containing location data
   * @return {Object} the search result or HTTPResponseError
   */
  async search({ query, cookies }) {
    const res = await this.callServiceAPI(() =>
      fetch("https://postmates.com/api/getFeedV1", {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "application/json",
          origin: "https://postmates.com",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-gpc": "1",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
          "x-csrf-token": "x",
          cookie: this.CookiesObjectToString(cookies),
        },
        body: JSON.stringify({
          userQuery: query,
          date: "",
          startTime: 0,
          endTime: 0,
          carouselId: "",
          sortAndFilters: [],
          marketingFeedType: "",
          billboardUuid: "",
          feedProvider: "",
          promotionUuid: "",
          targetingStoreTag: "",
          venueUUID: "",
          selectedSectionUUID: "",
          favorites: "",
          vertical: "ALL",
          searchSource: "SEARCH_SUGGESTION",
          keyName: "",
        }),
      })
    );

    return {
      data: await res.json(),
      responseCookies: {
        ...this.cookiesToJson(res.headers.raw()["set-cookie"]),
      },
    };
  }

  /* Get store information
   * @param {String} contains the restraunt ID (Should come from search results as storeUUID)
   * @return {Array} an array of [storeName, storeID, storeImage, storeHours,
   * menu[category[items[name, description, price, image]]]], or HTTPResponseError
   */
  async getStore(restarauntID) {
    return await (
      await this.callServiceAPI(() =>
        fetch("https://postmates.com/_p/api/getStoreV1", {
          method: "POST",
          headers: {
            authority: "postmates.com",
            accept: "*/*",
            "content-type": "application/json",
            "user-agent": this.commonHeaders["user-agent"],
            "x-csrf-token": "x",
          },
          body: JSON.stringify({ storeUuid: restarauntID }),
        })
      )
    ).json();
  }

  /*Autocomplete search results
   * @param {Object} payload
   * @param {String} payload.query to search
   * @param {Object} payload.cookies request cookies to use for search
   * @return {Object} raw search results and response cookies
   */
  async autocompleteSearch({ query, cookies }) {
    const res = await this.callServiceAPI(() =>
      fetch("https://postmates.com/api/getSearchSuggestionsV1", {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          origin: "https://postmates.com",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-gpc": "1",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36",
          "x-csrf-token": "x",
          cookie: this.CookiesObjectToString(cookies),
        },
        body: JSON.stringify({
          userQuery: query,
          date: "",
          startTime: 0,
          endTime: 0,
          vertical: "ALL",
        }),
      })
    );

    return {
      data: await res.json(),
      responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
    };
  }

  /*Initialize Postmates cart.
   * @params itemID->itemName are obtained from getStore() and getItemDetails().
   * @param {itemQuantity} Number of the item to add to the cart.
   * @param cookies {Object} cookie to pass in location data.
   * @return {Object} Raw cart information response.
   */
  async createCart(
    {
      itemID,
      storeID,
      sectionID,
      subsectionID,
      priceAsCents,
      itemName,
      itemQuantity,
      customizations,
      imageURL,
    },
    cookies
  ) {
    const generatedItemUUID = uuidv4();
    const res = await this.callServiceAPI(() =>
      fetch("https://postmates.com/api/createDraftOrderV2", {
        method: "POST",
        headers: {
          authority: "postmate s.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          cookie: this.CookiesObjectToString(cookies),
          dnt: "1",
          origin: "https://postmates.com",
          "sec-ch-ua":
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
          "x-csrf-token": "x",
        },
        body: JSON.stringify({
          isMulticart: false,
          shoppingCartItems: [
            {
              uuid: itemID,
              shoppingCartItemUuid: generatedItemUUID,
              storeUuid: storeID,
              sectionUuid: sectionID,
              subsectionUuid: subsectionID,
              price: priceAsCents,
              title: itemName,
              quantity: itemQuantity,
              customizations: customizations,
              imageURL: imageURL,
              specialInstructions: "",
              itemId: null,
            },
          ],
          useCredits: true,
          extraPaymentProfiles: [],
          promotionOptions: {
            autoApplyPromotionUUIDs: [],
            selectedPromotionInstanceUUIDs: [],
            skipApplyingPromotion: false,
          },
          deliveryTime: {
            asap: true,
          },
          deliveryType: "ASAP",
          currencyCode: "USD",
          interactionType: "door_to_door",
          checkMultipleDraftOrdersCap: false,
          isGuestOrder: true,
          businessDetails: {
            profileType: "personal",
          },
        }),
      })
    );
    return {
      data: await res.json(),
      responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
    };
  }

  /* Get Item details nessecary to access customizations
   * @param storeID->itemID are obtained from getStore().
   */
  async getItemDetails({ storeID, sectionID, subsectionID, itemID }) {
    console.log("Here");
    const res = await this.callServiceAPI(() =>
      fetch("https://postmates.com/api/getMenuItemV1", {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          dnt: "1",
          origin: "https://postmates.com",
          "sec-ch-ua":
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";vx ="110"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
          "x-csrf-token": "x",
        },
        body: JSON.stringify({
          itemRequestType: "ITEM",
          storeUuid: storeID,
          sectionUuid: sectionID,
          subsectionUuid: subsectionID,
          menuItemUuid: itemID,
        }),
      })
    );
    return {
      data: await res.json(),
    };
  }

  /* Add Item to Postmates Cart
   *@param draftOrderID {Object} is obtained from createCart().
   *@param cartID {Object} is obtained from createCart().
   @param itemID->image is obtained from getMenu() and getItemDetails().
   */

  async addToCart({
    draftOrderID,
    cartID,
    itemID,
    storeID,
    sectionID,
    subsectionID,
    priceAsCents,
    title,
    itemQuantity,
    customizations,
    image,
  }) {
    const generatedItemUUID = uuidv4();
    const res = await this.callServiceAPI(() =>
      fetch("https://postmates.com/api/addItemsToDraftOrderV2", {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          dnt: "1",
          origin: "https://postmates.com",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
          "x-csrf-token": "x",
        },
        body: JSON.stringify({
          draftOrderUUID: draftOrderID,
          cartUUID: cartID,
          items: [
            {
              uuid: itemID,
              shoppingCartItemUuid: generatedItemUUID,
              storeUuid: storeID,
              sectionUuid: sectionID,
              subsectionUuid: subsectionID,
              price: priceAsCents,
              title: title,
              quantity: itemQuantity,
              customizations: customizations,
              imageURL: image,
              specialInstructions: "",
              itemId: null,
            },
          ],
          shouldUpdateDraftOrderMetadata: false,
          storeUUID: storeID,
        }),
      })
    );
    return {
      data: await res.json(),
    };
  }

  /* Returns the fee for the cart
   * @param item {draftOrderID} is obtained from createCart()., cookies {Object}
   * @return JSON object with cart subtotal and fee.
   */
  async getFee({ draftOrderID }, cookies) {
    const res = await this.callServiceAPI(() =>
      fetch("https://postmates.com/api/getCheckoutPresentationV1", {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          cookie: this.CookiesObjectToString(cookies),
          dnt: "1",
          origin: "https://postmates.com",
          "sec-ch-ua":
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
          "x-csrf-token": "x",
        },
        body: JSON.stringify({
          payloadTypes: [
            "fulfillmentPromotionInfo",
            "deliveryOptInInfo",
            "eta",
            "fareBreakdown",
            "upfrontTipping",
            "basketSizeTracker",
            "total",
            "cartItems",
            "subtotal",
            "promotion",
            "disclaimers",
            "orderConfirmations",
            "passBanner",
            "taxProfiles",
            "addressNudge",
            "basketSize",
            "complements",
            "messageBanner",
            "merchantMembership",
            "restrictedItems",
            "timeWindowPicker",
          ],
          isGroupOrder: false,
          draftOrderUUID: draftOrderID, //Only thing we need to pass in, comes from createCart
        }),
      })
    );
    return {
      data: await res.json(),
      responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
    };
  }

  /* Remove an item from the cart.
   * @param item {cartID, draftOrderID, itemsRemovedID, storeID}
   * @return JSON response from Postmates ("status": "success"),
   */
  async removeItem(cartID, draftOrderID, itemsRemovedID, storeID) {
    const res = await this.callServiceAPI(() =>
      fetch("https://postmates.com/api/removeItemsFromDraftOrderV2", {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          dnt: "1",
          origin: "https://postmates.com",
          "sec-ch-ua":
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
          "x-csrf-token": "x",
        },
        body: JSON.stringify({
          cartUUID: cartID,
          draftOrderUUID: draftOrderID,
          shoppingCartItemUUIDs: [itemsRemovedID],
          storeUUID: storeID,
        }),
      })
    );

    return {
      data: await res.json(),
    };
  }

  /* Search itemName on Edamam API
   * @param itemName is a JSON containing a string called "itemName"
   * @return JSON response from Edamam API
   */
  async getNutrition(itemName) {
    const API_ID = "74a7395c";
    const API_KEY = "5a8f495c6c3e001a6fc2f3da84488f7b	";
    const itemString = JSON.stringify(itemName);
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${API_ID}&app_key=${API_KEY}&ingr=${encodeURIComponent(
      itemString
    )}&nutrition-type=logging`;

    const res = await this.callServiceAPI(() =>
      fetch(url, {
        method: "GET",
      })
    );

    return {
      data: await res.json(),
    };
  }
}
export default Postmates;
