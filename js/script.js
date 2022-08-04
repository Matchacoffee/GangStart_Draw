// triangulation using https://github.com/ironwallaby/delaunay

const TWO_PI = Math.PI * 2;

let in_guide = false;
var image,
    imageWidth = 768,
    imageHeight = 485;
var lastClick;
var prizes = [],targetPrize;
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
canvas.id = "block_canvas";

var vertices = [],
    indices = [],
    fragments = [];

var divPreviewer = document.getElementById('divPreviewer');

var clickPosition = [imageWidth * 0.5, imageHeight * 0.5];

function FillPrizes(array,src,count,isBigPrizes = false){
	var tempImg;
	for(var i=0;i<count;i++)
	{
		tempImg = new Image();
		tempImg.src = src;
		if(isBigPrizes)
		    tempImg.className = 'prizes big_prizes';
	    else tempImg.className = 'prizes';
		array.push(tempImg);
	}
}

function RandomPrizes(){
	var temp = prizes[0];
	var index = 0,index2=0;
	for(var i =0;i<100;i++)
	{
	    index =Math.floor(Math.random()*prizes.length);//ex: random*5 > 0~4
		index2 =Math.floor(Math.random()*prizes.length);//ex: random*5 > 0~4
		temp = prizes[index];
		prizes[index] = prizes[index2];
		prizes[index2] =temp;
	}
}

window.onload = function() {
    TweenMax.set(divPreviewer, {perspective:500});
	//病病池: 25張 6格金幣V 3格頂尖證明 2格小覺醒石 2格中覺醒石 2格大覺醒石 2格漢堡  弓銅 法銅 劍銅 牧銅 證明各1  1格掃蕩卷 3隻腳色
	/*
	    Cert_Wizard_copper
		Cert_Sword_silver
		Cert_Archer_gold
		Cert_healer_
		Cert_Summit 頂尖
	*/
	//array.push(value);

	create_pool('binbin');
};
/*
function imagesLoaded() {
    placeImage(false,0);
    //triangulate();
    //shatter();
}
*/
function placeImage(transitionIn,id) {
	image.className="fade-in-image";
	targetPrize = prizes[id];
	/*var index = Math.floor(Math.random()*prizes.length);//ex: random*5 > 0~4
    targetPrize = prizes[index];//給他搞成隨機
	console.log(prizes);
	prizes.splice(index, 1);
	console.log(prizes);*/
	context.fillStyle = "rgba(255, 255, 255, 0)";
	canvas.width = image.width;
	canvas.height = image.height;

    image.addEventListener('click', imageClickHandler);
	
	divPreviewer.appendChild(canvas);
	divPreviewer.appendChild(targetPrize);
    divPreviewer.appendChild(image);
    //divPreviewer.insertBefore(canvas, divPreviewer.firstChild);

    if (transitionIn !== false) {
        TweenMax.fromTo(image, 0.75, {y:-1000}, {y:0, ease:Back.easeOut});
    }
}

function imageClickHandler(event) {

    document.getElementById("all_screen").removeEventListener('click',all_screen_click);
	
    var box = image.getBoundingClientRect(),
        top = box.top,
        left = box.left;

    imageWidth = box.width;
	imageHeight = box.height;
	
    clickPosition[0] = event.clientX - left;
    clickPosition[1] = event.clientY - top;
	
    triangulate();
    shatter();
	
}

function triangulate() {
    var rings = [
            {r:50, c:12},
            {r:150, c:12},
            {r:300, c:12},
            {r:1200, c:12} // very large in case of corner clicks
        ],
        x,
        y,
        centerX = clickPosition[0],
        centerY = clickPosition[1];

    vertices.push([centerX, centerY]);

    rings.forEach(function(ring) {
        var radius = ring.r,
            count = ring.c,
            variance = radius * 0.25;

        for (var i = 0; i < count; i++) {
            x = Math.cos((i / count) * TWO_PI) * radius + centerX + randomRange(-variance, variance);
            y = Math.sin((i / count) * TWO_PI) * radius + centerY + randomRange(-variance, variance);
            vertices.push([x, y]);
        }
    });

    vertices.forEach(function(v) {
        v[0] = clamp(v[0], 0, imageWidth);
        v[1] = clamp(v[1], 0, imageHeight);
    });
	
    indices = Delaunay.triangulate(vertices);
}

