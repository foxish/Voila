
$(function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var video = document.getElementById('video');
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

  // insert the heatmap canvas.
  insertMap();
  video.addEventListener('loadeddata', function() {
      $.ajax({
	    	type: "GET",
	    	url: API_URL,
	    	dataType: "json",
	    	data:{"videoId":"100" /* create video id from URL in extension */ },
	    	success: function(result){
	    	  heat = JSON.parse(result);
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
     }
    });
  }, false);
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
});


