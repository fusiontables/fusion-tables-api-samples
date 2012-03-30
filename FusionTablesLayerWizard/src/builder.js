/**
 * @fileoverview Code for FusionTablesLayer Wizard.
 *
 * FusionTablesLayer Wizard generates the HTML code for users
 * to include search elements or another layer to a Google Map.
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
  this.initialize();
};

google.maps.event.addDomListener(window, 'load', function() {
  var builder = new Builder();
});

/**
 * Initialize the app.
 */
Builder.prototype.initialize = function() {
  var map = new Map(document.getElementById('map-canvas'));
  var html = new Html(map);
  var controller = new Controller(html, map);
  html.updateHtml();
};
