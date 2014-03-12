/**
 * Your API key for calling the Fusion Tables API. Replace with your own
 * key (see https://developers.google.com/fusiontables/docs/v1/using#APIKey)
 * @type {string}
 */
var API_KEY = 'YOUR API KEY HERE';

/**
 * The URL for the Fusion Tables API
 * @type {string}
 */
var FUSION_URL = 'https://www.googleapis.com/fusiontables/v1/query';

/**
 * Do-nothing method to trigger the authorization dialog if necessary.
 */
function checkAuthorization() {
}

/**
 * Submit the data to Fusion Tables when the form is submitted.
 * @const
 * @param {Object} e The form object.
 */
function onFormSubmit(e) {
  if (!e) {
    // Don't try to do anything when run directly from the script editor
    return;
  }
  // Get the row number of the newly entered data.
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getLastRow();

  // Check to make sure the rowid column is there.
  init();

  // The values entered into the form, mapped by question.
  var formValues = e.namedValues;

  // Insert the data into the Fusion Table.
  var rowId = createRecord(formValues);
  if (!rowId) {
    rowId = -1;
  }
  insertRowId(rowId, row);
}

/**
 * Initialize the spreadsheet by adding a rowid column.
 */
function init() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastColumn = sheet.getLastColumn();
  var lastHeaderValue = sheet.getRange(1, lastColumn).getValue();
  if (lastHeaderValue != 'rowid') {
    sheet.getRange(1, lastColumn + 1).setValue('rowid');
  }
}

/**
 * Add the rowid from the INSERT to the corresponding row in the spreadsheet.
 * @param {string} rowId The row id of the inserted row.
 * @param {number} row The row number to enter the rowid in.
 */
function insertRowId(rowId, row) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastColumn = sheet.getLastColumn();
  lastCell = sheet.getRange(row, lastColumn);
  lastCell.setValue(rowId);
}

/**
 * Create a record in the Fusion Table.
 * @param {Object} dictionary of columns mapped to values.
 * @return {?string} the rowid if successful, otherwise null.
 */
