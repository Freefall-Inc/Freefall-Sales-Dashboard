import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js';
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-auth.js';

var showOldSales = document.getElementById("testButton");

var stats = document.getElementsByClassName("stats")[0];
var orders = document.getElementsByClassName("orders")[0];

import {WooCommerceRestAPI} from "../node_modules/@woocommerce/woocommerce-rest-api/index.js";

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

const app = firebase.app();
const db = firebase.firestore();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
showOldSales.onClick = () => getOldSales();

// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         signedIn.hidden = false;
//         signedOut.hidden = true;
//         userDetails.innerHTML = `Hello ${user.displayName}!`;
//     } else {
//         signedIn.hidden = true;
//         signedOut.hidden = false;
//         userDetails.innerHTML = ``;
//     }
// })

console.log("test");

function getOldSales() {
    console.log("test");
    download(JSON.parse(WooCommerce.get('orders').body), "test.json", "text/plain")
}

function download(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
