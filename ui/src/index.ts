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

const ui = new firebaseui.auth.AuthUI(firebase.auth());
const allowedEmailDomain = "ffdrc.com"

const dashboard = document.getElementsByClassName("dashboard")[0] as HTMLElement;

firebase.auth().onAuthStateChanged((user) => {
    if (user && user.email?.split("@")[1] === allowedEmailDomain && user.emailVerified) {
        ui ? ui.delete() : null;
        dashboard.style.display = "inline-flex";
    }
    else {
        dashboard.style.display = "none";
        ui.start('#firebaseui-auth-container', {
            signInOptions: [
                firebase.auth.EmailAuthProvider.PROVIDER_ID,
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            ],
            signInSuccessUrl: '/',
        })
    }
})

const threshold30Day = dayjs().subtract(30, "days").format("YYYY-MM-DD");
const orders = document.getElementsByClassName("orders")[0];
let orderQuery = query(collection(db, "orders"), orderBy("date", "asc"), where("date", ">", threshold30Day))
let totalsQuery = query(collection(db, "stats"));

onSnapshot(orderQuery, (records) => {
    for (let i = 0; i < records.docs.length; i++) {
        addOrderToDashboard(records.docs[i].data());
    }
    orderQuery = orderQuery;
});

onSnapshot(totalsQuery, () => {
    updateTotals();
})

function addOrderToDashboard(recordData) {

    const order = document.createElement("div");
    order.className = "order";
    const orderDetails = document.createElement("div");
    orderDetails.className = "orderDetails";
    const orderItems = document.createElement("div");
    orderItems.className = "orderItems";
    const customerName = document.createElement("label");
    customerName.id = "name";
    const dateBought = document.createElement("label");
    dateBought.id = "date";
    const orderTotal = document.createElement("label");
    orderTotal.id = "orderTotal";
    orderTotal.className = "amount";

    customerName.innerText = recordData.customer.f_name + " " + recordData.customer.l_name;
    dateBought.innerText = dayjs(recordData.date).format('MM/DD/YYYY h:mmA');
    orderTotal.innerText = "$" + recordData.total.toLocaleString('en-US');

    orderDetails.append(customerName, dateBought, orderTotal);

    for (let j = 0; j < recordData.items.length; j++) {
        const item = document.createElement("label");
        item.id = "item";
        item.innerText = recordData.items[j].name;
        orderItems.appendChild(item);
    }
    order.appendChild(orderDetails);
    order.appendChild(orderItems);
    orders.insertBefore(order, orders.firstChild);
}

function updateTotals() {
    const total = document.getElementById("total");
    const total7 = document.getElementById("total7");
    const total30 = document.getElementById("total30");
    const product30 = document.getElementById("product30");

    getDoc(doc(db, "stats", "totals")).then((snapshot) => {
        total ? total.innerHTML = "$" + snapshot.data()?.all.toLocaleString('en-US') : null;
        total7 ? total7.innerHTML = "$" + snapshot.data()?.data7Day.toLocaleString('en-US') : null;
        total30 ? total30.innerHTML = "$" + snapshot.data()?.data30Day.toLocaleString('en-US') : null;
        product30 ? product30.innerHTML = snapshot.data()?.product30Day : null;
    })
}
