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
 * @namespace gateway
 */

medview.gateway = medview.gateway || {};

// *****************************************************************************

/**
 * @class Study
 */
medview.gateway.DicomGateway = function()
{
  this.uid;
  this.study;
  this.series;
  
  this.studyList; // StudyList html element
  this.seriesList; // SeriesList html element
  
  this.ig; // ImageGrid object. Different gateway ???

  // Location of the Dicom Q/R | C-Find gateway script
  // dcmgw: https://github.com/jap1968/dcmgw
  
  this.gwScript = "../dcmgw/dcmgw.php";

/*
  this.parseRes = function(xml) {
    console.log("parseRes");
    console.log(this);
    console.log(xml);
  }
*/

  /**
   * URL to get the DICOM file through WADO
   * A gateway can be necessary if the WADO service is running on a different server
   */
  this.getUriWado = function(studyUID, seriesUID, instanceUID) {
    var uri = this.gwScript + "?operation=wado" +
      "&studyUID=" + studyUID +
      "&seriesUID=" + seriesUID +
      "&objectUID=" + instanceUID + 
      "&contentType=application/dicom";
    console.log("getUriWado: " + uri);
    return uri;
  }

  this.convertDate = function (date8) {
    var year = date8.substring(0, 4);
    var month = date8.substring(4, 6);
    var day = date8.substring(6, 8);
    var date10 = year + '-' + month + '-' + day;
    return date10;
  }


// *************************************

  this.getStudyData = function(xml) {
    var study = {};

    // 00100020 : Patient ID
    study["patId"] = $(xml).find("attr[tag=00100020]").text();
    // 00100010 : Patient's Name
    study["patName"] = $(xml).find("attr[tag=00100010]").text();
    // 00100030 : Patient's Birth Date
    study["patBDate"] = $(xml).find("attr[tag=00100030]").text();
    study["patBDate"] = this.convertDate(study["patBDate"]);
    // 00100040 : Patient's Sex
    study["patSex"] = $(xml).find("attr[tag=00100040]").text();
    // 00080020 : Study Date
    study["studyDate"] = $(xml).find("attr[tag=00080020]").text();
    study["studyDate"] = this.convertDate(study["studyDate"]);
    // 00080061 : Modalities in Study
    study["studyMods"] = $(xml).find("attr[tag=00080061]").text();
    // 00081030 : Study Description
    study["studyDescr"] = $(xml).find("attr[tag=00081030]").text();
    // 00201206 : Number of Study Related Series
    study["studyNumSeries"] = $(xml).find("attr[tag=00201206]").text();
    // 0020000D : Study Instance UID
    study["studyUID"] = $(xml).find("attr[tag=0020000D]").text();

//    console.log(study);
    return study;
  }

// *************************************

  /**
   * Parses the results from a general C-Find query
   * Populates the StudyListArea with these results.
   */
  //medview.gateway.DicomGateway.prototype.parseXmlCFind = function(xml) {
  this.parseXmlCFind = function(xml) {

    console.log("medview.gateway.DicomGateway.parseXmlCFind()");
    console.log(xml);
    // http://stackoverflow.com/a/962040/176974
    var gwInstance = this; // self
    
    console.log(this);
  //  xmlCFind = xml;

    var studyList = $("#studyList");

    var lastPatId = '!';

    // loop on every response (study)
    $(xml).find("response").sort(function(a, b) {
      // Ordering (I): Patient identifier, as alphanumeric data
      var patIdA = $(a).find("attr[tag=00100020]").text();
      var patIdB = $(b).find("attr[tag=00100020]").text();
      if (patIdA == patIdB) {
        var studyDateA = $(a).find("attr[tag=00080020]").text();
        var studyDateB = $(b).find("attr[tag=00080020]").text();
        // Ordering (II): Study date (more recent come first)
        return studyDateA < studyDateB ? 1 : -1;
      }
      else {
        return patIdA < patIdB ? -1 : 1; // Lower patient id comes first
      };
    }).each(function() {

      var studyData = gwInstance.getStudyData($(this));

      // Sex: M, F, U, MP, FP, H, MC, FC, 121104, 121032, 121102, 121103 (O)
      // M: Male, F: Female, ...
      var patSex = studyData["patSex"];
      var sexClass;
      switch (patSex) {
        case('M'):
          sexClass = 'male';
          break;
        case('F'):
          sexClass = 'female';
          break;
        default:
          sexclass = '';
      }
//      console.log("patSex: " + patSex);
      
      var patInfo =  "<span class=\"patient\"><span class=\"patId\">" + studyData["patId"] + "</span>: <span class=\"" + sexClass + "\">" + studyData["patName"] + "</span> (<span class=\"birthdate\">" + studyData["patBDate"] + "</span>)</span>";

      if (studyData["patId"] != lastPatId) {
        $('<dt data-role="list-divider"></dt>').html(patInfo).appendTo(studyList);
        lastPatId = studyData["patId"];
      }

      $('<dd class="study" studyUID="' + studyData["studyUID"] + '"></dd>').html(studyData["studyDate"] + ' - ' + studyData["studyMods"] + studyData["studyDescr"] + studyData["studyNumSeries"]).appendTo(studyList);

    });

// *****************

    /**
     * When a Study is selected, a medview.dicom.Study instance is created
     */
    $("dd.study").click(function() {
      console.log("study.click");
      console.log(gwInstance);
      
      gwInstance.studyList.hide();
      gwInstance.seriesList.clear();
      gwInstance.seriesList.show();
      gwInstance.seriesList.showLoading();

      var studyUID = $(this).attr('studyUID');
      gwInstance.study = new medview.dicom.Study(studyUID);
     
      $(xml).find("response").each(function() {
        xmlStudyUID = $(this).find("attr[tag=0020000D]").text();
        if (xmlStudyUID == studyUID) {
          console.log(this);

          var studyData = gwInstance.getStudyData($(this));
          var patInfo = studyData["patId"] + ": " + studyData["patName"] + " (" + studyData["patBDate"] + ")";

// dt: Patient / study info
// dd: Series info

          $('<dt data-role="list-divider"></dt>').html("" + patInfo + "<br/>" + studyData["studyDate"] + ": " + studyData["studyMods"] + studyData["studyDescr"] + studyData["studyNumSeries"] + '<span class="ui-li-count">' + '</span>').appendTo(seriesList);

        }
      });

      uri = gwInstance.gwScript + "?operation=cfind&studyUID=" + studyUID;

      $.ajax({
        type: "GET",
        url: uri,
        dataType: "xml"
      }).done(function(xml, textStatus, jqXHR) {
        gwInstance.parseXmlStudy(xml);
      }).always(function() {
        gwInstance.seriesList.hideLoading();
      });
    });
  }

};

