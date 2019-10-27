var express  = require("express"), server = express();
var bodyParser = require('body-parser');
 server.use(bodyParser.json({limit: '50mb'}));
// server.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
const fetch= require('node-fetch');
var mssge,mssge2, x_val, y_val,area;
//server.use(bodyParser.json())
//use(bodyParser.urlencoded({ extended: false }))
const Promise = require('bluebird');
const HttpStatus = require('http-status-codes');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas')

// pico codes/* This library is released under the MIT license, see https://github.com/tehnokv/picojs */
	var facefinder_classify_region = function(r, c, s, pixels, ldim) {return -1.0;};
  var cascadeurl = 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';
  fetch(cascadeurl).then(function(response) {
    response.arrayBuffer().then(function(buffer) {
      var bytes = new Int8Array(buffer);
      facefinder_classify_region = pico.unpack_cascade(bytes);
    //  console.log('* cascade loaded');
    })
  })


	async function write_buffer (buf){

 	 await fs.writeFile('image.jpg', buf,function(err, result) {
      if(err) console.log('error', err);}
    );
	//console.log("file_created");
}

server.get('/getPatients', (req,res) => {


});

/*
  a function to transform an RGBA image to grayscale
*/
/* decode base 64  image*/
// Decoding base-64 image
        // Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
        function decodeBase64Image(dataString)
        {
					//console.log(dataString);
          var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          var response = {};

          if (matches.length !== 3)
          {
            return new Error('Invalid input string');
          }

          response.type = matches[1];
          response.data = new Buffer(matches[2], 'base64');

          return response;
        }
function rgba_to_grayscale(rgba, nrows, ncols) {
  var gray = new Uint8Array(nrows*ncols);
  for(var r=0; r<nrows; ++r)
    for(var c=0; c<ncols; ++c)
      // gray = 0.2*red + 0.7*green + 0.1*blue
      gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
  return gray;
}

pico = {}

pico.unpack_cascade = function(bytes)
{
 //
 const dview = new DataView(new ArrayBuffer(4));
 /*
   we skip the first 8 bytes of the cascade file
   (cascade version number and some data used during the learning process)
 */
 let p = 8;
 /*
   read the depth (size) of each tree first: a 32-bit signed integer
 */
 dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
 const tdepth = dview.getInt32(0, true);
 p = p + 4
 /*
   next, read the number of trees in the cascade: another 32-bit signed integer
 */
 dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
 const ntrees = dview.getInt32(0, true);
 p = p + 4
 /*
   read the actual trees and cascade thresholds
 */
 const tcodes_ls = [];
 const tpreds_ls = [];
 const thresh_ls = [];
 for(let t=0; t<ntrees; ++t)
 {
   // read the binary tests placed in internal tree nodes
   Array.prototype.push.apply(tcodes_ls, [0, 0, 0, 0]);
   Array.prototype.push.apply(tcodes_ls, bytes.slice(p, p+4*Math.pow(2, tdepth)-4));
   p = p + 4*Math.pow(2, tdepth)-4;
   // read the prediction in the leaf nodes of the tree
   for(let i=0; i<Math.pow(2, tdepth); ++i)
   {
     dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
     tpreds_ls.push(dview.getFloat32(0, true));
     p = p + 4;
   }
   // read the threshold
   dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
   thresh_ls.push(dview.getFloat32(0, true));
   p = p + 4;
 }
 const tcodes = new Int8Array(tcodes_ls);
 const tpreds = new Float32Array(tpreds_ls);
 const thresh = new Float32Array(thresh_ls);
 /*
   construct the classification function from the read data
 */
 function classify_region(r, c, s, pixels, ldim)
 {
    r = 256*r;
    c = 256*c;
    let root = 0;
    let o = 0.0;
    const pow2tdepth = Math.pow(2, tdepth) >> 0; // '>>0' transforms this number to int

    for(let i=0; i<ntrees; ++i)
    {
     idx = 1;
     for(let j=0; j<tdepth; ++j)
       // we use '>> 8' here to perform an integer division: this seems important for performance
       idx = 2*idx + (pixels[((r+tcodes[root + 4*idx + 0]*s) >> 8)*ldim+((c+tcodes[root + 4*idx + 1]*s) >> 8)]<=pixels[((r+tcodes[root + 4*idx + 2]*s) >> 8)*ldim+((c+tcodes[root + 4*idx + 3]*s) >> 8)]);

      o = o + tpreds[pow2tdepth*i + idx-pow2tdepth];

      if(o<=thresh[i])
        return -1;

      root += 4*pow2tdepth;
   }
   return o - thresh[ntrees-1];
 }
 /*
   we're done
 */
 return classify_region;
}

