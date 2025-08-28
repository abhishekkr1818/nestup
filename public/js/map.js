// public/js/map.js
function initMap() {
  if (!window.listingData || !listingData.geometry || !listingData.geometry.coordinates) {
    console.warn("No coordinates to render map");
    return;
  }

  const coords = {
    lat: Number(window.listingData.geometry.coordinates[1]),
    lng: Number(window.listingData.geometry.coordinates[0]),
  };

  const map = new google.maps.Map(document.getElementById("map"), {
    center: coords,
    zoom: 15,
    mapTypeControl: false,
  });

  const marker = new google.maps.Marker({
    position: coords,
    map,
    title: window.listingData.title || "Listing",
  });

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  const infoHtml = `
    <div style="min-width:200px">
      <h4 style="margin:0 0 6px 0;">${(window.listingData.title||"").replace(/</g,"&lt;")}</h4>
      <p style="margin:0 0 6px 0;">Exact location will be shown on Google Maps after booking.</p>
      <a href="${gmapsUrl}" target="_blank" rel="noopener">Open in Google Maps</a>
    </div>
  `;

  const infowindow = new google.maps.InfoWindow({ content: infoHtml });
  marker.addListener("click", () => infowindow.open(map, marker));
}
