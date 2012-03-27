/**
 * @fileoverview Code for FusionTablesLayer Builder.
 *
 * FusionTablesLayer Builder generates the HTML code for users
 * to include search elements or another layer.
 *
 */

goog.require('goog.dom');
goog.require('goog.ui.Slider');
goog.require('goog.ui.Component');

/**
 * Builder constructor.
 * @constructor
 */
var Builder = function() {
  this.map = null;
  this.initialize();
};

google.maps.event.addDomListener(window, 'load', function() {
  var builder = new Builder();
});

/**
 * The default width of the map.
 * @const
 * @type {number}
 * @private
 */
Builder.prototype.DEFAULT_WIDTH_ = 500;

/**
 * The default height of the map.
 * @const
 * @type {number}
 * @private
 */
Builder.prototype.DEFAULT_HEIGHT_ = 400;

/**
 * The default center of the map.
 * @type {google.maps.LatLng}
 * @private
 */
Builder.prototype.defaultCenter;

/**
 * The default zoom of the map.
 * @const
 * @type {number}
 * @private
 */
Builder.prototype.DEFAULT_ZOOM_ = 1;

/**
 * The current width of the map.
 * @type {number}
 */
Builder.prototype.currentWidth = 500;

/**
 * The current height of the map.
 * @type {number}
 */
Builder.prototype.currentHeight = 400;

/**
 * The current center of the map.
 * @type {google.maps.LatLng}
 * @private
 */
Builder.prototype.currentCenter;

/**
 * The current zoom of the map.
 * @type {number}
 */
Builder.prototype.currentZoom = 1;

/**
 * The current saturation of the map.
 * @type {number}
 */
Builder.prototype.currentSaturation = 0;

/**
 * The FusionTablesLayer to add to the map.
 * @type {Object}
 */
Builder.prototype.layer = null;

/**
 * The table id for the Fusion Table Layer.
 * @type {string}
 */
Builder.prototype.currentTableId = null;

/**
 * The location column of the table in the layer.
 * @type {string}
 */
Builder.prototype.currentLocationColumn = null;

/**
 * The a filter for the layer.
 * @type {string}
 */
Builder.prototype.currentFilter = null;

/**
 * The second FusionTablesLayer to add to the map.
 * @type {Object}
 */
Builder.prototype.secondLayer = null;

/**
 * The second table id for the second layer.
 * @type {string}
 */
Builder.prototype.currentSecondTableId = null;

/**
 * The second location column for the second layer.
 * @type {string}
 */
Builder.prototype.currentSecondLocationColumn = null;

/**
 * The second location filter for the second layer.
 * @type {string}
 */
Builder.prototype.currentSecondFilter = null;

/**
 * The label for the text query search box.
 * @type {string}
 */
Builder.prototype.currentTextQueryLabel = null;

/**
 * The column to be queried in the text search box.
 * @type {string}
 */
Builder.prototype.currentTextQueryColumn = null;

/**
 * The label for the select query.
 * @type {string}
 */
Builder.prototype.currentSelectQueryLabel = null;

/**
 * The column to be queried in the select menu.
 * @type {string}
 */
Builder.prototype.currentSelectQueryColumn = null;

/**
 * The options for the select menu.
 * @type {string}
 */
Builder.prototype.selectOptions = null;

/**
 * Indicates whether or not a second layer was added.
 * @type {boolean}
 */
Builder.prototype.secondLayerAdded = false;

/**
 * Indicates whether or not a text query was added.
 * @type {boolean}
 */
Builder.prototype.textQueryAdded = false;

/**
 * Indicates whether or not a select query was added.
 * @type {boolean}
 */
Builder.prototype.selectQueryAdded = false;

/**
 * Indicates which form is being displayed in the "Add Additional Feature"
 * section.
 * @type {string}
 */
Builder.prototype.lastDisplayed = null;

/**
 * Initialize the app.
 */
