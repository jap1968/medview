/*

    Copyright (C) 2013  Jose Antonio Perez
    [ http://goo.gl/lW17d ]

    This file is part of the medview Medical Imaging Viewer
    [ https://github.com/jap1968/medview ]

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/gpl.html
    
*/

// *****************************************************************************

/**
 * @namespace html
 * http://stackoverflow.com/a/2912492/176974
 * http://elegantcode.com/2011/01/26/basic-javascript-part-8-namespaces/
 */

medview.html = medview.html || {};

// *****************************************************************************
// *****************************************************************************

/**
 * Main form to launch c-find operations
 * Parameters:
 *  container: DOM container
 *  dgInstance: DicomGateway instance
 */
medview.html.CFindForm = function(container, dgInstance)
{

  this.dgInstance = dgInstance;


  var top = 0;
  var left = 0;
/*
  var width = 600;
  var height = 200;
*/  
  // main panel
  
  var fg = $('<div />');
  fg.attr('id', 'cFindArea');
  fg.attr('class', 'ui-body ui-body-b');
  fg.css({
    'top': top + 'px',
    'left': left + 'px',
    'width': '100%',
    'height': '400px',
    'position': 'relative',
    'background-color': 'rgb(127,191,191)',
    'z-index': 10,
    'opacity': 0.9
  }); // <!-- filter:alpha(opacity=50); -->





// ToDo: Clean html elements: Remove jQuery / Bootstrap tags

  var formHtml = '<div style="display:inline;">' +
    '<label for="patId">Patient id: </label>' + 
    '<input type="search" name="patientId" id="patId" value="" />' +
    '</div>' +
    
    '<!-- <div data-role="fieldcontain">' +
	  '<label for="fDesde">Date (from)</label>' +
    '<input type="date" name="fDesde" id="fDesde" value="" />' +
    '</div> -->' +
    
    '<input id="cfind" type="button" value="Search" />' +
    '<!-- <input id="cfinddate" type="button" value="Today" /> -->';


  fg.html(formHtml);
  
  var fgTab = $('<div />');
  fgTab.attr('id', 'cFindTab');
  fgTab.css({
    'position': 'relative',
    'height': '50px',
    'width': '150px',
    'left': '50px',    
    'background': 'red',
    'background-color': 'rgb(127,191,191)',    
    'z-index': 10,
    'opacity': 0.9
   
  }); // <!-- filter:alpha(opacity=50); -->
  




  
  container.append(fg);
  container.append(fgTab);

$('#cFindTab').click(function()
{
    console.log("click tab");
//    $("#cFindArea").animate({width:'toggle'},200);       
    $("#cFindArea").animate({height:'toggle'},200);       

});

  this.enable();

/*
  this.studyList = new medview.html.StudyList(fg);
  this.seriesList = new medview.html.SeriesList(fg);
*/

}

// *****************************************************************************

/**
 * Enable the search forms for Dicom Q/R (C-Find) gateway
 */
medview.html.CFindForm.prototype.enable = function() {
  console.log("CFindForm.enable");

  var dgInstance = this.dgInstance;

  // cFind search button
  $("#cfind").click(function() {
//    console.log("cfind.click()");

    dgInstance.studyList.showLoading();
    var patId = $("#patId").val();
    if (patId == '') {
      alert("Error!");
    }
    else {

      // ToDo: Move this to functions
      dgInstance.studyList.clear();
      dgInstance.seriesList.hide();
      dgInstance.seriesList.clear();

      // alert("cfind: " + $("#patId").val());
      uri = dgInstance.gwScript + '?operation=cfind&patId=' + patId;

      console.log('cfind: ' + uri);

      dgInstance.studyList.show();

      $.ajax({
        type: "GET",
        url: uri,
        dataType: "xml"
      }).done(function(xml, textStatus, jqXHR) {
        dgInstance.parseXmlCFind(xml);
      }).always(function() {
        dgInstance.studyList.hideLoading();
      });
    }
  });

/*
  $("#cfinddate").click( function() {
    // console.log(instance);
    instance.showLoading();
    var patId = $("#patId").val();
    var patIdParam = (patId == "" ? "" : "&patId=" + patId);
    
    // ToDo: Move this to functions
    $("#studyList dt, #studyList dd").remove();
    $("#seriesList dt, #seriesList dd").remove();

    // alert("cfind: " + $("#patId").val());

    var today = new Date();
    var strDate = today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + ("0" + today.getDate()).slice(-2);
    console.log(strDate);

    uri = instance.gwScript + '?operation=cfind&studyDate=' + strDate + patIdParam;
    console.log('cfind: ' + uri);

    $.ajax({
      type: "GET",
      url: uri,
      dataType: "xml"
    }).done(function(xml, textStatus, jqXHR) {
      instance.parseXmlCFind(xml);
    });

  });
*/

}

// *****************************************************************************
// *****************************************************************************

/**
 * Form to adjust image display / viewing
 * Parameters:
 *  container: DOM container
 *  dgInstance: DicomGateway instance
 */
