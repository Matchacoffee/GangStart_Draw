// triangulation using https://github.com/ironwallaby/delaunay

const TWO_PI = Math.PI * 2;

let in_guide = false,handan_mode = false;
var image,
    imageWidth = 768,
    imageHeight = 485;
var lastClick;
var prizes = [],targetPrize;
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
canvas.id = "block_canvas";

var imgDiv = document.getElementById('all_screen');	
var videoDiv = document.getElementById('drawed_animation');	
var vertices = [],
    indices = [],
    fragments = [];

var divPreviewer = document.getElementById('divPreviewer');

var clickPosition = [imageWidth * 0.5, imageHeight * 0.5];

function FillPrizes(array,src,count,isBigPrizes = false,haveAnimation = false){
	var tempImg;
	for(var i=0;i<count;i++)
	{
		tempImg = new Image();
		tempImg.src = src;
		if(isBigPrizes)
		    tempImg.className = 'prizes big_prizes';
	    else tempImg.className = 'prizes';
		if(haveAnimation)
			tempImg.classList.add('haveAnimation');
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
	//畢業池:25張 6格金幣 2格頂尖證明 2格小覺醒石 2格中覺醒石 2格大覺醒石 2格漢堡 弓銅 法銅 劍銅 牧銅 證明各1  2格掃蕩卷 3隻腳色
	/*
	    Cert_Wizard_copper
		Cert_Sword_silver
		Cert_Archer_gold
		Cert_healer_
		Cert_Summit 頂尖
		
		//監聽動畫https://blog.gtwang.org/web-development/using-css3-animation/
		e.addEventListener("animationstart", listener, false);
		e.addEventListener("animationend", listener, false);
		e.addEventListener("animationiteration", listener, false);
	*/
	//array.push(value);

	//create_pool('binbin');
};
/*
function imagesLoaded() {
    placeImage(false,0);
    //triangulate();
    //shatter();
}
*/
function placeImage(transitionIn,id) {
	image.className="showcardback fade-in-image";
	targetPrize = prizes[id];
	/*var index = Math.floor(Math.random()*prizes.length);//ex: random*5 > 0~4
    targetPrize = prizes[index];//給他搞成隨機
	console.log(prizes);
	prizes.splice(index, 1);
	console.log(prizes);*/
	context.fillStyle = "rgba(255, 255, 255, 0)";
	canvas.width = image.width;
	canvas.height = image.height;

    image.addEventListener('click', endanimaition);

    image.addEventListener('animationend', (ev) => {
		image.addEventListener('click', imageClickHandler);
       //console.log("animation end", ev);
    });
	
	divPreviewer.appendChild(canvas);
	divPreviewer.appendChild(targetPrize);
    divPreviewer.appendChild(image);
    //divPreviewer.insertBefore(canvas, divPreviewer.firstChild);

    if (transitionIn !== false) {
        TweenMax.fromTo(image, 0.75, {y:-1000}, {y:0, ease:Back.easeOut});
    }
}
function endanimaition(event){
	event.srcElement.classList.remove('fade-in-image');
	event.srcElement.addEventListener('click', imageClickHandler);
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
	
    
	
	videoDiv.style.display = "flex";
	
	if(targetPrize.classList.contains('haveAnimation')){
		video = document.createElement('video');
		video.addEventListener('click',video_click);
		video.addEventListener('ended',video_ended);
		video.id = 'drawed_animation_video';
		video.style.height = "100%";
		source = document.createElement('source');
		source.type = "video/webm";
		source.src = 'images/video/'+getFileName(targetPrize.src)+'.webm';
		videoDiv.appendChild(video);
		video.appendChild(source);
		video.play();
	}
	else {
		setTimeout(function(){
			 finishAnimation(imgDiv);
		},250);
	}
}

function video_ended(event){
	videoDiv.style.display = "none";
	videoDiv.innerHTML = "";
	finishAnimation(imgDiv);
}

function video_click(event){
	event.target.removeEventListener('ended',video_ended);
	videoDiv.style.display = "none";
	videoDiv.innerHTML = "";
	finishAnimation(imgDiv);
}

function getFileName(val) {
	filename = val.split('\\').pop().split('/').pop();
    filename = filename.substring(0, filename.lastIndexOf('.'));
	return filename;
}

function finishAnimation(imgDiv){
	imgDiv.addEventListener('click',all_screen_click);
	lastClick.src = targetPrize.src;
	if(targetPrize.className.indexOf('big_prizes') > 0)
		lastClick.className += ' card3_imgs big_prizes';//特效沒想好
	else lastClick.className += ' card3_imgs';
	imgDiv.style.display = "none";
	divPreviewer.removeChild(canvas);
	check_finished();
	if(in_guide)
		guide_forward();
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
  //var container = document.getElementById("container");
  tbl = document.getElementById("draw_box");
  tbl.innerHTML = "";
  //tbl = document.createElement('table');
		//border-collapse: collapse; border-spacing: 0;

  for (let i = 0; i < 5; i++) {
    const tr = tbl.insertRow();
    for (let j = 0; j < 5; j++) {
      const td = tr.insertCell();
	  const image = document.createElement('img');
	  image.src = "images/material/card.webp";
	  image.id = "card"+((i*5)+j);
	  image.className = "card_imgs";
	  image.addEventListener('click',cards_click);
      td.appendChild(image);
    }
  }
  
  //document.getElementById("container").appendChild(tbl);
}

function create_pool(pool_name){
	switch(pool_name){
	    case "binbin":
	        prizes=[];			
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',3);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',2);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',1);//掃蕩卷
			FillPrizes(prizes,'images/character/binbin.webp',1,true,true);//角色
			FillPrizes(prizes,'images/character/maomao.webp',1,true,true);//角色
			FillPrizes(prizes,'images/character/tutu.webp',1,true,true);//角色
			//FillPrizes(prizes,'images/character/binbin.webp',25,true,true);//角色
		break;
		case "cloudhorizon":
		    prizes=[];			
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',2);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',2);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/margaret.webp',1,true,true);//角色
			FillPrizes(prizes,'images/character/kamiina.webp',1,true,true);//角色
			FillPrizes(prizes,'images/character/linglan.webp',1,true,true);//角色
		break;
		case "chasedrea1":
		    prizes=[];			
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',1);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',3);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/naiweiya.webp',1,true);//角色
			FillPrizes(prizes,'images/character/zuoying.webp',1,true);//角色
			FillPrizes(prizes,'images/character/baimingjing_Archer.webp',1,true);//角色
		break;
		case "chasedrea2":
		    prizes=[];			
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',1);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',3);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/haiwen.webp',1,true);//角色
			FillPrizes(prizes,'images/character/zuoge.webp',1,true);//角色
			FillPrizes(prizes,'images/character/baimingjing_Sword.webp',1,true);//角色
		break;
		case "ciandaoshanghuei":
		    prizes=[];
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',1);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',3);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/bulliedRabbit_SSR.webp',1,true);//角色
			FillPrizes(prizes,'images/character/qiuren_Archer.webp',1,true);//角色
			FillPrizes(prizes,'images/character/Marlow_SR.webp',1,true);//角色
		break;
		case "rescute_No15":
		    prizes=[];
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',1);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',3);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/No15_Archer.webp',1,true);//角色
			FillPrizes(prizes,'images/character/No15_Sword.webp',1,true);//角色
			FillPrizes(prizes,'images/character/No15_Toy.webp',1,true);//角色
		break;
		case "rescute_Lutralutra":
		    prizes=[];
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',1);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',3);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/Lutralutra_Archer.webp',1,true);//角色
			FillPrizes(prizes,'images/character/Lutralutra_Healer.webp',1,true);//角色
			FillPrizes(prizes,'images/character/Lutralutra_Toy.webp',1,true);//角色
		break;
		case "rescute_Obear":
		    prizes=[];
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',1);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',3);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/Obear_Sword.webp',1,true);//角色
			FillPrizes(prizes,'images/character/Obear_Wizard.webp',1,true);//角色
			FillPrizes(prizes,'images/character/Obear_Toy.webp',1,true);//角色
		break;
		case "hotac":
		    prizes=[];
			FillPrizes(prizes,'images/material/gold.webp',6);//金幣
			FillPrizes(prizes,'images/material/Cert_Summit.webp',1);//頂尖證明
			FillPrizes(prizes,'images/material/AwakeStone.webp',2);//小覺醒石
			FillPrizes(prizes,'images/material/AwakeStone1.webp',2);//中覺醒石
			FillPrizes(prizes,'images/material/AwakeStone2.webp',2);//大覺醒石
			FillPrizes(prizes,'images/material/food.webp',3);//漢堡
			FillPrizes(prizes,'images/material/Cert_Archer_copper.webp',1);//弓銅
			FillPrizes(prizes,'images/material/Cert_Healer_copper.webp',1);//牧銅
			FillPrizes(prizes,'images/material/Cert_Sword_copper.webp',1);//劍銅
			FillPrizes(prizes,'images/material/Cert_Wizard_copper.webp',1);//法銅
			FillPrizes(prizes,'images/material/skip.webp',2);//掃蕩卷
			FillPrizes(prizes,'images/character/qiuren_Doge.webp',1,true);//角色
			FillPrizes(prizes,'images/character/Losernun_SR_Cat.webp',1,true);//角色
			FillPrizes(prizes,'images/character/Eva_SR_Cat.webp',1,true);//角色
		break;
		case "DIY":
		    if (Storage !== void(0)){  }
			else {
				alert('此瀏覽器不支援功能');
				return;
			}
		    prizes=[];
			var string = localStorage.getItem('diypool_1');
			if(isNull(string))
			{
				alert('未設定自訂池');
				return;
			}
			var source = string.split(';').filter((item)=> item.trim() != '');
			var content = [];
			if(source.length != 25)
			{
				alert('自訂池異常，請重新設定');
				return;
			}
			source.forEach(item =>{
				content = item.split(':');
				switch(content[0])
				{
					case "character":
					    FillPrizes(prizes,'images/character/'+content[1]+'.webp',1);//角色
					break;
					case "material":
					    FillPrizes(prizes,'images/material/'+content[1]+'.webp',1);//素材
					break;
					case "local":
					    FillPrizes(prizes,localStorage.getItem(content[1]),1);//素材
					break;
				}
			});
		break;
		
	    default:
	    alert('由於春睏夏乏秋盹冬眠，目前未開放喔，敬請期待');
	    return;
	}
	tableCreate();//清空並重置table
	
	RandomPrizes();
	
	image = new Image();
	image.src = 'images/material/card.webp';//放上卡背
	
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
	if(in_guide){
	    guide_forward();
	}
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
	else guide_forward();	
}

