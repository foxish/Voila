$(function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var video = document.getElementById('video');
  video.playbackRate = 10.0;
  video.addEventListener('play', function() {
    var $this = this; //cache
    (function loop() {
      if (!$this.paused && !$this.ended) {
        ctx.drawImage($this, 0, 0);
        setTimeout(loop, 1000 / 300); // drawing at 300fps
      }
    })();
  }, 0);
});

