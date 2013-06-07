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
 * @namespace dicom
 * http://stackoverflow.com/a/2912492/176974
 * http://elegantcode.com/2011/01/26/basic-javascript-part-8-namespaces/
 */

medview.dicom = medview.dicom || {};

// *****************************************************************************

/**
 * @class Study
 */
medview.dicom.Study = function(uid)
{
  this.uid = uid;
  console.log("Study. UID: " + this.uid);

  this.series = {};
//  this.seriesUID; // Selected series . NO, en gateway !!!

  this.addSeries = function(seriesData) {
    var seriesUID = seriesData["seriesUID"];
    var series = new medview.dicom.Series(seriesUID);
    series.setSeriesData(seriesData);
    series.setStudy(this);
    this.series[seriesUID] = series;
  }

  this.selectSeries = function(seriesUID) {
    this.seriesUID = seriesUID;
  }


};

/*
medview.dicom.Study.prototype.selectSeries = function(seriesUID) {
  this.seriesUID = seriesUID;
}
*/

// *****************************************************************************

/**
 * @class Series
 */
medview.dicom.Series = function(uid)
{
  // Series Instance UID
  this.uid = uid;
  this.study; // Reference to the study object
  this.seriesData;
  
  // Instance objects are referenced two ways: By UID and by Instance number
  this.instances = {};
  this.sortedInstances = [];

  this.setStudy = function(study) {
    this.study = study;
  }

  this.addInstance = function(instanceUID) {
    var instance = new medview.dicom.Instance(instanceUID);
    instance.setSeries(this);
    this.instances[instanceUID] = instance;
    this.sortedInstances.push(instance);
  }

  this.getNumInstances = function() {
//    var numInstances = this.seriesData["numInstances"];    
    var numInstances = this.sortedInstances.length;
    return numInstances;
  }

  this.getInstanceNum = function(pos) {
    // console.log("getInstanceNum() pos: " + pos);
    var instance = pos < this.sortedInstances.length ? this.sortedInstances[pos] : false;
    return instance;
  }

};

/**
 * When a series is created, the information obtained through Q/R is stored
 */
medview.dicom.Series.prototype.setSeriesData = function(seriesData) {
  this.seriesData = seriesData;
}


medview.dicom.Series.prototype.clearInstances = function() {
  console.log("Series.clearInstances()");
  console.log(this);
  this.instances = {};
  this.sortedInstances = [];
}

// *****************************************************************************

/**
 * @class Instance
 */
medview.dicom.Instance = function(uid)
{
  // SOP Instance UID
  this.uid = uid;
  this.series; // Reference to the series object
  this.loaded = false;
  
  var mih; // medview.dicom.MetaInformationHeader
  this.groups = {};
//  this.ab; // ArrayBuffer (response)
  this.sampleBuf = {}; // Array buffer with the samples

/*  
  // 32-bit Pixel Manipulation ???
  // http://jsperf.com/canvas-pixel-manipulation/68
  // https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
*/

};


medview.dicom.Instance.prototype.setSeries = function(series) {
  this.series = series;
}


/**
 * Loads a Dicom instance (via Wado)
 */
medview.dicom.Instance.prototype.load = function(url, callback) {

  var instance = this;
  
  var xhr = new XMLHttpRequest();

  xhr.open('GET', url, true); // true: asynchronous | false: synchronous
  xhr.responseType = 'arraybuffer';

  var start = new Date().getTime(this);

  // console.log("tIni: " + start);

  // var len = Number($(xml).find("dicom>attr[tag=7FE00010]").attr('len'));

  xhr.onload = function(e) {
    // console.log(e);
    if (this.status == 200) { // HTTP 200 : OK
      var end = new Date().getTime();
      var time = end - start;
      // console.log("size: " + len + " bytes");
      console.log("load time: " + time + "ms");
//        instance.ab = this.response; // The instance points to the ArrayBuffer (response)
      instance.parse(this.response);
      instance.prepareSampleBuffer(this.response);
//        instance.display(document.getElementById('canvas1'));
      
      callback(instance);
      
      // var speed = len * 8 / (time * 1000);
      // console.log("speed (Mbps): " + speed + "Mbps");
      
      // Int8Array Int8Array(ArrayBuffer buffer, optional unsigned long byteOffset, optional unsigned long length);
      
    }
  }

  xhr.onerror = function(e) {
    console.log("Error loading");
  };

  xhr.onprogress = function(e) {
    // console.log("onprogress");
    // console.log(e);
    // console.log(e.loaded);
  };

  // Request invocation after definition
  xhr.send(null);
};