function Handan_click(event){
	handan_mode = !handan_mode;
	var msg = document.getElementById("msg_show");
	if(handan_mode)
	{
		//var myfontsize = getComputedStyle(document.documentElement).getPropertyValue('--side_fontsize');
		msg.innerHTML = "邯鄲學步模式_此模式中抽到三位大獎後不會自動翻開剩下的牌";
		//msg.style.fontSize = myfontsize;
	}
	else msg.innerHTML = "";
}

function item_click(event){
	document.getElementById("side-menu-switch").checked = false;
	var dropdown = document.querySelectorAll("#side_menu input");
	dropdown.forEach(item =>{
		item.checked = false;
	});
	var diymode = document.getElementById("tab999");
	if(diymode.checked && event.srcElement.id != "create_pool")
	    diymode.checked = false;
}


function diy_fill(event){
	lastClick = event.srcElement;
	var nullImg = document.querySelectorAll("#draw_box .nullImg");
	if(nullImg.length == 0)
		return;
	nullImg[0].src = lastClick.src;
	nullImg[0].dataset.name = lastClick.dataset.name;
	nullImg[0].classList.remove('nullImg');
	nullImg[0].classList.add('havingImg');
}

function diy_clear(event){
	lastClick = event.srcElement;
	lastClick.dataset.name = "";
	lastClick.src = "images/material/Null.webp";
	lastClick.classList.add('nullImg');
}

