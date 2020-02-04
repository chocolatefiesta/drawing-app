var app = new Vue({
  el: '#draw',
  data: {
    history: [],
		color: '#13c5f7',
		popups: {
			showColor: false,
			showSize: false,
			showWelcome: false,
			showSave: false,
			showOptions: false
		},
		options: {
			restrictY: false,
			restrictX: false
		},
		save: {
			name: '',
			saveItems: []
		},
		size: 24,
		colors: [
			'#d4f713',
			'#13f7ab',
			'#13f3f7',
			'#13c5f7',
			'#138cf7',
			'#1353f7',
			'#2d13f7',
			'#7513f7',
			'#a713f7',
			'#d413f7',
			'#f713e0',
			'#f71397',
			'#f7135b',
			'#f71313',
			'#f76213',
			'#f79413',
			'#f7e013'],
		sizes: [6, 12, 24, 48],
		weights: [ 2, 4, 6 ]
  },
	methods: {
		removeHistoryItem: ()=>{
			app.history.splice(app.history.length-2, 1);
			draw.redraw();
		},
		removeAllHistory: ()=>{
			app.history = [];
			draw.redraw();
		},
		simplify: ()=>{
			var simpleHistory = [];
			app.history.forEach((item, i)=>{
				if(i % 6 !== 1 || item.isDummy){
					simpleHistory.push(item);
				}
			});
			app.history = simpleHistory;
			draw.redraw();
		},
		jumble: ()=>{
			var simpleHistory = [];
			app.history.forEach((item, i)=>{
				item.r += Math.sin(i * 20) * 5;
			});
			app.history = app.shuffle(app.history);
			draw.redraw();
		},
		shuffle: (a)=>{
			var b = [];
			
			a.forEach((item, i)=>{
				if(!item.isDummy){
					var l = b.length;
					var r = Math.floor(l * Math.random());
					b.splice(r, 0, item);
				}
			});
			
			for(var i = 0; i < b.length; i++){
				if(i % 20 === 1){
					b.push(draw.getDummyItem());	
				}
			}
			
			return b;
		},
		saveItem: ()=>{
		
			var historyItem = {
				history: app.history.slice(),
				name: app.save.name
			};
			
			app.save.saveItems.push(historyItem);
			app.save.name = "";
			firebase.database().ref('drawings/drawing').set(
				Array.from(app.history.slice(), x => ({'x': x.x, 'y': x.y, 'isDummy': x.isDummy}))
			);			
		},
		loadSave: (item)=>{
			app.history = item.history.slice();
			draw.redraw();
		},
	}
});

class Draw {
	constructor(){
		this.c = document.getElementById('canvas');
		this.ctx = this.c.getContext('2d');
		
		this.mouseDown = false;
		this.mouseX = 0;
		this.mouseY = 0;
		
		this.tempHistory = [];
		
		this.setSize();
		
		this.listen();
		
		this.redraw();
	}
	
	mouseDownEvent(e){
		this.mouseDown = true;
		this.getCursorPosition(e);
		this.setDummyPoint();
	}

	mouseUpEvent(){
		if(this.mouseDown){
			this.setDummyPoint();
		}
		this.mouseDown = false;
	}

	mouseMoveEvent(e){
		this.moveMouse(e);
		if(this.mouseDown){
			this.getCursorPosition(e);		
			var item = {
				isDummy: false,
				x: this.mouseX,
				y: this.mouseY,
				c: app.color,
				r: app.size
			};
			app.history.push(item);
			this.draw(item, app.history.length);
		}
	}