medview.html.AdjustForm = function(container, dgInstance)
{

  this.dgInstance = dgInstance; // Reference to the DicomGateway instance
  var fg = $('<div />');
  fg.attr('id', 'adjustArea');
  fg.css({
    'position': 'relative',
    'display': 'none',
    'bottom': '0',
    'left': '0',
    'width': '100%',
    'height': '160px',
    'background-color': 'rgb(191,127,191)',
    'z-index': 5,
    'opacity': 0.9
  }); // <!-- filter:alpha(opacity=50); -->
  //     'float': 'left',

// Change: this in ImageView
  this.numFrame = 0;

  var formHtml = '<div>' +
    '<label for="adjWC">WC: </label>' + 
    '<input type="text" id="adjWC" size="5" value="" />' +
    '<label for="adjWW">WW: </label>' + 
    '<input type="text" id="adjWW" size="5" value="" />' +        
    '<input id="adjWWB" type="button" value="Adjust Level" /></div>';

  var formHtmlGrid = '<div>' +
    '<label for="gridRows">Rows: </label>' + 
    '<input type="text" id="gridRows" size="2" value="" />' +
    '<label for="gridCols">Cols: </label>' + 
    '<input type="text" id="gridCols" size="2" value="" />' +        
    '<input id="adjGrid" type="button" value="Adjust Grid" /></div>';

  var formHtmlZoom = '<div>' +
    '<label for="adjZoom">Zoom: </label>' + 
    '<input id="adjZoom" type="range" min="5" max="200" step="5" value="100" />' + // onchange="updateSlider(this.value)"
    '</div>';

  var formHtmlFrame = '<div class="bigControl">' +
    '<label for="numFrame">Frame: </label>' + 
    '<input id="numFrame" type="range" min="1" max="100" step="1" value="1" />' + // onchange="updateSlider(this.value)"
    '<input id="mfPlay" type="button" value="Play / Stop" />' +
    '</div>';

    '</div>';


  fg.html(formHtml + formHtmlGrid + formHtmlZoom + formHtmlFrame);
  
  var fgTab = $('<div />');
  fgTab.attr('id', 'adjTab');
  fgTab.css({
    'position': 'relative',
    'height': '50px',
    'width': '150px',
    'left': '50px',
    'background': 'red',
    'background-color': 'rgb(191,127,191)',    
    'z-index': 5,
    'opacity': 0.9
   
  }); // <!-- filter:alpha(opacity=50); -->

  
  container.append(fgTab);
  container.append(fg);
  
  console.log(dgInstance);

  $('#adjTab').click(function()
  {
      console.log("click tab");
      $("#adjustArea").animate({height:'toggle'},200);       
  });

  $("#adjWWB").click(function() {
    var newWC = $("#adjWC").val(); 
    var newWW = $("#adjWW").val(); 

    console.log("Adjust, WC: " + newWC + ", WW: " + newWW);
  });

  $("#adjGrid").click(function() {
    var newRows = $("#gridRows").val(); 
    var newCols = $("#gridCols").val(); 

    console.log("Adjust, Rows: " + newRows + ", Cols: " + newCols);
    dgInstance.ig.setRowsCols(newRows, newCols);

// *** If the series has already been loaded
    console.log(dgInstance);
    dgInstance.displayGridSeries();
    // Reference series by UID ***. Mark series as active !!!
  });


  var afInstance = this; // AdjustForm instance
  
  this.zoomTimeOut = false;
  this.frameTimeOut = false;

  this.delay = 20; // ToDo: Change delay to a configurable parameter
  
  // Timer to avoid unwanted calls to the zoom method
  $("#adjZoom").change(function() {
    var newZoom = $("#adjZoom").val(); 
    
    // zoom just the canvas element ???
    if (afInstance.zoomTimeOut !== false) {
      clearTimeout(afInstance.zoomTimeOut);
    }
    afInstance.zoomTimeOut = setTimeout(function() {afInstance.zoom(newZoom);}, afInstance.delay);

  });

  $("#numFrame").change(function() {
    var numFrame = $("#numFrame").val();
    var newZoom = $("#adjZoom").val(); 
    
    if (afInstance.frameTimeOut !== false) {
      clearTimeout(afInstance.frameTimeOut);
    }
    afInstance.frameTimeOut = setTimeout(function() {afInstance.showFrame(numFrame, newZoom);}, afInstance.delay);
  });

  
  // Play / Stop
  $("#mfPlay").click(function() {
    // MF: (0008,2144) Recommended Display Frame Rate
    var imageView = dgInstance.ig.imgViews[0];
    if (imageView.play) {
      clearInterval(afInstance.frameInterval);
      imageView.play = false;  
    }
    else {
      imageView.play = true;      
      var period = 1000 / imageView.frameRate;
      console.log("frameRate: " + imageView.frameRate + "fps, T: " + period + "ms");
      afInstance.frameInterval = setInterval(function(){afInstance.showFrameLoop(afInstance, imageView)}, period);
    }
  });
}


medview.html.AdjustForm.prototype.showFrameLoop = function(afInstance, imageView) {
//  this = afInstance;
  // console.log("showFrameLoop()");
  afInstance.numFrame++;
  if (afInstance.numFrame >= imageView.numFrames) {
    //clearInterval(afInstance.frameInterval);
    //console.log(imageView.numFrames);
    afInstance.numFrame = 1;
  }
//  console.log("showFrame, this.numFrame: " + afInstance.numFrame);
  afInstance.showFrame(afInstance.numFrame, imageView.zoom);
//  setInterval(afInstance.showFrameLoop(afInstance), 2000);
//  window.setTimeout(afInstance.showFrameLoop(afInstance), 5000);
}


medview.html.AdjustForm.prototype.zoom = function(zoomValue) {
//  console.log("zoom() " + zoomValue);
  
  var ig = this.dgInstance.ig; // ImageGrid
  if (ig) {  
    for (var i = 0; i < this.dgInstance.ig.imgViews.length; i++) {
      var imageView = this.dgInstance.ig.imgViews[i];
      imageView.zoom = zoomValue;
      // imageView.displayInstance(zoomValue / 100.0);
      imageView.displayFrameInstance(imageView.numFrame, zoomValue / 100.0);
    }
  }
}

