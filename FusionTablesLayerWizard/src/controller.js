/**
 * @fileoverview DOM Controls.
 *
 * Controls the DOM interactions.
 */

 goog.provide('Builder.controller');


/**
 * Controller constructor.
 * @constructor
 * @param {Builder.Html} html The Html object for the generated code text area.
 * @param {google.maps.Map} map The the generated code text area.
 */
var Controller = function(html, map) {
  this.map = map;
  this.html = html;
  this.initialize();
};

/**
 * The number of layer forms that have been added to the DOM.
 * @type {number}
 * @private
 */
Controller.prototype.numLayerForms_ = 0;

/**
 * The maximum number of layer forms that can be added.
 * @const
 * @type {number}
 * @private
 */
Controller.prototype.MAX_LAYER_FORMS_ = 5;

/**
 * Initializes the form values and DOM event listeners.
 */
Controller.prototype.initialize = function() {
  var that = this;

  gapi.client.load('fusiontables', 'v1', function() {
    gapi.client.setApiKey('AIzaSyAm9yWCV7JPCTHCJut8whOjARd7pwROFDQ');
  });

  var layerId = this.constructLayerForm();
  this.layerFormListeners(layerId);

  // Initialize form inputs
  document.getElementById('map-width').value = this.map.DEFAULT_WIDTH_;
  document.getElementById('map-height').value = this.map.DEFAULT_HEIGHT_;
  document.getElementById('map-center-lat').value =
      this.map.defaultCenter_.lat();
  document.getElementById('map-center-lng').value =
      this.map.defaultCenter_.lng();
  document.getElementById('map-zoom').value = this.map.DEFAULT_ZOOM_;

  // Initialize slider
  var slider = new goog.ui.Slider();
  slider.decorate(document.getElementById('slider'));
  slider.setMinimum(-99);
  slider.setMaximum(99);
  slider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    that.map.saturation = slider.getValue();
    that.map.switchSelectedMapFeatures();
    that.html.updateHtml();
  });

  // Add Layer button click: adds layer to map, updates text HTML.
  google.maps.event.addDomListener(
      document.getElementById('add-layer'), 'click', function() {
        var layerId = that.constructLayerForm();
        that.layerFormListeners(layerId);
        this.style.display = 'None';
      });

  // Edit Map button click: Edit the map properties (width, height, zoom, etc).
  google.maps.event.addDomListener(document.getElementById('edit-map'), 'click',
      function() {
        that.map.editMap();
        that.html.updateHtml();
      });

  // All features checkbox click: Switch on/off all map features (roads, etc).
  google.maps.event.addDomListener(document.getElementById('all-features'),
      'click', function() {
        that.map.switchAllMapFeatures();
        that.html.updateHtml();
      });

  // Individual feature link click: Show/hide map features form.
  google.maps.event.addDomListener(document.getElementById('specs'), 'click',
      function() {
        var specifics = document.getElementById('specform');
        specifics.className = specifics.className == 'hide' ? '' : 'hide';
        that.html.updateHtml();
      });

  // Individual feature checkbox click: Switch on/off single feature on map.
  var specs = document.getElementsByName('specs');
  for (var i = 0, spec; spec = specs[i]; i++) {
    google.maps.event.addDomListener(spec, 'click', function() {
      that.map.switchSelectedMapFeatures();
      that.html.updateHtml();
    });
  }

  // Map zoom change: Update zoom text box.
  google.maps.event.addListener(this.map.map, 'zoom_changed',
      function() {
        var zoom = that.map.map.getZoom();
        document.getElementById('map-zoom').value = zoom;
        that.map.setZoom(zoom);
        that.html.updateHtml();
      });

  // Map center change: Update center text box.
  google.maps.event.addListener(this.map.map, 'center_changed',
      function() {
        var center = that.map.map.getCenter();
        document.getElementById('map-center-lat').value = center.lat();
        document.getElementById('map-center-lng').value = center.lng();
        that.map.setCenter(center);
        that.html.updateHtml();
      });

  // Map type changed: Update map type.
  google.maps.event.addListener(this.map.map, 'maptypeid_changed',
      function() {
        var mapTypeId = that.map.map.getMapTypeId();
        that.map.setMapTypeId(mapTypeId);
        that.html.updateHtml();
      });
};

