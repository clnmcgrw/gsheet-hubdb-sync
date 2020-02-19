const lodash = require('lodash');

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTime = timeStr =>  {
  const timeParts = timeStr.split(':');
  const hours = timeParts[0];
  if (!hours) return false;

  const hourInt = parseInt(hours);
  const suffix = hourInt > 12 ? 'PM' : 'AM';
  if (hourInt > 12) {
    return `${hourInt - 12}:${timeParts[1]}${suffix}`;
  }
  return timeStr + suffix;
};

const getHoursFromRow = row => {
  let result = '<ul>';
  daysOfWeek.forEach(day => {
    const open = row[`${day}Open`];
    const close = row[`${day}Close`];
    if ((open && open.length) && (close && close.length)) {
      result += `<li>${day}: ${formatTime(open)} - ${formatTime(close)}</li>`;
    }
  });
  return result += '</ul>';
};

const getLocationFromRow = ({ Latitude, Longitude }) => {
  let result = {};
  const hasCoords = ((Latitude && Latitude.length) && (Longitude && Longitude.length));
  if (hasCoords) {
    Object.assign(result, {
      lat: parseFloat(Latitude),
      long: parseFloat(Longitude),
      type: 'location',
    });
  }
  return result;
};

const getHubdbRowFromSheet = sheetrow => {
  const hours = getHoursFromRow(sheetrow);
  const location = getLocationFromRow(sheetrow);
  const payload = {
    '1': sheetrow.LocationName,
    '2': sheetrow.LOCATIONID,
    '3': location,
    '4': hours,
    '5': sheetrow['Active?'].toLowerCase() === 'yes' ? 1 : 0,
    '6': sheetrow.Country,
    '7': sheetrow.ContactEmail,
    '8': sheetrow.ContactPhone || sheetrow.ContactMobile,
    '9': sheetrow.Address1,
    '10': sheetrow.Address2,
    '11': sheetrow.Address3,
    '12': sheetrow.Address4,
    '13': sheetrow.LocationType,
    '14': sheetrow.City,
    '15': sheetrow.State_Province,
    '16': sheetrow.Zip_PostalCode,
    '17': sheetrow.URL,
  };

  // if row has no lat/lng, don't try to send empty obj
  // hubdb api doesn't except 
  if (Object.keys(location).length === 0) {
    delete payload['3'];
  }
  return payload;
};

const getRowValueEquality = (rowa, rowb) => {
  const locationa = rowa['3'];
  const locationb = rowb['3'];

  if (!locationa || !locationb) {
    return false;
  }

  delete rowa['3'];
  delete rowb['3'];

  const isEqual = lodash.isEqual(rowa, rowb);
  const latDiff = Math.abs(locationa.lat) - Math.abs(locationb.lat);
  const lngDiff = Math.abs(locationa.long) - Math.abs(locationb.long);
  const coordsChanged = latDiff > 0.001 || lngDiff > 0.001;
  return isEqual && !coordsChanged;
};

const validateRow = row => {
  const hasCoords = row.Latitude && row.Longitude;
  const hasId = row.LOCATIONID && row.LOCATIONID.length;
  return { hasCoords, hasId };
}

module.exports = {
  getHubdbRowFromSheet,
  getRowValueEquality,
  validateRow,
};
