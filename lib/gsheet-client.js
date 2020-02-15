const { GoogleSpreadsheet } = require('google-spreadsheet');

// google api key is multi-line & interpreted differently depending on env
const isDev = process.env.NODE_ENV === 'development';
const keyPrefix = '-----BEGIN PRIVATE KEY-----';
const keySuffix = '-----END PRIVATE KEY-----';
const keyBody = isDev ? process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n') :
                Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64');
const fullPrivateKey = isDev ? keyPrefix + keyBody + keySuffix : keyBody;

const serviceAccountCreds = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: fullPrivateKey,
};

// google-spreadsheet v2 (non-promise, deprecated)
const getLocationsFromSheet = (id = null) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject('No sheet id provided');
      return;
    }
    const doc = new GoogleSpreadsheet(id);
    doc.useServiceAccountAuth(serviceAccountCreds)
    .then(() => {

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

    })
    .catch(err => reject(`Authorization failed: ${err}`));
  });
};


// google-spreadsheet v3 (updated methods, etc..)
const getRowsFromSheet = async (id = null) => {
  if (!id) {
    throw new Error('No sheet id provided');
  }
  const doc = new GoogleSpreadsheet(id);

  await doc.useServiceAccountAuth(serviceAccountCreds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  return rows;
};

module.exports = {
  getLocationsFromSheet,
  getRowsFromSheet,
};
