import Postmates from "../services/Postmates.mjs";
import Grubhub from "../services/Grubhub.mjs";
import Doordash from "../services/Doordash.mjs";
import { HTTPResponseError } from "../errors/http.mjs";

// temp data
// import pItem from "./p_item.mjs";
// import ghItem from "./gh_item.mjs";
// import ddItem from "./dd_item.mjs";

const POSTMATES = "postmates";
const GRUBHUB = "grubhub";
const DOORDASH = "doordash";

/* retrieve detailed location information such as latitude / longitude data
 * @param {Object} locationData the location datato get more detailed info for
 * this data can be retried from /api/autocomplete/location
 * @return {Object} detailed lcation data
 */
const detailLocation = async (locationData) => {
  try {
    const postmates = new Postmates();
    return (await postmates.getDeliveryLocationDetails(locationData)).data;
  } catch (e) {
    if (e instanceof HTTPResponseError) {
      return { error: await e.getError() };
    } else {
      console.error(e);
    }
  }
};

/*Parse postmates store data
 * @param {Object} storeData the store data to parse
 * @return {Object} parsed store information
 */
const parsePostmatesStore = (storeData) => {
  const {
    uuid,
    title,
    heroImageUrls,
    location,
    hours,
    catalogSectionsMap,
    sections,
  } = storeData.data;

  return {
    id: uuid,
    name: title,
    image: heroImageUrls.at(-1).url,
    hours: hours,
    location: {
      streetAddress: location.streetAddress,
      city: location.city,
      zipCode: location.postalCode,
      country: location.country,
    },
    menu: catalogSectionsMap[sections[0].uuid].reduce(
      (accCategory, catalogSection) => {
        if (catalogSection.type == "standardItemsPayload") {
          accCategory.push({
            categoryId: catalogSection.catalogSectionUUID,
            category: catalogSection.payload.standardItemsPayload.title.text,
            items: catalogSection.payload.standardItemsPayload.catalogItems.map(
              (item) => ({
                id: item.uuid,
                name: item.title,
                description: item.itemDescription,
                price: item.price,
                image: item.imageUrl,
                subsectionId: item.subsectionUuid,
                sectionId: item.sectionUuid,
              })
            ),
          });
        }
        return accCategory;
      },
      []
    ),
  };
};

/*Parse grubhub store data
 * @param {Object} storeData the store data to parse
 * @return {Object} parsed store information
 */
const parseGrubhubStore = (storeData) => {
  const { delivery_fee, available_hours } = storeData.restaurant_availability;
  const { id, name, address, logo, menu_category_list } = storeData.restaurant;
  return {
    id: id,
    name: name,
    image: logo,
    hours: available_hours,
    location: {
      streetAddress: address.street_address,
      city: address.locality,
      zipCode: address.zipCode,
      country: address.country,
    },
    fees: { deliveryFee: delivery_fee.amount },
    menu: menu_category_list.map(
      ({ menu_category_id, name, menu_item_list }) => ({
        categoryId: menu_category_id,
        category: name,
        items: menu_item_list.map(
          ({ id, name, description, price, media_image }) => ({
            id: id,
            name: name,
            description: description,
            price: price.amount,
            image: media_image
              ? `${media_image.base_url}${media_image.public_id}`
              : "",
          })
        ),
      })
    ),
  };
};

const parseDoorDashConvenienceStore = (storeData) => {
  const {
    id,
    name,
    cover_img_url,
    address: { street, city, display_address },
  } = storeData.store;
  return {
    id: id,
    name: name,
    image: cover_img_url,
    location: {
      streetAddress: street,
      city: city,
      zipCode: display_address.split(",")[2].split(" ")[1],
      country: display_address.split(",")[3],
    },
    menu: storeData.lego_section_body.map(
      ({ logging: { id }, text: { title }, children }) => ({
        categoryId: id,
        category: title,
        description: title,
        items: children.map(
          ({
            custom: { item_id },
            text: { title, description },
            images: {
              main: { uri },
            },
            logging: { item_price },
          }) => ({
            id: item_id,
            name: title,
            description: description,
            price: item_price,
            image: uri,
          })
        ),
      })
    ),
  };
};