	listen(){
		this.c.addEventListener('mousedown', (e)=>{
			this.mouseDownEvent(e);
		});
		this.c.addEventListener('mouseup', ()=>{
			this.mouseUpEvent()
		});
		this.c.addEventListener('mouseleave', ()=>{
			this.mouseUpEvent()
		});
		this.c.addEventListener('mousemove', (e)=>{
			this.mouseMoveEvent(e)
		});


		this.c.addEventListener('touchstart', (e)=>{
			if (e.target == this.c) {
				e.preventDefault();
			};
			this.mouseDownEvent(e);
		});
		this.c.addEventListener('touchend', (e)=>{
			if (e.target == this.c) {
				e.preventDefault();
			};
			this.mouseUpEvent();
		});
		this.c.addEventListener('touchcancel', ()=>{
			if (e.target == this.c) {
				e.preventDefault();
			};
			this.mouseUpEvent();
		});
		this.c.addEventListener('touchmove', (e)=>{
			if (e.target == this.c) {
				e.preventDefault();
			};
			this.mouseMoveEvent(e);
		});

		window.addEventListener('resize', ()=>{
			this.setSize();
			this.redraw();
		});
	}
	
	setSize(){
		let min_size = Math.min(window.innerWidth, window.innerHeight)
		this.c.width = this.c.offsetWidth;
		this.c.height = this.c.offsetHeight;
	}

	getCursorPosition(e){
		if (e.offsetX) {
            this.mouseX = e.offsetX;
			this.mouseY = e.offsetY;
        }
        else if (e.touches[0].clientX) {
            this.mouseX = e.touches[0].clientX - this.c.offsetLeft;
			this.mouseY = e.touches[0].clientY - this.c.offsetTop;
		}
	}
	
	moveMouse(e){
		if (e.offsetX) {
            var x = e.offsetX;
            var y = e.offsetY;
        }
        else if (e.touches[0].clientX) {
            var x = e.touches[0].clientX;
            var y = e.touches[0].clientY;
		}
		
		var cursor = document.getElementById('cursor');
		
		cursor.style.transform = `translate(${x + this.c.offsetLeft}px, ${y + this.c.offsetTop}px)`;
	}
	
	getDummyItem(){
		var lastPoint = app.history[app.history.length-1];
		
		return {
			isDummy: true,
			x: lastPoint.x,
			y: lastPoint.y,
			c: null,
			r: null
		};
	}
	
	setDummyPoint(){
		var item = this.getDummyItem();
		app.history.push(item);
		this.draw(item, app.history.length);
	}
	
	redraw(){
		this.ctx.clearRect(0, 0, this.c.width, this.c.height);
		this.drawBgDots();
		
		if(!app.history.length){
			return true;
		}
		
		app.history.forEach((item, i)=>{
			this.draw(item, i);
		});
	}
	
	drawBgDots(){
		var gridSize = 50;
		this.ctx.fillStyle = 'rgba(0, 0, 0, .2)';
		
		for(var i = 0; i*gridSize < this.c.width; i++){
			for(var j = 0; j*gridSize < this.c.height; j++){
				if(i > 0 && j > 0){
					this.ctx.beginPath();
					this.ctx.rect(i * gridSize, j * gridSize, 2, 2);
					this.ctx.fill();
					this.ctx.closePath();
				}
			}
		}
	}
	
	draw(item, i){
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = "round";
		
		var prevItem = app.history[i-2];
				
		if(i < 2){
			return false;
		}

		if(!item.isDummy && !app.history[i-1].isDummy && !prevItem.isDummy){
			this.ctx.strokeStyle = item.c;
			this.ctx.lineWidth = item.r;
			
			this.ctx.beginPath();
			this.ctx.moveTo(prevItem.x, prevItem.y);
			this.ctx.lineTo(item.x, item.y);
			this.ctx.stroke();
			this.ctx.closePath();
		} else if (!item.isDummy) {			
			this.ctx.strokeStyle = item.c;
			this.ctx.lineWidth = item.r;
			
			this.ctx.beginPath();
			this.ctx.moveTo(item.x, item.y);
			this.ctx.lineTo(item.x, item.y);
			this.ctx.stroke();
			this.ctx.closePath();
		}
	}
}

var draw = new Draw();