medview.html.AdjustForm.prototype.showFrame = function(numFrame, zoomValue) {
//  console.log("Display frame #:" + numFrame);

  var ig = this.dgInstance.ig; // ImageGrid
  if (ig) {

/*
// Cine-loop -> just one ImageView
    for (var i = 0; i < this.dgInstance.ig.imgViews.length; i++) {
      this.dgInstance.ig.imgViews[i].displayFrameInstance(numFrame, zoomValue / 100.0);
    }
*/    

    var imageView = this.dgInstance.ig.imgViews[0];
    // console.log("showFrame(), numFrame: " + imageView.numFrame + ", zoom: " + zoomValue);
    imageView.numFrame = numFrame;
    imageView.displayFrameInstance(numFrame, zoomValue / 100.0);

  }
  
}


// *****************************************************************************


/**
 * Element to contain the list of studies
 */
medview.html.StudyList = function(container)
{
  this.listArea = $("<div id=\"studyListArea\"/>");

  // ToDo: Dimensions (dynamic / responsive)
  var studyAreaHtml = '<input id="backFromStudy" type="button" value="Back">' +
    '<dl id="studyList" style="min-height: 300px; overflow: scroll; overflow-x: hidden;"></dl>';
  // height: 600px; 
  this.listArea.html(studyAreaHtml);

  container.append(this.listArea);

  $("#backFromStudy").click(function() {
    console.log("#backFromStudy.click()");
    $("#studyListArea").hide();
    $("#cFindArea").show();
  });

}


medview.html.StudyList.prototype.hide = function() {
  $("#studyListArea").hide();
};

medview.html.StudyList.prototype.show = function() {
  $("#studyListArea").show();
};

medview.html.StudyList.prototype.showLoading = function() {
  this.listArea.addClass("splashLoading");
};

medview.html.StudyList.prototype.hideLoading = function() {
  this.listArea.removeClass("splashLoading");
};

medview.html.StudyList.prototype.hideList = function() {

};

/**
 * Removes elements from the study list
 */
medview.html.StudyList.prototype.clear = function() {
  $("#studyList dt, #studyList dd").remove();
};


// *****************************************************************************

/**
 * Element to contain the list of series
 */
medview.html.SeriesList = function(container)
{
  this.listArea = $("<div id=\"seriesListArea\"/>");
  
  var seriesAreaHtml = '<input id="backFromSeries" type="button" value="Back">' +
    '<dl id="seriesList" style="min-height: 300px; overflow: scroll; overflow-x: hidden;"></dl>';
  this.listArea.html(seriesAreaHtml);

  container.append(this.listArea);
  
  $("#backFromSeries").click(function() {
    $("#seriesListArea").hide();
    $("#studyListArea").show();
  });

}

medview.html.SeriesList.prototype.hide = function() {
  $("#seriesListArea").hide();
};

medview.html.SeriesList.prototype.show = function() {
  $("#seriesListArea").show();
};


medview.html.SeriesList.prototype.showLoading = function() {
  this.listArea.addClass("splashLoading");
};

medview.html.SeriesList.prototype.hideLoading = function() {
  this.listArea.removeClass("splashLoading");
};

/**
 * Removes elements from the series list
 */
medview.html.SeriesList.prototype.clear = function() {
  $("#seriesList dt, #seriesList dd").remove();
};


// *****************************************************************************


/**
 * @class HiddenLayer
 * Base element to contain the full image
 * The element is created after the Dicom instance object has been loaded
 */
medview.html.HiddenLayer = function(numFrames, frameRows, frameCols)
{
  // ToDo: Multiframe support: Create an array of numFrames canvas ???

/*
// 20130614 in-memory canvas, out of the DOM
  this.layer = $('<canvas />');
  this.layer.css({
    'display': 'none'
  });
  container.append(this.layer);

  var canvas = this.layer[0];
  // console.log(canvas);
*/
  this.numFrames = numFrames;
  this.canvas = [];
  
  // The ideal solution would be creating just the necessary ImageData elements. Unfortunately a whole Canvas must be created for every frame.
  for (var i = 0; i < numFrames; i++) {
    this.canvas[i] = document.createElement('canvas');
    
    this.canvas[i].height = frameRows;
    this.canvas[i].width = frameCols;
  }
  
//  this.frameImgData = [];
  

};

medview.html.HiddenLayer.prototype.getCanvas = function(numFrame) {
//  return this.layer[0];
  return this.canvas[numFrame - 1];
};

medview.html.HiddenLayer.prototype.getFrame = function(numFrame) {
//  return this.layer[0];
  return this.frameImgData[numFrame - 1];
};

medview.html.HiddenLayer.prototype.setFrame = function(numFrame, imgData) {
//  return this.layer[0];
  this.frameImgData[numFrame - 1] = imgData;
};


// *****************************************************************************

/**
 * @class LoadingLayer
 */
medview.html.LoadingLayer = function(container, width, height)
{
/*
width = 300;
height = 200;
*/

  this.layer = $("<div class=\"splashLoading\">XYZ</div>");
  this.htmlContents = "<div class=\"txtLoading\">Loading...</div>";
  this.layer.html(this.htmlContents);

  this.layer.css({
    'display': 'none',
    'top': '0',
    'left': '0',
    'width': width + 'px',
    'height': height + 'px',
    'z-index': '3000'
  });
  container.append(this.layer);
//  this.setTxt("dummy");

};

medview.html.LoadingLayer.prototype.setSize = function(width, height) {
  this.layer.css({
    'width': width + 'px',
    'height': height + 'px'
  });
};