/**
 * Parses the raw buffer containing a Dicom instance
 */
medview.dicom.Instance.prototype.parse = function(buffer) {

  // console.log('parse');
  var strMagic;

  try {
    // Verification of "magic number" 
    var magic = new Uint8Array(buffer, 128, 4);
    // array to string: http://stackoverflow.com/a/9936506/176974
    strMagic = String.fromCharCode.apply(null, magic);
//      var strMagic = String.fromCharCode.apply(null, new Uint8Array(buffer, 128, 4)); // Solucion mas compacta
  }
  catch(err) {
    strMagic = "";
    console.error(err);    
    console.error("Unable to read DICOM headers.");
  }

  console.log(strMagic);
  if (strMagic === "DICM") {
    // console.log("cmp: OK");
    var mihOffset = 128 + 4;
    var dv = new DataView(buffer);

    mih = new medview.dicom.MetaInformationHeader(dv, mihOffset, this);
    
    var transferSyntaxUID = this.getField(0x0002, 0x0010)[0];
    console.log(transferSyntaxUID);

    var explicit;
    var littleEndian;

    // http://www.medicalconnections.co.uk/kb/Transfer_Syntax
    switch (transferSyntaxUID) {
      case "1.2.840.10008.1.2": // Implicit VR Little-endian
        console.log("Implicit VR Little-endian");
        explicit = false;
        littleEndian = true;
        break;
        
      case "1.2.840.10008.1.2.1": // Explicit VR Little-endian
        console.log("Explicit VR Little-endian");
        explicit = true;
        littleEndian = true;
        break;

      case "1.2.840.10008.1.2.2": // Explicit VR Big-endian
        console.log("Explicit VR Big-endian");
        explicit = true;
        littleEndian = false;
        break;

// 20130522: Test to read SQ elements (US MF ECO)
      default:
        console.log("Non supported TransferSyntaxUID");
//          throw new Error("Unsupported TransferSyntaxUID");
          explicit = true;
          littleEndian = true;
        break;
    }

// Parse dicom data     
    var curOffset = mihOffset + mih.getLocalOffset();
        
    console.log(dv.byteLength);

    while (curOffset < dv.byteLength) {
      var nextElement = new medview.dicom.DataElement(dv, curOffset, littleEndian, explicit);
      curOffset += nextElement.getLocalOffset();
      this.addDataElement(nextElement);
//        console.log(nextElement);
    }
    console.log(this);

  }

}; // parse()


// http://dicomiseasy.blogspot.com.es/2012/08/chapter-12-pixel-data.html
medview.dicom.Instance.prototype.prepareSampleBuffer = function(buffer) {

  // ToDo: Test if is a supported class
//    var sopClassUID = instance.getField(0x0008, 0x0016); // 20130429
  var sopClassUID = this.getField(0x0008, 0x0016);

  console.log("SOPClassUID: " + sopClassUID);
  
  var samplesPerPixel = this.getField(0x0028, 0x0002);

  
  var numFrames = this.getField(0x0028, 0x0008);
  var rows = this.getField(0x0028, 0x0010);
  var cols = this.getField(0x0028, 0x0011);

  // http://www.dabsoft.ch/dicom/3/C.7.6.3/
  var bitsAllocated = this.getField(0x0028, 0x0100);
  var bitsStored = this.getField(0x0028, 0x0101);
  var highBit = this.getField(0x0028, 0x0102);
  var pixelRepresentation = this.getField(0x0028, 0x0103); // 0: unsigned | 1: signed

  console.log("bitsAllocated: " + bitsAllocated + ", pixelRepresentation: " + pixelRepresentation);

  var pixelBufferStart = this.getDataElement(0x7FE0, 0x0010).curOffset - this.getDataElement(0x7FE0, 0x0010).vl;
  var pixelBufferLength = this.getDataElement(0x7FE0, 0x0010).vl;

  console.log("pixelBufferStart: " + pixelBufferStart + ", pixelBufferLength: " + pixelBufferLength);

  // sampleBuf;
  if (bitsAllocated == 8) {
    this.sampleBuf['length'] = pixelBufferLength;
    if (pixelRepresentation == 0) {
      this.sampleBuf['buffer'] = new Uint8Array(buffer, pixelBufferStart, pixelBufferLength);
    }
    else { // pixelRepresentation == 1
      this.sampleBuf['buffer'] = new Int8Array(buffer, pixelBufferStart, pixelBufferLength);
    }
  }
  else { // bitsAllocated == 16
    this.sampleBuf['length'] = pixelBufferLength / 2;
    if (pixelRepresentation == 0) {
      this.sampleBuf['buffer'] = new Uint16Array(buffer, pixelBufferStart, this.sampleBuf['length']);
    }
    else { // pixelRepresentation == 1
      this.sampleBuf['buffer'] = new Int16Array(buffer, pixelBufferStart, this.sampleBuf['length']);
    }
  }
      
  console.log("Rows: " + rows + ", cols: " + cols);    

}



