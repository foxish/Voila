chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action == 'start') {
      console.log(request.time, request.bw);
      setup_helper();
    }
});


_getJSON = function(url, callback) {
  console.log("calling JSON");
  chrome.extension.sendRequest({action:'getJSON',url:url}, callback);
}
_ajax = function(url, callback, type, async) {
  console.log("calling ajax");
  chrome.extension.sendRequest({action:'ajax', url:url, type:type, async:async}, callback);
}

_get = function(url, callback) {
  console.log("sending get");
  chrome.extension.sendRequest({action:'get', url:url}, callback);
}

_post = function(url, data, callback) {
  console.log("sending post");
  chrome.extension.sendRequest({action:'post', data: data, url:url}, callback);
}



$(function() { });
function setup_helper() {
  var video = document.getElementsByTagName('video')[0];

  // make sure video does not autoplay
  $(video).attr("autoplay", false);
  $(video).attr("preload", false);
  video.autoplay = false;


  // create thumbnails canvas
  var tCanvas = $('<canvas/>',{'id':'thumbnails','Width':100,'Height':200});
  $('body').append(tCanvas);

  var tDiv = $('<div/>',{'id':'thumbnailContainer'});
  $('body').append(tDiv);


  var canvas = document.getElementById('thumbnails');
  var ctx = canvas.getContext('2d');

  // create heatmap
  var heatmapCanvas = $('<canvas/>',{'id':'voila','Width':500,'Height':50});
  heatmapCanvas.attr('margin', '0px auto');
  heatmapCanvas.attr('display', 'table');
  heatmapCanvas.attr('margin', '0px auto');
  $("video").after(heatmapCanvas);

  var voila = $('#voila');
  var voila_el = document.getElementById('voila');
  var prevImage = "";
  var navigation_pts = [];
  var GRANULARITY = 30;
  var API_URL = "http://voila-foxish.c9users.io/view";
  var i = 0;
  var heat = null;
  
  var summarizeFn = function() {
      generateThumbnail(i);
      i += 20;
      /// if we are not passed end, seek to next interval
      if (i <= video.duration) {
          video.currentTime = i;
      } else {
          video.removeEventListener("seeked", summarizeFn);
          video.currentTime = 0;
      }
  };
  
  var navigateFn = function(evt){
    var fraction = ((evt.clientX - $(voila).offset().left) / $(voila).width());
    var raw_loc = fraction * video.duration;
    for(var j = 0; j < navigation_pts.length; ++j) {
      if(raw_loc < navigation_pts[j]) {
        if(j == 0) {
           video.currentTime = 0;
        } else {
          video.currentTime = navigation_pts[Math.max(j-1, 0)];
        }
        return;
      }
    }
    video.currentTime = navigation_pts[navigation_pts.length - 1];
  }

  var ajaxFn = function(result){
      var heat = JSON.parse(result);
      console.log(heat);
      if(heat == 0){ //stupid JS cast!
          console.log("Generating local summary.");
          // generate a client-side summary.
          video.addEventListener('seeked', summarizeFn, false);
          video.currentTime = i;
      } else {
        console.log("Using pre-generated summary.");
        for(var p=0; p < heat.length; p++){
          // generate the green spots/thumbnails based the data returned
          generateThumbnail(heat[p][0]); // heat[p][0] indicates the start time
        }
      }
  };

  // insert the heatmap canvas. url, callback, type, async
  insertMap();

  $.ajax({
    type: "GET",
    url: API_URL,
    async: false,
    dataType: "json",
    data:{"videoId":"100" /* create video id from URL in extension */ },
    success: ajaxFn
  });  



  // video.addEventListener('loadeddata', function() {
  //     $('video').pause();

  //     $.ajax({
  //       type: "GET",
  //       url: API_URL,
  //       dataType: "json",
  //       data:{"videoId":"100" /* create video id from URL in extension */ },
  //       success: function(result){
  //         heat = JSON.parse(result);
  //         console.log(heat);
  //         if(heat == 0){ //stupid JS cast!
  //             console.log("Generating local summary.");
  //             // generate a client-side summary.
  //             video.addEventListener('seeked', summarizeFn, false);
  //             video.currentTime = i;
  //         } else {
  //           console.log("Using pre-generated summary.");
  //           for(var p=0; p < heat.length; p++){
  //             // generate the green spots/thumbnails based the data returned
  //             generateThumbnail(heat[p][0]); // heat[p][0] indicates the start time
  //           }
  //         }
  //    }
  //   });
  // }, false);
  voila_el.addEventListener('mousedown', navigateFn, false);

  function generateThumbnail(i) {     
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var dataURL = canvas.toDataURL();
    compareImages(dataURL, prevImage, i);
    prevImage = dataURL;
    
    //create img
    var img = document.createElement('img');
    img.setAttribute('crossOrigin', 'anonymous');
    img.setAttribute('src', dataURL);
    img.setAttribute('id', i + "sec");
    
    //append img in container div
    document.getElementById('thumbnailContainer').appendChild(img);
  }
  function compareImages(imgD1, imgD2, i) {
    if(imgD1 === "" || imgD2 === "") {
      return;
    }
    
    var api = resemble(imgD1).compareTo(imgD2).ignoreColors().onComplete(function(data){
      // create diffy
      var span = document.createElement('span');
      span.innerHTML = data.misMatchPercentage;
      
      // check for some arbitrary limit we later derive
      if(data.misMatchPercentage > 60) {
        // new scene detected
        insertMarker((i / video.duration));
        navigation_pts.push(i);
      }
      
      document.getElementById('thumbnailContainer').appendChild(span);
    });
  }
  function insertMarker(x_at){
    // Draw a rect
    $(voila).drawRect({
      layer: true,
      fromCenter: false,
      fillStyle: "green",
      x: (x_at * $(voila).width() * 0.6), y: 0,
      width: 2, height: 10
    });
  }
  function insertMap(){
    $(voila).drawRect({
      layer: true,
      fillStyle: 'yellow',
      x: 0, y: 0,
      width: 600,
      height: 20
    });
  }
  function userPattern(){//this generates the user seek pattern and does a post call
    
        var userresponse=[];
        var heatindex=0;//used as an index for sections in the heat array.
        
        while(heatindex<=heat.length){//iterates over all the sections
            var len=heat[heatindex][1]-heat[heatindex][0];
           
            while( (video.currentTime-heat[heatindex])< .25*len ) //check if less than 25% of this section is watched.exits this while
            //if more than 25% of this section is watched.
            {
                video.addEventListener('seeked', function() {//when user seeks
                  
                  while(video.currentTime>heat[heatindex][1]){ //mark all the sections between previous heatindex and current seek false  
                    userresponse.push([heat[heatindex][0],heat[heatindex][1],false]);
                    heatindex++;
                  }
                  
                }, false);
            }
            
            //comes here if more than 25% of section with index:heatindex is watched.
            userresponse.push([heat[heatindex][0],heat[heatindex][1],true]);
            heatindex++;//goes no next section
        }
            
          $.ajax({
            type: "POST",
            url:"" ,//need to add the url
            contentType: "application/json; charset=utf-8",
            data:JSON.stringify(userresponse),
            dataType: "json",
            success: function(result){
              
          }
        });
  }
}


