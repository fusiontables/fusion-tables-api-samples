goog.provide('ftchartconfig');

goog.require('goog.ui.AnimatedZippy');

// constructor for ftchartconfig
ftchartconfig = function( width, height, baseUrl) {
  this.defaultWidth_ = width;
  this.defaultHeight_ = height;
  this.exclOpts_ = {'width':1,'height':1,'colors':1};
  this.validEmbedvizCharts_ = {
    'BarChart':1,
    'LineChart':1,
    'PieChart':1,
    'AreaChart':1,
    'GeoChart':1,
    'ColumnChart':1};
  this.columnSelectorIds_ = {
    selectColumns:'default',
    orderbyColumn:'all',
    groupbyColumn:'all',
    sumbyColumn:'number',
    selectformatColumns:'all',
    selectrenameColumns:'all'};
  this.textareaIds_ = {
    selectedColumns:1, 
    formattedColumns:1, 
    chartiframe:1, 
    chartURL:1, 
    htmlCode:1};
  this.ftBaseUrl_ = baseUrl;

  this.colList_ = {};
  this.colType_ = {};

  this.wrapper_;
  this.cwidth_;
  this.cheight_;
  this.hformat_;
  this.vformat_;
  this.dataSourceUrl_;
  this.data_;
  this.editor_;
  this.zips_=[];
}

ftchartconfig.prototype.configureWrapper = function() {
  this.cwidth_ = document.getElementById('chartwidth').value ? 
    document.getElementById('chartwidth').value : this.defaultWidth_;
  this.cheight_ = document.getElementById('chartheight').value ? 
    document.getElementById('chartheight').value : this.defaultHeight_; 
  this.hformat_ = document.getElementById('haxisformat').value;
  this.vformat_ = document.getElementById('vaxisformat').value;

  this.wrapper_.setOption( 'strictFirstColumnType',false);
  this.wrapper_.setOption( 'width',this.cwidth_);
  this.wrapper_.setOption( 'height',this.cheight_);
  this.wrapper_.setOption( 'hAxis.format', this.hformat_);
  this.wrapper_.setOption( 'vAxis.format', this.vformat_);
}

ftchartconfig.prototype.openEditor = function() {
  if (!(this.wrapper_)) {
    this.dataSourceUrl_ = this.ftBaseUrl_ + '/gvizdata?tq=';
    this.wrapper_ = new google.visualization.ChartWrapper({
      containerId: 'visualization',
      chartType: 'LineChart'
    });
  };
  this.configureWrapper();

  // Handler for the "Open Editor" button.
  this.editor_ = new google.visualization.ChartEditor();
  var self = this;
  google.visualization.events.addListener(this.editor_, 'ok', 
    function () {
      self.wrapper_ = self.editor_.getChartWrapper();
      self.redrawChart();
    });
 
  var query = new google.visualization.Query( 
    this.dataSourceUrl_ + this.buildQuery());
  var self = this;
  query.send(handleQueryResponse);
  function handleQueryResponse(response) {
    if (response.isError()) {
      alert('Error in query: ' +
            response.getMessage() + ' ' + 
            response.getDetailedMessage());
      return;
    }
    self.data_ = response.getDataTable();
    self.formatData();
    self.wrapper_.setDataTable( self.data_);
    self.editor_.openDialog(self.wrapper_);
  }
}

// external function to update size of chart if wrapper exists
ftchartconfig.prototype.updateChart = function() {
  if (this.wrapper_) this.redrawChart();
}
  
// redraw chart
ftchartconfig.prototype.redrawChart = function() { 
  this.configureWrapper();

  var query = new google.visualization.Query( 
    this.dataSourceUrl_ + this.buildQuery());
  var self = this;
  query.send(handleQueryResponse);

  // wait for data and now set up wrapper with data table
  function handleQueryResponse(response) {
    if (response.isError()) {
      alert('Error in query: ' + 
            response.getMessage() + ' ' + 
            response.getDetailedMessage());
      return;
    }
    self.data_ = response.getDataTable();

    self.formatData();
    self.wrapper_.setDataTable( self.data_);
    self.wrapper_.draw(document.getElementById('visualization')); 
    self.updateiframe( self.updateURL());
    self.updateHTML();
  }
}