medview.html.LoadingLayer.prototype.setTxt = function(txt) {
//  console.log(this);
//  console.log("setTxt: " + txt);
  this.htmlContents = "<div class=\"txtLoading\">" + txt + "</div>";

//  $(this.layer).html(this.htmlContents);
  this.layer[0].innerHTML = this.htmlContents;
//  this.layer[0].innerHTML = "*";

//  this.layer[0].innerHTML = txt;

//  this.htmlContents.html(txt);
}


/*
medview.html.LoadingLayer.prototype.getCanvas = function() {
  return this.layer[0];
};
*/

// *****************************************************************************

/**
 * @class ImageLayer
 * Base element to display contents
 */
medview.html.ImageLayer = function(container, width, height, zIndex)
{
//  console.log
  this.layer = $('<canvas />');
  this.layer.css({
    'position': 'absolute',
    'top': '0px',
    'left': '0px',
    'width': width + 'px',
    'height': height + 'px',
    'z-index': zIndex
  });

  container.append(this.layer);

  // There are two sets of dimensions: Pixels inside the canvas and size of the canvas
  this.layer[0].width = width;
  this.layer[0].height = height;
};

medview.html.ImageLayer.prototype.setSize = function(width, height) {
  this.layer.css({
    'width': width + 'px',
    'height': height + 'px'
  });

  this.layer[0].width = width;
  this.layer[0].height = height;

};


medview.html.ImageLayer.prototype.getCanvas = function() {
  return this.layer[0];
};

// *****************************************************************************

/**
 * @class ImageView
 * Element to display contents. Formed by a set of ImageLayer elements
 * An ImageView is intended to be associated to a Dicom Instance
 */
medview.html.ImageView = function(container, numLayers, width, height, top, left)
{
  this.dicomInstance;
  this.numLayers = numLayers;

  this.iw = $('<div />');
  this.iw.css({
    'position': 'absolute',
    'top': top + 'px',
    'left': left + 'px',
    'width': width,
    'height': height,
    'background-color': 'black'
  });

  container.append(this.iw);

  this.txtOverlay = {
    "topLeft": [],
    "topRight": [],
    "bottomLeft": [],
    "bottomRight": []
  }

  this.hLayer; // Hidden Layer. Will be created on Dicom instance loading
  this.lLayer = new medview.html.LoadingLayer(this.iw, width, height);
  this.imgLayers = new Array();
  for (var i=0; i < numLayers; i++) {
    this.imgLayers[i] = new medview.html.ImageLayer(this.iw, width, height, i);
  }

  this.numFrames = 0; // Total number of frames
  this.numFrame = 0; // Currently displayed frame
  this.zoom = 100; // Current zoom value
  this.frameRate = 1; // fps
  this.play = false;
};

medview.html.ImageView.prototype.showLoading = function() {
  console.log("ImageView.showLoading()");
  this.lLayer.layer.css({'display': 'block'});
}

medview.html.ImageView.prototype.hideLoading = function() {
  this.lLayer.layer.css({'display': 'none'});
}

medview.html.ImageView.prototype.setDimensions = function(width, height, top, left) {
  this.iw.css({
    'position': 'absolute',
    'top': top + 'px',
    'left': left + 'px',
    'width': width,
    'height': height,
    'background-color': 'black'
  });
}


// *************************************


/**
 * After the instance has been loaded, a hidden layer is created to represent the image on RGB(A) space
 */
medview.html.ImageView.prototype.prepareHiddenLayer = function() {
}

medview.html.ImageView.prototype.displayTxtOverlay = function() {
  var txtCanvas = this.getImageLayer(1).getCanvas();
  var textContext = txtCanvas.getContext("2d");
  var minDimCanvas = Math.min(txtCanvas.width, txtCanvas.height);
  
  var fontSize = minDimCanvas / 32;
  var lineHeight = 1.5 * fontSize;
  textContext.font = fontSize + "px sans-serif";
  // context.textBaseline = "bottom";
  
  var posX, posY, deltaY;
  var txtPadding = 10;
  var text;

  for (var corner in this.txtOverlay) {
    switch (corner) {
      case "topLeft":
        textContext.textAlign = "left";
        posX = txtPadding;
        posY = txtPadding + lineHeight;
        deltaY = lineHeight;
        break;
        
      case "topRight":
        textContext.textAlign = "right";
        posX = txtCanvas.width - txtPadding;
        posY = txtPadding + lineHeight;
        deltaY = lineHeight;
        break;
        
      case "bottomLeft":
        textContext.textAlign = "left";
        posX = txtPadding;
        posY = txtCanvas.height - txtPadding;
        deltaY = -lineHeight;
        break;
        
      case "bottomRight":
        textContext.textAlign = "right";
        posX = txtCanvas.width - txtPadding;
        posY = txtCanvas.height - txtPadding;
        deltaY = -lineHeight;
        break;
    }
//      this.txtOverlay[corner]
    for (var i=0; i < this.txtOverlay[corner].length; i++) {
      text = this.txtOverlay[corner][i];
      
      // Black shadow
      textContext.fillStyle = "#000000";
      textContext.fillText(text, posX + 1, posY + 1);

      // White text over black shadow
      textContext.fillStyle = "#ffffff";
      textContext.fillText(text, posX, posY);

      posY += deltaY;
    }

//        result += objName + "." + prop + " = " + obj[prop] + "\n";
  }

}

// *************************************

/**
 * Displays information from the Dicom instance using an overlay layer.
 */