/**
 * Update the DOM, adding a new layer form.
 * @return {string} The next layer ID.
 */
Controller.prototype.constructLayerForm = function() {
  var nextLayerId = this.map.layerIds[0];
  var layerForms = document.getElementById('layer-forms');

  var layerForm = document.createElement('div');
  layerForm.id = 'layer-form-' + nextLayerId;


  // Instructions: Embed link
  var embedLinkHeader = document.createElement('p');
  embedLinkHeader.innerHTML = 'Create layer from embed link';
  embedLinkHeader.id = 'zHeaderEmbedLink-' + nextLayerId;
  embedLinkHeader.className += 'zHeaderEmbedLink';
  layerForm.appendChild(embedLinkHeader);

  var zipContentEmbedLink = document.createElement('div');
  zipContentEmbedLink.id = 'zContentEmbedLink-' + nextLayerId;
  layerForm.appendChild(zipContentEmbedLink);

  // Publish URL
  var publishUrlLabel = this.createLabel('Embed link');
  var publishUrlInput = this.createTextInput('publish-url-' + nextLayerId);
  var publishUrlFormElement =
      this.createFormElement([publishUrlLabel, publishUrlInput]);
  zipContentEmbedLink.appendChild(publishUrlFormElement);
  var publishUrlNote = this.createNote('Copy this from Tools > Publish.');
  zipContentEmbedLink.appendChild(publishUrlNote);


  // Instructions: Old Fashioned Way
  var oldFashionedWayHeader = document.createElement('p');
  oldFashionedWayHeader.innerHTML = 'Or, do it the old-fashioned way';
  oldFashionedWayHeader.id = 'zHeaderOldFashionedWay-' + nextLayerId;
  oldFashionedWayHeader.className += 'zHeaderOldFashionedWay';
  layerForm.appendChild(oldFashionedWayHeader);

  var zipContentOldFashionedWay = document.createElement('div');
  zipContentOldFashionedWay.id = 'zContentOldFashionedWay-' + nextLayerId;
  layerForm.appendChild(zipContentOldFashionedWay);


  // Table Id
  var tableIdLabel = this.createLabel('Your table id');
  var tableIdInput = this.createTextInput('table-id-' + nextLayerId);
  var tableIdFormElement = this.createFormElement([tableIdLabel, tableIdInput]);
  zipContentOldFashionedWay.appendChild(tableIdFormElement);
  var tableIdNote = this.createNote(
      'Look in File > About to find the Table ID.');
  zipContentOldFashionedWay.appendChild(tableIdNote);

  // Location column
  var locationColumnLabel = this.createLabel('Location Column');
  var locationColumnOptions = [{ 'value': '', 'text': '--Select--' }];
  var locationColumnInput = this.createSelect(
      'location-column-' + nextLayerId, locationColumnOptions);
  locationColumnInput.disabled = true;
  var locationColumnFormElement = this.createFormElement(
      [locationColumnLabel, locationColumnInput]);
  zipContentOldFashionedWay.appendChild(locationColumnFormElement);

  // Style ID for New look
  var styleIdLabel = this.createLabel('Style ID');
  var styleIdInput = this.createTextInput('style-id-' + nextLayerId);
  var styleIdFormElement = this.createFormElement([styleIdLabel, styleIdInput]);
  zipContentOldFashionedWay.appendChild(styleIdFormElement);
  var styleIdNote = this.createNote(
      'Required with New look. Click Tools > Publish. ' +
      'Enter the number after "y=" at the end of either URL.');
  zipContentOldFashionedWay.appendChild(styleIdNote);


  // Template ID for New look
  var templateIdLabel = this.createLabel('Template ID');
  var templateIdInput = this.createTextInput('template-id-' + nextLayerId);
  var templateIdFormElement =
      this.createFormElement([templateIdLabel, templateIdInput]);
  zipContentOldFashionedWay.appendChild(templateIdFormElement);
  var templateIdNote = this.createNote(
      'Required with New look. Click Tools > Publish. ' +
      'Enter the number after "tmplt=" at the end of either URL.');
  zipContentOldFashionedWay.appendChild(templateIdNote);

  // Filter
  var filterLabel = this.createLabel('Filter (optional)');
  var filterInput = this.createTextInput('where-' + nextLayerId);
  var filterFormElement = this.createFormElement([filterLabel, filterInput]);
  zipContentOldFashionedWay.appendChild(filterFormElement);

  // Layer buttons
  var putLayerInput = this.createButton('put-layer-' + nextLayerId,
      'Put layer on Map');
  var removeLayerInput = this.createButton('reset-layer-' + nextLayerId,
      'Remove layer');
  removeLayerInput.style.display = 'None';
  var buttonsFormElement = this.createFormElement(
      [removeLayerInput, putLayerInput]);
  buttonsFormElement.className += ' text-right';
  layerForm.appendChild(buttonsFormElement);

  // Search feature
  var addSearchLabel = this.createLabel('Add a search feature');
  var searchColumnOptions = [
      { 'value': '', 'text': '--Select--' },
      { 'value': 'text-' + nextLayerId, 'text': 'Text-based search' },
      { 'value': 'select-' + nextLayerId, 'text': 'Select-based search' }];
  var addSearchInput = this.createSelect('add-feature-' + nextLayerId,
      searchColumnOptions);
  var addSearchFormElement = this.createFormElement(
      [addSearchLabel, addSearchInput]);
  layerForm.appendChild(addSearchFormElement);

  // Text search form
  var textSearchForm = document.createElement('div');
  textSearchForm.id = 'text-' + nextLayerId;
  textSearchForm.className = 'clear hide';

  // Text search label
  var textSearchLabel = this.createLabel('<b>Text</b> Label:');
  var textSearchInput = this.createTextInput(
      'text-query-label-' + nextLayerId);
  var textSearchFormElement = this.createFormElement(
      [textSearchLabel, textSearchInput]);
  textSearchForm.appendChild(textSearchFormElement);

  // Text search column
  var textSearchColumnLabel = this.createLabel('Column to query:');
  var textSearchColumnOptions = [{ 'value': '', 'text': '--Select--' }];
  var textSearchColumnInput = this.createSelect(
      'text-query-column-' + nextLayerId, textSearchColumnOptions);
  textSearchColumnInput.disabled = true;
  var textSearchColumnFormElement = this.createFormElement(
      [textSearchColumnLabel, textSearchColumnInput]);
  textSearchForm.appendChild(textSearchColumnFormElement);

  // Text search buttons
  var textSearchAddSearchInput = this.createButton(
      'add-text-query-' + nextLayerId, 'Add Search');
  var textSearchRemoveSearchInput = this.createButton(
      'reset-text-query-' + nextLayerId, 'Remove Search');
  textSearchRemoveSearchInput.style.display = 'None';
  var textSearchButtonsFormElement = this.createFormElement(
      [textSearchAddSearchInput, textSearchRemoveSearchInput]);
  textSearchButtonsFormElement.className += ' text-right';
  textSearchForm.appendChild(textSearchButtonsFormElement);
  layerForm.appendChild(textSearchForm);

  // Select search form
  var selectSearchForm = document.createElement('div');
  selectSearchForm.id = 'select-' + nextLayerId;
  selectSearchForm.className = 'clear hide';

  // Select search label
  var selectSearchLabel = this.createLabel('<b>Select</b> Label:');
  var selectSearchInput = this.createTextInput(
      'select-query-label-' + nextLayerId);
  var selectSearchFormElement = this.createFormElement(
      [selectSearchLabel, selectSearchInput]);
  selectSearchForm.appendChild(selectSearchFormElement);

  // Select search column
  var selectSearchColumnLabel = this.createLabel('Column to query:');
  var selectSearchColumnOptions = [{ 'value': '', 'text': '--Select--' }];
  var selectSearchColumnInput = this.createSelect(
      'select-query-column-' + nextLayerId, selectSearchColumnOptions);
  selectSearchColumnInput.disabled = true;
  var selectSearchFormElement = this.createFormElement(
      [selectSearchColumnLabel, selectSearchColumnInput]);
  selectSearchForm.appendChild(selectSearchFormElement);

  // Select search buttons
  var selectSearchAddSearchInput = this.createButton(
      'add-select-query-' + nextLayerId, 'Add Search');
  var selectSearchRemoveSearchInput = this.createButton(
      'reset-select-query-' + nextLayerId, 'Remove Search');
  selectSearchRemoveSearchInput.style.display = 'None';
  var selectSearchButtonsFormElement = this.createFormElement(
      [selectSearchAddSearchInput, selectSearchRemoveSearchInput]);
  selectSearchButtonsFormElement.className += ' text-right';
  selectSearchForm.appendChild(selectSearchButtonsFormElement);
  layerForm.appendChild(selectSearchForm);
  layerForms.appendChild(layerForm);

  // Zippy
  var zipEmbedLink = new goog.ui.AnimatedZippy(
      'zHeaderEmbedLink-' + nextLayerId,
      'zContentEmbedLink-' + nextLayerId, true);
  var zipOldFashionedWay = new goog.ui.AnimatedZippy(
      'zHeaderOldFashionedWay-' + nextLayerId,
      'zContentOldFashionedWay-' + nextLayerId, false);
  goog.events.listen(zipOldFashionedWay,
      goog.ui.Zippy.Events.TOGGLE,
      function(event) {
        zipEmbedLink.setExpanded(!event.expanded);
      }
  );

  this.numLayerForms_++;
  return nextLayerId;
};

