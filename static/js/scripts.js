var allMarkers = [];

var southWest = L.latLng(23.839840, 127.661818); // Define the southwest corner of the bounding box
var northEast = L.latLng(45.670684, 148.995384); // Define the northeast corner of the bounding box
var bounds = L.latLngBounds(southWest, northEast);

const lightModeTileLayer = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  bounds: bounds,
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

const darkModeTileLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
  maxZoom: 19,
  bounds: bounds,
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

var mymap = L.map('map', {
  zoomControl: false,
  minZoom: 5,
  maxBounds: bounds, // Set the bounds beyond which the map cannot be dragged
  maxBoundsViscosity: 0.1 // Set the "stickiness" of the bounds (0.0 is no stickiness, 1.0 is full stickiness)
}).setView([35.6762, 139.6503], 9);

lightModeTileLayer.addTo(mymap);

mymap.on('mousemove', function(e) {
  if (document.body.classList.contains('selecting-coordinates')) {
    mymap.getContainer().style.cursor = 'crosshair';
  } else {
    mymap.getContainer().style.cursor = '';
  }
});




var customIcon = L.icon({
  iconUrl: '/static/Images/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/static/Images/images/marker-shadow.png',
  shadowSize: [41, 41]
});
var marker = null;

function getIconUrl(poiType) {
  fetch('/static/json/poitypes.json')
    .then(response => response.json())
    .then(data => {
      const poi = data.find(item => item.value === poiType);
      if (!poi) {
        return null;
      }
      return poi.icon;
    })
    .catch(error => {
      console.error('Error loading POI types:', error);
      return null;
    });
}

function addMarker(latlng, poiType) {
  return fetch('/static/json/poitypes.json')
    .then(response => response.json())
    .then(data => {
      const poi = data.find(item => item.value === poiType);
      if (!poi) {
        return;
      }
      var customIcon = L.icon({
        iconUrl: poi.icon,
        iconSize: [30, 30],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: '/static/Images/images/marker-shadow.png',
        shadowSize: [41, 41]
      });
      if (marker != null) {
        mymap.removeLayer(marker); // Change this line from 'map' to 'mymap'
      }
      marker = L.marker(latlng, { icon: customIcon }).addTo(mymap); // Change this line from 'map' to 'mymap'
      allMarkers.push(marker); // Add this line to update the allMarkers array
      return marker; // Add this return statement
    })
    .catch(error => {
      console.error('Error loading POI types:', error);
    });
}




function enableAddPOI() {
  var addPoiButton = document.getElementById('add-poi-button');
  
  if (document.body.classList.contains('selecting-coordinates') && !document.body.classList.contains('poi-submitted')) {
    addPoiButton.classList.remove('disabled');
    document.body.classList.remove('selecting-coordinates');
    mymap.off('click', addPOI);
  } else {
    addPoiButton.classList.add('disabled');
    document.body.classList.add('selecting-coordinates');
    mymap.on('click', addPOI);
  }
}




function createFilterButtons(data) {
  const filterOptions = document.getElementById('filter-options');
  filterOptions.style.display = 'none';

  data.forEach((poiType) => {
    const button = document.createElement('button');
    button.id = `filter-${poiType.value}`;
    button.innerText = poiType.label;
    button.classList.add('filter-button');

    // Check if the poiType is initially selected and toggle the button class accordingly
    if (poiType.initiallySelected) {
      button.classList.add('selected');
    } else {
      button.classList.add('deselected');
    }

    button.addEventListener('click', function () {
      button.classList.toggle('selected');
      button.classList.toggle('deselected');
      filterPOIs();
    });
    filterOptions.appendChild(button);
  });

  // Call filterPOIs() after creating the filter buttons to set the initial filter state
  filterPOIs();
}


mymap.on('click', function (e) {
  const filterOptions = document.getElementById('filter-options');
  if (filterOptions.style.display === 'block') {
    filterOptions.style.display = 'none';
  }
});



