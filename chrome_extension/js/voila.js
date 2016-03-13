// inject heapmap under video element
function inject(m){
  // alert(jQuery('.html5-video-container').width());

  var canvas = jQuery("<canvas>", {id: "voila"});
  $(canvas).drawRect({
    fillStyle: 'red',
    x: 0, y: 0,
    width: jQuery('.html5-video-container').width(),
    height: 10
  });
  
  jQuery("#watch-header").before(canvas);
  jQuery("#voila").width(jQuery('.html5-video-container').width());
}

// create a heatmap
function heatmap(data){
  return null;
}

// inject data to be shown within heatmap
function getData(){
  
}

// prevent video from playing (Debug)
// document.body.innerHTML = 
//     document.body.innerHTML.replace(new RegExp("youtube", "gi"), "null");

m = heatmap({});
inject(m);