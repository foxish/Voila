$(function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var video = document.getElementById('video');
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
      i += 100;
      /// if we are not passed end, seek to next interval
      if (i <= video.duration) {
          video.currentTime = i;
      } else {
          insertMap();
      }
  }, false);
  
  var prevImage = "";
  function generateThumbnail(i) {     
    ctx.drawImage(video, 0, 0);
    var dataURL = canvas.toDataURL();
    compareImages(dataURL, prevImage);
    prevImage = dataURL;
    
    //create img
    var img = document.createElement('img');
    img.setAttribute('crossOrigin', 'anonymous');
    img.setAttribute('src', dataURL);
    img.setAttribute('id', i + "sec");
    
    //append img in container div
    document.getElementById('thumbnailContainer').appendChild(img);
  }
  
  function compareImages(imgD1, imgD2) {
    if(imgD1 === "" || imgD2 === "") {
      return;
    }
    
    var api = resemble(imgD1).compareTo(imgD2).ignoreColors().onComplete(function(data){
      // create diffy
      var span = document.createElement('span');
      span.innerHTML = data.misMatchPercentage;
      document.getElementById('thumbnailContainer').appendChild(span);
    });
  }
  
  function insertMap(){
    var canvas = jQuery("<canvas>", {id: "voila"});
    $(canvas).drawRect({
      fillStyle: 'red',
      x: 0, y: 0,
      width: jQuery('#video').width(),
      height: 50
    });
    $(canvas).width = jQuery('#video').width();
    jQuery("#video").after(canvas);
  }
  
});


