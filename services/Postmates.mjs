import { env } from "node:process";
import fetch from "node-fetch";
import { HTTPResponseError } from "../errors/http.mjs";
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
    const res = await fetch(
      "https://postmates.com/api/getLocationAutocompleteV1",
      {
        method: "POST",
        headers: this.commonHeaders,
        body: JSON.stringify({ query: query }),
      }
    );

    if (res.ok) {
      return await res.json();
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /* Get detailed location information
   * @param {Object} locationData location data from getLocationAutocomplete
   * @param {Object} location details
   */
  async getLocationDetails(locationData) {
    const res = await fetch("https://postmates.com/api/getLocationDetailsV1", {
      method: "POST",
      headers: this.commonHeaders,
      body: JSON.stringify(locationData),
    });
    if (res.ok) {
      return await res.json();
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /* Get detailed delivery location information
   * @param {Object} locationData location data from getLocationAutocomplete
   * @param {Object} location details
   */
  async getDeliveryLocationDetails({ id, provider }) {
    const res = await fetch("https://postmates.com/api/getDeliveryLocationV1", {
      method: "POST",
      headers: this.commonHeaders,
      body: JSON.stringify({
        placeId: id,
        provider: provider,
        source: "manual_auto_complete",
      }),
    });
    if (res.ok) {
      return await res.json();
    } else {
      throw new HTTPResponseError(res);
    }
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
    const res = await fetch("https://postmates.com/api/setTargetLocationV1", {
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
    });

    if (res.ok) {
      return {
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /* Search query
   * @param {String} query the query to search
   * @param {Object} cookies containing location data
   * @return {Object} the search result or HTTPResponseError
   */
  async search({ query, cookies }) {
    const res = await fetch("https://postmates.com/api/getFeedV1", {
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
    });
    if (res.ok) {
      return {
        data: await res.json(),
        resCookies: {
          ...this.cookiesToJson(res.headers.raw()["set-cookie"]),
        },
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /* Get store information
   * @param {String} contains the restraunt ID (Should come from search results as storeUUID)
   * @return {Array} an array of [storeName, storeID, storeImage, storeHours,
   * menu[category[items[name, description, price, image]]]], or HTTPResponseError
   */
  async getStore(restarauntID) {
    const res = await fetch("https://postmates.com/api/getStoreV1", {
      method: "POST",
      headers: {
        authority: "postmates.com",
        accept: "*/*",
        "content-type": "application/json",
        dnt: "1",
        "x-csrf-token": "x",
      },
      body: JSON.stringify({ storeUuid: restarauntID }),
    });
    if (res.ok) {
      return await res.json();
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /*Autocomplete search results
   * @param {String} query to search
   * @param cookies {Object} cookies to use for search
   * @return {Object} raw search results and response cookies
   */
  async autocompleteSearch({ query, cookies }) {
    const res = await fetch(
      "https://postmates.com/api/getSearchSuggestionsV1",
      {
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
      }
    );
    if (res.ok) {
      return {
        data: await res.json(),
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  //Must add item to initialize cart.
  //Cart returns cartUUID & draftOrderUUID; very important for later.
  async createCart(item, cookies) {
    const res = await fetch("https://postmates.com/api/createDraftOrderV2", {
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
        isMulticart: "false", //Item UUID
        shoppingCartItem: {
          uuid: item.id, //HAVE from getStoreV1
          shoppingCartItemUuid: item.CartItemID, //Generated and assigned locally
          storeUuid: item.storeID, //HAVE from getStoreV1
          sectionUuid: item.sectionID, //HAVE from getStoreV1
          subsectionUuid: item.subsectionID, //HAVE from getStoreV1
          price: item.priceAsCents, //HAVE from getStoreV1
          title: item.title, //HAVE from getStoreV1
        },
        useCredits: "true",
        extraPaymentProfiles: [],
        promotionOptions: {
          autoApplyPromotionUUIDs: [],
          selectedPromotionInstanceUUIDs: [],
          skipApplyingPromotion: false,
        },
        deliveryTime: { asap: true },
        deliveryType: "ASAP",
        currencyCode: "USD",
        interactionType: "door_to_door",
        checkMultipleDraftOrdersCap: "false",
        isGuestOrder: "true",
        businessDetails: { profileType: "personal" },
      }),
    });
    if (res.ok) {
      return {
        data: await res.json(),
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  //Needed to selct customizations
  async getItemDetails(storeID, sectionID, subsectionID, itemID) {
    const res = await fetch("https://postmates.com/api/getMenuItemV1", {
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
    });
    if (res.ok) {
      return {
        data: await res.json(),
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  //Adding blueberry muffin
  async addToCart(draftOrderID, cartID, item, itemQuantity) {
    const res = await fetch(
      "https://postmates.com/api/addItemsToDraftOrderV2",
      {
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
              uuid: item.itemID,
              shoppingCartItemUuid: item.CartItemID,
              storeUuid: item.storeID,
              sectionUuid: item.sectionID,
              subsectionUuid: item.subsectionID,
              price: item.priceAsCents,
              title: item.title,
              quantity: itemQuantity,
              customizations: item.customizations,
              imageURL: item.image,
              specialInstructions: "",
              itemId: null,
            },
          ],
          shouldUpdateDraftOrderMetadata: false,
          storeUUID: item.storeID,
        }),
      }
    );
    if (res.ok) {
      return {
        data: await res.json(),
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  async getFee(draftOrderID) {
    const res = await fetch(
      "https://postmates.com/api/getCheckoutPresentationV1",
      {
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
          payloadTypes: ["cartItems", "subtotal", "basketSize", "promotion"], //These don't actually take in any data
          isGroupOrder: false,
          draftOrderUUID: draftOrderID, //Only thing we need to pass in, comes from createCart
        }),
      }
    );
    if (res.ok) {
      return {
        data: await res.json(),
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  async removeItem(cartID, draftOrderID, itemsRemovedID, storeID) {
    const res = await fetch(
      "https://postmates.com/api/addItemsToDraftOrderV2",
      {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          cookie:
            "uev2.id.session=1dc4b0ed-66f7-441b-a737-a422ab0ffddf; uev2.ts.session=1677542037321; marketing_vistor_id=9b6efbc9-abbf-499a-9da0-891ae45380f0; uev2.unregisteredUserUuid=241a6308-bbb7-5a89-85c4-3500c1135cfa; uev2.do=d3095756-0ccb-41fc-ac5d-235b44b365d3; uev2.gosid=GOSID-3a009157-3857-4898-8174-39c62e602e82; ",
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
          shoppingCartItemUUIDs: itemsRemovedID,
          shouldUpdateDraftOrderMetadata: false,
          storeUUID: storeID,
        }),
      }
    );
    if (res.ok) {
      return {
        data: await res.json(),
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  async discardCart(draftOrderID) {
    const res = await fetch("https://postmates.com/api/discardDraftOrderV2", {
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
      body: draftOrderID,
    });
    if (res.ok) {
      return {
        data: await res.json(),
        responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }
}
export default Postmates;
