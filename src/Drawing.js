import ColorPicker from './ColorPicker'
import Pixel from './Pixel'

class Drawing{
	constructor(opt){
		if (this === window) throw `Drawing: Can't call a function directly`;
		this.init(opt);
	}
	sqr(x) {
		return x * x
	}
	dist2(p1, p2) {
		return this.sqr(p1.x - p2.x) + this.sqr(p1.y - p2.y)
	}
	/**
	 * @description 计算线段与圆是否相交
	 * @param {x: num, y: num} p 圆心点
	 * @param {x: num, y: num} v 线段起始点
	 * @param {x: num, y: num} w 线段终点
	 */
	 distToSegmentSquared(p, v, w) {
		var l2 = this.dist2(v, w);
		if (l2 == 0) return this.dist2(p, v);
		var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
		if (t < 0) return this.dist2(p, v);
		if (t > 1) return this.dist2(p, w);
		return this.dist2(p, {
			x: v.x + t * (w.x - v.x),
			y: v.y + t * (w.y - v.y)
		});
	}
	distToSegment(p, v, w, offset) {
		var minX = Math.min(v.x, w.x) - offset;
		var maxX = Math.max(v.x, w.x) + offset;
		var minY = Math.min(v.y, w.y) - offset;
		var maxY = Math.max(v.y, w.y) + offset;

		if ((p.x < minX || p.x > maxX) && (p.y < minY || p.y > maxY)) {
			return Number.MAX_VALUE;
		}
		return Math.sqrt(this.distToSegmentSquared(p, v, w));
	}

	init(opt){
		let { el, EMPTY_COLOR = "#fff", stepX = 20, stepY = 20,penHeight = 10 } = opt;
		var elem = document.getElementById(el);

		if (!(elem && elem.nodeType && elem.nodeType === 1)) {
			throw `Drawing: not found  ID:${el}  HTMLElement,not ${{}.toString.call(el)}`;
		}

		this.Opt = {
			...opt,
			el,
			EMPTY_COLOR, 
			stepX , 
			stepY ,
			penHeight
		}

		//构建dom
		this.penBtnId = `${el}-pen`;
		this.eraserBtnId = `${el}-eraser`;
		this.cleanBtnId = `${el}-clean`;
		this.strawBtnId = `${el}-straw`
		this.uploadBtnId = `${el}-upload`;
		this.downloadBtnId = `${el}-downloadd`;
		this.canvasId = `${el}-canvas`;
		this.colorId = `${el}-color`;
		var div = document.createElement("div");
		div.className = 'drawing'
		div.innerHTML = this.render();
		elem.appendChild(div)

		this.bindElem = document.getElementById(this.canvasId); // 绑定的元素
		this.ctx = this.bindElem.getContext('2d');
		this.box = [];
		this.mousedown = false;
		this.p1 = null;
		this.p2 = null;
		this.isDraw = true;
		this.tempPenColor = null;
		this.penColor = null;
		this.penBtn = document.getElementById(this.penBtnId);
		this.eraserBtn = document.getElementById(this.eraserBtnId);
		this.cleanBtn = document.getElementById(this.cleanBtnId);
		this.strawBtn = document.getElementById(this.strawBtnId);
		this.uploadBtn = document.getElementById(this.uploadBtnId);
		this.downloadBtn = document.getElementById(this.downloadBtnId);


		var that = this;

		this.bindElem.addEventListener('mousedown', function (e) {
			that.p1 = that.WindowToCanvas(this, e.clientX, e.clientY);
			//设置取色器颜色
			if(!that.isDraw){
				that.box.forEach(function (pixel, index) {
					if((pixel.x-that.Opt.stepX/2<=that.p1.x&&that.p1.x<=pixel.x+that.Opt.stepX/2)&&(pixel.y-that.Opt.stepY/2<=that.p1.y&&that.p1.y<=pixel.y+that.Opt.stepY/2)){
						document.getElementById(that.colorId).style.background = pixel.getColor();
						that.tempPenColor = pixel.getColor();
					}
				});
				return;
			}
			that.mousedown = true;
			for (var p = 0; p < that.box.length; p++) {
				var pixel = that.box[p];
				if (pixel.isPointInPath(that.ctx, that.p1)) {
					pixel.fillStyle = that.penColor;
				}
			}
			that.refresh();
		}, false);
		
		this.bindElem.addEventListener('mousemove', function (e) {
			if(!that.isDraw){
				return;
			}
			if (that.mousedown) {
				that.p2 = that.WindowToCanvas(this, e.clientX, e.clientY);
				that.drawColorToPixel(that.p1, that.p2, that.penColor);
				that.p1 = that.p2;
			}
		}, false);
		
		this.bindElem.addEventListener('mouseup', function (e) {
			that.mousedown = false;
		}, false);
		
		this.bindElem.addEventListener('mouseout', function (e) {
			that.mousedown = false;
		}, false);
		
		
		this.penBtn.addEventListener('click', function (e) {
			that.bindElem.dataset.cursor = this.value;
			that.isDraw = true;
			that.penColor = that.tempPenColor;
		}, false);

		this.eraserBtn.addEventListener('click', function (e) {
			that.bindElem.dataset.cursor = this.value;
			that.isDraw = true;
			that.penColor = that.Opt.EMPTY_COLOR;
		}, false);

		this.cleanBtn.addEventListener('click',function(e){
			for (var i = 0; i < that.box.length; i++) {
				var pixel = that.box[i];
				pixel.setColor(that.Opt.EMPTY_COLOR)
			}
			that.refresh(); 
		})

		this.strawBtn.addEventListener('click', function (e) {
			that.bindElem.dataset.cursor = this.value
			that.isDraw = false;
		}, false);

		this.uploadBtn.addEventListener('change', function(){
			var file = this.files[0];
			var img = that.fileToImage(file);
			if (img.complete) {
				that.drawImage(img);
			} else {
				img.onload = function () {
				that.drawImage(img);
				}
			}
			this.value=''
		},false)

		this.downloadBtn.addEventListener('click',function(){
			this.href = that.bindElem.toDataURL();
			this.download = 'PixelPic'
		},false)
	}

