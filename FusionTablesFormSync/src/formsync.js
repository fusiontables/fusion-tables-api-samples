/**
 * AppsScript script to run in a Google Spreadsheet that synchronizes
 * Google Forms responses with a Fusion Table.
 */

var DOCID;
var ADDRESS_COLUMN;
var LOCATION_COLUMN;
var TIME_ZONE;

/**
 * Do-nothing method to trigger the authorization dialog if not already done.
 */
function checkAuthorization() {
}

/**
 * Syncs the Fusion Table to the form data. Run this every hour or so.
 */
function sync() {
  init();

  // Get the data in the spreadsheet and convert it to a dictionary.
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  var spreadsheetData = sheet.getRange(1, 1, lastRow, lastColumn);
  var spreadsheetValues = spreadsheetData.getValues();
  var columns = spreadsheetValues[0];
  var spreadsheetMap = mapRowsByRowId(columns,
      spreadsheetValues.slice(1, spreadsheetValues.length));

  // Get the columns in the spreadsheet and escape any single quotes
  var escapedColumns = [];
  for (var i = 0; i < columns.length; i++) {
    var columnName = columns[i];
    columnName = escapeQuotes(columnName);
    escapedColumns.push(columnName);
  }

  // Get the data from the table and convert to a dictionary.
  var query = "SELECT '" + escapedColumns.join("','") + "' FROM " + DOCID;
  var ftResults = runSqlWithRetry(query);
  if (!ftResults) {
    return;
  }
  var ftMap = mapRowsByRowId(ftResults.columns, ftResults.rows);

  // For each row in the Fusion Table, find if the row still exists in the
  // spreadsheet. If it exists, make sure the values are the same. If
  // they are different, update the Fusion Table data.
  // If the row doesn't exist in the spreadsheet, delete the row from the table.
  for (var rowId in ftMap) {
    var spreadsheetRow = spreadsheetMap[rowId];
    if (spreadsheetRow) {
      var updates = [];
      var tableRow = ftMap[rowId];

      for (var column in tableRow) {
        if (column === 'rowid') {
          continue;
        }
        var tableValue = tableRow[column];
        var spreadsheetValue = spreadsheetRow[column];
        if (tableValue != spreadsheetValue) {
          spreadsheetValue = processSpreadsheetValue(column, spreadsheetValue);
          updates.push("'" + escapeQuotes(column) + "' = '" +
              spreadsheetValue + "'");
        }
      }

      // If there are updates, send the UPDATE query.
      if (updates.length) {
        var query = [];
        query.push('UPDATE ');
        query.push(DOCID);
        query.push(' SET ');
        query.push(updates.join(','));
        query.push(" WHERE rowid = '");
        query.push(rowId);
        query.push("'");
        runSqlWithRetry(query.join(''));
        waitBetweenCalls();
      }

    } else {
      // If the row doesn't exist in the spreadsheet, delete it from the table
      runSqlWithRetry('DELETE FROM ' + DOCID + " WHERE rowid = '" +
          rowId + "'");
      waitBetweenCalls();
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
    insertRowId(rowId, failedInserts[i].spreadsheetRowNum);
    waitBetweenCalls();
  }
}

/**
 * Submits the data to Fusion Tables when the form is submitted.
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
 * Ensures the docid property for the target table is set, that if the
 * address column is set the latlngColumn is also set, and adds a rowid
 * column to the sheet if it doesn't have one.
 */
function init() {
  // Set up global properties
  DOCID = ScriptProperties.getProperty('docid');
  if (!DOCID) {
    throw 'The script is missing the required docid Project Property';
  }
  ADDRESS_COLUMN = ScriptProperties.getProperty('addressColumn');
  LOCATION_COLUMN = ScriptProperties.getProperty('latlngColumn');
  if (ADDRESS_COLUMN && !LOCATION_COLUMN) {
    throw('Since you added an ADDRESS_COLUMN project property, ' +
        'you also need to add a latlngColumn property');
  }
  TIME_ZONE = Session.getScriptTimeZone();
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastColumn = sheet.getLastColumn();
  var lastHeaderValue = sheet.getRange(1, lastColumn).getValue();
  if (lastHeaderValue != 'rowid') {
    sheet.getRange(1, lastColumn + 1).setValue('rowid');
  }
}

/**
 * Creates a record in the Fusion Table.
 * @param {Object} dictionary of columns mapped to values.
 * @return {?string} the rowid if successful, otherwise null.
 */
function createRecord(columnValues) {
  // Create lists of the column names and values to create the INSERT Statement.
  var columns = [];
  var values = [];
  for (var column in columnValues) {
    // If the column is not the spreadsheetRowNum,
    // add it and the value to the lists.
    if (column != 'spreadsheetRowNum') {
      values.push(processSpreadsheetValue(column, columnValues[column]));
      column = escapeQuotes(column);
      columns.push(column);
    }
  }

  var query = [];
  query.push('INSERT INTO ');
  query.push(DOCID);
  query.push(" ('");
  query.push(columns.join("','"));
  query.push("') ");
  query.push("VALUES ('");
  query.push(values.join("','"));
  query.push("')");

  var response = runSqlWithRetry(query.join(''));
  if (response) {
    var rowId = response.rows[0][0];
    return rowId;
  }
}

/**
 * Adds the rowid from the INSERT to the corresponding row in the spreadsheet.
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
 * Returns the geocoded address.
 * @param {string} address The user-entered address.
 * @return {string} The geocoded results as a lat,long pair.
 */
function geocode(address) {
  if (!address) {
    return '0,0';
  }
  var results = Maps.newGeocoder().geocode(address);

  // If all your form responses will be within a given area, you may get better
  // geocoding results by biasing to that area. Uncomment the code below and set
  // the desired region, bounding box, or component filter. The example shows
  // how to indicate that the addresses should be in Spain. For full details, see
  // https://developers.google.com/maps/documentation/javascript/geocoding#GeocodingRequests
  //
  // var results = Maps.newGeocoder().geocode({ address: address, region: 'es' });

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
 * Geocodes the value if this is the address column, or formats it as a date if
 * this is the timestamp column, escapes quotes, and returns the value.
 * @param {string} column Column name.
 * @param {string} column Spreadsheet value.
 * @return {string} The converted or escaped value.
 */
function processSpreadsheetValue(column, value) {
  if (column === ADDRESS_COLUMN) {
    return geocode(value);
  }
  if (column === 'Timestamp') {
    // Ensure this is a format Fusion Tables understands
    return Utilities.formatDate(new Date(value), TIME_ZONE,
        'yyyy-MM-dd HH:mm:ss');
  }
  return escapeQuotes(value);
}

var TOO_MANY_REQUESTS = 'The sync script has exceeded rate limits';

/**
 * Runs a Fusion Tables SQL statement. Reruns the query if not successful.
 * @param {string} query The query to execute
 * @return {?Array} the Fusion Table response formatted as a JSON object if the
 * query was successful. Returns null if not.
 */
function runSqlWithRetry(sql) {
  try {
    return runSql(sql);
  } catch (e) {
    if (e == TOO_MANY_REQUESTS) {
      // If there were too many requests being sent, sleep for a bit
      waitBetweenCalls();
      return runSql(sql);
    } else {
      throw e;
    }
  }
}

/**
 * Runs a Fusion Tables SQL statement and catches any errors. Logs errors
 * and rethrows based on whether the error is retryable.
 * @param {string} sql The SQL to execute.
 * @return {Object} the Fusion Table response object if successful.
 */
function runSql(sql) {
  try {
    return FusionTables.Query.sql(sql, { hdrs: false });
  } catch(err) {
    if (err.message.search('Rate Limit Exceeded') != -1) {
      throw TOO_MANY_REQUESTS;
    } else {
      var msg = 'Problem running SQL: ' + sql + ': ' + err + '.';
      if (err.message.search(/Column .* does not exist/) != -1 ||
          err.message.search('Bad column reference') != -1) {
        msg += ' Looks like the column names in the form do not match ' +
               'the column names in the table. Make sure these match!';
      }
      throw msg;
    }
  }
}

/**
 * Converts the spreadsheet contents to a dictionary, mapping rowid
 * to column values. If rowid == -1 or null, the rowid is mapped to a list
 * of column values representing the failed inserts.
 * @param {Array} array An array of data, the first row contains headers.
 * @param {Object} map The resulting dictionary of row id mapped to columns.
 * {rowid:{column:value,...} | [{{column:value,...}}],}.
 */
function mapRowsByRowId(columns, rows) {
  var map = {};
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
      // Add the (one-based) spreadsheet row number to the map.
      // Since we've excluded the headers from the row, spreadsheet
      // row numbers for data start at 2.
      columnMap.spreadsheetRowNum = i + 2;
      map[-1].push(columnMap);
    } else {
      map[rowId] = columnMap;
    }
  }
  return map;
}

/**
 * Sleeps for two seconds to avoid API quota problems.
 */
function waitBetweenCalls() {
  Utilities.sleep(2000);
}

/**
 * Returns the value with single quotes and backslashes escaped.
 */
function escapeQuotes(value) {
  if (!value) {
    return "";
  }
  if (typeof value != 'string') {
    value = value.toString();
  }
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\\'");
}