fetch('/static/json/poitypes.json')
  .then((response) => response.json())
  .then((data) => {
    createFilterButtons(data);
  })
  .catch(error => {
    console.error('Error loading POI types:', error);
  });
document.getElementById('filter-poi-button').addEventListener('click', function (e) {
  e.stopPropagation(); // Add this line to stop the event from propagating to the map click event
  const filterOptions = document.getElementById('filter-options');
  filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
  filterPOIs();


});


// Add this new event listener for the 'filter-options' div
document.getElementById('filter-options').addEventListener('click', function (e) {
  e.stopPropagation();
});


function addPOI(e) {
  if (marker) {
    mymap.removeLayer(marker);
    marker = null;
  }
  marker = L.marker(e.latlng, {icon: customIcon}).addTo(mymap);
  document.getElementById('confirm-coordinates').style.display = 'block';
  document.getElementById('yes-button').onclick = function() {
    document.getElementById('confirm-coordinates').style.display = 'none';
    mymap.off('click', addPOI);
    showForm();
  };
  document.getElementById('no-button').onclick = function() {
    mymap.removeLayer(marker);
    document.getElementById('confirm-coordinates').style.display = 'none';
    enableAddPOI();
  };
  if (document.getElementById('add-poi-button').classList.contains('disabled')) {
    mymap.off('click', addPOI);
  } else {
    mymap.on('click', addPOI);
  }
}

function showForm() {
  // Clear previous options
  const select = document.getElementById('poi-type');
  select.innerHTML = '<option value="">Select POI Type</option>';

  // Fetch POI types from JSON file and add them as options to the select element
  fetch('/static/json/poitypes.json')
    .then(response => response.json())
    .then(data => {
      data.forEach(poiType => {
        const option = document.createElement('option');
        option.value = poiType.value; // assign the value property
        option.innerText = poiType.label;
        select.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading POI types:', error);
    });

  document.getElementById('poi-form').style.display = 'block';
  mymap.dragging.enable();

  // Disable the "Add POI" button before showing the form
  var addPoiButton = document.getElementById('add-poi-button');
  addPoiButton.style.backgroundColor = '#ccc';
  addPoiButton.classList.add('disabled');
  addPoiButton.onclick = null;

  // Re-enable the "Add POI" button after the form is submitted
  var submitButton = document.getElementById('submit-button');
  submitButton.onclick = function() {
    submitPOI();
    addPoiButton.classList.remove('disabled');
    addPoiButton.style.backgroundColor = '';
    addPoiButton.onclick = showForm;
    mymap.dragging.disable();
  };
}

function resetMap() {
  mymap.setView([35.6762, 139.6503], 13);
  allMarkers.forEach((marker) => {
    mymap.removeLayer(marker);
  });
  allMarkers = [];
  enableAddPOI();
}

function submitPOI() {
  var name = document.getElementById('name').value;
  var description = document.getElementById('description').value;
  var lat = marker.getLatLng().lat;
  var lng = marker.getLatLng().lng;
  var poiType = document.getElementById('poi-type').options[document.getElementById('poi-type').selectedIndex].text;

  if (poiType === '') {
    alert('Error: Please select a valid POI type.');
    return;
  }
  var addPoiButton = document.getElementById('add-poi-button');
  addPoiButton.classList.remove('enabled');
  addPoiButton.classList.add('disabled');
  addPoiButton.onclick = null;
  enableAddPOI();

  fetch('/add_poi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      description: description,
      lat: lat,
      lng: lng,
      POItype: poiType
    }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      marker.bindPopup(`<b>${name}</b><br>${description}<br><i>${poiType}</i>`).openPopup();
      marker.poiType = poiType;
      allMarkers.push(marker);
      marker = null;
      cancelPOI();
      document.body.classList.remove('selecting-coordinates');
      document.body.classList.add('poi-submitted'); // Add this line to disable adding new POIs
    } else {
      alert('Error: Could not add POI.');
    }
  })
  .catch(error => {
    console.error('Error adding POI:', error);
    alert('Error: Could not add POI.');
  })
  .finally(() => {
    // Enable the add POI button and change its color to green
    addPoiButton.classList.remove('disabled');
    addPoiButton.classList.add('enabled');
    addPoiButton.onclick = showForm;
  });
}