Builder.prototype.initialize = function() {
  this.defaultCenter = new google.maps.LatLng(0, 0);
  this.currentCenter = this.defaultCenter;

  // Initialize map form inputs
  document.getElementById('mapwidth').value = this.DEFAULT_WIDTH_;
  document.getElementById('mapheight').value = this.DEFAULT_HEIGHT_;
  document.getElementById('map-center').value =
      this.defaultCenter.lat() + ', ' + this.defaultCenter.lng();
  document.getElementById('map-zoom').value = this.DEFAULT_ZOOM_;

  // Initialize slider
  var sliderElement = document.getElementById('slider');
  this.slider = new goog.ui.Slider();
  this.slider.decorate(sliderElement);
  this.slider.setMinimum(-99);
  this.slider.setMaximum(99);

  // Initialize the map
  var mapDiv = document.getElementById('map-canvas');
  mapDiv.style.width = this.DEFAULT_WIDTH_ + 'px';
  mapDiv.style.height = this.DEFAULT_HEIGHT_ + 'px';

  this.map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: this.defaultCenter,
    zoom: this.DEFAULT_ZOOM_,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // Add DOM listeners to elements on page
  var that = this;
  google.maps.event.addListener(this.map, 'zoom_changed', function() {
    that.zoomChanged();
  });

  google.maps.event.addListener(this.map, 'center_changed', function() {
    that.centerChanged();
  });

  this.slider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    that.styleMap();
  });

  google.maps.event.addDomListener(document.getElementById('table-id'), 'blur',
      function() {
        that.fillSelectColumns();
      });

  google.maps.event.addDomListener(document.getElementById('add-layer'),
      'click', function() {
        that.addLayer();
      });

  google.maps.event.addDomListener(document.getElementById('edit-map'), 'click',
      function() {
        that.editMap();
      });

  google.maps.event.addDomListener(document.getElementById('all-features'),
      'click', function() {
        that.styleMapAll();
      });

  google.maps.event.addDomListener(document.getElementById('specs'), 'click',
      function() {
        that.specs();
      });

  var specs = document.getElementsByName('specs');
  for (var i = 0, spec; spec = specs[i]; i++) {
    google.maps.event.addDomListener(spec, 'click', function() {
      that.styleMap();
    });
  }

  google.maps.event.addDomListener(document.getElementById('add-feature'),
      'change', that.showDiv);

  google.maps.event.addDomListener(document.getElementById('second-table-id'),
      'blur', function() {
        that.fillSecondSelectColumns();
       });

  google.maps.event.addDomListener(document.getElementById('add-second-layer'),
      'click', function() {
        that.addSecondLayer();
      });

  google.maps.event.addDomListener(document.getElementById('reset-layer'),
      'click', function() {
        that.reset();
      });

  google.maps.event.addDomListener(document.getElementById('add-text-query'),
      'click', function() {
        that.addTextQuery();
      });

  google.maps.event.addDomListener(document.getElementById('reset-text-search'),
      'click', function() {
        that.reset();
      });

  google.maps.event.addDomListener(document.getElementById('add-select-query'),
      'click', function() {
        that.addSelectQuery();
      });

  google.maps.event.addDomListener(
      document.getElementById('reset-select-search'), 'click', function() {
        that.reset();
      });

  // Set the text area
  this.updateTextArea();
};

/**
 * Handle map zoom changed event.
 */
Builder.prototype.zoomChanged = function() {
  var zoom = this.map.getZoom();
  document.getElementById('map-zoom').value = zoom;
  this.currentZoom = zoom;
  this.updateTextArea();
};

/**
 * Handle map center changed event.
 */
Builder.prototype.centerChanged = function() {
  var center = this.map.getCenter();
  document.getElementById('map-center').value =
      center.lat() + ', ' + center.lng();
  this.currentCenter = center;
  this.updateTextArea();
};

/**
 * Fill the select columns in the form after user enters table id.
 */
Builder.prototype.fillSelectColumns = function() {
  var tableid = document.getElementById('table-id').value;
  var query = 'SELECT * FROM ' + tableid + ' LIMIT 1';
  var that = this;
  this.runQuery(query, 'locationColumnMenu', function(response) {
    that.locationColumnMenu(response);
  });
};

/**
 * Actually add the columns from the table to the select columns in the form.
 * @param {Object} response The jsonp response object.
 */
Builder.prototype.locationColumnMenu = function(response) {
  var locationColumnSelectMenu = document.getElementById('location-column');
  var textQuerySelectMenu = document.getElementById('text-query-column');
  var selectQuerySelectMenu = document.getElementById('select-query-column');

  // First remove the options from the menu
  this.removeChildren(locationColumnSelectMenu);
  this.removeChildren(textQuerySelectMenu);
  this.removeChildren(selectQuerySelectMenu);

  // The fill them in with the new values
  for (var key in response['table']['cols']) {
    var value = response['table']['cols'][key];

    var locationOption = document.createElement('option');
    locationOption.value = value;
    locationOption.innerHTML = value;
    locationColumnSelectMenu.appendChild(locationOption);

    var textOption = locationOption.cloneNode(true);
    textQuerySelectMenu.appendChild(textOption);

    var selectOption = locationOption.cloneNode(true);
    selectQuerySelectMenu.appendChild(selectOption);
  }

  locationColumnSelectMenu.disabled = false;
  textQuerySelectMenu.disabled = false;
  selectQuerySelectMenu.disabled = false;
};

