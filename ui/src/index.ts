import WooCommerceRestAPI from "@woocommerce/woocommerce-rest-api";
import * as firebaseui from 'firebaseui';
import firebase from 'firebase/compat/app';
import 'firebaseui/dist/firebaseui.css';
import 'dayjs';

import { doc, onSnapshot, getFirestore, collection, query, where, getDocs, QuerySnapshot, orderBy, limit, setDoc, getDoc } from "firebase/firestore";
import dayjs from 'dayjs';

const WooCommerce = new WooCommerceRestAPI({
    url: 'https://ffdrc.com/',
    consumerKey: 'ck_7a4ef3dfb8ede54346f840e10afcbcbdcf08e1d9',
    consumerSecret: 'cs_88e06874eec5d48b8a76acc986b312a2a36a0e08',
    wpAPI: true,
    version: 'wc/v3'
  });

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
const orders = document.getElementsByClassName("orders")[0];
let d = new Date();

// getDocs(collection(db, "orders")).then((querySnapshot) => {
//     for(let i = 0; i < querySnapshot.docs.length; i++) {
//         salesTotalAll += parseFloat(querySnapshot.docs[i].data().total);
//         const timeBetweenDates = Math.abs(new Date(querySnapshot.docs[i].data().date).getTime() - d.getTime());
//         const daysBetweenDates = timeBetweenDates / (24 * 60 * 60 * 1000);
//         if (daysBetweenDates < 30) {
//             salesTotal30 += parseFloat(querySnapshot.docs[i].data().total);
//             for (let j = 0; j < querySnapshot.docs[i].data().items.length; j++) {
//                 productsInLast30.push(querySnapshot.docs[i].data().items[j].name);
//             }
//         }
//         if (daysBetweenDates < 7) {
//             salesTotal7 += parseFloat(querySnapshot.docs[i].data().total);
//         }
//     }
//     if (total != undefined) {
//         total.innerText = "$" + Math.round(salesTotalAll).toLocaleString('en-US');
//     }
//     if (total30 != undefined) {
//         total30.innerText = "$" + Math.round(salesTotal30).toLocaleString('en-US');
//     }
//     if (total7 != undefined) {
//         total7.innerText = "$" + Math.round(salesTotal7).toLocaleString('en-US');
//     }
//     if (product30 != undefined) {
//         const bestSeller = mostFrequent(productsInLast30, productsInLast30.length);
//         let count = 0;
//         for (let i = 0; i < productsInLast30.length; i++) {
//             if (productsInLast30[i] === bestSeller) {
//                 count++;
//             }
//         }
//         product30.innerText = bestSeller + " (" + count.toString() + ")";
//     }
// });

const q = query(collection(db, "orders"), orderBy("date", "desc"), limit(10))
// getDocs(q).then((querySnapshot) => {

//     for (let i = 0; i < querySnapshot.docs.length; i++) {
//         addOrderToDashboard(querySnapshot.docs[i].data());
//     }
// })

const unsub = onSnapshot(q, (records) => {
    for (let i = 0; i < records.docs.length; i++) {
        if (dayjs(d).diff(records.docs[i].data().date) > 0) {
            continue;
        }
        addOrderToDashboard(records.docs[i].data());
    }
    updateTotals();
    d = new Date();
})

function addOrderToDashboard(recordData) {

    const order = document.createElement("div");
    order.className = "order";
    const customerName = document.createElement("label");
    customerName.id = "name";
    const dateBought = document.createElement("label");
    dateBought.id = "date"
    const orderTotal = document.createElement("label");
    orderTotal.id = "orderTotal"

    customerName.innerText = recordData.customer.f_name + " " + recordData.customer.l_name;
    dateBought.innerText = dayjs(recordData.date).format('MM/DD/YYYY');
    orderTotal.innerText = "$" + recordData.total.toLocaleString('en-US');

    order.append(customerName, dateBought, orderTotal);

    for (let j = 0; j < recordData.items.length; j++) {
        const item = document.createElement("label");
        item.id = "item";
        item.innerText = recordData.items[j].name;
        order.appendChild(item);
    }
    orders.insertBefore(order, orders.firstChild);
}

function updateTotals() {
    const total = document.getElementById("total");
    const total7 = document.getElementById("total7");
    const total30 = document.getElementById("total30");
    const product30 = document.getElementById("product30");

    getDoc(doc(db, "stats", "totals")).then((snapshot) => {
        total ? total.innerHTML = "$" + snapshot.data()?.all.toLocaleString('en-US') : 0;
        total7 ? total7.innerHTML = "$" + snapshot.data()?.data7Day.toLocaleString('en-US') : 0;
        total30 ? total30.innerHTML = "$" + snapshot.data()?.data30Day.toLocaleString('en-US') : 0;
        product30 ? product30.innerHTML = snapshot.data()?.product30Day : 0;
    })
}

const now = new Date();

const threshold30Day = dayjs(new Date(now.setDate(now.getDate() - 7))).format("YYYY-MM-DD");
console.log(threshold30Day);

const q2 = query(collection(db, "orders"), orderBy("date", "desc"), where("date", ">", threshold30Day));

const getAndCalculateData = async () => {
 const docs = await (await getDocs(q2)).docs.map(i => i.data())
 const data30DaySum = docs.reduce((out, doc) => out + parseFloat(doc.total), 0)
 console.log(data30DaySum);
}

getAndCalculateData()
