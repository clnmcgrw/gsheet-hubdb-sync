// const debug = require('debug')('hubdb-client');
const nodeFetch = require('node-fetch');
const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({ minTime: 110 });
const fetch = limiter.wrap(nodeFetch);

const hapikey = process.env.HS_API_KEY;
const portalId = process.env.HS_PORTAL_ID;
const hsBase = 'https://api.hubapi.com/';

const endpoints = {
  tableInfo: id => `${hsBase}hubdb/api/v2/tables/${id}?portalId=${portalId}`,
  getTableRows: id => `${hsBase}hubdb/api/v2/tables/${id}/rows?portalId=${portalId}`,
  addTableRow: id => `${hsBase}hubdb/api/v2/tables/${id}/rows?hapikey=${hapikey}`,
  tableRow: (tableid, rowid) => `${hsBase}hubdb/api/v2/tables/${tableid}/rows/${rowid}?hapikey=${hapikey}`,
  publishTable: id => `${hsBase}hubdb/api/v2/tables/${id}/publish?hapikey=${hapikey}`,
};

const request = async (url, opts = {}) => {
  try {
    const response = await fetch(url, opts);
    const json = await response.json();
    return json;
  } catch (e) {
    throw new Error('Unable to complete request')
  }
};

const getTableInfo = id => request(endpoints.tableInfo(id));
const getTableRows = id => request(endpoints.getTableRows(id));

const addTableRow = (id, values) => request(endpoints.addTableRow(id), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ values }),
});

const updateTableRow = (tableid, rowid, values) => request(endpoints.tableRow(tableid, rowid), {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ values }),
});

const getFilteredTableRows = (tableid, filters = {}) => {
  const columnNames = Object.keys(filters);
  const queryParams = columnNames.reduce((result, key) => {
    result += `&${key}=${columnNames[key]}`;
    return result;
  });
  return request(`${endpoints.getTableRows(tableid)}${queryParams}`);
};

const publishTable = id => request(endpoints.publishTable(id), {
  method: 'PUT',
});

module.exports = {
  getTableInfo,
  getTableRows,
  getFilteredTableRows,
  addTableRow,
  updateTableRow,
  publishTable,
};
