import { env } from "node:process";
import { v4 as uuidv4 } from "uuid";
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

  /*Initialize cart
   * @param {item} item to add
   * @param {itemQuantity} # of that item to add to cart
   * @param cookies {Object} cookie to pass in location data
   * @return {Object} raw cart information
   */
  async createCart(item, itemQuantity) {
    const generatedItemUUID = uuidv4();
    const res = await fetch("https://postmates.com/api/createDraftOrderV2", {
      method: "POST",
      headers: {
        authority: "postmates.com",
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        //cookie: this.CookiesObjectToString(cookies),
        cookie:
          "uev2.id.xp=f178f947-11d4-4393-9355-efde4811cdbe; dId=7fd92c4f-c8c4-4b33-a404-cfb224f95d58; uev2.id.session=1ae26edb-6cff-46f2-b29a-abe33c575b68; uev2.ts.session=1677896009886; marketing_vistor_id=a505e25a-f431-44f8-bec2-3709df95c7b0; jwt-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9fand0X3JwY19wcm90ZWN0aW9uX2V4cGlyZXNfYXRfbXMiOjE2Nzc4OTcyODA5MTAsIl9fand0X3JwY19wcm90ZWN0aW9uX3V1aWQiOiIwN2ZhMDBmOS1kYzYwLTRhYTctODU4ZS03Y2Q0MmM1M2MyMzMiLCJfX2p3dF9ycGNfcHJvdGVjdGlvbl9jcmVhdGVkX2F0X21zIjoxNjc3ODk2MDA5OTEwfSwiaWF0IjoxNjc3ODk2MDEwLCJleHAiOjE2Nzc5ODI0MTB9.hNzcZ4KYRLYzQ2HCBPa7HuIuVAWmIJvxpN9YGH9Mi5k; __cf_bm=Q632amgP5C.ovCagkLEc1yk5Ld9jsfefsIHhFgeQ3Sw-1677896010-0-AWzIju68U/MHo+6IOEXBJkkHxb9A/qKB16bkLtD5L2kh649rydGnR40KC54USkmxMKjbht0C3g8vZN4ZZJjS3Tw=; uev2.gg=true; utm_medium=undefined; fm_conversion_id=undefined; utm_source=undefined; CONSENTMGR=c1:1%7Cc2:1%7Cc3:1%7Cc4:1%7Cc5:1%7Cc6:1%7Cc7:1%7Cc8:1%7Cc9:1%7Cc10:1%7Cc11:1%7Cc12:1%7Cc13:1%7Cc14:1%7Cc15:1%7Cts:1677896012239%7Cconsent:true; _userUuid=; uev2.loc=%7B%22address%22%3A%7B%22address1%22%3A%22Cal%20State%20Long%20Beach%20Usu%20Ballrooms%22%2C%22address2%22%3A%221250%20Bellflower%20Blvd%2C%20Long%20Beach%2C%20California%22%2C%22aptOrSuite%22%3A%22%22%2C%22eaterFormattedAddress%22%3A%221250%20Bellflower%20Blvd%2C%20Long%20Beach%2C%20CA%2090840%2C%20US%22%2C%22subtitle%22%3A%221250%20Bellflower%20Blvd%2C%20Long%20Beach%2C%20California%22%2C%22title%22%3A%22Cal%20State%20Long%20Beach%20Usu%20Ballrooms%22%2C%22uuid%22%3A%22%22%7D%2C%22latitude%22%3A33.783863%2C%22longitude%22%3A-118.1196783%2C%22reference%22%3A%22c2b93b29-c74b-4511-72eb-f31ff601d04d%22%2C%22referenceType%22%3A%22uber_places%22%2C%22type%22%3A%22uber_places%22%2C%22addressComponents%22%3A%7B%22city%22%3A%22Long%20Beach%22%2C%22countryCode%22%3A%22US%22%2C%22firstLevelSubdivisionCode%22%3A%22CA%22%2C%22postalCode%22%3A%2290840%22%7D%2C%22categories%22%3A%5B%22PROFESSIONAL_PLACE%22%2C%22point_of_interest%22%5D%2C%22originType%22%3A%22user_autocomplete%22%2C%22source%22%3A%22manual_auto_complete%22%7D; mcd_restaurant=McDonald'sÂ® (Long Bch - Bellflower/23Rd); utag_main=v_id:0186aa6551b9003dc0b40d7cada00506f001606700bd0$_sn:1$_se:8$_ss:0$_st:1677897868455$ses_id:1677896012219%3Bexp-session$_pn:1%3Bexp-session",
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
        isMulticart: "false",
        shoppingCartItems: [
          {
            uuid: "029806b0-cb37-5e1f-9117-0b3d491dc2d8",
            shoppingCartItemUuid: "5e7a41bb-f75e-4d8d-b0a8-9275e3163b4f",
            storeUuid: "d4fb63e7-429c-4b21-9fcc-668889b9c220",
            sectionUuid: "b74e9924-3f56-59dd-9da4-ee6d12eec8f4",
            subsectionUuid: "7104f0d2-ed91-5c36-8029-36b0e0fc1853",
            price: 509,
            title: "McCrispy",
            quantity: 1,
            customizations: {
              "34f335ca-5b1b-51ec-b937-6920d61d82f7+0": [
                {
                  uuid: "72daf202-d88b-5f31-86b6-d1794a8cdef2",
                  price: 0,
                  quantity: 1,
                  title: "Butter",
                  defaultQuantity: 1,
                  quantityInfo: {
                    chargeAbove: 1,
                    refundBelow: 0,
                  },
                  customizationMeta: {
                    title: "McCrispy Comes With",
                    isPickOne: false,
                  },
                },
                {
                  uuid: "6105071c-75d3-5f57-9b92-d85e22fdbe27",
                  price: 0,
                  quantity: 1,
                  title: "Crinkle Cut Pickle",
                  defaultQuantity: 1,
                  quantityInfo: {
                    chargeAbove: 1,
                    refundBelow: 0,
                  },
                  customizationMeta: {
                    title: "McCrispy Comes With",
                    isPickOne: false,
                  },
                },
                {
                  uuid: "7929218b-8bc8-5f25-a7aa-a9a8a2aab58e",
                  price: 329,
                  quantity: 1,
                  title: "McCrispy Filet",
                  defaultQuantity: 1,
                  quantityInfo: {
                    chargeAbove: 1,
                    refundBelow: 0,
                  },
                  customizationMeta: {
                    title: "McCrispy Comes With",
                    isPickOne: false,
                  },
                },
                {
                  uuid: "1319ec54-546f-51fd-8de1-c46b8a9a7669",
                  price: 0,
                  quantity: 1,
                  title: "Potato Roll",
                  defaultQuantity: 1,
                  quantityInfo: {
                    chargeAbove: 1,
                    refundBelow: 0,
                  },
                  customizationMeta: {
                    title: "McCrispy Comes With",
                    isPickOne: false,
                  },
                },
              ],
            },
            imageURL:
              "https://d1ralsognjng37.cloudfront.net/a53f03d6-53c1-4f1b-970f-a974e5e23a08.jpeg",
            specialInstructions: "",
            itemId: null,
          },
        ],
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

  async addToCart(item) {
    const generatedItemUUID = uuidv4();
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
          draftOrderUUID: item.draftOrderID,
          cartUUID: item.cartID,
          items: [
            {
              uuid: item.item.itemID,
              shoppingCartItemUuid: generatedItemUUID,
              storeUuid: item.item.storeID,
              sectionUuid: item.item.sectionID,
              subsectionUuid: item.item.subsectionID,
              price: item.item.priceAsCents,
              title: item.item.title,
              quantity: item.itemQuantity,
              customizations: item.item.customizations,
              imageURL: item.item.image,
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

  async removeItem(item) {
    const res = await fetch(
      "https://postmates.com/api/removeItemsFromDraftOrderV2",
      {
        method: "POST",
        headers: {
          authority: "postmates.com",
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          cookie:
            "uev2.id.session=06c8babb-9865-4fff-a302-817d2437033b; uev2.ts.session=1677964283558; marketing_vistor_id=9b6efbc9-abbf-499a-9da0-891ae45380f0; uev2.unregisteredUserUuid=730c1a93-51fc-5dbb-984c-2df7a2586937; uev2.do=e3d793fb-14d2-4c64-92e8-d9953756452d; uev2.gosid=GOSID-3bef0dd3-ec75-4eda-8ec5-30fff06561c4; uev2.id.xp=ac1634ed-0bc3-442e-858e-f0a1cc815a54; dId=32ef5873-22f4-4b11-859c-6aad4eeeca2e; ",
          dnt: "1",
          origin: "https://postmates.com",
          referer:
            "https://postmates.com/store/mcdonalds-long-bch-bellflower-23rd/1Ptj50KcSyGfzGaIibnCIA/713aee91-516f-5c61-ae72-09e6a45bb6fd/d6148a20-ce10-568a-97ab-66a26573f6bb/fe6cac2d-8dff-52c3-9c61-668437078156",
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
          cartUUID: item.cartID,
          draftOrderUUID: item.draftOrderID,
          shoppingCartItemUUIDs: [item.itemsRemovedID],
          storeUUID: item.storeID,
        }),
      }
    );
    /*
    console.log(
      "response body: ",
      JSON.stringify({
        cartUUID: item.cartID,
        draftOrderUUID: item.draftOrderID,
        shoppingCartItemUUIDs: [item.itemsRemovedID],
        storeUUID: item.storeID,
      })
    );
    */

    if (res.ok) {
      return {
        data: await res.json(),
        // responseCookies: this.cookiesToJson(res.headers.raw()["set-cookie"]),
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