// apply column format options to data table
ftchartconfig.prototype.formatData = function() {
  var colx=0;
  for (colname in this.colList_) {
    if (this.colList_[colname].format) {
      switch (this.colType_[ colname]) {
      case 'number':
        var formatter = new google.visualization.NumberFormat(
          {pattern: this.colList_[colname].format});
        formatter.format( this.data_, colx); break;
      case 'datetime': 
    	var formatter = new google.visualization.DateFormat(
          {pattern: this.colList_[colname].format});
        formatter.format( this.data_, colx); break;
      }
    }
    colx++;
  }
}

// build FusionTables query
ftchartconfig.prototype.buildQuery = function() {
  var select_text = document.getElementById('selectedColumns').value;

  var ftquery;
  var groupby_col = document.getElementById('groupbyColumn').value;
  var orderby_col = document.getElementById('orderbyColumn').value;
  var sumby_col = document.getElementById('sumbyColumn').value;

  // if group by and sumby columns present override column selection
  if (groupby_col && sumby_col) {
      ftquery = "select '" + groupby_col + 
                "', " + sumtype + "('" + sumby_col + "')" + 
                ' from ' + document.getElementById('tableid').value;
  } else {
    ftquery = 'select ' + select_text + ' from ' + 
              document.getElementById('tableid').value;
  }

  var filter = document.getElementById('filter').value
  if (filter) {
    ftquery = ftquery + ' where ' + filter
  }

  // add group by
  if (groupby_col) {
    ftquery = ftquery + " group by " + "'" + groupby_col + "'";
  }

  // add order by
  if (orderby_col) {
    var orderby_coltext = "'" + orderby_col + "'";
    if (this.colList_[ orderby_col].sum) {
      // has summary applied to order by column
      orderby_coltext = this.colList_[ orderby_col].sum + 
                                              "('" + orderby_col + "')";
    }
    if (document.getElementById('sortdesc').checked)
       ftquery = ftquery + " order by " + orderby_coltext + " DESC";
    else
       ftquery = ftquery + " order by " + orderby_coltext;
  }

  // add limit
  var limit = document.getElementById('limit').value;
  if (limit>0) {
    ftquery = ftquery + " limit " + limit;
  }

  console.log( ftquery);
  return ftquery;
}

ftchartconfig.prototype.updateiframe = function( url) {
    var iframe_text = '<iframe width="' + this.cwidth_ + 
                      'px" height="' + this.cheight_ + 
                      'px" scrolling="no" frameborder="no" src="' + 
                      url + '"></iframe>';
    if ( url.slice(0,4) == 'http')
      document.getElementById('chartiframe').value = iframe_text;
    else
      document.getElementById('chartiframe').value = url;
}

ftchartconfig.prototype.updateURL = function() {
    var url = this.ftBaseUrl_ + 
              "/embedviz?&containerId=gviz_canvas&viz=GVIZ&q=" + 
              encodeURIComponent(this.buildQuery());
    var chartType = this.wrapper_.getChartType();
    if (this.validEmbedvizCharts_[ chartType]) {    
      // have valid chart type for embedviz
      url = url+"&t=" + chartType.toUpperCase().replace(/CHART$/,"");
      var options = this.wrapper_.getOptions();
      for (var optx in options) {
          // if option in exclude list skip to next option
	  if (this.exclOpts_[ optx])
	    continue;
          var opt_obj = options[ optx];
          if (typeof( opt_obj) === 'string') {
      	  url = url + "&gco_" + optx + "=" + encodeURIComponent(opt_obj);
          } else { 
            // recode arrays as object with properties 0:, 1:  (temporary fix)
      	    if (opt_obj instanceof Array && (!(typeof(opt_obj[0]) === 'string')) ) {
      	    var new_opt_obj = {};
              for (objx=0; objx<opt_obj.length; objx++)
      	       new_opt_obj[objx] = opt_obj[objx];
              opt_obj = new_opt_obj; 
	    }
      	    var option_text = JSON.stringify( opt_obj);
            option_text.replace(/\n/gm,"");
            url = url + "&gco_" + optx + "=" + encodeURIComponent( option_text);
          }
      }	  
      url = url+"&width=" + this.cwidth_;
      url = url+"&height=" + this.cheight_;
    } else {
      url = "Embedviz URL only works for these chart types: ";
      for (ctype in this.validEmbedvizCharts_) {
	url = url + ctype + ", ";
      }
      url = url + "use HTML code below for other chart types";
    } 
    document.getElementById('chartURL').value = url;
    return url;
}
    
