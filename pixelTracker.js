$(()=>{
  var c = document.getElementById("myCanvas");
  var ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.strokeStyle = '#ff0000';

  var c2 = document.getElementById("myCanvas2");
  var ctx2 = c2.getContext("2d");
  ctx2.imageSmoothingEnabled = false;
  ctx2.strokeStyle = '#ff0000';

  var cache = [{
      analyse:[],
      pixel:[]
    },{
      analyse:[],
      pixel:[]
    }];

  var img = new Image();
  img.onload = ()=>{
    ctx.drawImage(img,0,0);
  };
  img.src = 'sample1.jpg';

  var img2 = new Image();
  img2.onload = ()=>{
    ctx2.drawImage(img2,0,0);
  };
  img2.src = 'sample2.jpg';

  function writeConsole(text){
    $('#console').text(text);
  }

  function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  c.addEventListener('mousemove', function(evt) {
    var radius = 10;
    var sampleRadius = 3;
    var nb = 6;
    var lookupRadius = 40;
    var mousePos = getMousePos(c, evt);
    var pixel = samplePixel(cache[0].pixel,ctx,mousePos.x,mousePos.y,radius);
    ctx.drawImage(img,0,0);
    ctx2.drawImage(img2,0,0);

    var coords = generateCircleCoordinates(mousePos.x,mousePos.y,radius,nb);
    var allSampled = cachedAnalysePixel(cache[0],ctx,mousePos.x,mousePos.y,radius,nb,sampleRadius);

    var analyse = [];

    var countAnalysed = 0;
    for(var i = mousePos.y - lookupRadius;i<mousePos.y + lookupRadius;i++){
      for(var j = mousePos.x - lookupRadius;j<mousePos.x + lookupRadius;j++){
        var resAnalyse = cachedAnalysePixel(cache[1],ctx2,j,i,radius,nb,sampleRadius);
        analyse.push({
          x:j,
          y:i,
          diff:diffSamples(allSampled,resAnalyse)
        });
        countAnalysed++;
      }
    }

    var compareDiff = (a,b) => a.diff - b.diff;

    analyse.sort(compareDiff);

    var clone = analyse[0];

    coords.forEach(c => {
      drawSquare(ctx,c.x,c.y,sampleRadius);
    });

    drawSquare(ctx,mousePos.x,mousePos.y,sampleRadius);

    var coords2 = generateCircleCoordinates(clone.x,clone.y,radius,nb);
    coords2.forEach(c => {
      drawSquare(ctx2,c.x,c.y,sampleRadius);
    });

    drawSquare(ctx2,clone.x,clone.y,sampleRadius);

    drawSquare(ctx,mousePos.x,mousePos.y,lookupRadius);
    drawSquare(ctx2,mousePos.x,mousePos.y,lookupRadius);

    var message = mousePos.x + ',' + mousePos.y + ' : analysed : '+countAnalysed + ', clone : ' + JSON.stringify(clone) + JSON.stringify(allSampled);
    writeConsole(message);
  }, false);
});

function cachedAnalysePixel(cache,ctx,x,y,radius,nb,sampleRadius){
  var inCache = cache.analyse[x+'|'+y+'|'+radius+'|'+nb+'|'+sampleRadius];
  if(inCache){
    return inCache;
  } else {
    var pixel = analysePixel(cache.pixel,ctx,x,y,radius,nb,sampleRadius);
    cache.analyse[x+'|'+y+'|'+radius+'|'+nb+'|'+sampleRadius] = pixel;
    return pixel;
  }
}

function analysePixel(cache,ctx,x,y,radius,nb,sampleRadius){
  var coords = generateCircleCoordinates(x,y,radius,nb);
  var allSampled = [];
  coords.forEach(c => {
    allSampled.push(samplePixel(cache,ctx,c.x,c.y,sampleRadius));
  });
  return allSampled;
}

function drawSquare(ctx,x,y,radius){
  ctx.strokeRect(x-radius,y-radius,radius*2+1,radius*2+1);
}

function generateCircleCoordinates(x,y,radius,nb){
  var res = [];

  for(var i=0;i<nb;i++){
    var angle = i*360/nb;
    res.push({
      x:x+Math.cos(toRadians(angle))*radius,
      y:y+Math.sin(toRadians(angle))*radius
    });
  }

  return res;
}

function toRadians(angle){
  return angle * Math.PI / 180;
}

function buildKey(x,y){
  return x+'|'+y;
}

function cachedGetPixel(cache,ctx,x,y){
  var key = buildKey(x,y);
  var inCache = cache[key];
  if(inCache){
    return inCache;
  } else {

    var pixel = getPixel(ctx,x,y);
    cache[key] = pixel;
    return pixel;
  }
}

function getPixel(ctx,x,y){
  var data = ctx.getImageData(x, y, 1, 1).data;
  return {
    r:data[0],
    g:data[1],
    b:data[2],
    a:data[3]
  };
}

function samplePixel(cache,ctx,x,y,radius){
  var nb = 0;
  var tPixel = { r:0,g:0,b:0,a:0 };
  for(var i = y-radius;i<y+radius;i++){
    for(var j = x-radius;j<x+radius;j++){
      nb++;
      var curPixel = cachedGetPixel(cache,ctx,j,i);
      tPixel = addPixel(tPixel,curPixel);
    }
  }
  tPixel.r /= nb;
  tPixel.g /= nb;
  tPixel.b /= nb;
  tPixel.a /= nb;
  return tPixel;
}

function addPixel(p1,p2){
  return {
    r:p1.r+p2.r,
    g:p1.g+p2.g,
    b:p1.b+p2.b,
    a:p1.a+p2.a
  };
}

function diffPixel(p1,p2){
  var sum = 0;
  var composantes = [x=>x.r,x=>x.g,x=>x.b,x=>x.a];
  composantes.forEach(f=>{
    sum += Math.pow(Math.abs(f(p1)-f(p2)),2);
  });
  return sum;
}

function diffSamples(s1,s2){
  var sum = 0;
  for(var i=0;i<s1.length;i++){
    sum += diffPixel(s1[i],s2[i]);
  }
  return sum;
}