medview.html.ImageView.prototype.populateTxtOverlay = function() {

  this.txtOverlay["topLeft"].push(this.dicomInstance.getField(0x0010, 0x0010)); // Pat. Name
  this.txtOverlay["topLeft"].push(this.dicomInstance.getField(0x0010, 0x0030)); // Pat. Birthdate
  this.txtOverlay["topLeft"].push("Pat. Id: " + this.dicomInstance.getField(0x0010, 0x0020)); // Pat. Id.
  this.txtOverlay["topLeft"].push("Sex: " + this.dicomInstance.getField(0x0010, 0x0040)); // Pat. Sex

  this.txtOverlay["topRight"].push(this.dicomInstance.getField(0x0008, 0x0080)); // Institution Name
  this.txtOverlay["topRight"].push(this.dicomInstance.getField(0x0008, 0x1030)); // Study Description
  this.txtOverlay["topRight"].push(this.dicomInstance.getField(0x0008, 0x0022)); // Acquisition Date

  var modalityRC = this.dicomInstance.getField(0x0008, 0x0060) + " (" + // Modality
    this.dicomInstance.getField(0x0028, 0x0010) + ", " + // Rows
    this.dicomInstance.getField(0x0028, 0x0011) + ")"; // Cols
  this.txtOverlay["bottomLeft"].push(modalityRC);
  this.txtOverlay["bottomLeft"].push("Image #"+ this.dicomInstance.getField(0x0020, 0x0013)); // Instance Number

  // ToDo: Detect if value is present to avoid strings containing "false"
  this.txtOverlay["bottomRight"].push(this.dicomInstance.getField(0x0008, 0x103E)); // Series Description
  this.txtOverlay["bottomRight"].push("Series #" + this.dicomInstance.getField(0x0020, 0x0011)); // Series Number
    
}

// Tagged image layers instead of having just a numeric index ???
medview.html.ImageView.prototype.getImageLayer = function(ilNumber) {
  return this.imgLayers[ilNumber];
};

medview.html.ImageView.prototype.setDicomInstance = function(dicomInstance) {
  this.dicomInstance = dicomInstance;

  this.populateTxtOverlay();
  this.displayTxtOverlay();
  this.prepareHidden();
  this.dicomInstance.setHidden(true);
//  this.displayInstance(1.0);
  this.displayFrameInstance(1, 1.0);
};

medview.html.ImageView.prototype.hasDicomInstance = function() {
  var hasInstance = this.dicomInstance instanceof medview.dicom.Instance;
  console.log("hasDicomInstance: ");
  console.log(hasInstance);
  return hasInstance;
}

// *************************************

/**
 * Creates the whole image in a hidden canvas
 */
