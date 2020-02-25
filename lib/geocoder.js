const { request } = require('./http-request');
const { escape } = require('querystring');

// mapbox / geocoding
const mapBoxBase = `https://api.mapbox.com/geocoding/v5/mapbox.places`;
const tokenParams = `access_token=${process.env.MAPBOX_API_KEY}`;

const forwardGeocodeUrl = search => (
  `${mapBoxBase}/${search}.json?${tokenParams}&types=address`
);
const reverseGeocodeUrl = (lat, lng) => (
  `${mapBoxBase}/${lng},${lat}.json?${tokenParams}&types=place,locality,postcode`
);

const forwardGeocode = location => request(forwardGeocodeUrl(location));
const reverseGeocode = (lat, lng) => request(reverseGeocodeUrl(lat, lng));


const addressToLatLng = async (row) => {
  const address = `${row.Address1} ${row.Address2} ${row.City}, ${row.State_Province} ${row.Zip_PostalCode}`;
  const geocodeResponse = await forwardGeocode(escape(address));
  const resultAddress = geocodeResponse.features[0];
  if (!resultAddress) {
    return false;
  }
  const coords = resultAddress.geometry.coordinates;
  return {
    longitude: coords[0],
    latitude: coords[1],
  };
};


module.exports = {
  addressToLatLng,
  reverseGeocode,
};