/**
 * Create a Form Element.
 * @param {Object} elements The list of DOM elements to add.
 * @return {element} The new form element.
 */
Controller.prototype.createFormElement = function(elements) {
  var formElement = document.createElement('div');
  formElement.className = 'form-element';
  for (var i in elements) {
    formElement.appendChild(elements[i]);
  }
  return formElement;
};

/**
 * Create a label DOM element.
 * @param {string} innerHtml The text for the label.
 * @return {element} The new label element.
 */
Controller.prototype.createLabel = function(innerHtml) {
  var label = document.createElement('label');
  label.innerHTML = innerHtml;
  return label;
};

/**
 * Create a note DOM element.
 * @param {string} innerHtml The text for the label.
 * @return {element} The new note element.
 */
Controller.prototype.createNote = function(innerHtml) {
  var note = document.createElement('p');
  var noteContent = document.createTextNode(innerHtml);
  note.appendChild(noteContent);
  note.className = 'note';
  return note;
};

/**
 * Create a text input box.
 * @param {string} id The id of the text box.
 * @return {element} The new text element.
 */
Controller.prototype.createTextInput = function(id) {
  var textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.id = id;
  textInput.className = 'right';
  return textInput;
};

/**
 * Create a select menu.
 * @param {string} id The id of the select menu.
 * @param {Object} options List of options for the select menu.
 * @return {element} The new select element.
 */
