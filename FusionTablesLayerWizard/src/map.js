/**
 * @fileoverview Code for Map.
 *
 * Controls the map.
 *
 */

 goog.provide('Builder.map');

/**
 * Map constructor.
 * @constructor
 * @param {Node} mapElement The DOM element displaying the map.
 */
var Map = function(mapElement) {
  this.initialize(mapElement);
};

/**
 * The map.
 * @type {google.maps.Map}
 */
Map.prototype.map;

/**
 * The default width of the map.
 * @const
 * @type {number}
 * @private
 */
Map.prototype.DEFAULT_WIDTH_ = 500;

/**
 * The default height of the map.
 * @const
 * @type {number}
 * @private
 */
Map.prototype.DEFAULT_HEIGHT_ = 400;

/**
 * The default center of the map.
 * @type {google.maps.LatLng}
 * @private
 */
Map.prototype.defaultCenter_;

/**
 * The default zoom of the map.
 * @const
 * @type {number}
 * @private
 */
Map.prototype.DEFAULT_ZOOM_ = 1;

/**
 * The default map type of the map.
 * @const
 * @type {string}
 * @private
 */
 Map.prototype.DEFAULT_MAP_TYPE_ = google.maps.MapTypeId.ROADMAP;

/**
 * The width of the map.
 * @type {number}
 */
Map.prototype.width = 500;

/**
 * The height of the map.
 * @type {number}
 */
Map.prototype.height = 400;

/**
 * The center of the map.
 * @type {google.maps.LatLng}
 * @private
 */
Map.prototype.center_ = null;

/**
 * The zoom of the map.
 * @type {number}
 * @private
 */
Map.prototype.zoom_ = 1;

/**
 * The type of the map.
 * @type {string}
 * @private
 */
Map.prototype.mapTypeId_ = google.maps.MapTypeId.ROADMAP;

/**
 * The saturation of the map.
 * @type {number}
 * @private
 */
Map.prototype.saturation_ = 0;

/**
 * The possible map types.
 * @type {Object}
 */
Map.prototype.mapTypes;

/**
 * The layer(s) added to the map.
 * @type {Object}
 */
Map.prototype.layers;

/**
 * The layer keys.
 * @type {Object}
 * @private
 */
Map.prototype.layerIds;

/**
 * Initializes the map.
 * @param {Node} mapElement The DOM element displaying the map.
 */
Map.prototype.initialize = function(mapElement) {
  mapElement.style.width = this.DEFAULT_WIDTH_ + 'px';
  mapElement.style.height = this.DEFAULT_HEIGHT_ + 'px';
  this.defaultCenter_ = new google.maps.LatLng(0, 0);
  this.center_ = this.defaultCenter_;
  this.mapTypes = {
    'roadmap': 'google.maps.MapTypeId.ROADMAP',
    'satellite': 'google.maps.MapTypeId.SATELLITE',
    'terrain': 'google.maps.MapTypeId.TERRAIN',
    'hybrid': 'google.maps.MapTypeId.HYBRID'
  };
  this.layers = {};
  this.layerIds = ['l0', 'l1', 'l2', 'l3', 'l4'];

  this.map = new google.maps.Map(mapElement);
  this.map.setCenter(this.defaultCenter_);
  this.map.setZoom(this.DEFAULT_ZOOM_);
  this.map.setMapTypeId(this.DEFAULT_MAP_TYPE_);
};

/**
 * Add layer to the map.
 * @param {string} tableId The id of the table.
 * @param {string} locationColumn The location column.
 * @param {string} where A filter for the layer.
 * @param {string} styleId The map style ID.
 * @param {string} templateId The map info window template ID.
 * @return {string} The layer id.
 */
Map.prototype.addLayer = function(tableId, locationColumn, where, styleId,
    templateId) {
  if (this.layerIds.length) {
    var layer = new Layer(tableId, locationColumn, where, styleId, templateId);
    layer.setMap(this.map);
    var layerId = this.layerIds.shift();
    this.layers[layerId] = layer;
    return layerId;
  }
};

/**
 * Edit the map features.
 */