// *************************************

medview.gateway.DicomGateway.prototype.getSeriesData = function(xml) {

    var series = {};

    // 00200011 : Series Number
    series["seriesNumber"] = $(xml).find("attr[tag=00200011]").text();
    // 00080060 : Modality
    series["modality"] = $(xml).find("attr[tag=00080060]").text();
    // 0008103E : Series Description
    series["seriesDescr"] = $(xml).find("attr[tag=0008103E]").text();
    // 0020000E : Series Instance UID
    series["seriesUID"] = $(xml).find("attr[tag=0020000E]").text();

    // console.log(series);
    return series;
  }

// *****************************************************************************

medview.gateway.DicomGateway.prototype.parseXmlStudy = function(xml) {

  console.log("*** parseXmlStudy ***");
  console.log(xml);
  console.log(this);
  var gwInstance = this;
  
  console.log(this.study);
  var seriesList = $("#seriesList");

  // loop on every response (series)
  $(xml).find("response").sort(function(a, b) {
    // Se ordena por "Series Number"
    var seriesNumA = Number($(a).find("attr[tag=00200011]").text());
    var seriesNumB = Number($(b).find("attr[tag=00200011]").text());
    return seriesNumA < seriesNumB ? -1 : 1; // Lower numbers come first
  }).each(function() {
    var respNumber = $(this).attr('number');
    var numInstances = $(xml).find("qresponse[qrequest=" + respNumber + "]").length;

    // 20120120: Get series information
    var seriesData = gwInstance.getSeriesData($(this));
    seriesData.numInstances = numInstances;
    gwInstance.study.addSeries(seriesData);

//      console.log(seriesData);

    var seriesUID = seriesData["seriesUID"];

    console.log(gwInstance.study.series[seriesData["seriesUID"]]);

    var liData = '';
    liData += "" + seriesData["modality"] + " [ " + numInstances + " ]";
    liData += " - " + seriesData["seriesDescr"];
    liData += '';

    $('<dd class="series" respNumber="' + respNumber + '" seriesUID="' + seriesData["seriesUID"] + '"></dd>').html(liData).appendTo(seriesList);

  });
  console.log("#seriesListArea.show()");
  $("#seriesListArea").show();
  
// *****************

  /**
   * When a Series is selected...
   */

  $("dd.series").click(function() {

    var seriesUID = $(this).attr('seriesUID');

// ***
// Select series: mark selected and clear previous series information (sortedInstances)
    gwInstance.series = gwInstance.study.series[seriesUID];
    gwInstance.series.clearInstances();

//      gwInstance.study.selectSeries(seriesUID);

    console.log(gwInstance.study);
    
    // ToDo: Change this !!!! Horror!!!!
    // launches the click tab event
    $('#cFindTab').click();


    var respNumber = $(this).attr('respNumber');
    console.log("click: " + seriesUID + ", respNumber: " + respNumber);

    var numInstances = $(xml).find("qresponse[qrequest=" + respNumber + "]").length;

    $(xml).find("qresponse[qrequest=" + respNumber + "]").sort(function(a, b) {
      // Se ordena por "Instance Number"
      var instanceNumA = Number($(a).find("attr[tag=00200013]").text());
      var instanceNumB = Number($(b).find("attr[tag=00200013]").text());
      return instanceNumA < instanceNumB ? -1 : 1; // Primero las instancias con menor num
    }).each(function() {

      var instanceNum = Number($(this).find("attr[tag=00200013]").text());
//        console.log("instanceNum: " + instanceNum);
      
      // 0020000D : Study Instance UID
      var studyUID = $(this).find("attr[tag=0020000D]").text();
      // 0020000E : Series Instance UID
      var seriesUID = $(this).find("attr[tag=0020000E]").text();
      // 00080018 : SOP Instance UID
      var objectUID = $(this).find("attr[tag=00080018]").text();

      gwInstance.series.addInstance(objectUID);
      // add the full instance data / raw xml ???

    });
    
    gwInstance.displaySeries();
    // Displays the object:
          
  });
  
}