Controller.prototype.createSelect = function(id, options) {
  var select = document.createElement('select');
  select.id = id;
  select.className = 'right';
  for (var iopt = 0; iopt < options.length; ++iopt) {
    var option = document.createElement('option');
    option.value = options[iopt].value;
    option.text = options[iopt].text;
    select.appendChild(option);
  }
  return select;
};

/**
 * Create a button.
 * @param {string} id The id of the button.
 * @param {string} value The value of the button.
 * @return {element} The new button.
 */
Controller.prototype.createButton = function(id, value) {
  var button = document.createElement('input');
  button.type = 'button';
  button.id = id;
  button.value = value;
  return button;
};

/**
 * Add listeners to layer form.
 * @param {string} nextLayerId The id of the next layer.
 */
Controller.prototype.layerFormListeners = function(nextLayerId) {
  var that = this;

  // On blur table id field: fill the select columns
  google.maps.event.addDomListener(
      document.getElementById('table-id-' + nextLayerId), 'blur', function() {
        var menus = [
            document.getElementById('location-column-' + nextLayerId),
            document.getElementById('text-query-column-' + nextLayerId),
            document.getElementById('select-query-column-' + nextLayerId)];
        that.fillSelectColumns(menus, this.value);
      });

  // Put Layer on map button click: adds layer to map, updates text HTML.
  google.maps.event.addDomListener(
      document.getElementById('put-layer-' + nextLayerId), 'click', function() {

  // Use iframe embed code or publish link if provided
  if (document.getElementById('publish-url-' + nextLayerId).value != '') {
    var embedLink = {};
    embedLink.url = Form.checkEmbedForm(nextLayerId);

    // Query parameter
    embedLink.query = embedLink.url.getParameterValue('q');

    // Query parameter: WHERE clause
    var wherePos = embedLink.query.indexOf('where');
    if (wherePos != -1) {
      var filter = embedLink.query.substring('where'.length + wherePos);
      embedLink.where = goog.string.urlDecode(filter);
    }

    // Query parameter: document ID
    var fromPos = embedLink.query.indexOf('from');
    if (fromPos == -1) {
      alert('Query has no "from" keyword: ' + embedLink.query);
      return;
    }
    var docIdStartPos = fromPos + 'from '.length;
    var docIdEndPos = embedLink.query.length;
    if (wherePos != -1) {
      docIdEndPos = wherePos - docIdStartPos;
    }
    embedLink.docId = embedLink.query.substring(docIdStartPos,
        docIdStartPos + docIdEndPos).trim();

    // Fill in old-fashioned form and trigger event to
    // populate select column menus for search feature forms
    document.getElementById('table-id-' + nextLayerId).value = embedLink.docId;
    google.maps.event.trigger(document.getElementById('table-id-' +
        nextLayerId), 'blur');
    // Location column parameter
    // TODO: add error checking for missing parameters
    embedLink.locationColumnId = embedLink.url.getParameterValue('l');

    // Optional parameters
    embedLink.lat = parseFloat(embedLink.url.getParameterValue('lat'));
    embedLink.lng = parseFloat(embedLink.url.getParameterValue('lng'));
    embedLink.styleId = embedLink.url.getParameterValue('y');
    embedLink.templateId = embedLink.url.getParameterValue('tmplt');
    embedLink.zoom = parseInt(embedLink.url.getParameterValue('z'), 10);

    var layerId =
        that.map.addLayer(embedLink.docId, embedLink.locationColumnId,
        embedLink.where, embedLink.styleId, embedLink.templateId);
    // capture existing map parameters
    document.getElementById('map-zoom').value = embedLink.zoom;
    document.getElementById('map-center-lat').value = embedLink.lat;
    document.getElementById('map-center-lng').value = embedLink.lng;
    if (embedLink.zoom >= 0) {
      that.map.setZoom(embedLink.zoom);
    }
    that.map.setCenter(new google.maps.LatLng(embedLink.lat, embedLink.lng));
    that.map.editMap();
    that.html.updateHtml();

    this.style.display = 'None';
    document.getElementById('reset-layer-' + nextLayerId).style.display =
        'inline';

    if (that.numLayerForms_ < that.MAX_LAYER_FORMS_) {
      document.getElementById('add-layer').style.display = 'inline';
    }
  } else if (Form.checkLayerForm(nextLayerId)) {
    // Use specific fields to construct layer, if no embed link
    var tableId = document.getElementById('table-id-' + nextLayerId).value;
    var locationColumn =
      document.getElementById('location-column-' + nextLayerId).value;
    var where = document.getElementById('where-' + nextLayerId).value;
    var styleId = document.getElementById('style-id-' + nextLayerId).value;
    var templateId =
        document.getElementById('template-id-' + nextLayerId).value;
    var layerId = that.map.addLayer(tableId, locationColumn, where,
        styleId, templateId);
    that.html.updateHtml();
    this.style.display = 'None';
    document.getElementById('reset-layer-' + nextLayerId).style.display =
        'inline';
    if (that.numLayerForms_ < that.MAX_LAYER_FORMS_) {
      document.getElementById('add-layer').style.display = 'inline';
    }
  }
  });

  // Remove layer button click: Remove layer.
  google.maps.event.addDomListener(
      document.getElementById('reset-layer-' + nextLayerId), 'click',
          function() {
            window.console.log('Removing layer:' + nextLayerId);
            if (that.map.layers[nextLayerId].search) {
              that.removeSearch(nextLayerId);
            }
            that.map.removeLayer(nextLayerId);
            that.removeLayerForm(nextLayerId);
            that.html.updateHtml();
          });

  // Add another feature select menu change: show appropriate form.
  google.maps.event.addDomListener(
      document.getElementById(
          'add-feature-' + nextLayerId),
          'change',
          function() {
            var show = this.value;
            document.getElementById(show).style.display = 'block';
            var hide = 'text-' + nextLayerId;
            if (show.search('text') != -1) {
              hide = 'select-' + nextLayerId;
            }
            document.getElementById(hide).style.display = 'none';
          });

  // Add text query button click: Add a text search under map.
  google.maps.event.addDomListener(
      document.getElementById('add-text-query-' + nextLayerId), 'click',
          function() {
            if (that.addSearch('text', nextLayerId)) {
              this.style.display = 'None';
              var id = 'reset-text-query-' + nextLayerId;
              document.getElementById(id).style.display = 'inline';
              that.html.updateHtml();
            }
          });

  // Remove text search button click: Remove text search from layer.
  google.maps.event.addDomListener(
      document.getElementById('reset-text-query-' + nextLayerId), 'click',
      function() {
        window.console.log('Removing text search: ' + nextLayerId);
        that.map.layers[nextLayerId].removeSearch();
        that.removeSearch(nextLayerId);
        that.html.updateHtml();
        this.style.display = 'None';
        document.getElementById(
             'add-text-query-' + nextLayerId).style.display = 'inline';
        document.getElementById('add-feature-' + nextLayerId).disabled = false;
      });

  // Add select query button click: Add a select search under map.
  google.maps.event.addDomListener(
      document.getElementById('add-select-query-' + nextLayerId), 'click',
      function() {
        that.addSearch('select', nextLayerId);
        this.style.display = 'None';
        document.getElementById(
            'reset-select-query-' + nextLayerId).style.display = 'inline';
      });

  // Remove select search button click: Remove select search and layer query.
  google.maps.event.addDomListener(
      document.getElementById('reset-select-query-' + nextLayerId), 'click',
      function() {
        that.map.layers[nextLayerId].removeSearch();
        that.removeSearch(nextLayerId);
        that.html.updateHtml();
        this.style.display = 'None';
        document.getElementById(
            'add-select-query-' + nextLayerId).style.display = 'inline';
        document.getElementById('add-feature-' + nextLayerId).disabled = false;
      });
};

