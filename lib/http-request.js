const nodeFetch = require('node-fetch');
const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({ minTime: 20 });
const fetch = limiter.wrap(nodeFetch);

const request = async (url, opts = {}) => {
  try {
    const response = await fetch(url, opts);
    const json = await response.json();
    return json;
  } catch (e) {
    throw new Error('Unable to complete request');
  }
};

module.exports = {
  request,
};