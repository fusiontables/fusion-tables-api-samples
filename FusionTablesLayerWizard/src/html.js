/**
 * @fileoverview Code for Html constructor.
 *
 * Constructs the HTML for the text area.
 *
 */

goog.provide('Builder.html');

/**
 * Html constructor.
 * @constructor
 * @param {google.maps.Map} map The map object.
 */
var Html = function(map) {
  this.initialize(map);
};

/**
 * Newline character.
 * @const
 * @type {string}
 * @private
 */
Html.prototype.NEW_LINE_ = '\r\n';

/**
 * 2 spaces for indent.
 * @const
 * @type {string}
 * @private
 */
Html.prototype.INDENT_ = '  ';


/**
 * Initializes the Html object.
 * @param {google.maps.Map} map The map object.
 */
Html.prototype.initialize = function(map) {
  this.map = map;
};

/**
 * Add the HTML code to the text area.
 */
Html.prototype.updateHtml = function() {
  var textArea = [];
  textArea.push('<!DOCTYPE html>');
  textArea.push(this.newLineIndent(0));
  textArea.push('<html>');
  textArea.push(this.newLineIndent(1));
  textArea.push('<head>');
  textArea = textArea.concat(this.head());
  textArea.push(this.newLineIndent(1));
  textArea.push('</head>');

  textArea.push(this.newLineIndent(1));
  textArea.push('<body>');
  textArea = textArea.concat(this.body());
  textArea.push(this.newLineIndent(1));
  textArea.push('</body>');
  textArea.push(this.newLineIndent(0));
  textArea.push('</html>');
  textArea.push(this.newLineIndent(0));
  document.getElementById('html-code').value = textArea.join('');
};

/**
 * Construct the head HTML code.
 * @return {Array.<string>} The array of strings with the header.
 */
Html.prototype.head = function() {
  var textArea = [];
  textArea = textArea.concat(this.style());
  textArea = textArea.concat(this.script());
  return textArea;
};

/**
 * Construct the style CSS code.
 * @return {Array.<string>} The array of strings with the CSS.
 */
Html.prototype.style = function() {
  var textArea = [];
  textArea.push(this.newLineIndent(1));
  textArea.push('<style>');
  textArea.push(this.newLineIndent(2));
  textArea.push('#map-canvas { width:');
  textArea.push(this.map.width);
  textArea.push('px; height:');
  textArea.push(this.map.height);
  textArea.push('px; }');
  textArea.push(this.newLineIndent(2));
  textArea.push('.layer-wizard-search-label { font-family: sans-serif };');
  textArea.push(this.newLineIndent(1));
  textArea.push('</style>');
  return textArea;
};

/**
 * Construct the script include HTML code.
 * @return {Array.<string>} The array of strings with script tags.
 */
Html.prototype.scriptIncludes = function() {
  var textArea = [];
  textArea.push(this.newLineIndent(1));
  textArea.push('<script type="text/javascript"');
  textArea.push(this.newLineIndent(2));
  textArea.push('src="http://maps.google.com/maps/api/js?sensor=false">');
  textArea.push(this.newLineIndent(1));
  textArea.push('</script>');
  return textArea;
};

/**
 * Construct the JavaScript code.
 * @return {Array.<string>} The array of strings with the code.
 */
Html.prototype.script = function() {
  var textArea = [];
  textArea = textArea.concat(this.scriptIncludes());
  textArea.push(this.newLineIndent(1));
  textArea.push('<script type="text/javascript">');
  textArea.push(this.newLineIndent(2));
  textArea.push('var map;');
  for (var layerId in this.map.layers) {
    layerId = this.readableLayerId(layerId);
    textArea.push(this.newLineIndent(2));
    textArea.push('var layer');
    textArea.push(layerId);
    textArea.push(';');
  }
  textArea.push(this.newLineIndent(2));
  textArea.push('function initialize() {');

  textArea = textArea.concat(this.mapScript());
  textArea = textArea.concat(this.mapStyle());
  textArea = textArea.concat(this.fusionTableLayers());

  textArea.push(this.newLineIndent(2));
  textArea.push('}');
  textArea = textArea.concat(this.searches());
  textArea.push(this.newLineIndent(2));
  textArea.push(
      "google.maps.event.addDomListener(window, 'load', initialize);");
  textArea.push(this.newLineIndent(1));
  textArea.push('</script>');
  return textArea;
};

/**
 * Construct the map JavaScript code.
 * @return {Array.<string>} The array of strings with the Maps API code.
 */
Html.prototype.mapScript = function() {
  var textArea = [];
  textArea.push(this.newLineIndent(3));
  textArea.push('map = new google.maps.Map(');
  textArea.push("document.getElementById('map-canvas'), {");
  textArea.push(this.newLineIndent(4));
  textArea.push('center: new google.maps.LatLng(');
  textArea.push(this.map.getCenter().lat());
  textArea.push(', ');
  textArea.push(this.map.getCenter().lng());
  textArea.push('),');
  textArea.push(this.newLineIndent(4));
  textArea.push('zoom: ');
  textArea.push(this.map.getZoom());
  var mapTypeId = this.map.mapTypes[this.map.map.getMapTypeId()];
  if (mapTypeId) {
    textArea.push(',');
    textArea.push(this.newLineIndent(4));
    textArea.push('mapTypeId: ');
    textArea.push(mapTypeId);
  }
  textArea.push(this.newLineIndent(3));
  textArea.push('});');
  return textArea;
};