ftchartconfig.prototype.updateHTML = function() {
  var sHTML = "<!--\n";
  sHTML += "You are free to copy and use this sample in accordance with the terms of the\n";
  sHTML += "Apache license (http://www.apache.org/licenses/LICENSE-2.0.html)\n";
  sHTML += "-->\n";
  sHTML += "\n";
  sHTML += "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n";
  sHTML += "<html xmlns=\"http://www.w3.org/1999/xhtml\">\n";
  sHTML += "  <head>\n";
  sHTML += "    <meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\"/>\n";
  sHTML += "    <title>\n";
  sHTML += "      Google Visualization API Sample\n";
  sHTML += "    </title>\n";
  sHTML += "    <script type=\"text/javascript\" src=\"http://www.google.com/jsapi\"><\/script>\n";
  sHTML += "    <script type=\"text/javascript\">\n";
  sHTML += "      google.load('visualization', '1');\n";
  sHTML += "    <\/script>\n";
  sHTML += "    <script type=\"text/javascript\">\n";
  sHTML += "      var winW = 500, winH = 300;\n";
  sHTML += "      if (document.body && document.body.offsetWidth) {\n";
  sHTML += "       winW = document.body.offsetWidth;\n";
  sHTML += "       winH = document.body.offsetHeight;\n";
  sHTML += "      }\n";
  sHTML += "      if (document.compatMode=='CSS1Compat' &&\n";
  sHTML += "          document.documentElement &&\n";
  sHTML += "          document.documentElement.offsetWidth ) {\n";
  sHTML += "       winW = document.documentElement.offsetWidth;\n";
  sHTML += "       winH = document.documentElement.offsetHeight;\n";
  sHTML += "      }\n";
  sHTML += "      if (window.innerWidth && window.innerHeight) {\n";
  sHTML += "       winW = window.innerWidth;\n";
  sHTML += "       winH = window.innerHeight;\n";
  sHTML += "      }\n";
  sHTML += "      function drawVisualization() {\n";
  sHTML += "        var query = new google.visualization.Query(" + '"' + this.dataSourceUrl_;
  sHTML += this.buildQuery() + '");\n';
  sHTML += "        query.send(handleQueryResponse);\n";
  sHTML += "        function handleQueryResponse(response) {\n";
  sHTML += "          if (response.isError()) {\n";
  sHTML += "            alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());\n";
  sHTML += "             return;\n";
  sHTML += "          }\n";
  sHTML += "          var data = response.getDataTable();\n";
  var colx=0;
  for (var colname in this.colList_) {
    var pattern = this.colList_[colname].format;
      if (pattern) {
        switch( this.colType_[ colname]) {
          case 'number':
  sHTML += "          var formatter = new google.visualization.NumberFormat({pattern:'" + pattern +"'});\n";
  sHTML += "          formatter.format(data," + colx + ");\n"; break;
          case 'datetime':
  sHTML += "          var formatter = new google.visualization.DateFormat({pattern:'" + pattern +"'});\n";
  sHTML += "          formatter.format(data," + colx + ");\n"; break;
        }
     }
     colx++;
  }
  sHTML += "          var wrapper = new google.visualization.ChartWrapper();\n";
  sHTML += "          wrapper.setDataTable( data);\n";
  sHTML += "          wrapper.setChartType("+ "'" + this.wrapper_.getChartType() + "'" + ");\n";
  sHTML += "          wrapper.setContainerId("+ "'" + this.wrapper_.getContainerId() + "'" + ");\n";
  sHTML += "          wrapper.setOptions(" + JSON.stringify( this.wrapper_.getOptions(), undefined, 2).replace(/^/gm,'             ') + "\n";
  sHTML += "          );\n";
  sHTML += "          wrapper.setOption('width',winW-20);\n";
  sHTML += "          wrapper.setOption('height',winH-20);\n";
  sHTML += "          wrapper.setOption('strictFirstColumnType',false);\n";
  sHTML += "          wrapper.draw();\n";
  sHTML += "        }\n";
  sHTML += "      }\n";
  sHTML += "      google.setOnLoadCallback(drawVisualization);\n";
  sHTML += "    <\/script>\n";
  sHTML += "  <\/head>\n";
  sHTML += "  <body style=\"font-family: Arial;border: 0 none;\">\n";
  sHTML += "    <div id=\"visualization\"></div>\n";
  sHTML += "  <\/body>\n";
  sHTML += "<\/html>\n";
  document.getElementById('htmlCode').value = sHTML;
}