// $(document).ready(function (){
//   var canvas = document.getElementById('voila');
//   var ctx = canvas.getContext('2d');
//   var video = document.getElementsByTagName('video');
//   video=video[0];

//   var voila = $('#voila');
//   insertMap();
  
//   // video.playbackRate = 10.0;
//   // video.addEventListener('play', function() {
//   //   var $this = this; //cache
//   //   (function loop() {
//   //     if (!$this.paused && !$this.ended) {
//   //       ctx.drawImage($this, 0, 0);
//   //       setTimeout(loop, 1000 / 300); // drawing at 300fps
//   //     }
//   // 
//   // }, 0);
  
//   var i = 0;
//   video.addEventListener('loadeddata', function() {
//       video.currentTime = i;

//   }, false);

//   video.addEventListener('seeked', function() {
//       generateThumbnail(i);
//       i += 5;
//       /// if we are not passed end, seek to next interval
//       if (i <= video.duration) {
//           video.currentTime = i;
//       } else {
          
//       }
//   }, false);
  
//   var prevImage = "";
//   function generateThumbnail(i) {     
//     ctx.drawImage(video, 0, 0);
//     var dataURL = canvas.toDataURL();
//     compareImages(dataURL, prevImage, i);
//     prevImage = dataURL;
    
//     //create img
//     var img = document.createElement('img');
//     img.setAttribute('crossOrigin', 'anonymous');
//     img.setAttribute('src', dataURL);
//     img.setAttribute('id', i + "sec");
    
//     //append img in container div
//     document.getElementById('thumbnailContainer').appendChild(img);
//   }
  
//   function compareImages(imgD1, imgD2, i) {
//     if(imgD1 === "" || imgD2 === "") {
//       return;
//     }
    
//     var api = resemble(imgD1).compareTo(imgD2).ignoreColors().onComplete(function(data){
//       // create diffy
//       var span = document.createElement('span');
//       span.innerHTML = data.misMatchPercentage;
      
//       // check for some arbitrary limit we later derive
//       if(data.misMatchPercentage > 60) {
//         // new scene detected
//         insertMarker((i / ((1.0) * video.duration))*600);
//         console.log(i);
//       }
      
//       document.getElementById('thumbnailContainer').appendChild(span);
//     });
//   }
  
//   function insertMarker(x_at){    
//     // Draw a rect
//     $(voila).drawRect({
//       layer: true,
//       fillStyle: "green",
//       x: x_at, y: 5,
//       width: 2, height: 10
//     });
//   }
  
//   function insertMap(){
//     $(voila).drawRect({
//       layer: true,
//       fillStyle: 'yellow',
//       x: 0, y: 0,
//       width: 600,
//       height: 20
//     });
//   }
  
// });
