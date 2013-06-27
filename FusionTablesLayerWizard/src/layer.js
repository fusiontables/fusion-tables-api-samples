/**
 * @fileoverview Code for Layer.
 *
 * Controls the Fusion Table Layer.
 *
 */

 goog.provide('Builder.layer');

/**
 * Layer constructor.
 * @constructor
 * @param {string} tableId The id of the table.
 * @param {string} locationColumn The location column.
 * @param {string} where A filter for the layer.
 * @param {string} styleId The map style to use. Needed for New look.
 * @param {string} templateId The template for infowindow to use. Needed
 *     for New look.
 */
var Layer = function(tableId, locationColumn, where, styleId, templateId) {
  this.initialize(tableId, locationColumn, where, styleId, templateId);
};

/**
 * The FusionTablesLayer to add to the map.
 * @type {Object}
 */
Layer.prototype.layer = null;

/**
 * The table id for the Fusion Table Layer.
 * @type {string}
 */
Layer.prototype.tableId = null;

/**
 * The location column of the table in the layer.
 * @type {string}
 */
Layer.prototype.locationColumn = null;

/**
 * The a filter for the layer.
 * @type {string}
 */
Layer.prototype.where = null;

/**
 * The styleID for the layer in New look.
 * Found as the y parameter in the embed code.
 * @type {string}
 */
Layer.prototype.styleId = null;

/**
 * The templateID for the layer in New look.
 * Found as the tmplt parameter in the embed code.
 * @type {string}
 */
Layer.prototype.templateId = null;

/**
 * Any searches added to the layer (text or select).
 * @type {Object}
 */
Layer.prototype.search = null;

/**
 * Initializes the layer.
 * @param {string} tableId The id of the table.
 * @param {string} locationColumn The location column.
 * @param {string} where A filter for the layer.
 * @param {number} styleId The map style ID.
 * @param {number} templateId The map info window template ID.
 */
Layer.prototype.initialize = function(tableId, locationColumn, where, styleId,
    templateId) {
  this.tableId = tableId;
  this.locationColumn = locationColumn;
  this.where = where;
  this.styleId = styleId;
  this.templateId = templateId;
  this.layer = new google.maps.FusionTablesLayer({
    query: {
      select: locationColumn,
      from: tableId,
      where: where
    },
    styleId: styleId,
    templateId: templateId
  });
};

/**
 * Sets the map of the layer.
 * @param {google.maps.Map} map The map for the layer.
 */
Layer.prototype.setMap = function(map) {
  this.layer.setMap(map);
};

/**
 * Add a search to the layer.
 * @param {string} type The type of search, either text or select.
 * @param {string} label The label for the search.
 * @param {string} column The column to be searched.
 */
Layer.prototype.addSearch = function(type, label, column) {
  // TODO: allow for multiple search elements
  if (!this.search) {
    this.search = new Search(type, label, column);
  }
};

/**
 * Update the layer query.
 * @param {string} value The search value.
 */
Layer.prototype.query = function(value) {
  var comparator = ' = ';
  if (this.search.type == 'text') {
    comparator = ' CONTAINS IGNORING CASE ';
  }
  value = value.replace(/'/g, "\\'");

  var where = '';
  if (this.where) {
    where += this.where + ' AND ';
  }
  if (value != '--Select--') {
    where += "'" + this.search.column + "'" + comparator + "'" + value + "'";
  }
  this.layer.setOptions({
    query: {
      select: this.locationColumn,
      from: this.tableId,
      where: where
    }
  });
};

/**
 * Remove the search.
 */
Layer.prototype.removeSearch = function() {
  this.search = null;
  this.reset();
};

/**
 * Reset the layer query.
 */
Layer.prototype.reset = function() {
  this.layer.setOptions({
    query: {
      select: this.locationColumn,
      from: this.tableId,
      where: this.where
    }
  });
};
