import { Loader } from "@googlemaps/js-api-loader";

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // uses Vite env system
  version: "weekly",
  libraries: ["places"],
});

export const initMap = async () => {
  return await loader.load();
};

export const getDirections = async (origin, destination) => {
  await loader.load();
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const map = new google.maps.Map(document.createElement("div"));
  directionsRenderer.setMap(map);

  const results = await directionsService.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
  });
  return results.routes[0].legs[0];
};