/**
 * Adds a DataElement creating the necessary structure (group, element)
 */
medview.dicom.Instance.prototype.addDataElement = function(dataElement) {
  var idxGroup = 'group.' + dataElement.group;
  var idxElement = 'element.' + dataElement.element;
  // console.log("addDataElement, idxGroup: " + idxGroup + ", idxElement: " + idxElement);
  if (!(idxGroup in this.groups)) {      
    this.groups[idxGroup] = {};
  }
  this.groups[idxGroup][idxElement] = dataElement;
}

/**
 * Returns the DataElement for a given pair (group, element)
 */
medview.dicom.Instance.prototype.getDataElement = function(group, element) {
  var idxGroup = 'group.' + group;
  var idxElement = 'element.' + element;

  if (idxGroup in this.groups && idxElement in this.groups[idxGroup]) {
    return this.groups[idxGroup][idxElement];
  }
  else {
    return false;
  }
};

/**
 * Returns the field value of DataElement given the pair (group, element)
 */
medview.dicom.Instance.prototype.getField = function(group, element) {
  var dataElement = this.getDataElement(group, element);
  if (dataElement) {
    return dataElement['field'];
  }
  else {
    return false;
  }
};


medview.dicom.Instance.prototype.setLoaded = function(statusLoaded) {
  this.loaded = statusLoaded;
};


// *****************************************************************************

/**
 * @class MetaInformationHeader
 */
medview.dicom.MetaInformationHeader = function(dv, offset, dicomInstance)
{
  // Initial buffer offset: 128 (reserved) + 4 (magic word)
  
  var littleEndian = true; // Meta information: LittleEndian, Explicit VR
  var explicit = true;
  this.elements = {};
  this.localOffset;
  var groupLength = 0;
  
  var firstElement = new medview.dicom.DataElement(dv, offset, littleEndian, explicit);
  dicomInstance.addDataElement(firstElement);
//  groupLength += de.getLocalOffset();
  this.elements['element.' + firstElement.element] = firstElement;
  if (firstElement.element == 0x0000) {
    // console.log("group.length: " + firstElement.field);
    while (groupLength < firstElement.field) {
      var nextElement = new medview.dicom.DataElement(dv, offset + firstElement.getLocalOffset() + groupLength, littleEndian, explicit);
      dicomInstance.addDataElement(nextElement);
      groupLength += nextElement.getLocalOffset();
    }
  }
  else {
    // Read propely groups without element.length dicomElement
    throw new Error("Meta header group length is not present!");
  }


  // console.log(this.elements);
  this.localOffset = firstElement.getLocalOffset() + groupLength;
};

medview.dicom.MetaInformationHeader.prototype.getLocalOffset = function() {
  return this.localOffset;
};

// *****************************************************************************
// *****************************************************************************

/**
 * @class DataElement
 */
