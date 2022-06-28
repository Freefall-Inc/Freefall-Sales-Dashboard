import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js';
import { getFirestore, ref, set, FieldValue } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js';
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-auth.js';
const faker = require('faker');
const functions = require('firebase-functions');

var signedIn = document.getElementById("signedIn");
var signedOut = document.getElementById("signedOut");
var userDetails = document.getElementById("userDetails");
var logIn = document.getElementById("logIn");
var logOut = document.getElementById("logOut");
var newSale = document.getElementById("newSale");

var stats = document.getElementsByClassName("stats")[0];
var orders = document.getElementsByClassName("orders")[0];

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

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
logIn.onclick = () => signInWithPopup(auth, provider);
logOut.onclick = () => signOut(auth);
newSale.onclick = () => add();

document.addEventListener("DOMContentLoaded", event => {
    const app = firebase.app();
    const db = firebase.firestore();
    const myPost
})

exports.newOrder = functions.https.onRequest((request, response) => {
    const data = request.body;
    console.log(data);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        signedIn.hidden = false;
        signedOut.hidden = true;
        userDetails.innerHTML = `Hello ${user.displayName}!`;
    } else {
        signedIn.hidden = true;
        signedOut.hidden = false;
        userDetails.innerHTML = ``;
    }
})

function writeSalesData(salesId, products, userId, date) {
    const reference = ref(db, 'sales/' + salesId);

    set(reference, {
        purchased: products,
        user: userId,
        time: date
    });
}

function add() {
    salesRef = db.collection('sales');

    const { serverTimestamp } = FieldValue;

    salesRef.add({
        uid: user.uid,
        sid: faker.random.uuid(),
        total: faker.random.number(),
        date: serverTimestamp
    });

    unsubscribe = salesRef.where('uid', '==', user.uid).onSnapshot(querySnapshot => {
        const items = querySnapshot.docs.map(doc => {
            return `<li>${ doc.data().name }</li>`
        });
        
    });
}

const stats = {
    width: "50%"
}

const orders = {
    width: "50%"
}

