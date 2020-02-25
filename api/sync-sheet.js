const Sentry = require('@sentry/node');
const hubdbClient = require('../lib/hubdb-client');
const gsheetClient = require('../lib/gsheet-client');
const { addressToLatLng } = require('../lib/geocoder');
const {
  getHubdbRowFromSheet,
  getRowValueEquality,
  validateRow,
} = require('../lib/data-transform');

const hubdbTableId = '2594730';
const sheetId = '1ELP2bRhfDs7QKHhdnnzVbH_7Q1R7LBjwYGqRJFhZvfg';

Sentry.init({ dsn: process.env.SENTRY_DSN });


module.exports = async (req, res) => {
  let updatedRows = 0;
  let newRows = 0;

  if (!req.query.key || req.query.key !== 'koicbd') {
    res.json({  status: 'error',  message: 'Invalid Authorization'});
    return;
  }

  console.log('Starting sync...');
  try {
    // all rows from sheet
    const locations = await gsheetClient.getRowsFromSheet(sheetId);
    console.log(`Got locations from sheet, ${locations.length} rows found...`);

    // all hubdb table rows
    const tableRows = await hubdbClient.getAllTableRows(hubdbTableId);
    console.log('Table Rows: ', tableRows.total);

    // iterate over gsheet rows
    for (let i=0; i < locations.length; i++) {
      console.log(`Processing row #${i}...`);
      const row = locations[i];
      const validity = validateRow(row);

      // console.log('Gsheet row: ', row);
      // throw new Error('Stop script');

      // if row has existing location id
      if (validity.hasId) {
        const [rowMatch] = tableRows.objects.filter(r => row.LOCATIONID === r.values['2']);
        const hubdbValues = getHubdbRowFromSheet(row);

        // if a match exists
        if (rowMatch) {
          // check if any cell values have changed
          const rowsIdentical = getRowValueEquality(hubdbValues, rowMatch.values);
          console.log('Row values are identical: ', rowsIdentical);

          if (!rowsIdentical) {
            console.log(`Updating row ${i}...`);
            await hubdbClient.updateTableRow(hubdbTableId, rowMatch.id, hubdbValues);
            console.log('Row updated: ', rowMatch.id);
            updatedRows++;
          }
        // if no match exists
        } else {
          console.log('No match, creating row...');
          // create a new hubdb row
          const createdRow = await hubdbClient.addTableRow(hubdbTableId, hubdbValues);
          console.log('Row created: ', createdRow.id);
          newRows++;
        }

      // no id present in sheet row, create as new
      } else {
        // first create id in gsheet
        console.log('Creating id...');
        const newRowId = new Date().getTime().toString();
        row.LOCATIONID = newRowId;
        
        // get lat/lng from address
        console.log('Getting lat/lng...');
        const newRowLocation = await addressToLatLng(row);
        if (newRowLocation) {
          row.Latitude = newRowLocation.latitude;
          row.Longitude = newRowLocation.longitude;
        }
        
        // save row changes in gsheet
        await row.save();
        console.log(`Row updated with id ${newRowId}`);

        console.log('Creating hubdb row...');
        const hubdbValues = getHubdbRowFromSheet(row); // row values have been updated
        const createdRow = await hubdbClient.addTableRow(hubdbTableId, hubdbValues);
        console.log('Row created: ', createdRow.id);
        newRows++;
      }
    } // end iteration

    // publish table after updates
    if (updatedRows > 0 || newRows > 0) {
      console.log('Publishing table...');
      await hubdbClient.publishTable(hubdbTableId);
      console.log('Table published!');
    }

    res.json({
      status: 'ok',
      message: `Sync complete - updated ${updatedRows} | created ${newRows}`,
    });
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2000);
    // something failed
    res.json({
      status: 'error',
      message: `Unable to sync google sheet - ${e}`,
    });
  }
};