// *****************************************************************************

medview.gateway.DicomGateway.prototype.layoutGrid = function() {

  var viewportWidth = $(window).width();
  var viewportHeight = $(window).height();
  var ratioWH = viewportWidth / viewportHeight;

  var numInstances = this.series.getNumInstances();
  var minPixels = 360; // Minimum size in pixels of an ImageView
  var maxRows = Math.floor(viewportHeight / minPixels);
  var maxCols = Math.floor(viewportWidth / minPixels);

  var ratio = numInstances / (maxRows * maxCols);
    
//    var desiredRows = Math.min(3, Math.max(1, Math.floor(Math.sqrt(numInstances / ratioWH))));
//    var desiredCols = Math.min(4, Math.max(1, Math.floor(Math.sqrt(numInstances / ratioWH) * ratioWH)));

  var desiredRows = Math.min(maxRows, Math.max(1, ratio * maxRows));
  var desiredCols = Math.min(maxCols, Math.max(1, ratio * maxCols));
    
  console.log("dRows: " + desiredRows + ", dCols: " + desiredCols);

// *** 20130522: Test. Force 1 x 1
//  this.ig.setRowsCols(1, 1);
  this.ig.setRowsCols(desiredRows, desiredCols);

}

// *****************************************************************************

// To be replaced: layoutGrid() + displayGridSeries()
medview.gateway.DicomGateway.prototype.displaySeries = function() {

  var series = this.series;

  console.log("displaySeries");
  // console.log(this);

  var numInstances = series.getNumInstances();
  console.log("displaySeries. numInstances: " + numInstances);

  var viewportWidth = $(window).width();
  var viewportHeight = $(window).height();
  var ratioWH = viewportWidth / viewportHeight;
  
  var desiredRows = Math.min(3, Math.max(1, Math.floor(Math.sqrt(numInstances / ratioWH))));
  var desiredCols = Math.min(4, Math.max(1, Math.floor(Math.sqrt(numInstances / ratioWH) * ratioWH)));
  
  console.log("dRows: " + desiredRows + ", dCols: " + desiredCols);

  $('#imgGrid').empty();
//  this.ig = new medview.html.ImageGrid($('#imgGrid'), viewportWidth, viewportHeight, 0, 0);
  this.ig = new medview.html.ImageGrid($('#imgGrid'), viewportWidth, viewportHeight);
  
  this.layoutGrid();
  this.displayGridSeries();
}