function create_pool_click(event){
  var key = document.getElementById("tab999");
  if (Storage !== void(0)){  }
  else {
    alert('此瀏覽器不支援功能');
	key.checked = true;//事件綁在先觸發 之後才是外層<label> 所以true → false
	return;
  }
  key.checked = false;
  tbl = document.getElementById("draw_box");
  tbl.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const tr = tbl.insertRow();
    for (let j = 0; j < 5; j++) {
      const td = tr.insertCell();
	  const image = document.createElement('img');
	  image.src = "images/material/Null.webp";
	  image.id = "null_card"+((i*5)+j);
	  image.className = "card_imgs nullImg";
	  image.addEventListener('click',diy_clear);
      td.appendChild(image);
    }
  }
  tbl2 = document.getElementById("diyImg_character_box");
  tbl2.innerHTML = "";
  var roleNum = Object.keys(all_characters).length;
  var times = Math.floor(roleNum/5.0);
  for (let i = 0; i < times+1; i++) {
    const tr = tbl2.insertRow();
    for (let j = 0; j < 5; j++) {
	  if(roleNum == (i*5)+j)
	  {
		  //console.log(roleNum);
		  break;
	  }
      const td = tr.insertCell();
	  const image = document.createElement('img');
	  image.src = "images/character/"+all_characters[(i*5)+j]+".webp";
	  image.className = "card_imgs";
	  image.dataset.name = "character:"+all_characters[(i*5)+j];
	  image.addEventListener('click',diy_fill);
      td.appendChild(image);
    }
  }
  
  tbl3 = document.getElementById("diyImg_material_box");
  tbl3.innerHTML = "";
  var itemNum = Object.keys(all_material).length;
  times = Math.floor(itemNum/5.0);
  for (let i = 0; i < times+1; i++) {
    const tr = tbl3.insertRow();
    for (let j = 0; j < 5; j++) {
	  if(itemNum == (i*5)+j)
	  {
		  //console.log(itemNum);
		  break;
	  }
	  
      const td = tr.insertCell();
	  const image = document.createElement('img');
	  image.src = "images/material/"+all_material[(i*5)+j]+".webp";
	  image.className = "card_imgs";
	  image.dataset.name = "material:"+all_material[(i*5)+j];
	  image.addEventListener('click',diy_fill);
      td.appendChild(image);
    }
  }
  //自訂部分
  var localNum = 0,index = 0; var size = 0;
  var localName =[]
  for(item in localStorage){
	if(item.indexOf('diyImg') >= 0)
	    localName.push(item);
  }
  
  tbl4 = document.getElementById("diyImg_local_box");
  tbl4.innerHTML = "";
  localNum = localName.length;
  times = Math.floor(localNum/5.0);
  for (let i = 0; i < times+1; i++) {
    const tr = tbl4.insertRow();
    for (let j = 0; j < 5; j++) {
	  if(localNum == (i*5)+j)
	  {
		  break;
	  }
      const td = tr.insertCell();
	  const image = document.createElement('img');
	  image.src =  localStorage.getItem(localName[(i*5)+j]);
	  image.className = "card_imgs";
	  image.dataset.name = "local:"+localName[(i*5)+j];
	  image.addEventListener('click',diy_fill);
      td.appendChild(image);
    }
  }
}
function diy_save_click(event){
	var imgs = document.querySelectorAll("#draw_box .havingImg");
	
	if(imgs.length != 25)
	{
	    alert('請確定25格都有圖片');
		return;
	}
	var temp = '';
	
	imgs.forEach(item =>{
		temp += item.dataset.name+';';
	});
	localStorage.setItem('diypool_1',temp);
	if(!isNull(localStorage.getItem('diypool_1')))
        alert('成功儲存，快去自訂池看看吧');
}


