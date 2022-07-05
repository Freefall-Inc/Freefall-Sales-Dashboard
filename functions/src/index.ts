import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {WebhookRequestBody} from "../interfaces";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

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

export const calculateTotals = functions.firestore.document("orders").onCreate((snapshot, context) => {
  console.log(snapshot);
})
