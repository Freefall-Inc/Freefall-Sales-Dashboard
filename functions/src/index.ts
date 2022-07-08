import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {WebhookRequestBody} from "../interfaces";
import dayjs from "dayjs";
// import fetch from "node-fetch";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const delay = (ms: number, returnValue?: any): Promise<boolean> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(returnValue), ms);
  });

admin.initializeApp();
const db = admin.firestore();

export const newOrder = functions.https.onRequest((request, response) => {
  const body: WebhookRequestBody = request.body;
  const data = {
    orderId: body.id,
    status: body.status,
    date: body.date_created,
    total: body.total,
    customer: {
      f_name: body.billing.first_name,
      l_name: body.billing.last_name,
      postcode: body.billing.postcode,
    },
    items: body.line_items,
  };
  db.collection("orders").add(data);
  response.status(200).send("");
});

interface StatsDoc {
  all?: number,
  data30Day?: number,
  data7Day?: number,
  product30Day?: string
}

export const calculateTotals = functions.firestore.document("/orders/{orderId}")
    .onCreate((snapshot, context) => {
      const orderData = snapshot.data() as WebhookRequestBody;

      const process = async () => {
        const statsDoc = (await db.collection("stats").doc("totals").get())
            .data() as StatsDoc;
        const all = (statsDoc.all || 0) + parseFloat(orderData.total);

        const now = new Date();
        const threshold30Day =
        dayjs(new Date(now.setDate(now.getDate() - 30))).format("YYYY-MM-DD");
        const threshold7Day =
        dayjs(new Date(now.setDate(now.getDate() - 7))).format("YYYY-MM-DD");
        let product30Day = "";
        const itemsInLast30:string[] = [];

        const query30Day = await db.collection("orders")
            .orderBy("date", "desc").where("date", ">", threshold30Day).get();
        const docs30Day = await (query30Day).docs.map((i) => i.data());
        const data30DaySum =
            docs30Day.reduce((out, doc) => out + parseFloat(doc.total), 0);

        const query7Day = await db.collection("orders")
            .orderBy("date", "desc").where("date", ">", threshold7Day).get();
        const docs7Day = await (query7Day).docs.map((i) => i.data());
        const data7DaySum =
            docs7Day.reduce((out, doc) => out + parseFloat(doc.total), 0);

        functions.logger.log(docs7Day, {structuredData: true});

        docs30Day.forEach((doc) => {
          for (let i = 0; i < doc.items.length; i++) {
            itemsInLast30.push(doc.items[i].name);
          }
        });
        product30Day =
          String(mostFrequent(itemsInLast30, itemsInLast30.length));

        db.collection("stats").doc("totals").set({
          all,
          data30Day: data30DaySum,
          data7Day: data7DaySum,
          product30Day,
        });
      };

      process();
      return true;
    });

// Get total sales
// export const getSales = functions.https.onRequest((req, res) => {
//   const h = new fetch.Headers();
//   const key = "ck_7a4ef3dfb8ede54346f840e10afcbcbdcf08e1d9";
//   const secret = "cs_88e06874eec5d48b8a76acc986b312a2a36a0e08";
//   const full = key + ":" + secret;
//   h.set("Authorization", "Basic " +
//   Buffer.from(full).toString("base64"));

//   const process2 = async () => {
//     const intervalMs = 2000;
//     const pageCount = 3;
//     const cumulativeStats = {
//       salesTotal: 0,
//     };

//     for (let i = 1; i < pageCount; i++) {
//       const response = await fetch(
//           "https://ffdrc.com/wp-json/wc/v3/orders?per_page=100&status=completed&page="+i,
//           {method: "GET", headers: h});

//       // push response values that you want to cumulativeStats
//       const orderList = await response.json();
//       let salesTotal = 0;
//       const orders = JSON.parse(JSON.stringify(orderList));
//       for (let j = 0; j < orders.length; j++) {
//         salesTotal += parseFloat(orders[j].total);
//       }
//       functions.logger.log(salesTotal);
//       cumulativeStats.salesTotal += salesTotal;

//       await delay(intervalMs);
//     }

//     // calculate and process data
//     // here: write to database
//     db.collection("stats").doc("totals").set({
//       all: cumulativeStats.salesTotal,
//     });
//   };
//   process2();
// });

/**
 * Find the most frequent element in an array
 * @param {[]} arr An array
 * @param {number} n The length of the array
 * @return {string} The most frequent element in the array
 */
function mostFrequent(arr: string[], n: number) {
  // Insert all elements in hash.
  const hash = new Map();
  for (let i = 0; i < n; i++) {
    if (hash.has(arr[i])) {
      hash.set(arr[i], hash.get(arr[i])+1);
    } else {
      hash.set(arr[i], 1);
    }
  }

  // find the max frequency
  let maxCount = 0;
  let res = -1;
  hash.forEach((value, key) => {
    if (maxCount < value) {
      res = key;
      maxCount = value;
    }
  });

  return res;
}
