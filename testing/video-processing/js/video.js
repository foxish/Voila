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
      i += 5;
      /// if we are not passed end, seek to next interval
      if (i <= video.duration) {
          video.currentTime = i;
      } else {
          alert("done");
      }
  }, false);
  
  
  function generateThumbnail(i) {     
    ctx.drawImage(video, 0, 0);
    var dataURL = canvas.toDataURL();

    //create img
    var img = document.createElement('img');
    img.setAttribute('crossOrigin', 'anonymous');
    img.setAttribute('src', dataURL);

    //append img in container div
    document.getElementById('thumbnailContainer').appendChild(img);
  }
});