medview.dicom.DataElement = function(dv, offset, littleEndian, explicit)
{
  // console.log("DataElement, offset inicial: " + offset);

  this.tag;
  this.group;
  this.element;
  this.vr; // Value Replesentation
  this.vl; // Value Length
  this.field; // Tag contents
  this.offset = offset; // Initial offset
  this.curOffset = offset; // Current offset. Updated when data is read from the DataViev (dv)


  this.read = function(dv, littleEndian, explicit)
  {

  /**
   * Reads a DataElement from the buffer
   */

    this.group = dv.getUint16(this.curOffset, littleEndian);
    this.curOffset += 2;
    this.element = dv.getUint16(this.curOffset, littleEndian);
    this.curOffset += 2;
    // console.log ("group: " + this.group + ", element: " + this.element);
    

    if (this.group == 0xfffe) { // Item / delimitation item / sequence delimitation item
      if (this.element == 0xe000 || this.element == 0xe00d || this.element == 0xe0dd) {
        console.log("");
        console.log(" *** Sequence element: (" + this.group.toString(16) + ", " + this.element.toString(16) + ")");
        console.log("curOffset: " + this.curOffset + " = 0x" + this.curOffset.toString(16));
        explicit = false;
      }
    }
   
    // Explicit / Implicit VR: http://plastimatch.org/dicom_tutorial.html
    if (explicit) {
      // read VR string
      this.vr = this.readString(dv, 2);

      // console.log ("vr: " + this.vr);

      // long representations 
      if (this.vr === "OB" || this.vr === "OW" || this.vr === "OF" || this.vr === "SQ" || this.vr === "UN") {
        // for VRs of OB, OW, OF, SQ and UN the 16 bits following the two character VR Field are reserved for use by later versions of the DICOM Standard.
        // These reserved bytes shall be set to 0000H and shall not be used or decoded
        var reserved = dv.getUint16(this.curOffset, littleEndian);
        console.assert(reserved == 0x0000);
        // console.log("vr: " + this.vr + ", reserved: " + reserved.toString(16));
        this.curOffset += 2;
        this.vl = dv.getUint32(this.curOffset, littleEndian);

        if (this.vl === 0xffffffff ) {
          console.log("vr: " + this.vr + ", vl: Undefined");
          this.vl = -1; // Undefined
        }

        this.curOffset += 4;
//        console.log ("Reading vl: Uint32: " + this.vl);


        if (this.vr === "SQ") {
          if (this.vl != 0) {
            console.log(" +++ Create object Sequence. curOffset: " + this.curOffset);
  console.log(this);
            
            var sq = new medview.dicom.Sequence(dv, this.curOffset, this.vr, this.vl, littleEndian, explicit);
            // console.log("this.curOffset: " + this.curOffset + ", sq.getLocalOffset(): " + sq.getLocalOffset());
            this.curOffset += sq.getLocalOffset();
            console.log(" --- End of object Sequence. curOffset: " + this.curOffset);
            
            this.field = sq;
          }
          console.log(this);
          
        }

      }
      // short representation
      else {
        this.vl = dv.getUint16(this.curOffset, littleEndian);
        this.curOffset += 2;
//        console.log ("Reading vl: Uint16: " + this.vl);
      }

    }
    else {
      // Sequences:
      // http://www.dclunie.com/medical-image-faq/html/part6.html
    
      // Implicit VR: 4 bytes for VL
      this.vr = "";
      this.vl = dv.getUint32(this.curOffset, littleEndian);
      this.curOffset += 4;
      console.log ("Implicit VR: (" + this.group.toString(16) + ", " + this.element.toString(16) + "), vl: " + this.vl);

      if( this.vl === 0xffffffff ) {
          this.vl = -1; // Undefined
      }
    }
//    console.log ("vl: " + this.vl);

    
/*    
    if (this.element == 0x0000) {
      // this field indicates group length
      console.log('element 0x0000: group length');
    }
*/
    
      // Read data field
//      this.field = this.readField(dv, this.offset + this.localOffset, this.vr, this.vl, littleEndian);

    if (this.group == 0x7fe0 && this.element == 0x0010) { // Pixel data
      console.log("Pixel data");
      if (this.vl == -1) {
        // http://www.dabsoft.ch/dicom/5/A.4/
//        throw new Error("Unsupported encapsulated pixel data.");
        this.readEncapsulatedData(dv, this.curOffset, littleEndian, explicit);
        
      }
      else {
        this.curOffset += this.vl; // ToDo: Pixel data will be read at the time of displaying the image
      }
    }
    else if (this.group == 0xfffe) {
      // Sequence item
      // console.log("Do not read values for sequence (0xFFFE) element markers");
      console.log("this.curOffset: " + this.curOffset);
    }
    else {
      // *** ToDo: Change this: Reading of SQ also here!
      if (this.vr !== "SQ") {
        // console.log("reading field, vr: " + this.vr);
        this.field = this.readField(dv, this.vr, this.vl, littleEndian);
      }
    }
//      console.log('field value: ' + this.field);

    
  };


  this.read(dv, littleEndian, explicit);

  
//  console.log("tag: " + this.tag + ", group: " + this.group + ", element: " + this.element);



};