/**
 * Construct the map style JavaScript code.
 * @return {Array.<string>} The array of strings with the map style code.
 */
Html.prototype.mapStyle = function() {
  var styles = [];

  if (this.map.saturation) {
    var style = [];
    style.push(this.newLineIndent(4));
    style.push('{');
    style.push(this.newLineIndent(5));
    style.push("featureType: 'all',");
    style.push(this.newLineIndent(5));
    style.push("elementType: 'all',");
    style.push(this.newLineIndent(5));
    style.push('stylers: [');
    style.push(this.newLineIndent(6));
    style.push('{ saturation: ');
    style.push(this.map.saturation);
    style.push(' }');
    style.push(this.newLineIndent(5));
    style.push(']');
    style.push(this.newLineIndent(4));
    style.push('}');
    styles.push(style.join(''));
  }

  var specs = document.getElementsByName('specs');
  for (var i = 0, spec; spec = specs[i]; i++) {
    if (!spec.checked) {
      var style = [];
      style.push(this.newLineIndent(4));
      style.push('{');
      style.push(this.newLineIndent(5));
      style.push("featureType: '");
      style.push(specs[i].id);
      style.push("',");
      style.push(this.newLineIndent(5));
      style.push("elementType: 'all',");
      style.push(this.newLineIndent(5));
      style.push('stylers: [');
      style.push(this.newLineIndent(6));
      style.push("{ visibility: 'off' }");
      style.push(this.newLineIndent(5));
      style.push(']');
      style.push(this.newLineIndent(4));
      style.push('}');
      styles.push(style.join(''));
    }
  }

  var textArea = [];
  if (styles.length) {
    textArea.push(this.newLineIndent(3));
    textArea.push('var style = [');
    textArea.push(styles.join(','));
    textArea.push(this.newLineIndent(3));
    textArea.push('];');
    textArea.push(this.newLineIndent(3));
    textArea.push('var styledMapType ');
    textArea.push('= new google.maps.StyledMapType(style, {');
    textArea.push(this.newLineIndent(4));
    textArea.push('map: map,');
    textArea.push(this.newLineIndent(4));
    textArea.push("name: 'Styled Map'");
    textArea.push(this.newLineIndent(3));
    textArea.push('});');

    textArea.push(this.newLineIndent(3));
    textArea.push("map.mapTypes.set('map-style', styledMapType);");
    textArea.push(this.newLineIndent(3));
    textArea.push("map.setMapTypeId('map-style');");
  }
  return textArea;
};

/**
 * Construct the Fusion Tables Layer JavaScript code.
 * @return {Array.<string>} The array of strings with the layer code.
 */
Html.prototype.fusionTableLayers = function() {
  var textArea = [];
  for (var layerId in this.map.layers) {
    var layer = this.map.layers[layerId];
    layerId = this.readableLayerId(layerId);
    textArea.push(this.newLineIndent(3));
    textArea.push('layer');
    textArea.push(layerId);
    textArea.push(' = new google.maps.FusionTablesLayer({');
    textArea.push(this.newLineIndent(4));
    textArea.push('query: {');
    textArea.push(this.newLineIndent(5));
    this.emitSelect(layer, textArea);
    textArea.push(this.newLineIndent(5));
    textArea.push('from: "');
    textArea.push(layer.tableId);
    textArea.push('"');
    if (layer.where) {
      textArea.push(',');
      textArea.push(this.newLineIndent(5));
      textArea.push('where: "');
      textArea.push(layer.where);
      textArea.push('"');
    }
    textArea.push(this.newLineIndent(4));
    textArea.push('},');
    textArea.push(this.newLineIndent(4));
    textArea.push('map: map');
    if (layer.styleId) {
      textArea.push(',');
      textArea.push(this.newLineIndent(4));
      textArea.push('styleId: ');
      textArea.push(layer.styleId);
    }
    if (layer.templateId) {
      textArea.push(',');
      textArea.push(this.newLineIndent(4));
      textArea.push('templateId: ');
      textArea.push(layer.templateId);
    }
    textArea.push(this.newLineIndent(3));
    textArea.push('});');
  }
  return textArea;
};

/**
 * Construct the Fusion Tables Layer search JavaScript code.
 * @return {Array.<string>} The array of strings with the search code.
 */