function createRecord(columnValues) {
  // Get the properties associated with this Script.
  var docid = ScriptProperties.getProperty('docid');
  var addressColumn = ScriptProperties.getProperty('addressColumn');
  var latlngColumn = ScriptProperties.getProperty('latlngColumn');

  // Create lists of the column names and values to create the INSERT Statement.
  var columns = [];
  var values = [];
  for (var column in columnValues) {
    // If the column is not the spreadsheetRowNum,
    // add it and the value to the lists.
    if (column != 'spreadsheetRowNum') {
      var value = columnValues[column];

      // If an address column was specified, geocode the value in it.
      if (addressColumn && column == addressColumn) {
        var latlng = geocode(value);
        latlngColumn = latlngColumn.replace(/'/g, "\\\'");
        columns.push(latlngColumn);
        values.push(latlng);
      }

      if (typeof value != 'string') {
        value = value.toString();
      }
      value = value.replace(/'/g, "\\\'");
      values.push(value);

      column = column.replace(/'/g, "\\\'");
      columns.push(column);
    }
  }

  var query = [];
  query.push('INSERT INTO ');
  query.push(docid);
  query.push(" ('");
  query.push(columns.join("','"));
  query.push("') ");
  query.push("VALUES ('");
  query.push(values.join("','"));
  query.push("')");

  var response = queryFt(query.join(''));
  if (response) {
    var rowId = response.rows[0][0];
    return rowId;
  }
}

/**
 * Geocode the address.
 * @param {string} address The user-entered address.
 * @return {string} the geocoded results.
 */
function geocode(address) {
  if (!address) {
    return '0,0';
  }
  var results = Maps.newGeocoder().geocode(address);
  Logger.log('Geocoding: ' + address);
  if (results.status == 'OK') {
    var bestResult = results.results[0];
    var lat = bestResult.geometry.location.lat;
    var lng = bestResult.geometry.location.lng;
    var latLng = lat + ',' + lng;
    Logger.log('Results: ' + latLng);
    return latLng;
  } else {
    Logger.log('Error geocoding: ' + address);
    Logger.log(results.status);
    return '0,0';
  }
}


/**
 * Initialize the query to Fusion Tables. Rerun the query if not successful.
 * @param {string} query The query to execute
 * @return {?Array} the Fusion Table response formatted as a JSON object if the
 * query was successful. Returns null if not.
 */
function queryFt(query) {
  var response = run(query);

  // If the query failed with a 401 or 500 error, try again one more time.
  if (response == -1) {
    response = run(query);
  }

  // If the query failed again, or failed for some other reason, return.
  if (response == -1 || response == -2) {
    return;
  }
  if (response) {
     return JSON.parse(response);
  }
  return null;
}

/**
 * Send query to Fusion Tables and catch any errors.
 * @param {string} query The query to execute
 * @return {Array|number} the Fusion Table response formatted as an array
 * if successful, -1 if a 401 or 500 error occurred, -2 if some other error
 * occurred.
 */
function run(query) {
  var method = 'post';
  var lowercaseQuery = query.toLowerCase();
  if (lowercaseQuery.indexOf('select') == 0 ||
      lowercaseQuery.indexOf('show') == 0 ||
      lowercaseQuery.indexOf('describe') == 0) {
    method = 'get';
  }

  var token = ScriptProperties.getProperty('token');
  if (!token) {
    token = getGAauthenticationToken();
    if (!token) {
      return -2;
    }
  }

  var response;
  var sql = encodeURIComponent(query);
  try {
    if (method == 'get') {
      var url = FUSION_URL + '?sql=' + sql + '&key=' + API_KEY;
      response = UrlFetchApp.fetch(url, {
        method: method,
        headers: {
          'Authorization': 'GoogleLogin auth=' + token
        }
      });
    } else {
      response = UrlFetchApp.fetch(FUSION_URL, {
        method: method,
        headers: {
          'Authorization': 'GoogleLogin auth=' + token
        },
        payload: 'sql=' + sql + '&key=' + API_KEY
      });
    }
  } catch(err) {
    if (err.message.search('401') != -1) {
      // If the auth failed, get a new token
      token = getGAauthenticationToken();
      if (!token) {
        return -2;
      }
      return -1;
    } else if (err.message.search('500') != -1) {
      // If there were too many requests being sent, sleep for a bit
      Utilities.sleep(3000);
      return -1;
    } else {
      Logger.log('The failing query: ' + decodeURIComponent(sql));
      var docid = ScriptProperties.getProperty('docid');
      if (!docid) {
        Logger.log('The script is missing a docid Project Property');
      }
      if (err.message.search('Bad column reference') != -1) {
        Logger.log('Looks like the column names in the form do not match ' +
            'the column names in the table. Make sure these match!');
      }
      var addressColumn = ScriptProperties.getProperty('addressColumn');
      var latlngColumn = ScriptProperties.getProperty('latlngColumn');
      if (addressColumn && !latlngColumn) {
        Logger.log('Since you added an addressColumn project property, ' +
            'you also need to add a latlngColumn property');
      }
      Logger.log(err.message);
      return -2;
    }
  }

  response = response.getContentText();
  return response;
}

/**
 * Get the auth token using Client Login. Save the token
 * to a Script Property "token".
 * @return {?string} the auth token.
 */
function getGAauthenticationToken() {
  var username;
  var password;
  var response;

  try {
    username = ScriptProperties.getProperty('username');
    if (!username) {
      throw new Error('Missing username in Project Properties.');
    }
  } catch(err) {
    Logger.log('Error authenticating.');
    Logger.log(err.message);
    return;
  }

  try {
    password = ScriptProperties.getProperty('password');
    if (!password) {
      throw new Error('Missing password in Project Properties.');
    }
  } catch(err) {
    Logger.log('Error authenticating.');
    Logger.log(err.message);
    return;
  }

  username = encodeURIComponent(username);
  password = encodeURIComponent(password);
  try {
    response = UrlFetchApp.fetch(
      'https://www.google.com/accounts/ClientLogin', {
        method: 'post',
        payload: 'accountType=GOOGLE&Email=' + username +
            '&Passwd=' + password + '&service=fusiontables&Source=googledocs'
      });
  } catch(err) {
    Logger.log('Error authenticating.');
    Logger.log(err.message);
    return;
  }

  var tokens = response.getContentText();
  var token = tokens.slice(tokens.search('Auth=') + 5, tokens.length);
  token = token.replace(/\n/g, '');
  ScriptProperties.setProperty('token', token);
  return token;
}

/**
 * Sync the Fusion Table to the Form data. Run this every hour or so.
 */
function sync() {
  // Check to make sure the rowid column is there.
  init();

  // Get the data in the spreadsheet and convert it to a dictionary.
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  var spreadsheetData = sheet.getRange(1, 1, lastRow, lastColumn);
  spreadsheetData = spreadsheetData.getValues();
  var spreadsheetMap = {};
  convertToMap(spreadsheetData, spreadsheetMap);

  // Get the columns in the spreadsheet and escape any single quotes
  var columns = spreadsheetData[0];
  var escapedColumns = [];
  for (var i = 0; i < columns.length; i++) {
    var columnName = columns[i];
    columnName = columnName.replace(/'/g, "\\\'");
    escapedColumns.push(columnName);
  }

  // Get the data from the table and convert to a dictionary.
  var docid = ScriptProperties.getProperty('docid');
  var query = "SELECT '" + escapedColumns.join("','") + "' FROM " + docid;
  var ftResults = queryFt(query);
  if (!ftResults) {
    return;
  }
  var ftMap = convertFtToMap(ftResults);

  // Get the properties associated with this Script.
  var addressColumn = ScriptProperties.getProperty('addressColumn');
  var latlngColumn = ScriptProperties.getProperty('latlngColumn');

  // For each row in the Fusion Table, find if the row still exists in the
  // Spreadsheet. If it exists, make sure the values are the same. If
  // they are different, update the Fusion Table data.
  // If the row doesn't exist in the spreadsheet, delete the row from the table.
  for (var rowId in ftMap) {
    var spreadsheetRow = spreadsheetMap[rowId];
    if (spreadsheetRow) {
      var updates = [];
      var tableRow = ftMap[rowId];
      for (var column in tableRow) {
        if (column === "rowid") {
          continue;
        }
        var tableValue = tableRow[column];
        var spreadsheetValue = spreadsheetRow[column];
        if (tableValue != spreadsheetValue) {
          if (addressColumn == column) {
            var latlng = geocode(spreadsheetValue);
            latlngColumn = latlngColumn.replace(/'/g, "\\\'");
            updates.push("'" + latlngColumn + "' = '" + latlng + "'");
          }
          if (!spreadsheetValue) {
            spreadsheetValue = "";
          }
          if (typeof spreadsheetValue != 'string') {
            spreadsheetValue = spreadsheetValue.toString();
          }
          spreadsheetValue = spreadsheetValue.replace(/'/g, "\\\'");
          column = column.replace(/'/g, "\\\'");
          updates.push("'" + column + "' = '" + spreadsheetValue + "'");
        }
      }

      // If there are updates, send the UPDATE query.
      if (updates.length) {
        var query = [];
        query.push('UPDATE ');
        query.push(docid);
        query.push(' SET ');
        query.push(updates.join(','));
        query.push(" WHERE rowid = '");
        query.push(rowId);
        query.push("'");
        queryFt(query.join(''));
        Utilities.sleep(3000);
      }

    } else {
      // If the row doesn't exist in the spreadsheet, delete it from the table
      queryFt('DELETE FROM ' + docid + " WHERE rowid = '" + rowId + "'");
      Utilities.sleep(3000);
    }
  }

  // Insert all the data into the Fusion Table that failed to insert.
  // These rows were given a rowid of -1 or have a blank rowid.
  var failedInserts = spreadsheetMap[-1];
  for (var i = 0; failedInserts && i < failedInserts.length; i++) {
    var rowId = createRecord(failedInserts[i]);
    if (!rowId) {
      rowId = -1;
    }
    insertRowId(rowId, failedInserts[i]['spreadsheetRowNum']);
    Utilities.sleep(3000);
  }
}

/**
 * Converts the form and table data to a dictionary, mapping rowid
 * to column values. If rowid == -1 or null, the rowid is mapped to a list
 * of column values representing the failed inserts.
 * @param {Array} array An array of data, the first row contains headers.
 * @param {Object} map The resulting dictionary of row id mapped to columns.
 * {rowid:{column:value,...} | [{{column:value,...}}],}.
 */
function convertToMap(array, map) {
  var columns = array[0];

  for (var i = 1; i < array.length; i++) {
    var row = array[i];
    var rowId = row[row.length - 1];
    var columnMap = {};

    for (var j = 0; j < row.length - 1; j++) {
      var columnName = columns[j];
      var columnValue = row[j];
      columnMap[columnName] = columnValue;
    }

    if (rowId == -1 || !rowId) {
      if (!map[-1]) {
        map[-1] = [];
      }
      // Add the spreadsheet row number to the map
      columnMap['spreadsheetRowNum'] = i + 1;
      map[-1].push(columnMap);
    } else {
      map[rowId] = columnMap;
    }
  }
}

function convertFtToMap(ftResults) {
  var map = {};
  var columns = ftResults.columns;
  var rows = ftResults.rows;
  if (!rows) {
    return;
  }
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var rowId = row[row.length - 1];
    var columnMap = {};

    for (var j = 0; j < columns.length; j++) {
      var columnName = columns[j];
      var columnValue = row[j];
      columnMap[columnName] = columnValue;
    }

    if (rowId == -1 || !rowId) {
      if (!map[-1]) {
        map[-1] = [];
      }
      // Add the spreadsheet row number to the map
      columnMap['spreadsheetRowNum'] = i + 1;
      map[-1].push(columnMap);
    } else {
      map[rowId] = columnMap;
    }
  }
  return map;
}