//  this.readString = function(dv, length)
medview.dicom.DataElement.prototype.readString = function(dv, length)

  {
    var str = "";
    var endOffset = this.curOffset + length;

    for(var i = this.curOffset; i < endOffset; i++) {
      str += String.fromCharCode(dv.getUint8(i));
    }
    
    // Values with a VR of UI are padded with a single trailing NULL (00H) character when necessary to achieve even length.
    if (this.vr === "UI" && str[str.length - 1] === String.fromCharCode(0x00)) {
      str = str.substring(0, str.length-1); 
    }
    
    this.curOffset += length;
    return str;
  };


//  this.readField = function(dv, vr, vl, littleEndian)
medview.dicom.DataElement.prototype.readField = function(dv, vr, vl, littleEndian)
// field types: http://www.dabsoft.ch/dicom/5/6.2/
{
  // console.log("readField vr: " + vr + ", vl: " + vl);
  var field = [];
  var endOffset;
  if (vr === "US" || vr === "UL")
  {
    field.push(this.readNBytes(dv, vl, littleEndian));
  }
  else if (vr === "OX" || vr === "OW" )
  {
    endOffset = this.curOffset + vl;
    for(var i = this.curOffset; i < endOffset; i += 2) {
      field.push(dv.getUint16(i));
    }
    // console.log("readField(), vr: " + vr);

//      this.curOffset += 2*vl;
    this.curOffset += vl;

  }
  else if (vr === "FL")
  {
    field.push(dv.getFloat32(this.curOffset, littleEndian));
    this.curOffset += vl;
  }
  else if (vr === "FD")
  {
    field.push(dv.getFloat64(this.curOffset, littleEndian));
    this.curOffset += vl;
  }
  else if (vr === "SL")
  {
    field.push(dv.getInt32(this.curOffset, littleEndian));
    this.curOffset += vl;
  }
  else if (vr === "SQ")
  {
// Sequences are loaded in a different way 
  }
  else if (vr === "OB" || vr === "N/A")
  {
    // ToDo:
    // Values with a VR of OB shall be padded with a single trailing NULL byte value (00H) when necessary to achieve even length.
    endOffset = this.curOffset + vl;
    for(var i = this.curOffset; i < endOffset; i++) {
      field.push(dv.getUint8(i));
    }

    console.log("readField(), vr: " + vr);

    this.curOffset += vl;
  }
  else
  {
    // Strings are also stored as an array after splitting them
//      console.log("(" + this.group + "," + this.element + ") " + this.curOffset);
//      console.log("readField vr: " + vr + ", vl: " + vl);

    var str = this.readString(dv, vl).trim();
    field = str.split("\\");
    if (vr === "DS") {    
      for (var i = 0; i < field.length; i++) {
        field[i] = parseFloat(field[i]);
      }
    }
  }
  // console.log("field: " + field);
  return field;
};


medview.dicom.DataElement.prototype.readNBytes = function(dv, nBytes, littleEndian) {
  var value;
  
  switch(nBytes)
  {
    case 1:
      value = dv.getUint8(this.curOffset, littleEndian);
      break;
    case 2:
      value = dv.getUint16(this.curOffset, littleEndian);
      break;
    case 4:
      value = dv.getUint32(this.curOffset, littleEndian);
      break;
      
    case 6: // 20130502: US MF, 6-byte sequences
      value = dv.getUint32(this.curOffset, littleEndian);
      break;
    case 8:
      value = dv.getFloat32(this.curOffset, littleEndian);
      break;
    default:
      console.error("medview.dicom.DataElement.readNBytes(): ERROR");
      throw new Error("Unsupported number size. nBytes: " + nBytes);
  }
  // console.log("readNBytes(): " + value);
  this.curOffset += nBytes;
  return value;
};