Html.prototype.searches = function() {
  var textArea = [];
  for (var layerId in this.map.layers) {
    var layer = this.map.layers[layerId];
    layerId = this.readableLayerId(layerId);
    if (layer.search) {
      textArea.push(this.newLineIndent(2));
      textArea.push('function changeMap');
      textArea.push(layerId);
      textArea.push('() {');
      textArea.push(this.newLineIndent(3));
      textArea.push('var whereClause');
      if (layer.where) {
        textArea.push(' = "' + layer.where + '"');
      }
      textArea.push(';');
      textArea.push(this.newLineIndent(3));
      textArea.push('var searchString ');
      textArea.push("= document.getElementById('search-string");
      textArea.push(layerId);
      textArea.push("').");
      textArea.push('value.replace(/\'/g, "\\\\\'");');
      textArea.push(this.newLineIndent(3));
      textArea.push('if (searchString != \'--Select--\') {');
      textArea.push(this.newLineIndent(4));
      if (layer.where) {
        textArea.push('whereClause += " AND ');
      } else {
        textArea.push('whereClause = "');
      }
      textArea.push("'" + layer.search.column + "'");
      if (layer.search.type == 'text') {
        textArea.push(' CONTAINS IGNORING CASE \'" + searchString + "\'"');
      } else if (layer.search.type == 'select') {
        textArea.push(' = \'" + searchString + "\'"');
      }
      textArea.push(';');

      textArea.push(this.newLineIndent(3));
      textArea.push('}');
      textArea.push(this.newLineIndent(3));
      textArea.push('layer');
      textArea.push(layerId);
      textArea.push('.setOptions({');
      textArea.push(this.newLineIndent(4));
      textArea.push('query: {');
      textArea.push(this.newLineIndent(5));
      this.emitSelect(layer, textArea);
      textArea.push(this.newLineIndent(5));
      textArea.push('from: "');
      textArea.push(layer.tableId);
      textArea.push('",');
      textArea.push(this.newLineIndent(5));
      textArea.push('where: whereClause');
      textArea.push(this.newLineIndent(4));
      textArea.push('}');
      textArea.push(this.newLineIndent(3));
      textArea.push('});');
      textArea.push(this.newLineIndent(2));
      textArea.push('}');
    }
  }
  return textArea;
};

/**
 * Adds the select clause, quoting the location column if required.
 * @param {google.maps.FusionTablesLayer} layer The layer.
 * @param {Array.<string>} textArea The array of strings to add the column to.
 */
Html.prototype.emitSelect = function(layer, textArea) {
  textArea.push('select: "');
  if (layer.locationColumn.match(/^col\d+(>>\d+)?$/)) {
    // Column ID, no quoting needed
    textArea.push(layer.locationColumn);
  } else {
    textArea.push("'" + layer.locationColumn + "'");
  }
  textArea.push('",');
};

/**
 * Construct the body of the HTML code.
 * @return {Array.<string>} The array of strings with the search code.
 */
Html.prototype.body = function() {
  var textArea = [];
  textArea.push(this.newLineIndent(2));
  textArea.push('<div id="map-canvas"></div>');

  for (var layerId in this.map.layers) {
    var layer = this.map.layers[layerId];
    layerId = this.readableLayerId(layerId);
    var search = layer.search;
    if (search) {
      textArea.push(this.newLineIndent(2));
      textArea.push('<div style="margin-top: 10px;">');
      textArea.push(this.newLineIndent(3));
      textArea.push('<label class="layer-wizard-search-label">');
      textArea.push(this.newLineIndent(4));
      textArea.push(search.label);
      textArea.push(this.newLineIndent(4));
      if (search.type == 'text') {
        textArea.push('<input type="text" id="search-string');
        textArea.push(layerId);
        textArea.push('">');
        textArea.push(this.newLineIndent(4));
        textArea.push('<input type="button" onclick="changeMap');
        textArea.push(layerId);
        textArea.push('()" value="Search">');
      } else if (search.type == 'select') {
        textArea.push('<select id="search-string');
        textArea.push(layerId);
        textArea.push('" ');
        textArea.push('onchange="changeMap');
        textArea.push(layerId);
        textArea.push('(this.value);">');
        textArea.push(this.newLineIndent(5));
        textArea.push('<option value="--Select--">--Select--</option>');
        for (var iopt = 0; iopt < search.options.length; iopt++) {
          textArea.push(this.newLineIndent(5));
          textArea.push('<option value="');
          var value = search.options[iopt];
          textArea.push(value);
          textArea.push('">');
          textArea.push(value ? value : '(no value)');
          textArea.push('</option>');
        }
        textArea.push(this.newLineIndent(4));
        textArea.push('</select>');
      }
      textArea.push(this.newLineIndent(3));
      textArea.push('</label> ');
      textArea.push(this.newLineIndent(2));
      textArea.push('</div>');
    }
  }

  return textArea;
};

/**
 * Return the numeric layer ID prefixed with an underscore for readability.
 * @param {string} layerId The maps layer ID, such as l2.
 * @return {string} The layer ID.
 */
Html.prototype.readableLayerId = function(layerId) {
  return '_' + layerId.substring(1);
};

/**
 * Get a line starting with a newline indented to the requested level.
 * @param {number} indent The number of indent levels, each of two spaces.
 * @return {string} The indented line.
 */
Html.prototype.newLineIndent = function(indent) {
  var indentation = new Array(indent + 1).join(this.INDENT_);
  return this.NEW_LINE_ + indentation;
};