medview.html.ImageView.prototype.prepareHidden = function() {

  var numFrames, frameRows, frameCols;
  numFrames = this.dicomInstance.getField(0x0028, 0x0008)[0];
  numFrames = numFrames ? numFrames : 1;
  frameRows = this.dicomInstance.getField(0x0028, 0x0010)[0];
  frameCols = this.dicomInstance.getField(0x0028, 0x0011)[0];

  var start = new Date().getTime();
  


  var samplesPerPixel = this.dicomInstance.getField(0x0028, 0x0002)[0];
  console.log("samplesPerPixel: " + samplesPerPixel);

  // MONOCHROME1, MONOCHROME2, RGB, PALETTECOLOR
  // Otros: YBR_FULL, YBR_FULL_422, YBR_PARTIAL_422, YBR_RCT, YBR_ICT
  // http://www.medicalconnections.co.uk/kb/Photometric_Interpretations
  var photometricInterpretation = this.dicomInstance.getField(0x0028, 0x0004)[0];
  console.log("photometricInterpretation: " + photometricInterpretation);

  // Rescale: Modality LUT. Only for grayscale images.
  var rescaleIntercept = this.dicomInstance.getField(0x0028, 0x1052); // 0040,4178
  var rescaleSlope = this.dicomInstance.getField(0x0028, 0x1053); // 0040,4179
  
  var rescale = (rescaleIntercept !== false) && (rescaleSlope !== false);

  // console.log("rescale: " + rescale);  
  // console.log("rescaleIntercept: " + rescaleIntercept + ", rescaleSlope: " + rescaleSlope);

// iOS (iPad / iPhone) limitation. Big images are not displayed
// http://developer.apple.com/library/ios/#documentation/AppleApplications/Reference/SafariWebContent/CreatingContentforSafarioniPhone/CreatingContentforSafarioniPhone.html

  // ToDo: Lut function returning 3 parameters (R, G, B) 
  var populateImageData = function (buffer, imageData, lut) {
    var value;
    var i = 0;
    var pos = 0;
    
    for (var y = 0; y < frameRows; y++) {
      for (var x = 0; x < frameCols; x++) {
        // value = buffer[pos] * rescaleSlope + rescaleIntercept;
        // value = buffer[pos];
        value = lut(buffer[pos]);

        imageData.data[i]   = value; // R
        imageData.data[i+1] = value; // G
        imageData.data[i+2] = value; // B
        imageData.data[i+3] = 255;   // A

        i += 4;
        pos++;
      }
    }
    return imageData;
  }
  
  var instanceIV = this; // Instance of this ImageView
  
  // samplesPerPixel (0028,0002) = 3
  var populateImageDataRGB = function (buffer, imageData) {

    // Planar Configuration
    // http://www.medicalconnections.co.uk/kb/Planar_configuration
    // https://www.dabsoft.ch/dicom/3/C.7.6.3.1.3/
    // Read this value only for color images ???
    var planarConfiguration = instanceIV.dicomInstance.getField(0x0028, 0x0006)[0];

    var value;
    var i = 0;
    
    var posR, posG, posB, stepPos;
    
    if (planarConfiguration == 1) { // RRRR...GGGG...BBBB...
      posR = 0;
      posG = canvasHeight * canvasWidth;
      posB = 2 * posG;
      stepPos = 1;
    }
    else { // RGBRGBRGBRGB...
      posR = 0;
      posG = 1;
      posB = 2;
      stepPos = 3;
    }
    
//    for (var y = 0; y < canvasHeight; y++) {
//      for (var x = 0; x < canvasWidth; x++) {
    for (var y = 0; y < frameRows; y++) {
      for (var x = 0; x < frameCols; x++) {

        posR += stepPos;
        posG += stepPos;
        posB += stepPos;

        imageData.data[i]   = buffer[posR]; // R
        imageData.data[i+1] = buffer[posG]; // G
        imageData.data[i+2] = buffer[posB]; // B
        imageData.data[i+3] = 255;   // A
        
        i += 4;
      }
    }
    return imageData;
  }

  // 20130610: Adding support for PALETTE COLOR (ToDo)
  var populateImageDataPalette = function (buffer, imageData, lut) {
    var value;
    var i = 0;
    var pos = 0;
    
//    for (var y = 0; y < canvasHeight; y++) {
//      for (var x = 0; x < canvasWidth; x++) {
    for (var y = 0; y < frameRows; y++) {
      for (var x = 0; x < frameCols; x++) {
        // value = buffer[pos];
        value = lut(buffer[pos]);

        imageData.data[i]   = value["r"]; // R
        imageData.data[i+1] = value["g"]; // G
        imageData.data[i+2] = value["b"]; // B
        imageData.data[i+3] = value["a"]; // A

        i += 4;
        pos++;
      }
    }
    return imageData;
  }
 

  // https://www.dabsoft.ch/dicom/3/C.11.2.1.2/
  var wc, ww;
  if ((photometricInterpretation === "MONOCHROME1" || photometricInterpretation === "MONOCHROME2")) {
    wc = this.dicomInstance.getField(0x0028, 0x1050); // 0040,4176
    ww = this.dicomInstance.getField(0x0028, 0x1051); // 0040,4177

    console.log("WC: " + wc + ", WW: " + ww);
  
    var windowLevel = wc && ww;
    if (windowLevel) {
      wc = wc[0];
      ww = ww[0];
    }
    else {
      console.log("no window level");
      // obtain max / min values
      var pos = 0;
      var valMax = buffer[0];
      var valMin = buffer[0];

      for (var y = 0; y < frameRows; y++) {
        for (var x = 0; x < frameCols; x++) {
        // value = buffer[pos] * rescaleSlope + rescaleIntercept;
        // value = buffer[pos];
        value = buffer[pos];

        if (value > valMax) {
          valMax = value;
        }
        else if (value < valMin) {
          valMin = value; 
        }
        ww = valMax - valMin;
        wc = valMin + ww/2;

        // if (pos % 10000 == 0) {
        //   console.log("buffer[" + pos + "] = " + value);
        // }

        pos++;
      }
    }
    console.log("valMax: " + valMax + ", valMin: " + valMin + ", wc: " + wc + ", ww: " + ww);

/*    
      console.log("No preset window Levels. Using default values");
      wc = 40;
      ww = 350;
      */
    }
  }

  this.hLayer = new medview.html.HiddenLayer(numFrames, frameRows, frameCols);
  console.log(this);

  // 32-bit Pixel Manipulation ???
// http://jsperf.com/canvas-pixel-manipulation/68
// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
  
  // var hiddenLayer = this.hLayer;
  
  
/*
  var canvas = this.hLayer.getCanvas(1); // numFrame
  var canvasWidth  = canvas.width;
  var canvasHeight = canvas.height;
  // console.log("canvasWidth: " + canvasWidth + ", canvasHeight: " + canvasHeight);
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  // var imageData = ctx.createImageData(canvasWidth, canvasHeight);
*/

  var self = this; // Reference
  var populateFrame; // function to populate frames for any kind of images
  this.numFrames = numFrames; // Total number of frames
  this.numFrame = 0; // Currently displayed frame (store only one)
  this.frameRate = this.dicomInstance.getField(0x0008, 0x2144)[0]; // fps


  switch (photometricInterpretation) {

    case "MONOCHROME2":
    case "MONOCHROME1":
      var coefPhotInt = photometricInterpretation === "MONOCHROME2" ? 1 : -1;
      console.log("coefPhotInt: " + coefPhotInt);

  //  var maxOut = 255;
  //  var minOut = 0;
      var deltaY = 255;

      var coefA = coefPhotInt * deltaY / ww;
      var coefB = deltaY * (0.5 - coefPhotInt * wc/ww);
      var lut;      
       
      if (rescale) {
        rescaleSlope = rescaleSlope[0];
        rescaleIntercept = rescaleIntercept[0];
        lut = function(value) {return coefA * (rescaleSlope * value + rescaleIntercept) + coefB;}
      }
      else {
        lut = function(value) {return coefA * value + coefB;}
      }
//      populateImageData(lut);
      
      populateFrame = (function(i) {
        return populateImageData(self.dicomInstance.frameBuf[i], self.fimageData, lut);               
      });

      
      break;

    case "RGB":
//      populateImageDataRGB(this.dicomInstance.frameBuf[i], fimageData);
      
      populateFrame = (function(i) {
        return populateImageDataRGB(self.dicomInstance.frameBuf[i], self.fimageData);               
      });
      
      break;
      
    case "PALETTE COLOR":
      console.log("ImageView.prepareHidden() -> Palette color");
      var rPalette = this.dicomInstance.getField(0x0028, 0x1201); // 0040,4609
      var gPalette = this.dicomInstance.getField(0x0028, 0x1202); // 0040,4610
      var bPalette = this.dicomInstance.getField(0x0028, 0x1203); // 0040,4611

      lut = function(value) {        
        var pixel = {
          "r": rPalette[value],
          "g": gPalette[value],
          "b": bPalette[value],
          "a": 255
        };         
        return pixel;
      }


      populateFrame = (function(i) {
        var frameImageData = populateImageDataPalette(self.dicomInstance.frameBuf[i], self.fimageData, lut);               
        return frameImageData;
      });

      break;

      
    default:
      break;
  }


  this.processFrameInterval = false;
  this.processFrame(this, 0, numFrames, populateFrame);

  
//  this.dicomInstance.frameBuf = null;


  var end = new Date().getTime();
  var time = end - start;
  console.log("display time: " + time + "ms");

};