// *****************************************************************************

// Cargar imagenes de modo que permita cambiar grid y offset inicial
medview.gateway.DicomGateway.prototype.displayGridSeries = function() {
//  var ig = new medview.html.ImageGrid($('#imgGrid'), viewportWidth, viewportHeight, desiredRows, desiredCols);
  var series = this.series;

//  this.ig = ig; // ImageGrid
  var ig = this.ig;

  var offsetInstance = 0; // Initial instance to display
  var pos;
  var instance;
  var iv; // ImageView
  var instanceNum;
//    var iv; // ImageView
  var urlDicom;
  // numInstances: No salirse del array!!!
  
  for (var row=0; row < ig.rows; row++) {
    offsetLeft = 0;
    for (var col=0; col < ig.cols; col++) {
      pos = ig.getPos(row, col);
      // console.log("pos: " + pos);
            
      instanceNum = offsetInstance + pos;
      // console.log("instanceNum: " + instanceNum);
      if (instance = series.getInstanceNum(instanceNum)) {
        iv = ig.getImageView(pos);
        console.log(iv);
        ig.indexInstances[instance.uid] = iv;
        iv.showLoading();

        console.log(instance);

        // Once loaded, the ImageGrid object is notified.
        if (instance.loaded) {
          ig.instanceLoaded(instance);
        }
        else {
          // show loading icon splash should be started here
          urlDicom = this.getUriWado(series.study.uid, series.uid, instance.uid);
          instance.load(urlDicom, function(dicomInstance) {ig.instanceLoaded(dicomInstance);});
        }
      }
      
    }
  }
}


// *****************************************************************************

medview.gateway.DicomGateway.prototype.getStudyInfo = function(studyUID) {
  uri = this.gwScript + "?operation=cfind&studyUID=" + studyUID;
    //alert('cfind: ' + uri);
  console.log(uri);

  $.ajax({
    type: "GET",
    url: uri,
    dataType: "xml",
    success: this.parseXmlStudy
  });
}

// *****************************************************************************

medview.gateway.DicomGateway.prototype.setSize = function(width, height) {
  console.log(this);
  if (this.ig) {
    this.ig.setSize(width, height);
    if (this.series) {
      this.layoutGrid();
      this.displayGridSeries();
    }
  }
}

// *****************************************************************************

