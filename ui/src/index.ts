// import WooCommerceRestAPI from "@woocommerce/woocommerce-rest-api";
import * as firebaseui from 'firebaseui';
import firebase from 'firebase/compat/app';
import 'firebaseui/dist/firebaseui.css';
import 'dayjs';

import { doc, onSnapshot, getFirestore, collection, query, getDocs, QuerySnapshot, orderBy, limit } from "firebase/firestore";
import dayjs from 'dayjs';

// const WooCommerce = new WooCommerceRestAPI({
//     url: 'https://ffdrc.com/',
//     consumerKey: 'ck_7a4ef3dfb8ede54346f840e10afcbcbdcf08e1d9',
//     consumerSecret: 'cs_88e06874eec5d48b8a76acc986b312a2a36a0e08',
//     wpAPI: true,
//     version: 'wc/v3'
//   });

const firebaseConfig = {
    apiKey: "AIzaSyAFIRcu2EUkvX1jReVrAl5CpP-aGGbnmOY",
    authDomain: "freefall-sales-dashboard.firebaseapp.com",
    databaseURL: "https://freefall-sales-dashboard-default-rtdb.firebaseio.com",
    projectId: "freefall-sales-dashboard",
    storageBucket: "freefall-sales-dashboard.appspot.com",
    messagingSenderId: "819531464549",
    appId: "1:819531464549:web:992a7e7c1e882a76196b8c",
    measurementId: "G-96D5YKF11R"
};

const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);

var ui = new firebaseui.auth.AuthUI(firebase.auth());

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        ui.delete();
    }
    else {
        ui.start('#firebaseui-auth-container', {
            signInOptions: [
                firebase.auth.EmailAuthProvider.PROVIDER_ID,
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            ],
            signInSuccessUrl: '/',
        })
    }
})

let salesTotalAll = 0;
let salesTotal30 = 0;
let salesTotal7 = 0;
let productsInLast30 = Array();
const total = document.getElementById("total");
const total7 = document.getElementById("total7");
const total30 = document.getElementById("total30");
const product30 = document.getElementById("product30");
const orders = document.getElementsByClassName("orders")[0];
const d = new Date();

const q = query(collection(db, "orders"), orderBy("date", "desc"), limit(10))
getDocs(q).then((querySnapshot) => {

    for (let i = 0; i < querySnapshot.docs.length; i++) {
        addOrderToDashboard(querySnapshot.docs[i].data());
    }
})

getDocs(collection(db, "orders")).then((querySnapshot) => {
    for(let i = 0; i < querySnapshot.docs.length; i++) {
        salesTotalAll += parseFloat(querySnapshot.docs[i].data().total);
        const timeBetweenDates = Math.abs(new Date(querySnapshot.docs[i].data().date).getTime() - d.getTime());
        const daysBetweenDates = timeBetweenDates / (24 * 60 * 60 * 1000);
        if (daysBetweenDates < 30) {
            salesTotal30 += parseFloat(querySnapshot.docs[i].data().total);
            for (let j = 0; j < querySnapshot.docs[i].data().items.length; j++) {
                productsInLast30.push(querySnapshot.docs[i].data().items[j].name);
            }
        }
        if (daysBetweenDates < 7) {
            salesTotal7 += parseFloat(querySnapshot.docs[i].data().total);
        }
    }
    if (total != undefined) {
        total.innerText = "$" + Math.round(salesTotalAll).toLocaleString('en-US');
    }
    if (total30 != undefined) {
        total30.innerText = "$" + Math.round(salesTotal30).toLocaleString('en-US');
    }
    if (total7 != undefined) {
        total7.innerText = "$" + Math.round(salesTotal7).toLocaleString('en-US');
    }
    if (product30 != undefined) {
        const bestSeller = mostFrequent(productsInLast30, productsInLast30.length);
        let count = 0;
        for (let i = 0; i < productsInLast30.length; i++) {
            if (productsInLast30[i] === bestSeller) {
                count++;
            }
        }
        product30.innerText = bestSeller + " (" + count.toString() + ")";
    }
});

function mostFrequent(arr, n)
{
    // Insert all elements in hash.
    var hash = new Map();
    for (var i = 0; i < n; i++)
    {
        if(hash.has(arr[i]))
            hash.set(arr[i], hash.get(arr[i])+1)
        else
            hash.set(arr[i], 1)
    }

    // find the max frequency
    var max_count = 0, res = -1;
    hash.forEach((value,key) => {

        if (max_count < value) {
            res = key;
            max_count = value;
        }

    });

    return res;
}

const unsub = onSnapshot(collection(db, "orders"), (records) => {
    for (let i = 0; i < records.docs.length; i++) {
        if (dayjs(d).diff(records.docs[i].data().date) > 0) {
            continue;
        }
        console.log(records.docs[i].data());
        addOrderToDashboard(records.docs[i].data());
    }
})

function addOrderToDashboard(record) {

    const order = document.createElement("div");
    order.className = "order";
    const customerName = document.createElement("label");
    customerName.id = "name";
    const dateBought = document.createElement("label");
    dateBought.id = "date"
    const orderTotal = document.createElement("label");
    orderTotal.id = "orderTotal"

    customerName.innerText = record.customer.f_name + " " + record.customer.l_name;
    dateBought.innerText = dayjs(record.date).format('MM/DD/YYYY');
    orderTotal.innerText = "$" + record.total.toLocaleString('en-US');

    order.append(customerName, dateBought, orderTotal);

    for (let j = 0; j < record.items.length; j++) {
        const item = document.createElement("label");
        item.id = "item";
        item.innerText = record.items[j].name;
        order.appendChild(item);
    }
    orders.appendChild(order);
}