/**
 * Initialize addition of the layer to the map.
 */
Builder.prototype.addLayer = function() {
  if (!this.checkLayerForm()) {
    return;
  }

  this.currentTableId = document.getElementById('table-id').value;
  this.currentLocationColumn =
      document.getElementById('location-column').value;
  this.currentFilter = document.getElementById('filter').value;

  this.addLayerToMap();
  this.updateTextArea();
};

/**
 * Add the first layer to the map.
 */
Builder.prototype.addLayerToMap = function() {
  if (this.layer) {
    this.layer.setMap(null);
  }

  if (this.currentFilter) {
    this.layer = new google.maps.FusionTablesLayer({
      query: {
        select: '\'' + this.currentLocationColumn + '\'',
        from: this.currentTableId,
        where: this.currentFilter
      }
    });
  } else {
    this.layer = new google.maps.FusionTablesLayer({
      query: {
        select: '\'' + this.currentLocationColumn + '\'',
        from: this.currentTableId
      }
    });
  }
  this.layer.setMap(this.map);
};


/**
 * Update map based on user-entered values.
 */
Builder.prototype.editMap = function() {
  // Get the new map values (or set defaults if text field left blank)
  var width = parseInt(document.getElementById('mapwidth').value, 10);
  this.currentWidth = width > 0 ? width : this.DEFAULT_WIDTH_;

  var height = parseInt(document.getElementById('mapheight').value, 10);
  this.currentHeight = height > 0 ? height : this.DEFAULT_HEIGHT_;

  var zoom = parseInt(document.getElementById('map-zoom').value, 10);
  this.currentZoom = zoom >= 0 ? zoom : this.DEFAULT_ZOOM_;

  this.currentSaturation = parseInt(this.slider.getValue(), 10);

  // Resize the map
  var mapDiv = document.getElementById('map-canvas');
  mapDiv.style.width = this.currentWidth + 'px';
  mapDiv.style.height = this.currentHeight + 'px';
  google.maps.event.trigger(this.map, 'resize');

  // Set the center of the map. Do this only if new value is different.
  var center = document.getElementById('map-center').value;
  var stringCenter =
    this.currentCenter.lat() + ', ' + this.currentCenter.lng();
  var that = this;
  if (center != stringCenter) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': center },
      function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          that.currentCenter = results[0].geometry.location;
          that.map.setCenter(that.currentCenter);
        } else {
          alert('Map Center failed to geocode, map center set to last value');
          that.map.setCenter(that.currentCenter);
        }
    });
  }
};

/**
 * Turn off or on all map features.
 */
