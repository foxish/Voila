chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action == 'start') {
      console.log(request.time, request.bw);
      setup_helper();
    }
});

$(function() { });

var TEST_JSON = '[{"start":0,"end":15,"score":0.1},{"start":15,"end":20,"score":0.6},{"start":20,"end":25,"score":0.1},{"start":25,"end":340,"score":0.5},{"start":340,"end":829,"score":0.9},{"start":829.05625,"end":904.05625,"score":0.2},{"start":904.05625,"end":2611.506250000001,"score":0.5},{"start":2611.506250000001,"end":2686.506250000001,"score":0.0},{"start":2611.506250000001,"end":2686.506250000001,"score":0.0},{"start":2686.506250000001,"end":3001.506250000001,"score":0.0},{"start":3001.506250000001,"end":3316.506250000001,"score":0.2}]';

function setup_helper() {
  var video = document.getElementsByTagName('video')[0];

  // make sure video does not autoplay
  $(video).attr("autoplay", false);
  $(video).attr("preload", false);
  video.autoplay = false;


  // create thumbnails canvas
  var tCanvas = $('<canvas/>',{'id':'thumbnails','Width':video.clientWidth,'Height':video.clientHeight, 'style': 'display:none'});
  $('video').after(tCanvas);

  var tDiv = $('<div/>',{'id':'thumbnailContainer', 'style': 'display:none'});
  $('video').after(tDiv);


  var canvas = document.getElementById('thumbnails');
  var ctx = canvas.getContext('2d');

  // create heatmap
  var heatmapCanvas = $('<canvas/>',{'id':'voila','Width':video.clientWidth,'Height': 50, 'style':'display: block; margin:0px auto'});
  $("video").after(heatmapCanvas);

  var voila = $('#voila');
  var voila_el = document.getElementById('voila');
  var prevImage = "";
  var navigation_pts = [];
  var GRANULARITY = 5;
  var API_URL = "https://voila-foxish.c9users.io/view";
  var i = 0;
  var heat = null;
  var COLOR_CHANGE_TIMEOUT = 500;
  
  var summarizeFn = function() {
      generateThumbnail(i);
      i += GRANULARITY;
      /// if we are not passed end, seek to next interval
      if (i <= video.duration) {
          video.currentTime = i;
      } else {
          video.removeEventListener("seeked", summarizeFn);
          video.currentTime = 0;
      }
  };

  var colorLocation = function(j, color){
    var start = 0;
    var end = 0;

    // fix later
    if(j == 0) {
      end = navigation_pts[0];
    } else if (j == navigation_pts.length - 1) {
      start = navigation_pts[navigation_pts.length - 1];
      end = video.duration;
    } else {
      start = navigation_pts[j];
      end = navigation_pts[j+1];
    }

    // Draw a rect
    $(voila).drawRect({
      layer: true,
      fromCenter: false,
      fillStyle: color,
      x: ((start/video.duration) * video.clientWidth) + 2, y: 0,
      width: (((end-start)/video.duration) * video.clientWidth) - 2, height: 25
    });
  }
  
  var navigateFn = function(evt){
    var fraction = ((evt.clientX - $(voila).offset().left) / $(voila).width());
    var raw_loc = fraction * video.duration;
    for(var j = 0; j < navigation_pts.length; ++j) {
      if(raw_loc < navigation_pts[j]) {
        if(j == 0) {
           video.currentTime = 0;
           colorLocation(0, "green");
           setTimeout(function(){ colorLocation(0, "yellow"); }, COLOR_CHANGE_TIMEOUT);
        } else {
          video.currentTime = navigation_pts[Math.max(j-1, 0)];
          colorLocation(Math.max(j-1, 0), "green");
          setTimeout(function(){ colorLocation(Math.max(j-1, 0), "yellow"); }, COLOR_CHANGE_TIMEOUT);
        }
        
        return;
      }
    }
    video.currentTime = navigation_pts[navigation_pts.length - 1];
    colorLocation(navigation_pts.length - 1, "green");
    setTimeout(function(){ colorLocation(navigation_pts.length - 1, "yellow"); }, COLOR_CHANGE_TIMEOUT);
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
        var heat = JSON.parse(TEST_JSON);
        for(var j=0; j < heat.length; j++){
          navigation_pts.push(heat[j].end);
        }
        for(var j=0; j < heat.length; j++){
          colorLocation(j, "hsl(348, 100%, " + (1.0 - heat[j].score) * 100 + "%)");
        }
      }
  };

  // insert the heatmap canvas. url, callback, type, async
  insertMap();
  // $.ajax({
  //   type: "GET",
  //   url: API_URL,
  //   async: false,
  //   dataType: "json",
  //   data:{"videoID":"" /* create video id from URL in extension */ },
  //   success: ajaxFn
  // }); 
  ajaxFn("[]");
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
    
    var api = resemble(imgD1).compareTo(imgD2).onComplete(function(data){
      // create diffy
      var span = document.createElement('span');
      span.innerHTML = data.misMatchPercentage;
      
      // check for some arbitrary limit we later derive
      console.log("Mismatch: " + data.misMatchPercentage);
      if(data.misMatchPercentage > 40) {
        // new scene detected
        
        GRANULARITY = 5;
        insertMarker((i / video.duration));
        navigation_pts.push(i);
      } else {
        
        GRANULARITY = Math.min(video.duration/20, GRANULARITY*2);
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
      x: (x_at * video.clientWidth), y: 0,
      width: 2, height: 25
    });
  }

  function insertMap(){
    $(voila).drawRect({
      layer: true,
      fillStyle: 'yellow',
      x: 0, y: 0,
      width: video.clientWidth * 2,
      height: 50
    });
  }

  function generateJSON() {
    // assign some heatmapping.

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