/**
 * Fill the select columns in the select menu(s) after user enters table id.
 * @param {Object} menus A list of menus to update.
 * @param {string} tableId The id of the table.
 */
Controller.prototype.fillSelectColumns = function(menus, tableId) {
  var that = this;

  var request = gapi.client.fusiontables.table.get({'tableId': tableId});
  request.execute(function(response) {
    if (response.error) {
      alert('Unable to get table columns: ' + response.error.message +
          ' (' + response.error.code + ')');
      return;
    }

    // First remove the current options from and enable each menu.
    for (var imenu in menus) {
      if (menus[imenu].hasChildNodes()) {
        while (menus[imenu].childNodes.length > 2) {
          menus[imenu].removeChild(menus[imenu].lastChild);
        }
      }
      menus[imenu].disabled = false;
    }

    // Then fill the menus in with the new values
    for (var icol = 0; icol < response.columns.length; icol++) {
      var column = response.columns[icol];
      var columnName = column.name;
      var locationOption = document.createElement('option');
      locationOption.value = columnName;
      locationOption.text = columnName;
      menus[0].appendChild(locationOption);
      for (var imenu = 1; imenu < menus.length; imenu++) {
        var option = locationOption.cloneNode(true);
        menus[imenu].appendChild(option);
      }
    }
  });
};

