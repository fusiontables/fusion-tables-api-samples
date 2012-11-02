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
 * @return {object} googUri defining map layer.
 */
Form.checkEmbedForm = function(layerNum) {
  var link = document.getElementById('publish-url-' + layerNum).value
  if (!link) {
    alert('Enter Publish link or Embed code.');
    return null;
  }

  var iframeSrcMatch = link.match(/src="([^"]*)/);
  if (iframeSrcMatch) {
    var ampPattern = /&amp;/g;    // ampersand
    var sqPattern = /&#39;/g;     // single quote; appears in WHERE clause
    link = iframeSrcMatch[1].replace(ampPattern, '&');
    link = link.replace(sqPattern, "'");
  }
  if (link.indexOf("viz=MAP") == -1) {
    alert('Link or code does not specify an embedded map: no viz=MAP found.');
    return null;
  }

  return new goog.Uri(link);
};


/**
 * Check the layer form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkLayerForm = function(layerNum) {
   if (!document.getElementById('table-id-' + layerNum).value) {
     alert('Enter a Table ID.');
     return false;
   }

   if (!document.getElementById('location-column-' + layerNum).value) {
     alert('Select a Location Column.');
     return false;
   }

   return true;
};

/**
 * Check the text form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkTextForm = function(layerNum) {
  if (!document.getElementById('text-query-label-' + layerNum).value) {
   alert('Enter a Label.');
   return false;
  }

  if (!document.getElementById('text-query-column-' + layerNum).value) {
   alert('Select a Query Column.');
   return false;
  }

  return true;
};

/**
 * Check the select menu form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkSelectForm = function(layerNum) {
  if (!document.getElementById('select-query-label-' + layerNum).value) {
   alert('Enter a Label.');
   return false;
  }

  if (!document.getElementById('select-query-column-' + layerNum).value) {
   alert('Select a Query Column.');
   return false;
  }

  return true;
};