	render(){
		return `<canvas id="${this.canvasId}" width="600" height="600" data-cursor="pen" class='canvas'>
			您的浏览器不支持cavas
		</canvas>
		<div class="tool">
			<div class="tool-icon" title="画笔">
				<input type="radio" name="select" id="${this.penBtnId}" class="pen" value="pen">
			</div>
			<div class="tool-icon" title="橡皮">
				<input type="radio" name="select" id="${this.eraserBtnId}" class="eraser" value="eraser">
			</div>
			<div class="tool-icon" title="取色器">
				<input type="radio" name="select" id="${this.strawBtnId}" class="straw" value="straw">
			</div>
			<div id="${this.cleanBtnId}" class="tool-icon clean" title="清除"></div>
			<div id="${this.colorId}" class="tool-icon" style="background: #000;"></div>
			<a href="javascript:;" class="file">上传图片
				<input type="file" id="${this.uploadBtnId}">
			</a>
			<a href="javascript:;" class="file" id="${this.downloadBtnId}">下载</a>
		</div>`;
	}
	/**
	 * @param  {} canvas
	 * @param  {} x
	 * @param  {} y
	 * @description 将鼠标位置定位到canvas坐标
	 */
	WindowToCanvas(canvas, x, y) {
		var box = canvas.getBoundingClientRect();
		return {
			x: x - box.left * (canvas.width / box.width),
			y: y - box.top * (canvas.height / box.height)+this.Opt.stepY
		};
	}
	refresh() {
		this.ctx.clearRect(0, 0, this.bindElem.width, this.bindElem.height);
		for (var i = 0; i < this.box.length; i++) {
			var pixel = this.box[i];
			pixel.draw(this.ctx);
		}
	}
	drawColorToPixel(p1, p2, color) {
		this.box.forEach((pixel, index) =>{
			var p = {
				x: pixel.x,
				y: pixel.y
			};
			var distance = this.distToSegment(p, p1, p2, this.Opt.penHeight);
			if (distance <= this.Opt.penHeight) {
				var pixel = this.box[index];
				pixel.setColor(color);
			}
		});
		this.refresh();
	}
	// File转image
	fileToImage(blob){
		var img_src = URL.createObjectURL(blob);
		var img = new Image();
		img.src = img_src
		return img;
	}
	drawImage(img){
		var privew = document.createElement("canvas");
		var privewctx = privew.getContext('2d');
		privew.width = 600;
		privew.height = 600;
		privewctx.drawImage(img,0,0,privew.width, privew.height)
		var imgData = privewctx.getImageData(0, 0, privew.width, privew.height).data;
		var array = [];
		for (var x = this.Opt.stepX+1; x < privew.width; x += this.Opt.stepX) {
			for(var y=this.Opt.stepY+1;y<privew.height;y+=this.Opt.stepY){
				var index = (y * privew.width + x);
				var i = index * 4;
				var rgb = `rgb(${imgData[i]},${imgData[i+1]},${imgData[i+2]})`
				//透明色转默认色
				if(imgData[i]==0&&imgData[i+1]==0&&imgData[i+2]==0&&imgData[i+3]==0){
					array.push(this.Opt.EMPTY_COLOR)
				}else{
					array.push(rgb);
				}
				
			}
		}
		for (let index = 0; index < array.length; index++) {
			this.box[index].setColor(array[index]);
		}
		this.refresh();
	}
	createPixel() {
		for (var i = this.Opt.stepX + 1; i < this.bindElem.width; i += this.Opt.stepX) {
			for (var j = this.Opt.stepY + 1; j < this.bindElem.height; j += this.Opt.stepY) {
				var pixel = new Pixel({
					x: i,
					y: j,
					shape: 'rect',
					isFill: true,
					fillStyle: this.Opt.EMPTY_COLOR
				})
				this.box.push(pixel);
				pixel.draw(this.ctx);
			}
		}
		//初始化颜色选择器
		new ColorPicker({
			el: this.colorId,
			color: "#000",
			change:  (elem, hex) =>{
				elem.style.backgroundColor = hex;
				this.penColor = hex;
				this.tempPenColor = hex;
			}
		})
	}
}

export default Drawing;