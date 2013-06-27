/**
 * @fileoverview Code for FusionTablesLayer Wizard.
 *
 * FusionTablesLayer Wizard generates the HTML code for users
 * to include search elements or another layer to a Google Map.
 *
 *  This is the helper file to convert plaintext .js files into
 *  compiled javascript.
 *
 *  Documentation:
 *  https://developers.google.com/closure/library/docs/closurebuilder
 *
 *  Overview:
 *
 *  1| Download the closure library and compiler.jar helper files
 *  You'll have already downloaded the Closure library to set up
 *  your local editing environment.
 *  svn checkout http://closure-library.googlecode.com/svn/trunk/ \
 *  closure-library
 *
 *  Download the closure.jar
 *  http://closure-compiler.googlecode.com/files/compiler-latest.zip
 *
 *  Place them sister to the FusionTablesLayerWizard folder.
 *
 *  2| In the FusionTablesLayerWizard directory, run the following command line
 * ../closure-library/closure/bin/build/closurebuilder.py \
 * --root=../closure-library/ \
 * --root=src/ \
 * --namespace "Builder.start" \
 * --output_mode=compiled \
 * --compiler_jar=../compiler.jar \
 *  > src/builder_compiled.js
 *
 *  3| Clean up
 *  Change path in index.html to test that the new builder_compiled.js works,
 *  and submit changes
 *
 */

goog.provide('Builder.start');

goog.require('Builder.controller');
goog.require('Builder.form');
goog.require('Builder.html');
goog.require('Builder.layer');
goog.require('Builder.map');
goog.require('Builder.search');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.ui.AnimatedZippy');
goog.require('goog.ui.Component');
goog.require('goog.ui.Slider');
goog.require('goog.ui.Zippy');
goog.require('goog.ui.ZippyEvent');


/**
 * Builder constructor.
 * @constructor
 */
var Builder = function() {
  this.initialize();
};

goog.exportSymbol('Builder', Builder);

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
