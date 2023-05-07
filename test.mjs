import Postmates from "./services/Postmates.mjs";

(async () => {
  console.log(
    await new Postmates().getItem({
      storeID: "d4fb63e7-429c-4b21-9fcc-668889b9c220",
      sectionID: "713aee91-516f-5c61-ae72-09e6a45bb6fd",
      subsectionID: "792d35a1-b756-52a8-bd82-2693c5888284",
      itemID: "fe6cac2d-8dff-52c3-9c61-668437078156",
    })
  );
})();
