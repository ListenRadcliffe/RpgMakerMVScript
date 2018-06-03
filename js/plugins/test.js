(function(){
	var Scene_Map_start = Scene_Map.prototype.start;
	Scene_Map.prototype.start = function() {
	    Scene_Map_start.call(this);
	    this._skill = new Sprite();
	   	this._skill.bitmap = ImageManager.loadPicture('Test');
	   	this._skill.setFrame(0, 0, 192, 192);
	   	this._i = 0;
	   	this.addChild(this._skill);
	};
	// 更新
	var Scene_Map_update = Scene_Map.prototype.update;
	Scene_Map.prototype.update = function() {
	    Scene_Map_update.call(this);
	    if(Input.isTriggered('ok')){
	    	this._i++;
	    	this._skill.move(this._i, 0);

	    	console.log($gameMap.data());
	    }
	};
})();