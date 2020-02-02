const lodash = require('lodash');

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
    const open = row[`${day}open`];
    const close = row[`${day}close`];
    if (open.length && close.length)
      result += `<li>${day}: ${formatTime(open)} - ${formatTime(close)}</li>`;
  });
  return result += '</ul>';
};

const getLocationFromRow = row => ({
  type: 'location',
  lat: parseFloat(row.latitude),
  long: parseFloat(row.longitude),
});

const getHubdbRowFromSheet = sheetrow => {
  const hours = getHoursFromRow(sheetrow);
  const location = getLocationFromRow(sheetrow);
    
  return {
    '1': sheetrow.locationname,
    '2': sheetrow.locationid,
    '3': location,
    '4': hours,
    '5': sheetrow.active.toLowerCase() === 'yes' ? 1 : 0,
    '6': sheetrow.country,
    '7': sheetrow.contactemail,
    '8': sheetrow.contactphone || sheetrow.contactmobile,
    '9': sheetrow.address1,
    '10': sheetrow.address2,
    '11': sheetrow.address3,
    '12': sheetrow.address4,
    '13': sheetrow.locationtype,
    '14': sheetrow.city,
    '15': sheetrow.stateprovince,
    '16': sheetrow.zippostalcode,
    '17': sheetrow.url,
  };
};

const getRowValueEquality = (rowa, rowb) => {
  // const strEq = JSON.stringify(rowa) === JSON.stringify(rowb);
  return lodash.isEqual(rowa, rowb);
};

module.exports = {
  getHubdbRowFromSheet,
  getRowValueEquality,
};
