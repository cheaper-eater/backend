import { env } from "node:process";
import fetch from "node-fetch";
import { HTTPResponseError } from "../errors/http.mjs";
import Service from "./Service.mjs";
class Grubhub extends Service {
  constructor() {
    super();
    this.service = "grubhub";
    this.clientId = env.GRUBHUB_CLIENT_ID;
  }

  /*Parse token data from API response
   * @param {Object} data the API reponse from getting token info
   * @return {Object} parased token data
   */
  parseTokenData(data) {
    const {
      access_token,
      refresh_token,
      token_expire_time,
      refresh_token_expire_time,
    } = data.session_handle;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      accessTokenExpireTime: token_expire_time,
      refreshTokenExpireTime: refresh_token_expire_time,
    };
  }

  /* Assure a token is always valid, ie: nerver expired
   * @param {Object} tokenData token data (expiration times and token data)
   * @return {Object} valid tokenData, one of refreshed token, new token, or
   * original passed in token depending on validity of passed in tokenData.
   */
  async getValidToken(tokenData) {
    const { refreshTokenIsValid, accessTokenIsValid } =
      this.areTokensValid(tokenData);

    // update tokens if invalid
    if (!accessTokenIsValid) {
      if (refreshTokenIsValid) {
        return await this.refreshAuth(tokenData.refreshToken);
      } else {
        return await this.createNewToken();
      }
    }

    return tokenData;
  }

  /* Create a new token, this method should only be called
   * if valid token data does not already exists in the database.
   * if you want to get a token to use, getToken() should be used
   * instead.
   * @return {Object} newly create token data
   */
  async createNewToken() {
    return await this.updateToken(
      this.parseTokenData(
        await (
          await this.callServiceAPI(() =>
            fetch("https://api-gtm.grubhub.com/auth", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                tracestate: "@nr=0-2-0-0-cfd18ff8408d2318--0--1674429822078",
                "x-px-authorization": "4",
                accept: "*/*",
                "accept-language": "en-us",
                "user-agent":
                  "GrubHub/2022.32 (iPhone; iOS 13.3.1; Scale/3.00)",
                vary: "Accept-Encoding",
              },
              body: JSON.stringify({
                brand: "GRUBHUB",
                client_id: this.clientId,
                scope: "anonymous",
              }),
            })
          )
        ).json()
      )
    );
  }

  /* Refresh authentication tokens and store new token data in database
   * @param {String} refreshToken the refresh token used to get new tokens
   * @return {Object} the object containing the new token data
   */
  async refreshAuth(refreshToken) {
    return await this.updateToken(
      this.parseTokenData(
        await (
          await this.callServiceAPI(() =>
            fetch("https://api-gtm.grubhub.com/auth/refresh", {
              method: "POST",
              headers: {
                accept: "*/*",
                "accept-language": "en-us",
                "content-type": "application/json",
                "user-agent":
                  "GrubHub/2022.32 (iPhone; iOS 13.3.1; Scale/3.00)",
                vary: "Accept-Encoding",
                "x-newrelic-id": "VQQDVlBVGwoBVVRSBQkO",
                "x-px-authorization": "4",
                "x-px-bypass-reason":
                  "An%20SSL%20error%20has%20occurred%20and%20a%20secure%20connection%20to%20the%20server%20cannot%20be%20made.",
                "x-px-original-token": env.GRUBHUB_XPX_TOKEN,
              },
              body: JSON.stringify({
                client_id: this.clientId,
                scope: "anonymous",
                brand: "GRUBHUB",
                refresh_token: refreshToken,
              }),
            })
          )
        ).json()
      )
    );
  }

  /* Search query
   * @param {Object} payload
   * @param {String} payload.query the query to search
   * @param {String} payload.location.latitude location latitude
   * @param {String} payload.location.longitude location longitude
   * @return {Object} the search result or HTTPResponseError
   */
  async search({ query, location }) {
    return await (
      await this.callServiceAPI(async () => {
        let endpoint = new URL(
          "https://api-gtm.grubhub.com/restaurants/search"
        );
        const params = new URLSearchParams({
          orderMethod: "delivery",
          locationMode: "DELIVERY",
          facetSet: "umamiV6",
          pageSize: 20,
          hideHateos: true,
          searchMetrics: true,
          queryText: query,
          location: `POINT(${location.longitude} ${location.latitude})`,
          preciseLocation: true,
          includeOffers: true,
          sortSetId: "umamiv3",
          sponsoredSize: 3,
          countOmittingTimes: true,
        });

        endpoint.search = params;

        return fetch(endpoint.toString(), {
          method: "GET",
          headers: {
            "content-type": "application/json",
            "x-px-authorization": env.GRUBHUB_XPX_TOKEN,
            accept: "*/*",
            authorization: `Bearer ${(await this.getToken()).accessToken}`,
            "accept-language": "en-us",
            "user-agent": "GrubHub/2022.32 (iPhone; iOS 13.3.1; Scale/3.00)",
            vary: "Accept-Encoding",
          },
        });
      })
    ).json();
  }

  /*Get store information. Wraps web API
   * @param storeId the store id
   * @return {Object} object containing store information
   */
  async getStore(storeId) {
    return await (
      await this.callServiceAPI(async () => {
        let endpoint = new URL(
          `https://api-gtm.grubhub.com/restaurants/${storeId}`
        );

        const params = new URLSearchParams({
          hideChoiceCategories: true,
          version: 4,
          variationId: "rtpFreeItems",
          orderType: "standard",
          hideUnavailableMenuItems: true,
          hideMenuItems: false,
          locationMode: "delivery",
        });

        endpoint.search = params;

        return fetch(endpoint, {
          method: "GET",
          headers: {
            authority: "api-gtm.grubhub.com",
            accept: "application/json",
            "accept-language": "en-US,en;q=0.5",
            authorization: `Bearer ${(await this.getToken()).accessToken}`,
            origin: "https://www.grubhub.com",
            referer: "https://www.grubhub.com/",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sec-gpc": "1",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36",
          },
        });
      })
    ).json();
  }


  /************************ ALL ITEMS BELOW HERE WAS WRITTEN BY  ERIC CHHOUR ***********************/
  /*Creates a Grubhub cart.
   * @return {Object} json object containing cartID, a cartID in URL form,
   * and "already_exists: false"
   */
  async createCart() {
    return await (
      await this.callServiceAPI(async () => {
        return fetch("https://api-gtm.grubhub.com/carts", {
          method: "POST",
          headers: {
            authority: "api-gtm.grubhub.com",   
            accept: "application/json",
            "accept-language": "en-US,en;q=0.5",
            authorization: `Bearer ${(await this.getToken()).accessToken}`,
            origin: "https://www.grubhub.com",
            referer: "https://www.grubhub.com/",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sec-gpc": "1",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36",
          },
          body: JSON.stringify({
            brand: "GRUBHUB",
            experiments: [
              "IGNORE_MINIMUM_TIP_REQUIREMENT",
              "LINEOPTION_ENHANCEMENTS",
            ],
            cart_attributes: [],
          }),
        });
      })
    ).json();
  }

  /*Creates a Grubhub cart.
   * @param storeId the store id
   * @param itemId the item id
   * @return {Object} json object containing cartID
   * @param {String} payload.location.latitude location latitude
   * @param {String} payload.location.longitude location longitude
   */
  async getItemDetails({ storeId, itemId /*, location*/ }) {
    let endpoint = new URL(
      `https://api-gtm.grubhub.com/restaurants/${storeId}/menu_items/${itemId}`
    );
    const params = new URLSearchParams({
      //time: Date.getTime(), Not needed I think, takes in 13 digit epoch time but works w/o
      hideUnavailableMenuItems: true,
      orderType: "standard",
      version: 4,
      //location: `POINT(${location.longitude} ${location.latitude})`,
      location: `POINT(-118.11377717 33.78110885)`,
    });
    endpoint.search = params;
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        authority: "api-gtm.grubhub.com",
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9",
        authorization: "Bearer 546a958b-13ba-4b53-8a2a-14075d983f30",
        "cache-control": "no-cache",
        dnt: "1",
        "if-modified-since": "0",
        origin: "https://www.grubhub.com",
        referer: "https://www.grubhub.com/",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
    });
    if (res.ok) {
      return {
        data: await res.json(),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /*Returns contents of Gruhub cart + fees; basically checkout page.
   * Also contains "line ID's, which is needed to remove items from the cart.
   * @param storeId the store id
   * @param itemId the item id
   * @return {Object} json object containing cartID
   */
  async getFee({ cartId }) {
    let endpoint = `https://api-gtm.grubhub.com/carts/${cartId}`;
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        authority: "api-gtm.grubhub.com",
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9",
        authorization: `Bearer 546a958b-13ba-4b53-8a2a-14075d983f30`,
        //authorization: "Bearer 7bb487a7-2dd7-4756-a990-dc2ed09c453c",
        "cache-control": "no-cache",
        dnt: "1",
        "if-modified-since": "0",
        origin: "https://www.grubhub.com",
        referer: "https://www.grubhub.com/",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
    });
    if (res.ok) {
      return {
        data: await res.json(),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /* Adds an item to Gruhub cart
   * @param cartId the cart id
   * @param itemId the item id
   * @param storeId the store id
   * @param costAsDollars the cost of the item in dollars ($x.xx)
   * @param options[] , an array of options for the item derived from getItemDetails()
   * @param quantity the quantity of the item
   */
  async addToCart({
    cartId,
    itemId,
    storeId,
    costAsDollars,
    options,
    quantity,
  }) {
    let endpoint = `https://api-gtm.grubhub.com/carts/${cartId}/lines`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authority: "api-gtm.grubhub.com",
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9",
        //authorization: `Bearer ${(await this.getToken()).accessToken}`,
        authorization: "Bearer 546a958b-13ba-4b53-8a2a-14075d983f30",
        "cache-control": "no-cache",
        dnt: "1",
        "if-modified-since": "0",
        origin: "https://www.grubhub.com",
        referer: "https://www.grubhub.com/",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        menu_item_id: itemId,
        brand: "GRUBHUB",
        experiments: ["LINEOPTION_ENHANCEMENTS"],
        quantity: quantity,
        special_instructions: "",
        options: options,
        cost: costAsDollars,
        restaurant_id: storeId,
        popular: false,
        isBadged: false,
        source: "restaurant menu section_other menu categories",
      }),
    });

    if (res.ok) {
      return {
        data: await res.json(),
      };
    } else {
      throw new HTTPResponseError(res);
    }
  }

  /*Removes an item from a Grubhub cart.
   * Also contains "line ID's, which is needed to remove items from the cart.
   * @param cartId, the cart id from createCart()
   * @param lineId, the id assigned to the item in the cart (obtained from getCartFee())
   * @return nothing on success, error on failure.
   */
  async removeItem({ cartId, lineId }) {
    let endpoint = `https://api-gtm.grubhub.com/carts/${cartId}/lines/${lineId}`;
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        authority: "api-gtm.grubhub.com",
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        authorization: "Bearer 546a958b-13ba-4b53-8a2a-14075d983f30",
        "content-type": "application/json;charset=UTF-8",
        dnt: "1",
        origin: "https://www.grubhub.com",
        referer: "https://www.grubhub.com/",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
    });
    if (res.ok) {
      return {};
    } else {
      throw new HTTPResponseError(res);
    }
  }
}

export default Grubhub;
