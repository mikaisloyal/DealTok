// Firebase Config
// Update these values in FoodMap.js
const firebaseConfig = {
    apiKey: "AIzaSyAhQ4ntF2kH2YVpanHDpRX0ukHoY4gfvgw", // Ensure this is the NEW key from settings
    authDomain: "dealtok-20aba.firebaseapp.com",      // Update this
    projectId: "dealtok-20aba",                       // Update this
    storageBucket: "dealtok-20aba.firebasestorage.app", // Update this
    messagingSenderId: "101200281210",
    appId: "1:101200281210:web:d29b65577e761a4dec05c3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Initialize Map
var map = L.map('map', { zoomControl: false }).setView([40.7712, -73.9828], 14);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

// Fix Grey Tiles
setTimeout(() => { map.invalidateSize(); }, 500);

const subFilters = {
    food: ['Halal', 'Vegan', 'Vegetarian', 'Kosher', 'All'],
    beauty: ['Skincare', 'Haircare', 'Makeup', 'Fragrances'],
    fashion: ['Shoes', 'Womenswear', 'Menswear', 'Accessories'],
    study: ['Stationery', 'Books', 'Tutoring'],
    tech: ['Laptops & Tablet', 'Accessories', 'Cell Phones', 'Desktops'],
    events: ['Workshops', 'Social']
};

let allMarkers = [];

// Main Navigation & Sidebar Logic
function handleTopNav(category) {
    // 1. Highlight Top Button
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    // 2. Filter Map Pins
    filterByCategory(category);

    const sideMenu = document.getElementById('sideFilterMenu');
    const list = document.getElementById('filterOptionsList');
    const title = document.getElementById('sideMenuTitle');

    // 3. Handle Sidebar Visibility
    if (category === 'all') {
        sideMenu.classList.remove('active');
        return;
    }

    title.innerText = category.toUpperCase() + " FILTERS";
    list.innerHTML = '';

    if (subFilters[category]) {
        subFilters[category].forEach(opt => {
            list.innerHTML += `
                <label class="filter-item">
                    <input type="checkbox" onchange="console.log('Subfilter: ${opt}')"> ${opt}
                </label>`;
        });
        sideMenu.classList.add('active');
    } else {
        sideMenu.classList.remove('active');
    }
}

function closeSideMenu() {
    document.getElementById('sideFilterMenu').classList.remove('active');
}

// Fetch Markers from Firestore
db.collection("deals").onSnapshot((snapshot) => {
    allMarkers.forEach(m => map.removeLayer(m));
    allMarkers = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        const marker = L.marker([data.lat, data.lng])
            .bindPopup(`<b>${data.header}</b><br>${data.items}`);

        marker.options.category = data.category || 'all';
        allMarkers.push(marker);
        marker.addTo(map);
    });
});

function filterByCategory(cat) {
    allMarkers.forEach(marker => {
        if (cat === 'all' || marker.options.category === cat) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
}

function toggleChat() {
    document.getElementById('chatDrawer').classList.toggle('active');
}

async function askGemini() {
    const input = document.getElementById('chatInput');
    const display = document.getElementById('chatDisplay');
    if(!input.value) return;

    display.innerHTML += `<div style="margin-bottom:10px;"><b>You:</b> ${input.value}</div>`;
    display.innerHTML += `<div style="color:var(--primary); margin-bottom:10px;"><b>DealBot:</b> I'm checking the latest ${input.value} deals for you...</div>`;

    input.value = '';
    display.scrollTop = display.scrollHeight;
}

db.collection("deals").onSnapshot((snapshot) => {
    console.log(`Received ${snapshot.size} deals from Firebase!`); // Check your console (F12) for this!
    allMarkers.forEach(m => map.removeLayer(m));
    allMarkers = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lat && data.lng) {
            const marker = L.marker([data.lat, data.lng])
                .bindPopup(`<b>${data.header}</b><br>${data.items}`);

            marker.options.category = data.category || 'all';
            allMarkers.push(marker);
            marker.addTo(map);
        } else {
            console.warn("Deal missing coordinates:", data.header);
        }
    });
});