Builder.prototype.styleMapAll = function() {
  var style = [];

  // Check or uncheck all items. If not show all, turn off visibility
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
 * Show / Hide form for turning specific map features on or off.
 */
Builder.prototype.specs = function() {
  var specifics = document.getElementById('specform');
  specifics.className = specifics.className == 'hide' ? '' : 'hide';
};

/**
 * Turn off or on some of the map features.
 */
Builder.prototype.styleMap = function() {
  var style = [];

  // Set the map style visibility to off for all unchecked elements
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
Builder.prototype.applyStyle = function(style) {
  // Set the saturation of all elements
  this.currentSaturation = this.slider.getValue();
  if (this.currentSaturation) {
    style.push({
      featureType: 'all',
      elementType: 'all',
      stylers: [
        { saturation: this.currentSaturation }
      ]
    });
  }

  var styledMapType = new google.maps.StyledMapType(style, {
    map: this.map,
    name: 'Styled Map'
  });

  this.map.mapTypes.set('map-style', styledMapType);
  this.map.setMapTypeId('map-style');

  this.updateTextArea();
};


/**
 * Show the correct form (second layer, text search, select search).
 */
Builder.prototype.showDiv = function() {
  var which = this.value;
  document.getElementById(which).style.display = 'block';
  if (this.lastDisplayed) {
    document.getElementById(this.lastDisplayed).style.display = 'none';
  }
  this.lastDisplayed = which;
};

/**
 * Run query to get the columns in the table to populate the menus.
 */
Builder.prototype.fillSecondSelectColumns = function() {
  var secondTableId = document.getElementById('second-table-id').value;
  var query = 'SELECT * FROM ' + secondTableId + ' LIMIT 1';
  var that = this;
  this.runQuery(query, 'secondLocationColumnMenu',
      function(response) { that.secondLocationColumnMenu(response); });
};

/**
 * Add columns from the table to the drop-down menus on the form.
 * @param {Object} response The jsonp response object.
 */
Builder.prototype.secondLocationColumnMenu = function(response) {
  var selectMenu = document.getElementById('second-location-column');

  // First remove the items from the menu
  this.removeChildren(selectMenu);

  // Then add the new ones in
  for (var key in response['table']['cols']) {
    var value = response['table']['cols'][key];
    var option = document.createElement('option');
    option.value = value;
    option.innerHTML = value;
    selectMenu.appendChild(option);
  }
  selectMenu.disabled = false;
};

/**
 * Initialize addition of the second layer to the map.
 */
Builder.prototype.addSecondLayer = function() {
  if (!this.checkSecondLayerForm()) {
    return;
  }

  if (!this.secondLayerAdded) {
    this.currentSecondTableId =
        document.getElementById('second-table-id').value;
    this.currentSecondLocationColumn =
        document.getElementById('second-location-column').value;
    this.currentSecondFilter =
        document.getElementById('second-filter').value;

    this.addSecondLayerToMap();
    this.updateTextArea();
    this.secondLayerAdded = true;
    this.switchSelectMenu();
  }
};

/**
 * Add second layer to the map.
 */
Builder.prototype.addSecondLayerToMap = function() {
  if (this.secondLayer) {
    this.secondLayer.setMap(null);
  }

  var tableid = parseInt(this.currentSecondTableId, 10);
  if (this.currentSecondFilter) {
    this.secondLayer = new google.maps.FusionTablesLayer({
      query: {
        select: '\'' + this.currentSecondLocationColumn + '\'',
        from: tableid,
        where: this.currentSecondFilter
      }
    });
  } else {
    this.secondLayer = new google.maps.FusionTablesLayer({
      query: {
        select: '\'' + this.currentSecondLocationColumn + '\'',
        from: tableid
      }
    });
  }
  this.secondLayer.setMap(this.map);
};

/**
 * Initialize addition of the text search under the map.
 */
Builder.prototype.addTextQuery = function() {
  if (!this.checkTextForm()) {
    return;
  }

  if (!this.textQueryAdded) {
    // Set text query values
    this.currentTextQueryLabel =
        document.getElementById('text-query-label').value;
    this.currentTextQueryColumn =
        document.getElementById('text-query-column').value;

    this.addTextQueryUnderMap();
    this.updateTextArea();
    this.textQueryAdded = true;
    this.switchSelectMenu();
  }
};

/**
 * Update DOM to add text-based search under map.
 */
Builder.prototype.addTextQueryUnderMap = function() {
  var mapDiv = document.getElementById('map-section');
  var div = document.createElement('div');
  div.setAttribute('id', 'text-search-div');
  div.style.marginTop = '10px';

  var label = document.createElement('label');
  label.innerHTML = this.currentTextQueryLabel + '&nbsp;';

  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('id', 'text-search');

  var button = document.createElement('input');
  button.setAttribute('type', 'button');
  button.setAttribute('value', 'Search');
  var that = this;
  google.maps.event.addDomListener(button, 'click', function() {
    that.textQueryChangeMap(this);
  });

  div.appendChild(label);
  div.appendChild(input);
  div.appendChild(button);
  mapDiv.appendChild(div);
};

/**
 * Change the map based on text query.
 */
Builder.prototype.textQueryChangeMap = function() {
  var searchString =
    document.getElementById('text-search').value.replace("'", "\\'");
  if (this.currentFilter) {
    this.layer.setOptions({
      query: {
        select: '\'' + this.currentLocationColumn + '\'',
        from: this.currentTableId,
        where: this.currentFilter + 
            ' AND \'' + this.currentTextQueryColumn +
            '\' CONTAINS IGNORING CASE \'' + searchString + '\''
      }
    });
  } else {
    this.layer.setOptions({
      query: {
        select: '\'' + this.currentLocationColumn + '\'',
        from: this.currentTableId,
        where: '\'' + this.currentTextQueryColumn +
            '\' CONTAINS IGNORING CASE \'' + searchString + '\''
      }
    });
  }
};

/**
 * Initialize addition of the select menu under the map.
 */
Builder.prototype.addSelectQuery = function() {
  if (!this.checkSelectForm()) {
    return;
  }

  if (!this.selectQueryAdded) {
    this.currentSelectQueryLabel =
        document.getElementById('select-query-label').value;
    this.currentSelectQueryColumn =
        document.getElementById('select-query-column').value;

    this.addSelectQueryUnderMap();
    this.selectQueryAdded = true;
    this.switchSelectMenu();
  }
};

/**
 * Update the DOM to add select menu under map.
 */
Builder.prototype.addSelectQueryUnderMap = function() {
  var mapDiv = document.getElementById('map-section');
  var div = document.createElement('div');
  div.setAttribute('id', 'select-search-div');
  div.style.marginTop = '10px';

  var label = document.createElement('label');
  label.innerHTML = this.currentSelectQueryLabel + '&nbsp;';

  var select = document.createElement('select');
  select.setAttribute('id', 'select-search');
  select.setAttribute('disabled', 'true');

  var that = this;
  google.maps.event.addDomListener(select, 'change', function() {
    that.selectQueryChangeMap(this);
  });

  var option = document.createElement('option');
  option.setAttribute('value', '');
  option.innerHTML = '--Select--';
  select.appendChild(option);

  div.appendChild(label);
  div.appendChild(select);
  mapDiv.appendChild(div);

  var selectQueryColumn = document.getElementById('select-query-column').value;
  if (this.currentFilter) {
    var query = 'SELECT \'' + selectQueryColumn +
        '\',COUNT() FROM ' + this.currentTableId +
        ' WHERE ' + this.currentFilter +
        ' GROUP BY \'' + selectQueryColumn + '\'';
  } else {
    query = 'SELECT \'' + selectQueryColumn +
        '\',COUNT() FROM ' + this.currentTableId +
        ' GROUP BY \'' + selectQueryColumn + '\'';
  }

  this.runQuery(query, 'fillMapSelectMenu',
      function(response) { that.fillMapSelectMenu(response); });
};

/**
 * Run a jsonp query to Fusion Tables.
 * @param {string} query A Fusion Table query.
 * @param {string} callbackName Callback function name.
 * @param {Function} callback Callback function.
 */
Builder.prototype.runQuery = function(query, callbackName, callback) {
  query = escape(query);
  var script = document.createElement('script');
  script.setAttribute('src',
      'https://www.google.com/fusiontables/api/query?sql=' + query +
      '&jsonCallback=' + callbackName);
  window[callbackName] = callback;
  document.body.appendChild(script);
};

/**
 * Fill in the select menu with data from the table.
 * The string select menu for the text area is also generated.
 * @param {Object} response The jsonp response object.
 */
Builder.prototype.fillMapSelectMenu = function(response) {
  var selectMenu = document.getElementById('select-search');
  var selectOptions = [];
  selectOptions.push('  <select id="search-string" ');
  selectOptions.push('onchange="changeMap(this.value);">\n');
  selectOptions.push('    <option value="">--Select--</option>\n');
  for (var i = 0; i < response['table']['rows'].length; i++) {
    var rowValue = response['table']['rows'][i][0];
    var option = document.createElement('option');
    option.value = rowValue;
    option.innerHTML = rowValue;
    selectMenu.appendChild(option);
    selectOptions.push('    <option value="');
    selectOptions.push(rowValue);
    selectOptions.push('">');
    selectOptions.push(rowValue);
    selectOptions.push('</option>\n');
  }
  selectMenu.disabled = false;
  selectOptions.push('  </select>\n');
  this.selectOptions = selectOptions.join('');
  this.updateTextArea();
};

/**
 * Change the map based on select menu.
 */
Builder.prototype.selectQueryChangeMap = function() {
  var searchString =
    document.getElementById('select-search').value.replace("'", "\\'");

  if (this.currentFilter) {
    if (!searchString) {
      this.layer.setOptions({
        query: {
          select: '\'' + this.currentLocationColumn + '\'',
          from: this.currentTableId,
          where: this.currentFilter
        }
      });
      return;
    }
    this.layer.setOptions({
      query: {
        select: '\'' + this.currentLocationColumn + '\'',
        from: this.currentTableId,
        where: this.currentFilter + ' AND \'' + this.currentSelectQueryColumn +
            '\' = \'' + searchString + '\''
      }
    });
  } else {
    if (!searchString) {
      this.layer.setOptions({
        query: {
          select: '\'' + this.currentLocationColumn + '\'',
          from: this.currentTableId
        }
      });
      return;
    }
    this.layer.setOptions({
      query: {
        select: '\'' + this.currentLocationColumn + '\'',
        from: this.currentTableId,
        where: '\'' + this.currentSelectQueryColumn +
            '\' = \'' + searchString + '\''
      }
    });
  }
};

/**
 * Remove any extra feature that was added.
 */
Builder.prototype.reset = function() {
  if (this.secondLayerAdded) {
    this.removeSecondLayer();
    this.switchSelectMenu();

  } else if (this.textQueryAdded) {
    this.removeTextQuery();
    this.switchSelectMenu();

  } else if (this.selectQueryAdded) {
    this.removeSelectQuery();
    this.switchSelectMenu();
  }

  this.updateTextArea();
};

/**
 * If select menu on, turn off. If off, turn on.
 */
Builder.prototype.switchSelectMenu = function() {
  var addFeatureMenu = document.getElementById('add-feature');
  addFeatureMenu.disabled = addFeatureMenu.disabled ? false : true;
};

/**
 * Remove the layer from the map and reset the form.
 */
Builder.prototype.removeSecondLayer = function() {
  this.currentSecondTableId = null;
  this.currentSecondLocationColumn = null;
  this.currentSecondFilter = null;
  if (this.secondLayer) {
    this.secondLayer.setMap(null);
  }
  var secondLocationColumn = document.getElementById('second-location-column');
  // Remove values from select menu
  this.removeChildren(secondLocationColumn);
  // Disable select menu
  secondLocationColumn.disabled = true;
  this.secondLayerAdded = false;
};

/**
 * Remove the text query.
 */
Builder.prototype.removeTextQuery = function() {
  this.currentTextQueryLabel = null;
  this.currentTextQueryColumn = null;
  this.removeQueryElement('text-search-div');
  this.layer.setOptions({
    query: {
      select: '\'' + this.currentLocationColumn + '\'',
      from: this.currentTableId
    }
  });
  this.textQueryAdded = false;
};

/**
 * Remove the select query.
 */
Builder.prototype.removeSelectQuery = function() {
  this.currentSelectQueryLabel = null;
  this.currentSelectQueryColumn = null;
  this.removeQueryElement('select-search-div');
  this.layer.setOptions({
    query: {
      select: '\'' + this.currentLocationColumn + '\'',
      from: this.currentTableId
    }
  });
  this.selectQueryAdded = false;
};

/**
 * Update DOM.
 * @param {string} elementId The id of the element to remove.
 */
Builder.prototype.removeQueryElement = function(elementId) {
  var searchDiv = document.getElementById(elementId);
  if (searchDiv.hasChildNodes()) {
    while (searchDiv.childNodes.length > 0) {
      searchDiv.removeChild(searchDiv.lastChild);
    }
  }
  searchDiv.parentNode.removeChild(searchDiv);
};

/**
 * Remove child nodes from a menu.
 * @param {Element} menu A select menu HTML element.
 */
Builder.prototype.removeChildren = function(menu) {
  if (menu.hasChildNodes()) {
    while (menu.childNodes.length > 2) {
      menu.removeChild(menu.lastChild);
    }
  }
};

/**
 * Add the HTML code to the text area.
 */
Builder.prototype.updateTextArea = function() {
  var textArea = [];
  textArea.push('<!DOCTYPE html>\n');
  textArea.push('<html>\n');
  textArea.push('<head>\n');
  textArea.push('<style>\n');
  textArea.push('  #map_canvas { width: ');
  textArea.push(this.currentWidth);
  textArea.push('px;');
  textArea.push('height: ');
  textArea.push(this.currentHeight);
  textArea.push('px; }\n');
  textArea.push('</style>\n\n');

  textArea.push('<script type="text/javascript"');
  textArea.push('src="http://maps.google.com/maps/api/js?sensor=false">');
  textArea.push('</script>\n');
  textArea.push('<script type="text/javascript">\n');
  textArea.push('var map;\n\n');

  if (this.currentTableId) {
    textArea.push('var layer;\n');
    textArea.push('var tableid = ');
    textArea.push(this.currentTableId);
    textArea.push(';\n\n');
  }

  if (this.currentSecondTableId) {
    textArea.push('var layer2;\n');
    textArea.push('var tableid2 = ');
    textArea.push(this.currentSecondTableId);
    textArea.push(';\n\n');
  }

  textArea.push('function initialize() {\n');
  textArea.push('  map = new google.maps.Map(');
  textArea.push('document.getElementById(\'map_canvas\'), {\n');
  textArea.push('    center: new google.maps.LatLng(');
  textArea.push(this.currentCenter.lat());
  textArea.push(', ');
  textArea.push(this.currentCenter.lng());
  textArea.push('),\n');
  textArea.push('    zoom: ');
  textArea.push(this.currentZoom);
  textArea.push(',\n');
  textArea.push('    mapTypeId: google.maps.MapTypeId.ROADMAP\n');
  textArea.push('  });\n');

  // Is there a feature that has been checked? Show style if so
  var oneChecked = false;
  var specs = document.getElementsByName('specs');
  for (var i = 0, spec; spec = specs[i]; i++) {
    if (!spec.checked) {
      oneChecked = true;
      break;
    }
  }

  if (this.currentSaturation != 0 || oneChecked) {
    textArea.push('\n  var style = [\n');

    var oneabove = false;
    if (this.currentSaturation != 0) {
      textArea.push('    {\n');
      textArea.push('      featureType: \'all\',\n');
      textArea.push('      elementType: \'all\',\n');
      textArea.push('      stylers: [\n');
      textArea.push('        { saturation: ');
      textArea.push(this.currentSaturation);
      textArea.push(' }\n');
      textArea.push('      ]\n');
      textArea.push('    }');
      oneabove = true;
    }

    var specs = document.getElementsByName('specs');
  for (var i = 0, spec; spec = specs[i]; i++) {
      if (!spec.checked) {
        if (oneabove) textArea.push(',\n');
        textArea.push('    {\n');
        textArea.push('      featureType: \'');
        textArea.push(specs[i].id);
        textArea.push('\',\n');
        textArea.push('      elementType: \'all\',\n');
        textArea.push('      stylers: [\n');
        textArea.push('        { visibility: \'off\' }\n');
        textArea.push('      ]\n');
        textArea.push('    }');
        oneabove = true;
      }
    }
    textArea.push('\n  ];\n\n');

    textArea.push('  var styledMapType');
    textArea.push(' = new google.maps.StyledMapType(style, {\n');
    textArea.push('    map: map,\n');
    textArea.push('    name: \'Styled Map\'\n');
    textArea.push('  });\n\n');

    textArea.push('  map.mapTypes.set(\'map-style\', styledMapType);\n');
    textArea.push('  map.setMapTypeId(\'map-style\');\n');
  }

  if (this.currentTableId) {
    textArea.push('\n  layer = new google.maps.FusionTablesLayer(tableid);\n');
    if (this.currentFilter) {
      textArea.push('  layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid + "');
      textArea.push(' WHERE ');
      textArea.push(this.currentFilter);
      textArea.push('");\n');
    } else {
      textArea.push('  layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid);\n');
    }
    textArea.push('  layer.setMap(map);\n');
  }

  if (this.currentSecondTableId) {
    textArea.push('\n');
    textArea.push('  layer2 = new google.maps.FusionTablesLayer(tableid2);\n');
    if (this.currentSecondFilter) {
      textArea.push('  layer2.setQuery("SELECT \'');
      textArea.push(this.currentSecondLocationColumn);
      textArea.push('\' FROM " + tableid2 + "');
      textArea.push(' WHERE ');
      textArea.push(this.currentSecondFilter);
      textArea.push('");\n');
    } else {
      textArea.push('  layer2.setQuery("SELECT \'');
      textArea.push(this.currentSecondLocationColumn);
      textArea.push('\' FROM " + tableid2);\n');
    }
    textArea.push('  layer2.setMap(map);\n');
  }

  textArea.push('}\n');

  if (this.currentTextQueryLabel) {
    textArea.push('\n');
    textArea.push('function changeMap() {\n');
    textArea.push('  var searchString');
    textArea.push(' = document.getElementById(\'search-string\').');
    textArea.push('value.replace("\'", "\\\\\'");\n');
    if (this.currentFilter) {
      textArea.push('  layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid + "');
      textArea.push(' WHERE \'');
      textArea.push(this.currentTextQueryColumn);
      textArea.push('\' CONTAINS IGNORING CASE \'" + searchString + "\'');
      textArea.push(' AND ');
      textArea.push(this.currentFilter);
      textArea.push('");\n');
    } else {
      textArea.push('  layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid + ');
      textArea.push(' WHERE \'');
      textArea.push(this.currentTextQueryColumn);
      textArea.push('\' CONTAINS IGNORING CASE \'" + searchString + "\'");\n');
    }
    textArea.push('}\n');
  }

  if (this.currentSelectQueryLabel) {
    textArea.push('\n');
    textArea.push('function changeMap() {\n');
    textArea.push('  var searchString');
    textArea.push(' = document.getElementById(\'search-string\')');
    textArea.push('.value.replace("\'", "\\\\\'");\n');
    if (this.currentFilter) {
      textArea.push('  if (!searchString) {\n');
      textArea.push('    layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid + "');
      textArea.push(' WHERE ');
      textArea.push(this.currentFilter);
      textArea.push('");\n');
      textArea.push('    return;\n');
      textArea.push('  }\n');
      textArea.push('  layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid + "');
      textArea.push(' WHERE \'');
      textArea.push(this.currentSelectQueryColumn);
      textArea.push('\' = \'" + searchString + "\'');
      textArea.push(' AND ' + this.currentFilter + '");\n');
    } else {
      textArea.push('  if(!searchString) {\n');
      textArea.push('    layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid);\n');
      textArea.push('    return;\n');
      textArea.push('  }\n');
      textArea.push('  layer.setQuery("SELECT \'');
      textArea.push(this.currentLocationColumn);
      textArea.push('\' FROM " + tableid + "');
      textArea.push(' WHERE \'');
      textArea.push(this.currentSelectQueryColumn);
      textArea.push('\' = \'" + searchString + "\'");\n');
    }
    textArea.push('}\n');
  }

  textArea.push('</script>\n\n');

  textArea.push('</head>\n');
  textArea.push('<body onload="initialize();">\n\n');

  textArea.push('<div id="map_canvas"></div>\n\n');

  if (this.currentTextQueryLabel) {
    textArea.push('<div style="margin-top: 10px;">\n');
    textArea.push('  <label>');
    textArea.push(this.currentTextQueryLabel);
    textArea.push(' </label>\n');
    textArea.push('  <input type="text" id="search-string" />\n');
    textArea.push('  <input type="button" onclick="changeMap();"');
    textArea.push(' value="Search" />\n');
    textArea.push('</div>\n\n');
  }

  if (this.currentSelectQueryLabel) {
    textArea.push('<div style="margin-top: 10px;">\n');
    textArea.push('  <label>');
    textArea.push(this.currentSelectQueryLabel);
    textArea.push(' </label>\n');
    textArea.push(this.selectOptions);
    textArea.push('</div>\n\n');
  }

  textArea.push('</body>\n');
  textArea.push('</html>');

  document.getElementById('html-code').value = textArea.join('');
};


/**
 * Check the layer form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Builder.prototype.checkLayerForm = function() {
   if (!document.getElementById('table-id').value) {
     alert('Table ID required!');
     return false;
   }

   if (!document.getElementById('location-column').value) {
     alert('Location Column required!');
     return false;
   }

   return true;
};

/**
 * Check the second layer form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Builder.prototype.checkSecondLayerForm = function() {
  if (!this.checkLayerForm()) {
    return false;
  }

  if (!document.getElementById('second-table-id').value) {
   alert('Table ID required!');
   return false;
  }

  if (!document.getElementById('second-location-column').value) {
   alert('Location Column required!');
   return false;
  }

  return true;
};

/**
 * Check the text form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Builder.prototype.checkTextForm = function() {
  if (!this.checkLayerForm()) {
    return false;
  }

  if (!document.getElementById('text-query-label').value) {
   alert('Label required!');
   return false;
  }

  if (!document.getElementById('text-query-column').value) {
   alert('Query Column required!');
   return false;
  }

  return true;
};

/**
 * Check the select menu form to make sure there are no blanks.
 * @return {boolean} True if form passed check, false if not.
 */
Builder.prototype.checkSelectForm = function() {
  if (!this.checkLayerForm()) {
    return false;
  }

  if (!document.getElementById('select-query-label').value) {
   alert('Label required!');
   return false;
  }

  if (!document.getElementById('select-query-column').value) {
   alert('Query Column required!');
   return false;
  }

  return true;
};