//remove child nodes from a menu
ftchartconfig.prototype.removeChildren = function(menu) {
  if(menu.hasChildNodes()) {
    while (menu.childNodes.length > 2) {
      menu.removeChild(menu.lastChild);       
    } 
  }
}

var ftchartconfig_response_context;

//fill the select columns in the form after user enters table id
// this.columnSelectorIds_ contains list of element ids in document that contain column selector
ftchartconfig.prototype.fetchColumns = function() {
  this.colList_ = {};
  this.updateSelectText();
  for (var colSelId in this.columnSelectorIds_) {
    var menu = document.getElementById( colSelId);
    this.removeChildren (menu)
  }         
 
  ftchartconfig_response_context = this;
  var tableid = document.getElementById('tableid').value;
  if (tableid) {
    query = "DESCRIBE+" + document.getElementById('tableid').value;
    var script = document.createElement("script");
    script.setAttribute(
      "src", 
      this.ftBaseUrl_ + 
        "/api/query?sql=" + query + 
        "&jsonCallback=configureSelectColumns"
    );
    document.body.appendChild(script);
  }

  // clear all areas
  for (var textid in this.textareaIds_)
    document.getElementById( textid).value = "";

  // clear the visualization div
  var vizDiv = document.getElementById("visualization");  
  while ( vizDiv.firstChild ) vizDiv.removeChild( vizDiv.firstChild );
}

// actually add the columns from the table to the select columns in the form
function configureSelectColumns(response) {
  var table = response['table'];
  var rows = table['rows'];
  // save column types
  for (var r=0; r<rows.length; r++)
    ftchartconfig_response_context.colType_[ rows[r][1]] = rows[r][2];

  ftchartconfig_response_context.createColumnSelector();
}

ftchartconfig.prototype.createColumnSelector = function() {
  for (var colSelectId in this.columnSelectorIds_) {
    var colSelectElem = document.getElementById( colSelectId);
    this.removeChildren ( colSelectElem)

    var colselProps = this.columnSelectorIds_[ colSelectId];
    for (var colname in this.colType_) {
      // create the option if the selector is marked as "default" 
      // (ie the main selector at the top of the page
      // the other selectors in the page should all show column names that 
      // have been selected and appear in this.colList_
      // further if the selector has a specific type associated with it 
      // ie 'number' then only columns of that type should be added
      if (colselProps == 'default' || 
          ( this.colList_[ colname] && (colselProps == 'all' || 
             (colselProps == this.colType_[ colname]))
	  )
	 )
      {
        var option = document.createElement("option");
        option.setAttribute("value",colname);
        option.innerHTML = colname; 
        colSelectElem.appendChild(option);
      }
    }
    colSelectElem.disabled = false;
  } 
}     