/*Parse DoorDash store data for mobile API
 * @param {Object} storeData the store data to parse
 * @return {Object} parsed store information
 */
const parseDoorDashStore = (storeData) => {
  let store = { menu: [] };

  for (const module of storeData.display_modules) {
    if (module.type == "store_header") {
      const {
        data: {
          id,
          name,
          address: { street, city, display_address, country_shortname },
        },
      } = module;

      const image = module?.header_image?.url || module?.cover_image?.url;

      store.id = id;
      store.name = name;
      store.image = image;
      store.location = {
        streetAddress: street,
        city: city,
        zipCode: (
          display_address.split(",")[2] || display_address.split(",")[1]
        ).split(" ")[1],
        country: country_shortname,
      };
    }
    if (module.type == "menu_book") {
      store.hours = module.data.menus[0].open_hours;
    }
    if (module.type == "item_list") {
      const {
        data: { name, content },
      } = module;

      store.menu.push({
        categoryId: module.id,
        category: name,
        items: content.map(
          ({ id, name, description, display_price, image }) => ({
            id: id,
            name: name,
            description,
            price: +display_price.replace("$", "") * 100,
            image: image.url,
          })
        ),
      });
    }
  }

  return store;
};

/*Parse DoorDash store data for web crawler
 * @param {Object} storeData the store data to parse
 * @return {Object} parsed store information
 */
//const parseDoorDashStore = (storeData) => {
//  const { info, menu } = storeData;
//  return {
//    restarauntName: info.name,
//    image: info.image[0],
//    logo: info.image[1],
//    location: {
//      streetAddress: info.address.streetAddress,
//      city: info.address.addressLocality,
//      state: info.address.addressRegion,
//      country: info.address.addressCountry,
//    },
//    coordinates: {
//      latitude: info.geo.latitude,
//      longitude: info.geo.longitude,
//    },
//    menu: menu.hasMenuSection[0].map((category) => ({
//      categoryName: category.name,
//      items: category.hasMenuItem.map((item) => ({
//        name: item.name,
//        price: item.offers.price,
//      })),
//    })),
//  };
//};

/* Add category to menu
 * @param {Object} category
 * @param {String} category.name the name of the category
 * @param {String} category.id the id of the cateogry
 * @param {Object} menu to add category to
 * @param {Object} items to add to category
 * @param {String} service name of default / first service
 */
const addCategoryToMenu = ({ category, menu, items, service }) => {
  menu[category.name] = {
    categoryId: category.id,
    categoryIds: { [service]: category.id },
    category: category.name,
    items: items,
  };
};

/* Add item to menu
 * @param {Object} categoryItems cateogry items to add item to
 * @param {Objet} item to add
 * @param {String} service name of default / first service
 */
const addItemToMenu = ({ categoryItems, item, service }) => {
  categoryItems[item.name] = {
    id: item.id,
    name: item.name,
    description: item.description,
    prices: { [service]: item.price },
    image: item.image,
    subsectionId: item.subsectionId,
    ids: { [service]: item.id },
  };
};

/* Add service imtem to merged item object
 * @param {Object} details of item to add
 * @param {Object} item of merged items
 */
const addServiceItemToMergedItem = (details, item) => {
  const { id, price, title, description, service } = details;

  item.id[service] = id;
  item.price[service] = price;

  if (!item?.title) {
    item.title = title;
  }
  if (!item?.description) {
    item.itemDescription = description;
  }
};

/* Add customization option to merged item of customization options
 * @param {Object} details of item to add
 * @param {Object} customization  to add to
 */
const addCustomizationToMergedCustomization = (details, customization) => {
  const { maxPermitted, minPermitted, title, id, options, service } = details;
  if (!customization?.title) {
    const data = {
      maxPermitted: maxPermitted,
      minPermitted: minPermitted,
      title: title,
      ids: { postmates: null, grubhub: null, doordash: null },
      options: options,
      services: [],
    };
    data.services.push(service);
    data.ids[service] = id;
    customization[title] = data;
  }
};

/* Recursively build (merge) customiztion options for
 * cascading customiztion options
 * @param {Object} customizationOptions the customization optsion to parse
 * @param {String} customizationOptionsName the name of the field that contains
 * the customization options
 * @param {String} service the service for this customiztion option
 * @return {Array} list of merged customiztion options
 */