function cancelPOI() {
  document.getElementById('poi-form').style.display = 'none';
  document.getElementById('name').value = '';
  document.getElementById('description').value = '';
  var addPoiButton = document.getElementById('add-poi-button');
  addPoiButton.style.backgroundColor = '';
  addPoiButton.disabled = false;
  addPoiButton.classList.remove('disabled');
  addPoiButton.classList.add('enabled');
  if (marker) {
    mymap.removeLayer(marker);
    marker = null;
  }
  if (!document.getElementById('confirm-coordinates').classList.contains('hidden')) {
    mymap.off('click', addPOI);
  }
  enableAddPOI();
}

function filterPOIs() {
  const buttons = Array.from(document.querySelectorAll('#filter-options .filter-button'));
  const selectedButtons = buttons.filter((button) => button.classList.contains('selected')).map((button) => button.innerText);

  // Hide all markers if no buttons are selected, otherwise show or hide markers based on the selected buttons
  if (selectedButtons.length === 0) {
    allMarkers.forEach((marker) => {
      mymap.removeLayer(marker); // Hide all markers
    });
  } else {
    allMarkers.forEach((marker) => {
      if (selectedButtons.includes(marker.poiType)) {
        marker.addTo(mymap);
      } else {
        mymap.removeLayer(marker);
      }
    });
  }
}




async function loadPOIs() {
  const response = await fetch('/get_pois');
  const data = await response.json();

  const promises = data.map(async (poi) => {
    try {
      const newMarker = await addMarker([poi.lat, poi.lng], poi.POItype);
      if (newMarker) {
        newMarker.bindPopup(`<b>${poi.name}</b><br>${poi.description}<br><i>${poi.POItype}</i>`);
        newMarker.poiType = poi.POItype;
      }
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  });

  await Promise.all(promises);
}




loadPOIs().then(() => {
  filterPOIs();
}).catch(error => {
  console.error('Error loading POIs:', error);
});




// Add event listener for filter buttons
document.querySelectorAll('#filter-options .filter-button').forEach(button => {
  button.addEventListener('click', function () {
    this.classList.toggle('selected');
    filterPOIs();
  });
});

// Add this new event listener for the 'filter-options' div
document.getElementById('filter-options').addEventListener('click', function (e) {
  e.stopPropagation();
});

// Add a click event listener to the switch-map-tiles-button
document.getElementById('switch-map-tiles-button').addEventListener('click', () => {
  if (mymap.hasLayer(lightModeTileLayer)) { // Change 'map' to 'mymap'
    mymap.removeLayer(lightModeTileLayer); // Change 'map' to 'mymap'
    mymap.addLayer(darkModeTileLayer); // Change 'map' to 'mymap'
  } else {
    mymap.removeLayer(darkModeTileLayer); // Change 'map' to 'mymap'
    mymap.addLayer(lightModeTileLayer); // Change 'map' to 'mymap'
  }
});

function checkForNewPins() {
  console.log('Checking for new pins...'); // Add this line for debugging purposes
  fetch('/get_new_pins', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.pins) {
      data.pins.forEach(pin => {
        var pinExists = false;
        allMarkers.forEach(existingMarker => {
          if (existingMarker.getLatLng().lat === pin.lat && existingMarker.getLatLng().lng === pin.lng) {
            pinExists = true;
          }
        });
        if (!pinExists) {
          var newMarker = L.marker([pin.lat, pin.lng]).addTo(map);
          newMarker.bindPopup(`<b>${pin.name}</b><br>${pin.description}<br><i>${pin.poiType}</i><br>Lat: ${pin.lat}, Lng: ${pin.lng}`);
          newMarker.poiType = pin.poiType;
          allMarkers.push(newMarker);
        }
      });
    }
  });
}

setInterval(checkForNewPins, 6000000); // Check for new pins every 60 seconds (60000 milliseconds)


