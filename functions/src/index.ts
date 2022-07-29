import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {WebhookRequestBody} from "../interfaces";
import dayjs from "dayjs";
import fetch from "node-fetch";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const delay = (ms: number, returnValue?: any): Promise<boolean> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(returnValue), ms);
  });

admin.initializeApp();
const db = admin.firestore();

interface StatsDoc {
  all?: number,
  data30Day?: number,
  data7Day?: number,
  product30Day?: string
}

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

export const updateOrder = functions.https.onRequest((request, response) => {
  const body: WebhookRequestBody = request.body;
  // Update the order status if it gets updated
  const order = db.collection("orders").where("orderId", "==", body.id);
  const orderTotal = parseFloat(body.total);
  if (body.status === "processing") {
    addOrderTotal(orderTotal);
  } else if (body.status === "refunded" || body.status === "failed") {
    addOrderTotal(-orderTotal);
  }
  order.get().then((snap) => {
    snap.forEach((doc) => {
      db.collection("orders").doc(doc.id).update({
        status: body.status,
      });
    });
  });
  response.status(200).send("");
});

export const deleteOrder = functions.https.onRequest((request, response) => {
  if (Object.keys(request.body).includes("webhook_id")) return;
  const orderId = request.body.id;
  // Delete the order if it gets trashed
  const order = db.collection("orders").where("orderId", "==", orderId);
  order.get().then((snap) => {
    snap.forEach((doc) => {
      db.collection("orders").doc(doc.id).delete();
    });
  });
  response.status(200).send("");
});

export const updateTotals = functions.pubsub.schedule("0 0 * * *")
    .timeZone("America/Phoenix").onRun((context) => {
      // Set-up variables
      const threshold30Day =
      dayjs().subtract(30, "days").format("YYYY-MM-DD");
      const threshold7Day =
      dayjs().subtract(7, "days").format("YYYY-MM-DD");
      let product30Day = "";
      const itemsInLast30:string[] = [];

      const process = async () => {
        const statsDoc = (await db.collection("stats").doc("totals").get())
            .data() as StatsDoc;

        // Get the amount of sales from the last 30 days
        const query30Day = await db.collection("orders")
            .orderBy("date", "desc").where("date", ">", threshold30Day)
            .where("status", "==", "completed").get();
        const docs30Day = await (query30Day).docs.map((i) => i.data());
        const data30DaySum =
            docs30Day.reduce((out, doc) => out + parseFloat(doc.total), 0);

        // Get the amount of sales from the last 7 days
        const query7Day = await db.collection("orders")
            .orderBy("date", "desc").where("date", ">", threshold7Day)
            .where("status", "==", "completed").get();
        const docs7Day = await (query7Day).docs.map((i) => i.data());
        const data7DaySum =
            docs7Day.reduce((out, doc) => out + parseFloat(doc.total), 0);

        // Get top selling product from the last 30 days
        docs30Day.forEach((doc) => {
          for (let i = 0; i < doc.items.length; i++) {
            for (let j = 0; j < doc.items[i].quantity; j++) {
              itemsInLast30.push(doc.items[i].name);
            }
          }
        });
        product30Day =
          String(mostFrequent(itemsInLast30, itemsInLast30.length));

        // Add all information to firebase
        db.collection("stats").doc("totals").set({
          all: statsDoc.all,
          data30Day: data30DaySum,
          data7Day: data7DaySum,
          product30Day,
        });
      };
      process();
      return null;
    });

// export const deleteOrders = functions.https.onRequest((request, response) =>{
//   const orders = db.collection("orders").where("date", ">", "2022-07-26T06");
//   orders.get().then((snap) => {
//     snap.forEach((doc) => {
//       db.collection("orders").doc(doc.id).delete();
//     });
//   });
// });

// Get total sales
// export const getSales = functions.https.onRequest((req, res) => {
//   const threshold30Day =
//   dayjs().subtract(30, "days").format("YYYY-MM-DD");
//   const threshold7Day =
//   dayjs().subtract(7, "days").format("YYYY-MM-DD");
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
//       sales30: 0,
//       sales7: 0,
//       product: "",
//     };

//     for (let i = 1; i < pageCount; i++) {
//       const response = await fetch(
//           "https://ffdrc.com/wp-json/wc/v3/orders?per_page=100&status=completed&page="+i,
//           {method: "GET", headers: h});

//       // push response values that you want to cumulativeStats
//       const orderList = await response.json();
//       let salesTotal = 0;
//       let sales30 = 0;
//       let sales7 = 0;
//       const products:string[] = [];
//       const orders = JSON.parse(JSON.stringify(orderList));
//       for (let j = 0; j < orders.length; j++) {
//         salesTotal += parseFloat(orders[j].total);
//         if (orders[j].date_created > threshold30Day) {
//           sales30 += parseFloat(orders[j].total);
//           for (let k = 0; k < orders[j].line_items.length; k++) {
//             for (let l = 0; l < orders[j].line_items[k].quantity; l++) {
//               products.push(orders[j].line_items[k].name);
//             }
//           }
//         }
//         if (orders[j].date_created > threshold7Day) {
//           sales7 += parseFloat(orders[j].total);
//         }
//       }
//       cumulativeStats.salesTotal += salesTotal;
//       cumulativeStats.sales30 += sales30;
//       cumulativeStats.sales7 += sales7;
//       cumulativeStats.product =
//       String(mostFrequent(products, products.length));

//       await delay(intervalMs);
//     }

//     // calculate and process data
//     // here: write to database
//     db.collection("stats").doc("totals").set({
//       all: cumulativeStats.salesTotal,
//       data30Day: cumulativeStats.sales30,
//       data7Day: cumulativeStats.sales7,
//       product30Day: cumulativeStats.product,
//     });
//   };
//   process2();
// });

/**
 * Update the stats doc with the new incoming order total
 * @param {number} orderTotal the incoming order total to add to the stats doc
 */
function addOrderTotal(orderTotal: number) {
  const process = async () => {
    const statsDoc = (await db.collection("stats").doc("totals").get())
        .data() as StatsDoc;

    // update sales totals based on current order total
    const all = (statsDoc.all || 0) + orderTotal;
    const data30DaySum = (statsDoc.data30Day || 0) + orderTotal;
    const data7DaySum = (statsDoc.data7Day || 0) + orderTotal;

    // update stats in database
    db.collection("stats").doc("totals").set({
      all,
      data30Day: data30DaySum,
      data7Day: data7DaySum,
      product30Day: statsDoc.product30Day,
    });
  };
  process();
}

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