pico.run_cascade = function(image, classify_region, params)
{
 //console.log("here run cascade");
 const pixels = image.pixels;
 const nrows = image.nrows;
 const ncols = image.ncols;
 const ldim = image.ldim;

 const shiftfactor = params.shiftfactor;
 const minsize = params.minsize;
 const maxsize = params.maxsize;
 const scalefactor = params.scalefactor;

 let scale = minsize;
 const detections = [];

 while(scale<=maxsize)
 {
   const step = Math.max(shiftfactor*scale, 1) >> 0; // '>>0' transforms this number to int
   const offset = (scale/2 + 1) >> 0;

   for(let r=offset; r<=nrows-offset; r+=step)
     for(let c=offset; c<=ncols-offset; c+=step)
     {
       const q = classify_region(r, c, scale, pixels, ldim);
       if (q > 0.0)
         detections.push([r, c, scale, q]);
     }

   scale = scale*scalefactor;
 }

    return detections;
}

pico.cluster_detections = function(dets, iouthreshold)
{
 /*
   sort detections by their score
 */
 dets = dets.sort(function(a, b) {
   return b[3] - a[3];
 });
 /*
   this helper function calculates the intersection over union for two detections
 */
 function calculate_iou(det1, det2)
 {
   // unpack the position and size of each detection
   const r1=det1[0], c1=det1[1], s1=det1[2];
   const r2=det2[0], c2=det2[1], s2=det2[2];
   // calculate detection overlap in each dimension
   const overr = Math.max(0, Math.min(r1+s1/2, r2+s2/2) - Math.max(r1-s1/2, r2-s2/2));
   const overc = Math.max(0, Math.min(c1+s1/2, c2+s2/2) - Math.max(c1-s1/2, c2-s2/2));
   // calculate and return IoU
   return overr*overc/(s1*s1+s2*s2-overr*overc);
 }
 /*
   do clustering through non-maximum suppression
 */
 const assignments = new Array(dets.length).fill(0);
 const clusters = [];
 for(let i=0; i<dets.length; ++i)
 {
   // is this detection assigned to a cluster?
   if(assignments[i]==0)
   {
     // it is not:
     // now we make a cluster out of it and see whether some other detections belong to it
     let r=0.0, c=0.0, s=0.0, q=0.0, n=0;
     for(let j=i; j<dets.length; ++j)
       if(calculate_iou(dets[i], dets[j])>iouthreshold)
       {
         assignments[j] = 1;
         r = r + dets[j][0];
         c = c + dets[j][1];
         s = s + dets[j][2];
         q = q + dets[j][3];
         n = n + 1;
       }
     // make a cluster representative
     clusters.push([r/n, c/n, s/n, q]);
   }
 }

 return clusters;
}

pico.instantiate_detection_memory = function(size)
{
 /*
   initialize a circular buffer of `size` elements
 */
 let n = 0;
 const memory = [];
 for(let i=0; i<size; ++i)
   memory.push([]);
 /*
   build a function that:
   (1) inserts the current frame's detections into the buffer;
   (2) merges all detections from the last `size` frames and returns them
 */
 function update_memory(dets)
 {
   memory[n] = dets;
   n = (n+1)%memory.length;
   dets = [];
   for(i=0; i<memory.length; ++i)
     dets = dets.concat(memory[i]);
   //
   return dets;
 }
 /*
   we're done
 */
 return update_memory;
}