function diy_clearall_click(event){
	lastClick = event.srcElement;
	var nullImg = document.querySelectorAll("#draw_box .havingImg");
	if(nullImg.length == 0)
		return;
	nullImg.forEach(item => {
	  item.dataset.name = "";
	  item.src = "images/material/Null.webp";
	  item.classList.add('nullImg');
	  item.classList.remove('havingImg');
	});
}

function diy_fillmaterial_click(event){
	lastClick = event.srcElement;
	var nullImg = document.querySelectorAll("#draw_box .nullImg");
	if(nullImg.length < 22)
	{
		alert('快速塞素材需要22個空位');
		return;
	}
	var material = ['gold','gold','gold','gold','gold','gold',
	  'Cert_Summit','AwakeStone','AwakeStone','AwakeStone1','AwakeStone1',
	  'AwakeStone2','AwakeStone2','food','food','food','Cert_Archer_copper',
	  'Cert_Healer_copper','Cert_Sword_copper','Cert_Wizard_copper',
	  'skip','skip'
	];
	for(var i=0;i<22;i++)
	{
		nullImg[i].dataset.name = 'material:'+material[i];
		nullImg[i].src = 'images/material/'+material[i]+'.webp';
		nullImg[i].classList.add('havingImg');
		nullImg[i].classList.remove('nullImg');
	}
}

function guide_forward(){
	if(document.getElementsByClassName('guide_clickme').length != 0)
		return;
	var cards = document.getElementsByClassName('card_imgs');
	var index = Math.floor(Math.random()*cards.length);//ex: random*5 > 0~4
	cards[index].classList.add("guide_clickme");//element.classList.remove("mystyle");
}


async function check_finished(){
	if(handan_mode)
		return;
	if(document.querySelectorAll("#container .big_prizes").length != 3)//大獎
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

function isNull(str){
	if(str === null || str === undefined || str.length === 0){
		return true;
	}
	return false;
}
