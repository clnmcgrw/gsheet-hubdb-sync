const GoogleSheet = require('google-spreadsheet');

const getLocationsFromSheet = (id = null) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject('No sheet id provided');
      return;
    }
    const doc = new GoogleSheet(id);
    doc.getInfo((err, info) => {
      if (err) {
        reject(err);
      } else {
        const sheet = info.worksheets[0];
        sheet.getRows((err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      }
    });
  });
};

module.exports = {
  getLocationsFromSheet,
};