// Timed frame loop to avoid browser collapse
// http://kryogenix.org/days/2009/07/03/not-blocking-the-ui-in-tight-javascript-loops
medview.html.ImageView.prototype.processFrame = function(ivInstance, i, numFrames, populateFrame) {
  if (i < numFrames) {
    period = 0;
//  setTimeout(ImageView.prototype.processFrame, 1);
//     afInstance.frameInterval = setInterval(function(){afInstance.showFrameLoop(afInstance, imageView)}, period);

    var numFrame = i + 1;
    var fcanvas = ivInstance.hLayer.getCanvas(numFrame);
    var fcanvasWidth  = fcanvas.width;
    var fcanvasHeight = fcanvas.height;
    var fctx = fcanvas.getContext('2d');

    // console.log("canvasWidth: " + canvasWidth + ", canvasHeight: " + canvasHeight);
//        var fimageData = fctx.getImageData(0, 0, canvasWidth, canvasHeight);
//    var fimageData = fctx.createImageData(canvasWidth, canvasHeight);
    ivInstance.fimageData = fctx.createImageData(fcanvasWidth, fcanvasHeight);

//      populateImageDataPalette(lut); // display time, assoc object: 15 ~ 17ms, array: 24
//    console.log("Obtaining image data. Frame #" + i + "/" + numFrames);
    this.lLayer.setTxt("Processing frame #" + i + " / " + numFrames);
    
    
    fimageData = populateFrame(i); // display time, assoc object: 15 ~ 17ms, array: 24
    
    ivInstance.dicomInstance.frameBuf[i] = null; // Release frame buffer memory
    fctx.putImageData(fimageData, 0, 0);


    ivInstance.processFrameTimeout = setTimeout(function(){ivInstance.processFrame(ivInstance, i+1, numFrames, populateFrame)}, period);
  }
  else {
    ivInstance.endProcessing(ivInstance);
  }
}

medview.html.ImageView.prototype.endProcessing = function(self) {
  console.log("Frame processing ended");
  
  self.hideLoading();
}


// *****************************************************************************
// *****************************************************************************

medview.html.ImageView.prototype.setSizePos = function(width, height, top, left) {
  console.log("ImageView.setSizePos()");

  // iw.attr('class', 'imageview');
  this.iw.css({
    'top': top + 'px',
    'left': left + 'px',
    'width': width,
    'height': height
  });


  this.lLayer.setSize(width, height);
  for (var i=0; i < this.numLayers; i++) {
    this.imgLayers[i].setSize(width, height);
  }

  this.displayTxtOverlay();
//  this.displayInstance(1.0);
  this.displayFrameInstance(1, 1.0);

  // .setSize(deltaX, deltaY, offsetTop, offsetLeft);
}

// *****************************************************************************

/**
 * Copies some area of the hidden image to the visible canvas
 */
medview.html.ImageView.prototype.displayInstance_ = function(localZoom) {
  console.log("ImageView.displayInstance()");
  var start = new Date().getTime();

  var numFrame = 1;
  var canvas = this.hLayer.getCanvas(numFrame);
  var canvasWidth  = canvas.width;
  var canvasHeight = canvas.height;
  var ctx = canvas.getContext('2d');

/*
  console.log(canvas);
  var frameImageData = this.hLayer.getFrame(numFrame);
  console.log(frameImageData);
*/

  var canvas2 = this.getImageLayer(0).getCanvas();
  
  var context2 = canvas2.getContext('2d');
  context2.clearRect (0 ,0 , canvas2.width, canvas2.height);
  
  var imgZoom = Math.min(canvas2.width/canvasWidth, canvas2.height/canvasHeight) * localZoom;
  var newWidth = canvasWidth * imgZoom;
  var newX = (canvas2.width - newWidth) / 2;

  var newHeight = canvasHeight * imgZoom;
  var newY = (canvas2.height - newHeight) / 2;

  // http://www.w3schools.com/tags/canvas_drawimage.asp
  context2.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, newX, newY, newWidth, newHeight);
//  context2.putImageData(frameImageData, newX, newY, 0, 0, newWidth, newHeight);
  console.log(canvasWidth + "|" + canvasHeight + "|" + newX + "|" + newY + "|" + newWidth + "|" + newHeight + "|" + imgZoom);

//    alert("cw: " + canvasWidth + ", ch: " + canvasHeight + ", nw: " + newWidth + ", nh: " + newHeight);

  var end = new Date().getTime();
  var time = end - start;
  console.log("displayInstance(): " + time + "ms");
//  alert("displayInstance(): " + time + "ms");
}