// handle adding or removing a column
ftchartconfig.prototype.addremoveColumn = function() {
  var colname = document.getElementById("selectColumns").value;
  document.getElementById("selectColumns").selectedIndex = 0;

  // if colname in list delete it
  if (this.colList_[ colname]) 
    delete this.colList_[ colname];
  else {
    this.colList_[ colname] = {};
  }

  this.createColumnSelector();
  this.updateformatText()
  this.updateSelectText();
}

// handle adding or removing a column
ftchartconfig.prototype.addformattoColumn = function() {
  var colname = document.getElementById("selectformatColumns").value;
  document.getElementById("selectformatColumns").selectedIndex = 0;

  // if colname update format string
  if (this.colList_[ colname]) {
    var format_str = document.getElementById("columnformat").value;
    if (format_str)
	this.colList_[ colname]['format'] = format_str;
    else
        delete this.colList_[ colname]['format'];
  }
  this.updateformatText();
  this.updateChart();
}

// handle setting summarization function on a column
ftchartconfig.prototype.addsummaryColumn = function() {
  var colname = document.getElementById("sumbyColumn").value;
  document.getElementById("sumbyColumn").selectedIndex = 0;

  // determine summarization type
  var sum_elems = document.getElementsByName('sumtype');
  var sum_func = "sum";
  for (sumx=0; sumx<sum_elems.length; sumx++) {
    if (sum_elems[sumx].checked) sum_func = sum_elems[sumx].value;
  }

  // if colname in list add summary
  if (this.colList_[ colname]) 
      this.colList_[ colname]["sum"] = sum_func;
  else {
      // generate error
  }

  this.updateSelectText();
}

// handle adding a column rename
ftchartconfig.prototype.addnametoColumn = function() {
  var colname = document.getElementById("selectrenameColumns").value;
  document.getElementById("selectrenameColumns").selectedIndex = 0;

  var rename = document.getElementById("columnrename").value;
  document.getElementById("columnrename").value = "";

  if (this.colList_[ colname]) {
    if (rename)
      this.colList_[ colname]["rename"] = rename;
    else
      delete this.colList_[ colname]["rename"];
  }
  else {
      // generate error
  }

  this.updateSelectText();
  this.updateChart();
}


ftchartconfig.prototype.updateformatText = function() {
  var format_text = "";
  // build format text
  for (colx in this.colList_) { 
    var col = this.colList_[colx];
    var pre_sep = "";
    if (format_text)
      pre_sep = ", ";
     
    if (col.format) {
      format_text = format_text + pre_sep + "'" + 
                    colx + "':{'format': '" + col.format + "'}";
    }
  }
  document.getElementById("formattedColumns").value = format_text; 
}

ftchartconfig.prototype.updateSelectText = function() {
  var select_text = "";
  // build select text
  for (colx in this.colList_) { 
    var col = this.colList_[colx];
    var pre_sep = "";
    if (select_text)
      pre_sep = ", ";
     
    if (col.sum) {
      select_text = select_text + pre_sep + col.sum + "('" + colx + "')";
    } else {
      select_text = select_text + pre_sep + "'" + colx + "'";
    }
    if (col.rename)
      select_text = select_text + " as '" + col.rename + "'";
  }
  document.getElementById("selectedColumns").value = select_text; 
}

// create zips
ftchartconfig.prototype.createZips = function() {
  this.zips_.push(new goog.ui.AnimatedZippy('header1', 'content1'));
  this.zips_.push(new goog.ui.AnimatedZippy('header2', 'content2'));
  this.zips_.push(new goog.ui.AnimatedZippy('headeriframe', 'chartiframe'));
  this.zips_.push(new goog.ui.AnimatedZippy('headerURL', 'chartURL'));
  this.zips_.push(new goog.ui.AnimatedZippy('headerHTML', 'htmlCode'));
}

// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('ftchartconfig', ftchartconfig);