const buildCustomizationOptionsRecursively = (
  customizationOptions,
  customizationOptionsName,
  service
) => {
  let formatedOptions = {};
  let generalCustomization = {};

  for (const customization of customizationOptions) {
    switch (service) {
      case POSTMATES: {
        const { maxPermitted, minPermitted, title, uuid, price } =
          customization;
        generalCustomization = {
          maxPermitted: maxPermitted,
          minPermitted: minPermitted,
          title: title,
          id: uuid,
          price: price,
        };
        break;
      }
      case GRUBHUB: {
        const {
          min_choice_options,
          max_choice_options,
          price: { amount },
          description,
          id,
        } = customization;
        generalCustomization = {
          maxPermitted: max_choice_options,
          minPermitted: min_choice_options,
          title: description,
          id: id,
          price: amount,
        };
        break;
      }
      case DOORDASH: {
        const { maxNumOptions, minNumOptions, unitAmount, name, id } =
          customization;
        generalCustomization = {
          maxPermitted: maxNumOptions,
          minPermitted: minNumOptions,
          title: name,
          id: id,
          price: unitAmount,
        };
        break;
      }
    }

    const { maxPermitted, minPermitted, title, id, price } =
      generalCustomization;
    let op = { ids: { postmates: null, grubhub: null, doordash: null } };

    op.maxPermitted = maxPermitted;
    op.minPermitted = minPermitted;
    op.title = title;
    op.price = price;
    op.ids[service] = id;

    if (
      customization[customizationOptionsName] &&
      customization[customizationOptionsName].length > 0
    ) {
      op.options[title] = {
        ...buildCustomizationOptionsRecursively(
          customization[customizationOptionsName],
          customizationOptionsName,
          service
        ),
      };
    }
    formatedOptions[title] = op;
  }

  // converting data to final form - after merge (array of customization options)
  return Object.values(formatedOptions).map((o) => o);
};

/* Get details for an inten
 * @param {Array} array of items ids
 * @return {Object} details merged service item details + originals service items
 * @return {Object} details.merged merged service items
 * @return {Object} details.postmates original postmates items
 * @return {Object} details.grubhub original grubhub items
 * @return {Object} details.doordash original doordash items
 */
const detailItem = async (serviceIds) => {
  const services = {
    postmates: { instance: Postmates },
    grubhub: { instance: Grubhub },
    doordash: { instance: Doordash },
  };

  // modeled after postmates item detail with field applicable
  // to all other services
  let item = {
    title: "",
    id: { postmates: null, grubhub: null, doordash: null },
    itemDescription: "",
    price: { postmates: 0, grubhub: 0, doordash: 0 },
    customizationsList: {},
  };

  return Promise.all(
    serviceIds.reduce((accServices, { service, itemData }) => {
      if (itemData && itemData != "null") {
        accServices.push(
          new services[service].instance().getItem(itemData).then((data) => ({
            service: service,
            serviceItem: data.data,
          }))
        );
      }
      return accServices;
    }, [])
  ).then((items) => {
    for (const { service, serviceItem } of items) {
      if (service === POSTMATES && serviceItem) {
        const { uuid, price, title, itemDescription, customizationsList } =
          serviceItem;

        addServiceItemToMergedItem(
          {
            id: uuid,
            price: price,
            title: title,
            description: itemDescription,
            service: service,
          },
          item
        );

        for (const customization of customizationsList) {
          const { maxPermitted, minPermitted, title, uuid, options } =
            customization;

          addCustomizationToMergedCustomization(
            {
              maxPermitted: maxPermitted,
              minPermitted: minPermitted,
              title: title,
              id: uuid,
              options: buildCustomizationOptionsRecursively(
                options,
                "option",
                service
              ),
              service: service,
            },
            item.customizationsList
          );

          // next level of customization options
        }
      } else if (service === GRUBHUB && serviceItem) {
        const {
          id,
          minimum_price_variation: { amount },
          name,
          description,
          choice_category_list,
        } = serviceItem;

        addServiceItemToMergedItem(
          {
            id: id,
            price: amount,
            title: name,
            description: description,
            service: service,
          },
          item
        );

        for (const customization of choice_category_list) {
          const {
            max_choice_options,
            min_choice_options,
            id,
            name,
            choice_option_list,
          } = customization;

          addCustomizationToMergedCustomization(
            {
              maxPermitted: max_choice_options,
              minPermitted: min_choice_options,
              title: name,
              id: id,
              options: buildCustomizationOptionsRecursively(
                choice_option_list,
                "choice_category_list",
                service
              ),

              service: service,
            },
            item.customizationsList
          );
        }
      } else if (service === DOORDASH && serviceItem) {
        const {
          itemHeader: { id, name, unitAmount, description },
          optionLists,
        } = serviceItem;

        addServiceItemToMergedItem(
          {
            id: id,
            price: unitAmount,
            title: name,
            description: description,
            service: service,
          },
          item
        );

        for (const customization of optionLists) {
          const { maxNumOptions, minNumOptions, name, id, options } =
            customization;

          addCustomizationToMergedCustomization(
            {
              maxPermitted: maxNumOptions,
              minPermitted: minNumOptions,
              title: name,
              id: id,
              options: buildCustomizationOptionsRecursively(
                options,
                "optionLists",
                service
              ),
              service: service,
            },
            item.customizationsList
          );
        }
      }
    }

    let individualServiceItems = {};
    for (const { service, serviceItem } of items) {
      individualServiceItems[service] = serviceItem;
    }

    return { merged: item, ...individualServiceItems };
  });
};

