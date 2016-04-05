$(function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var video = document.getElementById('video');
  var voila = $('#voila');
  insertMap();
  // video.playbackRate = 10.0;
  // video.addEventListener('play', function() {
  //   var $this = this; //cache
  //   (function loop() {
  //     if (!$this.paused && !$this.ended) {
  //       ctx.drawImage($this, 0, 0);
  //       setTimeout(loop, 1000 / 300); // drawing at 300fps
  //     }
  //   })();
  // }, 0);
  
  var i = 0;
  video.addEventListener('loadeddata', function() {
      video.currentTime = i;
  }, false);

  video.addEventListener('seeked', function() {
      generateThumbnail(i);
      i += 5;
      /// if we are not passed end, seek to next interval
      if (i <= video.duration) {
          video.currentTime = i;
      } else {
          
      }
  }, false);
  
  var prevImage = "";
  function generateThumbnail(i) {     
    ctx.drawImage(video, 0, 0);
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
        insertMarker((i / ((1.0) * video.duration))*600);
        console.log(i);
      }
      
      document.getElementById('thumbnailContainer').appendChild(span);
    });
  }
  
  function insertMarker(x_at){    
    // Draw a rect
    $(voila).drawRect({
      layer: true,
      fillStyle: "green",
      x: x_at, y: 5,
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
  
});