function shatter() {
    var p0, p1, p2,
        fragment;

    var tl0 = new TimelineMax({onComplete:shatterCompleteHandler});

    for (var i = 0; i < indices.length; i += 3) {
        p0 = vertices[indices[i + 0]];
        p1 = vertices[indices[i + 1]];
        p2 = vertices[indices[i + 2]];
        
        fragment = new Fragment(p0, p1, p2);

        var dx = fragment.centroid[0] - clickPosition[0],
            dy = fragment.centroid[1] - clickPosition[1],
            d = Math.sqrt(dx * dx + dy * dy),
            rx = 30 * sign(dy),
            ry = 90 * -sign(dx),
            delay = d * 0.003 * randomRange(0.9, 1.1);
        fragment.canvas.style.zIndex = Math.floor(d).toString();

        var tl1 = new TimelineMax();


        tl1.to(fragment.canvas, 1, {
            z:-500,
            rotationX:rx,
            rotationY:ry,
            ease:Cubic.easeIn
        });
        tl1.to(fragment.canvas, 0.4,{alpha:0}, 0.6);

        tl0.insert(tl1, delay);

        fragments.push(fragment);
        divPreviewer.appendChild(fragment.canvas);
    }
	//divPreviewer.appendChild(canvas);
    divPreviewer.removeChild(image);
    image.removeEventListener('click', imageClickHandler);
}

function shatterCompleteHandler() {
    // add pooling?
    fragments.forEach(function(f) {
        divPreviewer.removeChild(f.canvas);
    });
    fragments.length = 0;
    vertices.length = 0;
    indices.length = 0;
    
	var imgDiv = document.getElementById('all_screen');
	
	setTimeout(function(){
		document.getElementById("all_screen").addEventListener('click',all_screen_click);
		 lastClick.src = targetPrize.src;
		 if(targetPrize.className.indexOf('big_prizes') > 0)
		     lastClick.className += ' card3_imgs big_prizes';//特效沒想好
		 else lastClick.className += ' card3_imgs';
		 imgDiv.style.display = "none";		 
		 divPreviewer.removeChild(canvas);
		 check_finished();
		 if(in_guide)
		     guide_forward();
	 },500);
	 
	
}

//////////////
// MATH UTILS
//////////////

function randomRange(min, max) {
    return min + (max - min) * Math.random();
}

function clamp(x, min, max) {
    return x < min ? min : (x > max ? max : x);
}

function sign(x) {
    return x < 0 ? -1 : 1;
}

//////////////
// FRAGMENT
//////////////

Fragment = function(v0, v1, v2) {
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;

    this.computeBoundingBox();
    this.computeCentroid();
    this.createCanvas();
    this.clip();
};
Fragment.prototype = {
    computeBoundingBox:function() {
        var xMin = Math.min(this.v0[0], this.v1[0], this.v2[0]),
            xMax = Math.max(this.v0[0], this.v1[0], this.v2[0]),
            yMin = Math.min(this.v0[1], this.v1[1], this.v2[1]),
            yMax = Math.max(this.v0[1], this.v1[1], this.v2[1]);

        this.box ={
            x:xMin,
            y:yMin,
            w:xMax - xMin,
            h:yMax - yMin
        };
    },
    computeCentroid:function() {
        var x = (this.v0[0] + this.v1[0] + this.v2[0]) / 3,
            y = (this.v0[1] + this.v1[1] + this.v2[1]) / 3;

        this.centroid = [x, y];
    },
    createCanvas:function() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.box.w;
        this.canvas.height = this.box.h;
        this.canvas.style.width = this.box.w + 'px';
        this.canvas.style.height = this.box.h + 'px';
        this.canvas.style.left = this.box.x + 'px';
        this.canvas.style.top = this.box.y + 'px';
        this.ctx = this.canvas.getContext('2d');
    },
    clip:function() {
        this.ctx.translate(-this.box.x, -this.box.y);
        this.ctx.beginPath();
        this.ctx.moveTo(this.v0[0], this.v0[1]);
        this.ctx.lineTo(this.v1[0], this.v1[1]);
        this.ctx.lineTo(this.v2[0], this.v2[1]);
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(image, 0, 0);
    }
};

