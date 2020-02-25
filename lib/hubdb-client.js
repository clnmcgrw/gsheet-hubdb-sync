// const debug = require('debug')('hubdb-client');
const { request } = require('./http-request');

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
    result += '&' + `${key}=${filters[key]}`;
    return result;
  }, '');
  const endpoint = endpoints.getTableRows(tableid) + queryParams;
  return request(endpoint);
};

const getAllTableRows = async (tableid) => {
  const result = getFilteredTableRows(tableid, { limit: 2500 });
  return result;
};

const publishTable = id => request(endpoints.publishTable(id), {
  method: 'PUT',
});

module.exports = {
  getTableInfo,
  getTableRows,
  getFilteredTableRows,
  getAllTableRows,
  addTableRow,
  updateTableRow,
  publishTable,
};
