const hubdbClient = require('../lib/hubdb-client');
const gsheetClient = require('../lib/gsheet-client');
const { getHubdbRowFromSheet, getRowValueEquality } = require('../lib/data-transform');

const hubdbTableId = '2054297';
const sheetId = '1ELP2bRhfDs7QKHhdnnzVbH_7Q1R7LBjwYGqRJFhZvfg';


module.exports = async (req, res) => {
  let updatedRows = 0;
  let newRows = 0;

  console.log('Starting sync...');
  try {
    // all rows from sheet
    const locations = await gsheetClient.getLocationsFromSheet(sheetId);
    console.log(`Got locations from sheet, ${locations.length} rows found...`);

    // iterate over rows
    for (let i=0; i < locations.length; i++) {
      const row = locations[i];
      const hubdbValues = getHubdbRowFromSheet(row);

      // query table for existing match
      const rowMatch = await hubdbClient.getFilteredTableRows(hubdbTableId, {
        vendor_id: row.locationid,
      });

      // if a match exists
      if (rowMatch.objects && rowMatch.objects.length === 1) {
        const rowMatchVals = rowMatch.objects[0].values;
        const rowMatchId = rowMatch.objects[0].id;
        // check if any cell values have changed
        const rowsIdentical = getRowValueEquality(hubdbValues, rowMatchVals);
        console.log('Row values are identical: ', rowsIdentical);

        if (!rowsIdentical) {
          console.log('Updating row...');
          await hubdbClient.updateTableRow(hubdbTableId, rowMatchId, hubdbValues);
          console.log('Row updated: ', rowMatchId);
          updatedRows++;
        }
      // if no match exists
      } else {
        console.log('Creating row...');
        // create a new hubdb row
        const createdRow = await hubdbClient.addTableRow(hubdbTableId, hubdbValues);
        console.log('Row created: ', createdRow.id);
        newRows++;
      }
    } // end iteration

    console.log('Iteration finished, publishing table...');
    // publish table after updates
    await hubdbClient.publishTable(hubdbTableId);
    console.log('Table published!');

    res.json({
      status: 'ok',
      message: `Sync complete - updated ${updatedRows} | created ${newRows}`,
    });

  } catch (e) {
    // something failed
    res.json({
      status: 'error',
      message: `Unable to sync google sheet - ${e}`,
    });
  }
};