function tableCreate() {
  var container = document.getElementById("container");
  tbl = document.createElement('table');
		//border-collapse: collapse; border-spacing: 0;

  for (let i = 0; i < 5; i++) {
    const tr = tbl.insertRow();
    for (let j = 0; j < 5; j++) {
      const td = tr.insertCell();
	  const image = document.createElement('img');
	  image.src = "images/material/card.png";
	  image.id = "card"+((i*5)+j);
	  image.className = "card_imgs";
	  image.addEventListener('click',cards_click);
      td.appendChild(image);
    }
  }
  container.innerHTML = "";
  document.getElementById("container").appendChild(tbl);
}

function create_pool(pool_name){
	switch(pool_name){
	  case "binbin":
	        prizes=[];			
			FillPrizes(prizes,'images/material/gold.png',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.png',3);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.png',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.png',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.png',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.png',2);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.png',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.png',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.png',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.png',1);//法銅
			FillPrizes(prizes,'images/material/skip.png',1);//掃蕩卷
			FillPrizes(prizes,'images/character/binbin.png',1,true);//角色
			FillPrizes(prizes,'images/character/maomao.png',1,true);//角色
			FillPrizes(prizes,'images/character/tutu.png',1,true);//角色
		break;
	  default:
	    alert('由於沒有圖片素材，目前只開放病病池(低畫質版)');
	    return;
	}
	tableCreate();//清空並重置table
	
	RandomPrizes();
	
	image = new Image();
	image.src = 'images/material/card.png';//放上卡背
	
}

function cards_click(event){
	lastClick = event.srcElement;
	lastClick.className = "card2_imgs";
	lastClick.removeEventListener('click',cards_click);
	var imgDiv = document.getElementById('all_screen');
	imgDiv.style.display = "flex";
	placeImage(false,event.srcElement.id.replace("card", ""));
}

function pool_click(event){
	var btn = event.srcElement;
	var str_arr = btn.className.split(' ');
	create_pool(str_arr[str_arr.length-1]);
	
}

function all_screen_click(event){
	if(event.target.id !='all_screen')
		return;
	lastClick.className = "card_imgs";
	lastClick.addEventListener('click',cards_click);
	if(in_guide){
	    if(document.getElementsByClassName('guide_clickme').length == 0)
			lastClick.classList.add('guide_clickme');
	}	
    event.srcElement.style.display = "none";
	divPreviewer.innerHTML = '';//清空，再點再加
}

function hint_guide_click(event){
	in_guide = !in_guide;
	if(!in_guide && document.getElementsByClassName('guide_clickme').length != 0)
		document.getElementsByClassName('guide_clickme')[0].classList.remove('guide_clickme');
	guide_forward();
}

function item_click(event){
	document.getElementById("side-menu-switch").checked = false;
}

function guide_forward(){
	if(document.getElementsByClassName('guide_clickme').length != 0)
		return;
	var cards = document.getElementsByClassName('card_imgs');
	var index = Math.floor(Math.random()*cards.length);//ex: random*5 > 0~4
	cards[index].classList.add("guide_clickme");//element.classList.remove("mystyle");
}


async function check_finished(){

	if(document.getElementsByClassName('big_prizes').length != 3)//大獎
		return;
	var cards = document.getElementsByClassName('card_imgs');
	let total = cards.length;
	for (let i = 0; i < total; i++) {
      await delay(200);
	  cards[0].removeEventListener('click',cards_click);
	  cards[0].src = prizes[cards[0].id.replace("card", "")].src;
	  cards[0].className = "card3_imgs";//card2_imgs card3_imgs 自動翻 沒有card2_imgs 就是自動翻
    }
}

function delay(n){
    return new Promise(function(resolve){
        setTimeout(resolve,n);
    });
}


