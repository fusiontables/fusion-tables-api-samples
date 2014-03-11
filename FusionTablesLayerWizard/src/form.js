/**
 * @fileoverview Form checks.
 *
 * Checks form input.
 *
 */

goog.provide('Builder.form');

/**
 * Form constructor.
 * @constructor
 */
var Form = function() { };

/**
 * Check for and clean the embed link.
 * @param {string} layerNum The layer number, such as l0.
 * @return {object} googUri Defining map layer.
 */
Form.checkEmbedForm = function(layerNum) {
  var link = document.getElementById('publish-url-' + layerNum).value;
  if (!link) {
    alert('Enter publish link or embed code.');
    return null;
  }

  var iframeSrcMatch = link.match(/src="([^"]*)/);
  if (iframeSrcMatch) {
    var ampPattern = /&amp;/g;    // ampersand
    var sqPattern = /&#39;/g;     // single quote; appears in WHERE clause
    link = iframeSrcMatch[1].replace(ampPattern, '&');
    link = link.replace(sqPattern, "'");
  }
  if (link.indexOf('viz=MAP') == -1) {
    alert('Link or code does not specify an embedded map: no viz=MAP found.');
    return null;
  }
  return new goog.Uri(link);
};


/**
 * Check the layer form to make sure there are no blanks.
 * @param {string} layerNum The layer number, such as l0.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkLayerForm = function(layerNum) {
  if (!document.getElementById('table-id-' + layerNum).value) {
    alert('Enter a table ID.');
    return false;
  }

  if (!document.getElementById('location-column-' + layerNum).value) {
    alert('Select a location column.');
    return false;
  }

  return true;
};

/**
 * Check the text form to make sure there are no blanks.
 * @param {string} layerNum The layer number, such as l0.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkTextForm = function(layerNum) {
  return Form.checkSearchColumnAndLabel(
      document.getElementById('text-query-column-' + layerNum),
      document.getElementById('text-query-label-' + layerNum));
};

/**
 * Check the select menu form to make sure there are no blanks.
 * @param {string} layerNum The layer number, such as l0.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkSelectForm = function(layerNum) {
  return Form.checkSearchColumnAndLabel(
      document.getElementById('select-query-column-' + layerNum),
      document.getElementById('select-query-label-' + layerNum));
};

/**
 * Check that a query column is selected, and set the label to the column name
 * if not set.
 * @param {element} columnElement The query column selector.
 * @param {element} labelElement The query label.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkSearchColumnAndLabel = function(columnElement, labelElement) {
  if (!columnElement.value) {
    alert('Select a column to query.');
    return false;
  }
  if (!labelElement.value) {
    labelElement.value = columnElement.value;
  }
  return true;
};
