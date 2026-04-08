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
//for reporting purposes 
//the things i'll do for a wendy's cheeseburger
let tempCoords = null;
let reportMarker = null;

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
}
//lets you go back
const goBack = (e) => {
    //keeps openOption from being called again by accident
    if (e) e.stopPropagation();
    chatbot.classList.remove('active', 'hidden');
    filters.classList.remove('active', 'hidden');
    report.classList.remove('active', 'hidden');
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

map.on('click', function(e){
    if(report.classList.contains('active')){
        tempCoords = e.latlng;
        if (!reportMarker){
            reportMarker = L.marker(tempCoords, {draggable:true}).addTo(map);
            reportMarker.bindPopup("Location Set! Drag me or click elsewhere to move.").openPopup();
            reportMarker.on('dragend', function(event){
                tempCoords = event.target.getLatLng();
                reportMarker.bindPopup("Location Updated!").openPopup();
            });
        }
        else{
            reportMarker.setLatLng(tempCoords);
            reportMarker.openPopup();
        }
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