medview.dicom.DataElement.prototype.getLocalOffset = function() {
//  return this.localOffset;
  return this.curOffset - this.offset;
};

medview.dicom.DataElement.prototype.readEncapsulatedData = function(dv, offset, littleEndian, explicit)
{
// RLE encapsulated pixel data
// http://www.dabsoft.ch/dicom/5/8.2/
// http://www.dabsoft.ch/dicom/5/G/
  console.log("+++ readEncapsulatedData()");
  
  console.log("offset: " + offset + " = 0x" + offset.toString(16));
  var seqData = new medview.dicom.Sequence(dv, offset, 'OB', -1, littleEndian, explicit);
  this.curOffset += seqData.getLocalOffset();
//die;
  console.log("--- end readEncapsulatedData()");




}


// *****************************************************************************

/**
 * @class SequenceItem
 */
medview.dicom.SequenceItem = function()
{
  this.groups = {};

}

medview.dicom.SequenceItem.prototype.addDataElement = function(dataElement) {
  // console.log("medview.dicom.SequenceItem.addDataElement()");
  var idxGroup = 'group.' + dataElement.group;
  var idxElement = 'element.' + dataElement.element;
  // console.log("addDataElement, idxGroup: " + idxGroup + ", idxElement: " + idxElement);
  if (!(idxGroup in this.groups)) {      
    this.groups[idxGroup] = {};
  }
  this.groups[idxGroup][idxElement] = dataElement;
}

// *****************************************************************************


/**
 * @class Sequence
 */
medview.dicom.Sequence = function(dv, offset, vr, length, littleEndian, explicit)
{
  this.items = [];
//  this.groups = {};
  this.offset = offset;
  this.curOffset = offset;


  if (length === -1 ) {
      console.log("vl: Undefined");
  }
  console.log("Sequence vl: " + length);

  if (vr === "SQ") {

    // var count = 0;

    var totalSeqLength = 0;
    do {

      var de = new medview.dicom.DataElement(dv, this.curOffset, littleEndian, explicit);
      // console.log(de);
      console.log("sequence");
      this.curOffset += de.getLocalOffset();
  //  this.addDataElement(de);
      // console.log("Data element offset: " + de.getLocalOffset());

      var itemLength = de.vl;
      totalSeqLength += de.getLocalOffset();

      if (de.group === 0xFFFE && de.element === 0xE000) {

          totalSeqLength += this.readItem(dv, this.curOffset, itemLength, littleEndian, explicit);
      }
      console.log("totalSeqLength: " + totalSeqLength);

      // count++;
  //    var endSequence = count >= 3;

      var endSequence = (length == -1 && de.group === 0xFFFE && de.element === 0xE0DD) || (totalSeqLength == length) ;
      console.log("endSequence: " + endSequence);
   
    } 
    while (!endSequence);
  }
  else {
    console.log("Sequence. vr: " + vr);
    
    var totalSeqLength_ = 0;
    var count = 0;
    do {

      var de = new medview.dicom.DataElement(dv, this.curOffset, littleEndian, explicit);
      console.log(count);
      console.log("segment");
      this.curOffset += de.getLocalOffset();
  //  this.addDataElement(de);
      // console.log("Data element offset: " + de.getLocalOffset());

      var itemLength = de.vl;
      totalSeqLength += de.getLocalOffset();

      if (de.group === 0xFFFE && de.element === 0xE000) {

          totalSeqLength_ += this.readSegment(dv, this.curOffset, itemLength, littleEndian, explicit);
      }
      console.log("totalSeqLength: " + totalSeqLength_);

      count++;
  //    var endSequence = count >= 3;

      var endSequence = (length == -1 && de.group === 0xFFFE && de.element === 0xE0DD) || (totalSeqLength_ == length) ;
      console.log("endSequence: " + endSequence);
   
    } 
    while (!endSequence);
    
    
    
  }


}

