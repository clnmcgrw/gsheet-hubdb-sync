# GSheet + HubDB Sync

This tool can sync data from a google sheet to a HubSpot hubdb table.

### Script Overview

- scans the entire google sheet & iterate over every row
- convert single row data to hubdb format
- check if vendor id from gsheet row already exists in hubdb
- if row match found, check if any cell values have changed
- if values have changed, run an update, if not do nothing
- if no row match, create as new row in hubdb
- after iterating through all, publish the hubdb table
