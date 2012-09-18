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
 * Check the layer form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkLayerForm = function(layerNum) {
   if (!document.getElementById('table-id-'+layerNum).value) {
     alert('Table ID required!');
     return false;
   }

   if (!document.getElementById('location-column-'+layerNum).value) {
     alert('Location Column required!');
     return false;
   }

   return true;
};

/**
 * Check the text form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkTextForm = function(layerNum) {
  if (!Form.checkLayerForm(layerNum)) {
    return false;
  }

  if (!document.getElementById('text-query-label-'+layerNum).value) {
   alert('Label required!');
   return false;
  }

  if (!document.getElementById('text-query-column-'+layerNum).value) {
   alert('Query Column required!');
   return false;
  }

  return true;
};

/**
 * Check the select menu form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Form.checkSelectForm = function(layerNum) {
  if (!Form.checkLayerForm(layerNum)) {
    return false;
  }

  if (!document.getElementById('select-query-label-'+layerNum).value) {
   alert('Label required!');
   return false;
  }

  if (!document.getElementById('select-query-column-'+layerNum).value) {
   alert('Query Column required!');
   return false;
  }

  return true;
};