server.post('/send_img', (req,res) => {
/// so far we go the image is into the server:
// lets process it and get to back

// Draw cat with lime helmet

//load the img from the server
 //console.log(req.body);


 var base64Data = req.body.message.replace(/^data:image\/png;base64,/, "");
 var data = base64Data.replace(/^data:image\/\w+;base64,/, "");
 let buf;
 if (Buffer.from && Buffer.from !== Uint8Array.from) {
   buf = Buffer.from(data, 'base64');
 } else {
   if (typeof notNumber === 'number') {
     throw new Error('The "size" argument must be not of type number.');
   }
   buf = new Buffer(data, 'base64');
 }

 fs.writeFile('image.jpg', buf,function(err, result) {
		if(err) console.log('error', err);

 //console.log("loading image");
 loadImage('./image.jpg').then((image) => {
	// console.log("getting here");
  var  width_img = image.width;
	var height_img=image.height;
	const canvas = createCanvas(width_img, height_img);
	const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  var rgba = ctx.getImageData(0, 0, width_img, height_img).data;
  // prepare input to `run_cascade`
  //console.log(rgba);
	//console.log("width is " + width_img + "height is"+ height_img);
  image = {
    "pixels": rgba_to_grayscale(rgba, height_img, width_img),
    "nrows": height_img,
    "ncols": width_img,
    "ldim": width_img
  }
  params = {
    "shiftfactor": 0.1, // move the detection window by 10% of its size
    "minsize": 20,      // minimum size of a face (not suitable for real-time detection, set it to 100 in that case)
    "maxsize": 1000,    // maximum size of a face
    "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
  }
  //console.log(image);
  // run the cascade over the image
  // dets is an array that contains (r, c, s, q) quadruplets
  // (representing row, column, scale and detection score)
  dets = pico.run_cascade(image, facefinder_classify_region, params);
  //console.log(dets);
  // cluster the obtained detections
  dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
  //console.log(dets);

  // draw results
  qthresh = 5.0 // this constant is empirical: other cascades might require a different one
area=0;
    if(dets && dets[0][1]&& dets[0][0]){
		y_val=dets[0][0];
		x_val=dets[0][1];

		console.log(mssge+  "m1    " +  mssge2 +"m2   ");
		if (FindPoint(0.0 , 0.0, width_img/4 ,height_img*0.5 ,  x_val,  y_val)){
        res.status(201).send('area1');
        	area=1;
    }

		else if (FindPoint(0.0 , 0.0, 2* (width_img/4) ,height_img*0.5 ,  x_val,  y_val)){
		area=2;

    res.status(202).send('area2');
  }
	else 	if (FindPoint(0.0 , 0.0, 3 *(width_img/4) ,height_img*0.5 ,  x_val,  y_val)){
    	area=3;
    res.status(203).send('area 3')
  }


	else 	if (FindPoint(0.0 , 0.0, width_img ,height_img*0.5 ,  x_val,  y_val)){
    area=4;
    res.status(204).send('area 4')
  }
}
else{
  res.status(200).send('no area')
}




		// check if its inside area 1
		// function to find if given point
// lies inside a given rectangle or not.


    console.log("this im sending" + area);



})


// connect to the db and return information for login information
});
});
server.post('*', (req,res) => {

res.json({ area_val:'1', hit:"yes"  })

// connect to the db and return information for login information
});
server.listen(3000, function() {
  console.log("server listening to port ");
});



/// helper functions
// function to find if given point
// lies inside a given rectangle or not.
 function FindPoint( x1, y1,  x2, y2,  x,  y)
 {
	 console.log("testing");
     if (x > x1 && x < x2 && y > y1 && y < y2)
         return true;

     return false;
 }
