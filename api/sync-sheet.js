const hubdbClient = require('../lib/hubdb-client');
const gsheetClient = require('../lib/gsheet-client');
const { getHubdbRowFromSheet, getRowValuesChanged } = require('../lib/data-transform');

const hubdbTableId = '2054297';
const sheetId = '1ELP2bRhfDs7QKHhdnnzVbH_7Q1R7LBjwYGqRJFhZvfg';

let updatedRows = 0;
let newRows = 0;

module.exports = async (req, res) => {

  try {
    // all rows from sheet
    const locations = await gsheetClient.getLocationsFromSheet(sheetId);

    locations.forEach(row => {
      // convert to hubdb row format
      const hubdbValues = getHubdbRowFromSheet(row);
      
      (async () => {
        // query table for existing match
        const rowMatch = await hubdbClient.getFilteredTableRows(hubdbTableId, {
          vendor_id: row.locationid,
        });
        // if a match exists
        if (rowMatch.objects.length === 1) {
          const rowMatchVals = rowMatch.objects[0].values;
          const rowMatchId = rowMatch.objects[0].id;
          // check if any cell values have changed
          const needsUpdate = getRowValuesChanged(hubdbValues, rowMatchVals);

          if (needsUpdate) {
            await hubdb.updateTableRow(hubdbTableId, rowMatchId, hubdbValues);
            updatedRows++;
          }
        // if no match exists
        } else {
          // create a new hubdb row
          await hubdb.addTableRow(hubdbTableId, hubdbValues); 
          newRows++;
        }

      })();
    }); //end forEach

    // publish table after updates
    await hubdbClient.publishTable(hubdbTableId);

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