Map.prototype.editMap = function() {
  // Get the new map values (or set defaults if text field left blank)
  var width = parseInt(document.getElementById('map-width').value, 10);
  this.width = width > 0 ? width : this.DEFAULT_WIDTH_;
  var height = parseInt(document.getElementById('map-height').value, 10);
  this.height = height > 0 ? height : this.DEFAULT_HEIGHT_;

  // TODO: get the max zoom from the maxZoomService
  var zoom = parseInt(document.getElementById('map-zoom').value, 10);
  this.currentZoom = zoom >= 0 ? zoom : this.DEFAULT_ZOOM_;
  this.map.setZoom(this.zoom_);

  // Set the map's centerpoint
  var lat = parseFloat(document.getElementById('map-center-lat').value);
  var lng = parseFloat(document.getElementById('map-center-lng').value);
  var center = new google.maps.LatLng(lat, lng);
  this.map.setCenter(center);

  // Resize the map
  var mapDiv = document.getElementById('map-canvas');
  mapDiv.style.width = this.width + 'px';
  mapDiv.style.height = this.height + 'px';
  google.maps.event.trigger(this.map, 'resize');
};

/**
 * Turn off or on all map features.
 */
Map.prototype.switchAllMapFeatures = function() {
  var style = [];

  // Check or uncheck all items. If not show all, turn off visibility.
  var showAll = document.getElementById('all-features').checked;
  var specs = document.getElementsByName('specs');
  for (var i = 0, spec; spec = specs[i]; i++) {
    spec.checked = showAll;
    if (!showAll) {
      style.push({
        featureType: spec.id,
        elementType: 'all',
        stylers: [
          { visibility: 'off' }
        ]
      });
    }
  }

  this.applyStyle(style);
};

/**
 * Turn off or on some of the map features.
 */
Map.prototype.switchSelectedMapFeatures = function() {
  var style = [];

  // Set the map style visibility to off for all unchecked elements.
  var unchecked = false;
  var specs = document.getElementsByName('specs');
  for (var i = 0, spec; spec = specs[i]; i++) {
    if (!spec.checked) {
      style.push({
        featureType: spec.id,
        elementType: 'all',
        stylers: [
          { visibility: 'off' }
        ]
      });
      unchecked = true;
    }
  }

  // If a map element is unchecked, uncheck the "all features" checkbox,
  // otherwise, make sure it's checked
  document.getElementById('all-features').checked = !unchecked;

  this.applyStyle(style);
};


/**
 * Style the map according to the form values.
 * @param {Object} style Style list.
 */
Map.prototype.applyStyle = function(style) {
  if (this.saturation) {
    style.push({
      featureType: 'all',
      elementType: 'all',
      stylers: [
        { saturation: this.saturation }
      ]
    });
  }

  if (style.length) {
    var styledMapType = new google.maps.StyledMapType(style, {
      map: this.map,
      name: 'Styled Map'
    });

    this.map.mapTypes.set('map-style', styledMapType);
    this.map.setMapTypeId('map-style');
  } else {
    this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
  }
};

/**
 * Get the map center.
 * @return {google.maps.LatLng} The center of the map.
 */
Map.prototype.getCenter = function() {
  return this.center_;
};

/**
 * Set the map center.
 * @param {google.maps.LatLng} center The center for the map.
 */
Map.prototype.setCenter = function(center) {
  this.center_ = center;
};

/**
 * Get the map zoom.
 * @return {number} The zoom of the map.
 */
Map.prototype.getZoom = function() {
  return this.zoom_;
};

/**
 * Set the map zoom.
 * @param {number} zoom The new map zoom.
 */
Map.prototype.setZoom = function(zoom) {
  this.zoom_ = zoom;
};

/**
 * Get the map type id.
 * @return {string} The mapTypeId of the map.
 */
Map.prototype.getMapTypeId = function() {
  return this.mapTypeId_;
};

/**
 * Set the map type id.
 * @param {string} mapTypeId The map type id of the map.
 */
Map.prototype.setMapTypeId = function(mapTypeId) {
  this.mapTypeId_ = mapTypeId;
};

/**
 * The number of layers added to the map so far.
 * @return {number} The number of layers added.
 */
Map.prototype.numLayers = function() {
  return 5 - this.layerIds.length;
};

/**
 * Remove one of the layers.
 * @param {string} layerId The id of the layer to remove.
 */
Map.prototype.removeLayer = function(layerId) {
  var layer = this.layers[layerId];
  layer.setMap(null);
  delete this.layers[layerId];
  layer = null;
  this.layerIds.push(layerId);
  this.layerIds.sort();
};

/**
 * Reset the map by removing all layers.
 */
Map.prototype.reset = function() {
  var keys = [];
  for (var key in this.layers) {
    keys.push(key);
  }
  for (var i = 0; i < keys.length; i++) {
    this.removeLayer(keys[i]);
  }
};