medview.dicom.Sequence.prototype.readItem = function(dv, offset, itemLength, littleEndian, explicit) {
  var seqItem = new medview.dicom.SequenceItem();
  this.items.push(seqItem);
  var count = 0;
  do {
    // dei: Every data element in the sequence item
    // console.log("Sequence.readItem() - offset: 0x" + this.curOffset.toString(16));
    var dei = new medview.dicom.DataElement(dv, this.curOffset, littleEndian, explicit);
    // console.log("dei.getLocalOffset() " + dei.getLocalOffset());
    this.curOffset += dei.getLocalOffset();
    // console.log(this.curOffset);
    if (dei.group !== 0xFFFE) {
      seqItem.addDataElement(dei);
    }
    
    var curItemLength = this.curOffset - offset;
    count++;

    // console.log("offset: 0x" + this.curOffset.toString(16));
    // Compare length if available.
    var endItem = (itemLength == -1 && dei.group === 0xFFFE && dei.element === 0xE00D) || (curItemLength == itemLength) || count >= 70;
  }
  while (!endItem);
  console.log("group: 0x" + dei.group.toString(16) + ", element: 0x" + dei.element.toString(16));
  console.log("count: " + count);
  console.log("End of sequence item"); 

  return curItemLength;
}

medview.dicom.Sequence.prototype.readSegment = function(dv, offset, itemLength, littleEndian, explicit) {

  var count = 0;
  var offsetTable;
  do {
    // dei: Every data element in the sequence item
    console.log("Sequence.readItem() - offset: 0x" + this.curOffset.toString(16));
    console.log("itemLength: " + itemLength + ", 0x" + itemLength.toString(16));
    if (count == 0) {
      offsetTable = this.readOffsetTable(dv, this.curOffset, itemLength, littleEndian);
    }
    else {
    
    }
//    var dei = new medview.dicom.DataElement(dv, this.curOffset, littleEndian, explicit);
//    console.log(dei);
    // console.log("dei.getLocalOffset() " + dei.getLocalOffset());
//    this.curOffset += dei.getLocalOffset();
    this.curOffset += itemLength;
    // console.log(this.curOffset);
/*
    if (dei.group !== 0xFFFE) {
      //seqItem.addDataElement(dei);
    }
*/    
    var curItemLength = this.curOffset - offset;
    count++;

    console.log("offset: 0x" + this.curOffset.toString(16));
    // Compare length if available.
/*
    var endItem = (itemLength == -1 && dei.group === 0xFFFE && dei.element === 0xE00D) || (curItemLength == itemLength) || count >= 70;
    */
    var endItem = (curItemLength == itemLength) || count >= 70;

  }
  while (!endItem);
//  console.log("group: 0x" + dei.group.toString(16) + ", element: 0x" + dei.element.toString(16));
  console.log("count: " + count);
  console.log("End of segment"); 

  return curItemLength;
}

/**
 * Offset table for RLE encoded multiframe
 */
medview.dicom.Sequence.prototype.readOffsetTable = function(dv, offset, itemLength, littleEndian) {
// http://www.dabsoft.ch/dicom/5/G/
  console.log("readOffsetTable");

  return false;
}

/**
 * Reads RLE encoded segment
 */
medview.dicom.Sequence.prototype.readRLESegment = function(dv, offset, itemLength, littleEndian) {
// http://www.dabsoft.ch/dicom/5/G/
  console.log("readRLESegment");

  var n = dv.getInt8(this.curOffset);
  this.curOffset += 1;
  if (n >= 0 && n <= 127) {
  
  }

/*

Loop until the number of output bytes equals the uncompressed segment size

Read the next source byte into n

If n> =0 and n <= 127 then

output the next n+1 bytes literally

Elseif n <= - 1 and n >= -127 then

output the next byte -n+1 times

Elseif n = - 128 then

output nothing

Endif

Endloop



*/


  return false;
}


/*
medview.dicom.Sequence.prototype.addDataElement = function(dataElement) {
  console.log("medview.dicom.Sequence.addDataElement()");
  var idxGroup = 'group.' + dataElement.group;
  var idxElement = 'element.' + dataElement.element;
  // console.log("addDataElement, idxGroup: " + idxGroup + ", idxElement: " + idxElement);
  if (!(idxGroup in this.groups)) {      
    this.groups[idxGroup] = {};
  }
  this.groups[idxGroup][idxElement] = dataElement;
}
*/

medview.dicom.Sequence.prototype.getLocalOffset = function() {
  console.log("this.curOffset: " + this.curOffset + ", this.offset: " + this.offset);
  return this.curOffset - this.offset;
};

// *****************************************************************************