/*Get detail store information for the specified services
 * @param {Array} storeIds objects with services and corresponding
 * store ids ex: {"postmates": "id"}
 * @return {Object} store information
 */
const detailStore = async (serviceIds, isRetail) => {
  const services = {
    postmates: {
      parser: parsePostmatesStore,
      getter: (id) => new Postmates().getStore(id),
    },
    grubhub: {
      parser: parseGrubhubStore,
      getter: (id) => new Grubhub().getStore(id),
    },
    doordash: {
      parser: isRetail ? parseDoorDashConvenienceStore : parseDoorDashStore,
      getter: (id) => {
        const instance = new Doordash();
        return isRetail ? instance.getRetailStore(id) : instance.getStore(id);
      },
    },
  };

  return Promise.all(
    serviceIds.reduce((accServices, { service, id }) => {
      if (id && id != "null") {
        accServices.push(
          services[service].getter(id).then((store) => ({
            service: service,
            ...services[service].parser(store),
          }))
        );
      }
      return accServices;
    }, [])
  ).then((serviceStores) => {
    let menu = {};

    const defaultService = serviceStores[0];

    for (const { category, categoryId, items } of defaultService.menu) {
      addCategoryToMenu({
        category: { id: categoryId, name: category },
        menu: menu,
        items: {},
        service: defaultService.service,
      });
      for (const item of items) {
        addItemToMenu({
          categoryItems: menu[category].items,
          service: defaultService.service,
          item: item,
        });
      }
    }

    serviceStores.shift();

    // merging menu items of the same category
    for (const serviceStore of serviceStores) {
      if (serviceStore.menu) {
        for (const { categoryId, category, items } of serviceStore.menu) {
          // if category does not already exist, add it
          if (!menu[category]) {
            addCategoryToMenu({
              category: { id: categoryId, name: category },
              menu: menu,
              items: {},
              service: serviceStore.service,
            });
          }
          menu[category].categoryIds[serviceStore.service] = categoryId;
          for (const item of items) {
            if (menu[category].items[item.name]) {
              menu[category].items[item.name].prices[serviceStore.service] =
                item.price;
              menu[category].items[item.name].ids[serviceStore.service] =
                item.id;
            }
            // if item does not already exist, add it
            else {
              addItemToMenu({
                categoryItems: menu[category].items,
                service: serviceStore.service,
                item: item,
              });
            }
          }
        }
      }
    }

    // removing application specific categories
    // postmates
    delete menu["Picked for you"];
    // flattening hashmaps as arrays

    return {
      id: defaultService.id,
      name: defaultService.name,
      image: defaultService.image,
      hours: defaultService.hours,
      location: defaultService.location,
      menu: Object.values(menu).map((category) => ({
        ...category,
        items: Object.values(category.items),
      })),
    };
  });
};

export { detailLocation, detailStore, detailItem };
