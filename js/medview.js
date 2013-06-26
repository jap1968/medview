/**
 * Main medview script
 * jQuery required
 */

/**
 * @namespace Main medview namespace.
 */ 
var medview = medview || {};

// Alternative method to load .js files
/*
var medviewBase = "js/";
$.getScript(medviewBase + "html.js",
  function(data, textStatus, jqxhr) {
    // console.log(data); //data returned
    console.log(textStatus); //success
    console.log(jqxhr.status); //200
    medviewInit();
  });
*/
var mainDG;

function medviewInit() {
  console.log("medview loaded");
  
  // ToDo: Join these initialization steps
  var dg = new medview.gateway.DicomGateway();
  mainDG = dg;
  var fg = new medview.html.CFindForm($('#controls'), dg);  
  dg.studyList = new medview.html.StudyList($('#cFindArea'));
  dg.seriesList = new medview.html.SeriesList($('#cFindArea'));

  var adj = new medview.html.AdjustForm($('#adjControls'), dg);
 
//  id="imgGrid";
}

$(document).ready(function(){
    // initialise the application
    medviewInit();
    medviewResize();
});

// Avoid multiple resize invocations
// http://stackoverflow.com/a/668185/176974

function medviewResize() {

  console.log("medviewResize()");
  var viewportWidth = $(window).width();
  var viewportHeight = $(window).height();
  var cw = document.documentElement.clientWidth;
  var ch = document.documentElement.clientHeight;
  var iw = window.innerWidth;
  var ih = window.innerHeight;
  
//  alert("Size: W: " + viewportWidth + ", H: " + viewportHeight + ", CW: " + cw + ", CH: " + ch + ", iw: " + iw + ", ih: " + ih);
  mainDG.setSize(viewportWidth, viewportHeight);
//  console.log($(this));

}

var resizeTimeOut = false;
$(window).resize(function(){
  if (resizeTimeOut !== false) {
    clearTimeout(resizeTimeOut);
  }
  resizeTimeOut = setTimeout(medviewResize, 200);
});

