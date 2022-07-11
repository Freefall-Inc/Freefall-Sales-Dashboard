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

export const updateOrder = functions.https.onRequest((request, response) => {
  const body: WebhookRequestBody = request.body;
  // Delete the order from the database if it gets refunded or if it fails
  const order = db.collection("orders").where("orderId", "==", body.id);
  if (body.status == "refunded" || body.status == "failed") {
    order.get().then((snap) => {
      snap.forEach((doc) => {
        db.collection("orders").doc(doc.id).delete();
      });
    });
  // update the status of an order if it goes from processing to completed
  } else if (body.status == "completed") {
    order.get().then((snap) => {
      snap.forEach((doc) => {
        db.collection("orders").doc(doc.id).update({
          "status": body.status,
        });
      });
    });
  }
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
        // get the current sales stats
        const statsDoc = (await db.collection("stats").doc("totals").get())
            .data() as StatsDoc;

        // get the current order total
        const orderTotal = parseFloat(orderData.total);

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
      return null;
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
            .orderBy("date", "desc").where("date", ">", threshold30Day).get();
        const docs30Day = await (query30Day).docs.map((i) => i.data());
        const data30DaySum =
            docs30Day.reduce((out, doc) => out + parseFloat(doc.total), 0);

        // Get the amount of sales from the last 7 days
        const query7Day = await db.collection("orders")
            .orderBy("date", "desc").where("date", ">", threshold7Day).get();
        const docs7Day = await (query7Day).docs.map((i) => i.data());
        const data7DaySum =
            docs7Day.reduce((out, doc) => out + parseFloat(doc.total), 0);

        // Get top selling product from the last 30 days
        docs30Day.forEach((doc) => {
          for (let i = 0; i < doc.items.length; i++) {
            itemsInLast30.push(doc.items[i].name);
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