// ToDo...
medview.html.ImageView.prototype.displayFrameInstance = function(numFrame, localZoom) {
  // console.log("ImageView.displayFrameInstance(" + numFrame + ", " + localZoom + ")");
  this.numFrame = numFrame;
  
  var start = new Date().getTime();

//  var numFrame = 1;

  var canvas = this.hLayer.getCanvas(numFrame);
  var canvasWidth  = canvas.width;
  var canvasHeight = canvas.height;
  var ctx = canvas.getContext('2d');
/*  
//  console.log(canvas);
  var frameImageData = this.hLayer.getFrame(numFrame);
//  console.log(frameImageData);
*/
  var canvas2 = this.getImageLayer(0).getCanvas();
  
  var context2 = canvas2.getContext('2d');
  context2.clearRect(0, 0, canvas2.width, canvas2.height);
  
  var imgZoom = Math.min(canvas2.width/canvasWidth, canvas2.height/canvasHeight) * localZoom;
  var newWidth = canvasWidth * imgZoom;
  var newX = (canvas2.width - newWidth) / 2;

  var newHeight = canvasHeight * imgZoom;
  var newY = (canvas2.height - newHeight) / 2;

  // http://www.w3schools.com/tags/canvas_drawimage.asp
  context2.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, newX, newY, newWidth, newHeight);
//  context2.putImageData(frameImageData, newX, newY, 0, 0, canvasWidth, canvasHeight);
//  console.log(canvasWidth + "|" + canvasHeight + "|" + newX + "|" + newY + "|" + newWidth + "|" + newHeight + "|" + imgZoom);

//    alert("cw: " + canvasWidth + ", ch: " + canvasHeight + ", nw: " + newWidth + ", nh: " + newHeight);

  var end = new Date().getTime();
  var time = end - start;
//  console.log("displayFrameInstance(): " + time + "ms");

//  alert("displayInstance(): " + time + "ms");
}


// *****************************************************************************

/**
 * @class ImageGrid
 * Main display element. Grid of ImageView elements
 * @param rows Number of rows in the grid
 * @param cols Number of columns in the grid
 */

// medview.html.ImageGrid = function(container, width, height, rows, cols)
medview.html.ImageGrid = function(container, width, height)
{
  this.width = width;
  this.height = height;
  this.rows = 0;
  this.cols = 0;
  
  // Mapping between the Dicom Instances and the ImageViews. Change this ???
  this.indexInstances = {};

  this.grid = $('<div />');
  this.grid.css({
    'position': 'absolute',
    'top': '0px',
    'left': '0px',
    'width': this.width,
    'height': this.height,
    'z-index': 0
  });
  container.append(this.grid);

  this.imgViews = new Array();

  this.numLayers = 2;

//  this.setRowsCols(rows, cols);


  this.instanceLoaded = function(instance) {
    console.log("Instance loaded");
    instance.setLoaded(true); // MF still to be processed
    // Pairs the ImageView Object to the DicomInstance just loaded
    this.indexInstances[instance.uid].setDicomInstance(instance);
//    this.indexInstances[instance.uid].hideLoading();
  }
};

// *************************************

/**
 * Gets the array position for a given pair row, col
 */
medview.html.ImageGrid.prototype.getPos = function(row, col)
{
  var pos = col + row * this.cols;
  // console.log("getPos(), row: " + row + ", col: " + col + " , this.cols: " + this.cols + ", pos: " + pos);
  return pos;
};


medview.html.ImageGrid.prototype.clear = function() {

  // The pairing between DicomInstances and ImageViews is cleared
  for(var uid in this.indexInstances) {
    delete this.indexInstances.uid;
  }

  // Current ImageViews are removed
  this.imgViews.splice(1, this.imgViews.length);
  
  this.grid.empty();
}


medview.html.ImageGrid.prototype.setRowsCols = function(numRows, numCols) {

  console.log("+++ setRowsCols() +++ START");
  this.clear();
  
  this.rows = numRows;
  this.cols = numCols;

  var deltaX = this.width / numCols;
  var deltaY = this.height / numRows;

  var offsetTop = 0;
  var offsetLeft = 0;
  for (var row=0; row < numRows; row++) {
    offsetLeft = 0;
    for (var col=0; col < numCols; col++) {
      // Examine if there is already an ImageView for that position
      var pos = this.getPos(row, col);
      if (this.imgViews[pos]) {
        // Resize the ImageView
        console.log("No new ImageView");
        this.imgViews[pos].setDimensions(deltaX, deltaY, offsetTop, offsetLeft);
      }
      else {
        console.log("New ImageView");
        this.imgViews[pos] = new medview.html.ImageView(this.grid, this.numLayers, deltaX, deltaY, offsetTop, offsetLeft);
      }
      // Clear the unused ImageViews ???
      // console.log("ImageView created, row: " + row + ", col: " + col + ", offsetTop: " + offsetTop + ", offsetLeft: " + offsetLeft);
      offsetLeft += deltaX;
    }
    offsetTop += deltaY;
  }
  console.log("--- setRowsCols() --- END");

}


medview.html.ImageGrid.prototype.setSize = function(width, height) {
  console.log("ImageGrid.setSize()");
  this.width = width;
  this.height = height;

  this.grid.css({
    'width': this.width,
    'height': this.height
  });

  var deltaX = this.width / this.cols;
  var deltaY = this.height / this.rows;


  var offsetTop = 0;
  var offsetLeft = 0;
  for (var row=0; row < this.rows; row++) {
    offsetLeft = 0;
    for (var col=0; col < this.cols; col++) {
      this.imgViews[this.getPos(row, col)].setSizePos(deltaX, deltaY, offsetTop, offsetLeft);

      // console.log("ImageView created, row: " + row + ", col: " + col + ", offsetTop: " + offsetTop + ", offsetLeft: " + offsetLeft);
      offsetLeft += deltaX;
    }
    offsetTop += deltaY;
  }

};

medview.html.ImageGrid.prototype.getImageView = function(ivNumber) {
  // Throw error if someone tries to access an unexistent ImageView
  var iv = ivNumber < this.imgViews.length ? this.imgViews[ivNumber] : false;
  return iv;
};

// *****************************************************************************