/**
 * Initialize addition of the search under the map.
 * @param {string} type The type of query, either text or select.
 * @param {number} layerId The layer id.
 * @return {boolean} True if the search elements could be added.
 */
Controller.prototype.addSearch = function(type, layerId) {
  var layer = this.map.layers[layerId];
  var labelElement = document.getElementById(type + '-query-label-' + layerId);
  var column = document.getElementById(type + '-query-column-' + layerId).value;

  var addSearchDom = function(checkForm, addSearch, eventType, menuElement) {
    if (checkForm(layerId)) {
      layer.addSearch(type, labelElement.value, column);
      var domElement = addSearch(labelElement.value, column, layerId);
      google.maps.event.addDomListener(domElement, eventType, function() {
        var value = document.getElementById(menuElement).value;
        layer.query(value);
      });
      return true;
    }
    return false;
  };

  if (type == 'text') {
    if (!addSearchDom(Form.checkTextForm, this.addTextSearch, 'click',
        'text-search-' + layerId)) {
      return false;
    }
  } else if (type == 'select') {
    if (!addSearchDom(Form.checkSelectForm, this.addSelectSearch, 'change',
        'select-search-' + layerId)) {
      return false;
    }

    // Get the select menu options.
    var query = [];
    query.push("SELECT '");
    query.push(column);
    query.push("',COUNT() FROM ");
    query.push(layer.tableId);
    if (layer.where) {
      query.push(' WHERE ');
      query.push(layer.where);
    }
    query.push(" GROUP BY '");
    query.push(column);
    query.push("'");

    var that = this;
    var request = gapi.client.fusiontables.query.sqlGet(
        {'sql': query.join('')});
    request.execute(function(response) {
      if (response.error) {
        alert('Unable to run query: ' + response.error.message +
              ' (' + response.error.code + ')');
        return;
      }
      layer.search.options = that.selectMenuOptions(response, layerId);
      // Need to run this here, since the call is async
      that.html.updateHtml();
    });
  }
  var addFeatureMenu = document.getElementById('add-feature-' + layerId);
  addFeatureMenu.disabled = addFeatureMenu.disabled ? false : true;
  return true;
};

