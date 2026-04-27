//firebase - manages the data of the deals 
const firebaseConfig = {
    apiKey: "AIzaSyAhQ4ntF2kH2YVpanHDpRX0ukHoY4gfvgw",
    authDomain: "dealtok.firebaseapp.com",
    projectId: "dealtok",
    storageBucket: "dealtok.firebasestorage.app",
    messagingSenderId: "101200281210",
    appId: "1:101200281210:web:d29b65577e761a4dec05c3",
    measurementId: "G-5MEFG2P4KG"
};

//initialize firebase 
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

//for report thing
//the things i'll do for a wendy's cheeseburger
let tempCoords = null;
let reportMarker = null;
let currentSearchMarker = null;

//leaflet
//set limitationsn 
var sw = L.latLng(40.72614046024686, -74.01010607632027);
var ne = L.latLng(40.796611, -73.947889);

var bounds = L.latLngBounds(sw, ne);

//Initialize the map
var map = L.map('map', {
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    center: [40.768078508660984, -73.98193797408281],
    zoom: 13,
    minZoom: 13
}).fitBounds(bounds);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
//selection pin color change for report
const greenIcon = L.divIcon({
    className: "custom-pin",
    html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#8CC084"/>
           <circle cx="15" cy="15" r="6" fill="#C1D7AE"/>
         </svg>`,
    iconSize: [30, 42],
    iconAnchor: [14.5, 11]
});
//pin color change for search bar
const whiteIcon = L.divIcon({
    className: "custom-pin-white",
    html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#FFFFFF"/>
            <circle cx="15" cy="15" r="6" fill="#C1D7AE"/>
          </svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42], // Tip of the pin
    popupAnchor: [0, -42] // Popup appears above the pin
});
//side menu
const sideMenu = document.getElementById('sideMenu');
const toggle = document.getElementById('toggle');
//When you want to open the stuff
const chatbot = document.getElementById('chatbot');
const filters = document.getElementById('filters');
const report = document.getElementById('report');
//very distracting if the map zooms 
sideMenu.addEventListener('dblclick', (e) => {
    e.stopPropagation();
});
sideMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});
sideMenu.addEventListener('mousedown', (e) =>{
    e.stopPropagation();
});

//code for the close button and info button
toggle.addEventListener('click',(e) =>{
    if (currentSearchMarker){
        map.removeLayer(currentSearchMarker);
        currentSearchMarker = null; //reset the variable
    }
    const cStatus = chatbot.classList.contains('active');
    const fStatus = filters.classList.contains('active');
    const rStatus = report.classList.contains('active');
    if (cStatus || fStatus || rStatus){
        goBack(e);
        toggle.innerHTML = "⧀";
    }
    else {
        sideMenu.classList.toggle('collapsed');
        //Make buttons easy to understand 
        if (sideMenu.classList.contains('collapsed'))
            toggle.innerHTML = "ⓘ";
        else
            toggle.innerHTML = "⧀";

    }
    //Wait for animation to be over
    setTimeout(
        () => {
            map.invalidateSize();
        },
        300);
});
const geocoder = L.Control.Geocoder.nominatim({
    geocodingQueryParams: {
        viewbox: bounds.toBBoxString(),
        bounded: 1
    }
});
const searchControl = L.Control.geocoder({
    geocoder: geocoder,
    defaultMarkGeocode: false,
    placeholder: "Search for a location...",
    collapsed: false,
    suggest: true
}).addTo(map);

//mve into sidebar
const searchBarContainer = searchControl.getContainer();
document.getElementById("geocoderInput").appendChild(searchBarContainer);

//prevent map interference
L.DomEvent.disableClickPropagation(searchBarContainer);

searchControl.on('markgeocode', function(e){
    const latlng = e.geocode.center;

    if (bounds.contains(latlng)){
        //remove the old marker if it exists
        if (currentSearchMarker) {
            map.removeLayer(currentSearchMarker);
        }

        map.setView(latlng, 16);

        //create new marker 
        currentSearchMarker = L.marker(latlng, { icon: whiteIcon })
            .addTo(map)
            .bindPopup(e.geocode.name)
            .openPopup();
    }
});
//keep it from bubbles
const input = searchBarContainer.querySelector('input');

if (input){
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('mousedown', (e) => e.stopPropagation());
}
const checkAcc = document.getElementById('checkAcc');
const newAcc = document.getElementById('newAcc');
const cal = document.getElementById('Calendar');

checkAcc.addEventListener('change', function() {
    if (this.checked) {
        newAcc.style.display = 'block';
        cal.style.display = 'none';
    } else {
        newAcc.style.display = 'none';
        cal.style.display = 'block';
    }
});

//initialize calendar
flatpickr("#dateRange", {
    mode: "range",
    minDate: "today",
    dateFormat: "Y-m-d"
});

const submitReport = document.getElementById('submitReport');
const reportPage = document.getElementById('reportPage');

// List the IDs of the required inputs
const requiredFields = [
    'reportTitle',
    'reportItems',
    'category',
];
const boxAcc = document.getElementById('checkAcc');

function checkForm() {
    let filled = true;

    requiredFields.forEach(id => {
        const field = document.getElementById(id);
        //trim checks there's actually text that's valid
        if (!field.value || field.value.trim() === ""){
            filled = false;
        }
        if (boxAcc.checked){
            //checking if drop down has a value
            const boxAcc = document.getElementById('accDuration');
            if (!boxAcc.value) filled = false;
        } else{
            //what about calendar?
            const dateRange = document.getElementById('dateRange');
            if (!dateRange.value || dateRange.value.trim() === ""){
                filled = false;
            }

            if (!reportMarker)
                filled = false;
        }
    });

    //if form is filled button is active
    submitReport.disabled = !filled;
}
reportPage.addEventListener('input', checkForm);
reportPage.addEventListener('change', checkForm);

const submitUserDeal = (e) => {
    if (e) e.stopPropagation();

    const checkedBoxes = document.querySelectorAll('input[name="dealTag"]:checked');
    const selectedTags = Array.from(checkedBoxes).map(x => x.value);
    //no matter what foodcheck should be checked if food deal
    if (selectedTags.length > 0 && !selectedTags.includes('foodCheck')) {
        selectedTags.push('foodCheck');
    }


    if (!tempCoords){
        alert("Please click on the map to set the location of the deal first!");
        return;
    }

    if (document.getElementById('category').value === ""){
        alert("Please select a category for the deal!");
        return;
    }
    const ca = document.getElementById('checkAcc').checked;
    let duration;
    if (ca){
        const days = document.getElementById('accDuration').value;
        duration = `${days} days after sign-up`;
    }
    else{
        const datePicker = document.querySelector("#dateRange")._flatpickr;
        duration = datePicker.selectedDates.length > 0 ? datePicker.selectedDates : "No date set";
    }

    const newDeal = {
        title: document.getElementById('reportTitle').value,
        items: document.getElementById('reportItems').value,
        url: document.getElementById('reportUrl').value,
        category: document.getElementById('category').value,
        duration: duration,
        ca: ca,
        tags: selectedTags,
        lat: tempCoords.lat,
        lng: tempCoords.lng,
        status: "pending",
        submittedAt: new Date()
    };

    db.collection("pendingDeals").add(newDeal).then(() => {
        alert("Thanks! We will review this deal shortly.");
        tempCoords = null;
        if (reportMarker){
            map.removeLayer(reportMarker);
            reportMarker = null;
        }
        document.getElementById('reportTitle').value = "";
        document.getElementById('reportItems').value = "";
        document.getElementById('reportUrl').value = "";
        document.getElementById('category').value = "";
        goBack(e);
    });
};

//this lets you open one of the options by hiding the other
const openOption = (active, hide, hide2) => {
    active.classList.add('active');
    hide.classList.add('hidden');
    hide2.classList.add('hidden');

    searchContainer.classList.add('hidden');
}
//lets you go back
const goBack = (e) => {
    //keeps openOption from being called again by accident
    if (e) e.stopPropagation();
    chatbot.classList.remove('active', 'hidden');
    filters.classList.remove('active', 'hidden');
    report.classList.remove('active', 'hidden');
    searchContainer.classList.remove('hidden');
}

//when you click either it hides it  
chatbot.addEventListener('click', function() {
    if (!this.classList.contains('active')) {
        openOption(chatbot, filters, report);
    }
});
filters.addEventListener('click', function() {
    if (!this.classList.contains('active')){
        openOption(filters, chatbot, report);
    }
});

report.addEventListener('click', function() {
    if (!this.classList.contains('active')){
        openOption(report, filters, chatbot);
    }
});

map.on('click', function(e) {
    if (report.classList.contains('active')) {
        tempCoords = e.latlng;

        if (!reportMarker) {
            //make marker if it doesn't exist already 
            reportMarker = L.marker(tempCoords, {draggable: true,icon: greenIcon}).addTo(map);
            reportMarker.bindPopup("Location Set!").openPopup();
            //let user drag 
            reportMarker.on('dragend', function(event) {
                tempCoords = event.target.getLatLng();
                reportMarker.bindPopup("Location Updated!").openPopup();
                checkForm();
            });

            //set up the right click thing 
            reportMarker.on('contextmenu', function(event) {
                //prevent the browser's default right-click menu
                L.DomEvent.stopPropagation(event);

                //create the delete button 
                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = "Remove Pin";
                deleteBtn.style.cssText = "color: white; cursor: pointer; border: 1px solid #C1D7AE; background-color: #b14b3e; border-padding: 25px; padding: 5px; border-radius: 4px; font-weight: bold;";

                //when the button inside the popup is clicked
                deleteBtn.onclick = function() {
                    map.removeLayer(reportMarker);
                    reportMarker = null;
                    checkForm(); //disable the submit button now that pin is gone
                };

                //show the button in a popup at the marker
                reportMarker.bindPopup(deleteBtn).openPopup();
            });
        } else{
            reportMarker.setLatLng(tempCoords);
            reportMarker.bindPopup("Location Moved!").openPopup();
        }

        if (currentSearchMarker) {
            map.removeLayer(currentSearchMarker);
            currentSearchMarker = null; //teset the variable
        }
        //check form after map interaction
        checkForm();
    }
});


//create the three basic groups - more might be added idk
var foodLayer = L.layerGroup(); //food
var veggieLayer = L.layerGroup();
var veganLayer = L.layerGroup();
//halal layer
//kosher layer 
var halalLayer = L.layerGroup();
var kosherLayer = L.layerGroup();

var clothLayer = L.layerGroup();
var soapLayer = L.layerGroup();

//Fast Food Markers/Food Deals in General 
var fork = L.icon({
    iconUrl: 'fork.png',

    iconSize: [75, 75],
    iconAnchor: [37, 75],
    popupAnchor: [-3, -76]
});

var shirt = L.icon({
    iconUrl: 'shirt.png',

    iconSize:[75, 75],
    iconAnchor: [37, 75],
    popupAnchor: [-3, -76]
});

var soap = L.icon({
    iconUrl:'soap.png',
    iconSize:[75, 75],
    iconAnchor: [37, 75],
    popupAnchor: [-3, -76]
});

//Utilized when user hovers over the markers 
//values are adjusted 
var forkHover = L.icon({
    iconUrl: 'forkHover.png',

    iconSize: [112, 112],
    iconAnchor: [56, 112],
    popupAnchor: [0, -112]
});

const shirtHover = L.icon({
    iconUrl: 'shirtHover.png',

    iconSize: [112, 112],
    iconAnchor: [56, 112],
    popupAnchor: [0, -112]
});

var soapHover = L.icon({
    iconUrl: 'soapHover.png',

    iconSize: [112, 112],
    iconAnchor: [56, 112],
    popupAnchor: [0, -112]
});

//basic marker making function
const addMarker = (lat, lng, image, details, groups) => {
    var marker = L.marker([lat, lng], {icon: image});
    //if the image is fork = forkHover else if shirt else if soap
    let hover;
    const url = image.options.iconUrl;
    if (url === 'fork.png') hover = forkHover;
    else if (url === 'shirt.png') hover = shirtHover;
    else if (url === 'soap.png') hover = soapHover;

    marker.on('mouseover', function(){ this.setIcon(hover); });
    marker.on('mouseout', function(){ this.setIcon(image); });

    //increase on hover
    marker.on('mouseover', function(){
        this.setIcon(hover);
    });
    //return to original
    marker.on('mouseout', function(){
        this.setIcon(image);
    });

    //Stuff for the pop up
    //Convert to String and Pass it to function 
    // Here it checks for ' and replaces it with its html replacement 
    //unironically helpful for the irish and Wendy's 
    const info = JSON.stringify(details).replace(/'/g, "&apos;");
    //This creates the details of the popup 
    const popCorn = `
        <div class="mapPopup">
            <h3>${details.title}</h3>
            <hr>
            <a class="detailsTrigger" href="#" 
               onclick='openDealModal(${info})'>
               Click here for details.
            </a>
        </div>
    `;
    marker.bindPopup(popCorn);

    groups.forEach(group => group.addLayer(marker));
    return marker;
}

//this organizes the deals 
const layers = {
    'foodCheck': foodLayer,
    'veggieCheck': veggieLayer,
    'veganCheck' : veganLayer,
    'halalCheck' : halalLayer,
    'kosherCheck': kosherLayer,
    'clothCheck': clothLayer,
    'soapCheck' : soapLayer
};

const showLayer = (id, layer) => {
    const checkbox = document.getElementById(id);
    const foodIDs = ['foodCheck','veggieCheck', 'veganCheck', 'halalCheck', 'kosherCheck'];
    const updateMap = () => {
        //is it checked and does it belong to food
        if (checkbox.checked && foodIDs.includes(id)){
            //essentially it filters food i g
            //the mild issue is that halal food and vegan food say isn't exclusive to one another and can intersect
            //although technically the multiple layers can solve this issue
            //it could be annoying to the user
            //at the same time, some tags should not interact with one another
            foodIDs.forEach(otherId => {
                if (otherId !== id) {
                    const otherCheck = document.getElementById(otherId);
                    const otherLayer = layers[otherId];
                    otherCheck.checked = false;
                    if (otherLayer)
                        map.removeLayer(otherLayer);
                }
            });
        };
        if (checkbox.checked) {
            map.addLayer(layer);
        } else {
            map.removeLayer(layer);
        }
    }
    updateMap();
    //for any future clicks
    checkbox.addEventListener('change', updateMap);
}

//snapshot allows live ui updates 
db.collection("deals").onSnapshot((snapshot) =>{
    snapshot.docChanges().forEach((change) =>{
        const data = change.doc.data();

        if (change.type === "added"){
            let iconType;
            if (data.category === 'clothing'){
                iconType = shirt;
            } else if (data.category === 'hygiene'){
                iconType = soap;
            } else {
                iconType = fork;
            }

            const targetLayers = data.tags.map(tagId => layers[tagId]);
            addMarker(data.lat, data.lng, iconType, data, targetLayers);
        }

    });
});

//Depending on what is checked: 
showLayer('foodCheck', foodLayer);
showLayer('veggieCheck', veggieLayer);
showLayer('veganCheck', veganLayer);
showLayer('halalCheck', halalLayer);
showLayer('kosherCheck', kosherLayer);
showLayer('clothCheck', clothLayer);
showLayer('soapCheck', soapLayer);

//modal functions 
const modal = document.getElementById('dealModal');
const modalTitle = document.getElementById('modalTitle');
const modalDuration = document.getElementById('modalDuration');
const modalItems = document.getElementById('modalItems');
const modalExternalLink = document.getElementById('modalExternalLink');

const openDealModal = (data) => {

    modalTitle.textContent = data.header;
    modalDuration.textContent = data.expirationDate || "No expiration listed";
    modalItems.textContent = data.items;
    modalExternalLink.href = data.url;

    map.closePopup();
    modal.style.display = "block";
}

const closeDealModal =() => {
    modal.style.display = "none";
}

// ==========================================
// 8. AI CHATBOT LOGIC (Gemini Integration)
// ==========================================

// 1. Point to the instance created in the HTML bridge
let genAI;

function checkBridge() {
    if (window.genAIInstance) {
        genAI = window.genAIInstance;
        console.log("FoodMap.js: AI Instance linked successfully!");
    } else {
        setTimeout(checkBridge, 100);
    }
}
checkBridge();

// 2. The Chat Function
async function askChatbot(userPrompt) {
    const ai = window.genAIInstance || genAI;
    if (!ai) return "I'm still waking up...";

    try {
        // Fix 1: Use the full path for the model
        const result = await ai.models.generateContent({
            // Use the exact string from your console log
            model: "models/gemini-2.5-flash",
            contents: [{
                role: "user",
                parts: [{ text: userPrompt }]
            }]
        });

        // Fix 2: Navigate the specific response tree for this SDK version
        // Based on your previous logs, this is the most likely path:
        if (result.candidates && result.candidates[0].content) {
            return result.candidates[0].content.parts[0].text;
        }

        return "I found an answer, but I can't read it. Check the console!";

    } catch (error) {
        console.error("Gemini Error:", error);
        return "Connection failed. Make sure you're using the right model path!";
    }
}

// 3. The UI Logic (Ensure messageArea is defined)
// Add these at the top of your AI section in FoodMap.js
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const messageArea = document.getElementById('messages');

// Function to add a message bubble to the UI
function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' ? 'user-msg' : 'bot-msg';
    msgDiv.innerText = text;
    messageArea.appendChild(msgDiv);

    // Auto-scroll to the bottom
    messageArea.scrollTop = messageArea.scrollHeight;
}

async function handleChat() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    // 1. Show user message
    appendMessage('user', prompt);
    userInput.value = ''; // Clear input

    // 2. Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bot-msg';
    loadingDiv.innerText = "Thinking...";
    messageArea.appendChild(loadingDiv);

    // 3. Get AI Response
    const aiResponse = await askChatbot(prompt);

    // 4. Replace loading text with real response
    loadingDiv.innerText = aiResponse;
}

// Listen for the Send button click
sendBtn.addEventListener('click', handleChat);

// Allow pressing "Enter" to send
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChat();
});

function toggleChat() {
    document.getElementById('chatDrawer').classList.toggle('active');
}

async function askGemini() {
    const input = document.getElementById('chatInput');
    const display = document.getElementById('chatDisplay');
    if(!input.value) return;

    display.innerHTML += `<div><b>You:</b> ${input.value}</div>`;
    display.innerHTML += `<div style="color:#8CC084;"><b>Bot:</b> (Connecting to AI...)</div>`;
    input.value = '';
}
