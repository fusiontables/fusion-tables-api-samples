/**
 * @fileoverview Code for Search.
 *
 * Search for a Fusion Table Layer.
 *
 */

 goog.provide('Builder.search');

/**
 * Search constructor.
 * @constructor
 * @param {string} type The type of search, text or select.
 * @param {string} label A label for the search.
 * @param {string} column The column to query.
 */
var Search = function(type, label, column) {
  this.type = type;
  this.label = label;
  this.column = column;
  this.options = [];
};

/**
 * The type of search (either text or select).
 * @type {string}
 */
Search.prototype.type = null;

/**
 * The text label for the query element.
 * @type {string}
 */
Search.prototype.label = null;

/**
 * The column to be queried in the search.
 * @type {string}
 */
Search.prototype.column = null;

/**
 * The list of options in the drop-down menu, if it's a select search.
 * @type {Object}
 */
Search.prototype.options = null;

/**
 * Reset all options.
 */
Search.prototype.remove = function() {
  this.type = null;
  this.label = null;
  this.column = null;
  this.options = [];
};