/**
 * Update DOM to add text-based search under map.
 * @param {string} label The string label to display.
 * @param {string} column The column to be queried.
 * @param {string} layerId The id of the layer.
 * @return {Object} The button of the search.
 */
Controller.prototype.addTextSearch = function(label, column, layerId) {
  var mapDiv = document.getElementById('search');
  var div = document.createElement('div');
  div.setAttribute('id', 'search-' + layerId);
  div.style.marginTop = '10px';

  var searchLabel = document.createElement('label');
  searchLabel.innerHTML = label + '&nbsp;';

  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('id', 'text-search-' + layerId);

  var button = document.createElement('input');
  button.setAttribute('type', 'button');
  button.setAttribute('value', 'Search');
  div.appendChild(searchLabel);
  div.appendChild(input);
  div.appendChild(button);
  mapDiv.appendChild(div);

  return button;
};

/**
 * Update the DOM to add select menu under map.
 * @param {string} label The string label to display.
 * @param {string} column The column to be queried.
 * @param {string} layerId The id of the layer.
 * @return {Object} The select menu of the search.
 */
Controller.prototype.addSelectSearch = function(label, column, layerId) {
  var mapDiv = document.getElementById('search');
  var div = document.createElement('div');
  div.setAttribute('id', 'search-' + layerId);
  div.style.marginTop = '10px';

  var searchLabel = document.createElement('label');
  searchLabel.innerHTML = label + '&nbsp;';

  var select = document.createElement('select');
  select.setAttribute('id', 'select-search-' + layerId);
  select.setAttribute('disabled', 'true');

  var option = document.createElement('option');
  option.setAttribute('value', '--Select--');
  option.text = '--Select--';
  select.appendChild(option);

  div.appendChild(searchLabel);
  div.appendChild(select);
  mapDiv.appendChild(div);

  return select;
};


/**
 * Fill in the select menu with data from the table. The search options array
 * is also updated with this data.
 * @param {Object} response The jsonp response object.
 * @param {string} layerId The id of the layer.
 * @return {Object} The search options array.
 */
Controller.prototype.selectMenuOptions = function(response, layerId) {
  var selectMenu = document.getElementById('select-search-' + layerId);
  var searchOptions = [];
  for (var irow = 0; irow < response.rows.length; irow++) {
    var rowValue = response.rows[irow][0];
    var option = document.createElement('option');
    option.value = rowValue;
    option.text = rowValue ? rowValue : '(no value)';
    selectMenu.appendChild(option);
    searchOptions.push(rowValue);
  }
  selectMenu.disabled = false;
  return searchOptions;
};

/**
 * Remove the search elements from under the map.
 * @param {string} layerId The id of the layer.
 */
Controller.prototype.removeSearch = function(layerId) {
  var searchElement = document.getElementById('search-' + layerId);
  if (searchElement.hasChildNodes()) {
    while (searchElement.childNodes.length > 0) {
      searchElement.removeChild(searchElement.lastChild);
    }
  }
  document.getElementById('search').removeChild(searchElement);
};

/**
 * Remove the layer form.
 * @param {string} layerId The id of the layer.
 */
Controller.prototype.removeLayerForm = function(layerId) {
  var layerForm = document.getElementById('layer-form-' + layerId);
  if (layerForm.hasChildNodes()) {
    while (layerForm.childNodes.length > 0) {
      layerForm.removeChild(layerForm.lastChild);
    }
  }
  document.getElementById('layer-forms').removeChild(layerForm);
  this.numLayerForms_--;
};
