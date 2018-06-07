(function(){
	var LC_Window_ItemCategory_processOk = Window_ItemCategory.prototype.processOk;
	Window_ItemCategory.prototype.processOk = function() {
	    if (this.isCurrentItemEnabled()) {
	    	if(!this._firstOpen){
	    		this.playOkSound();
	    	}
	    	this._firstOpen = false;
	        this.updateInputData();
	        this.deactivate();
	        this.callOkHandler();
	    } else {
	        this.playBuzzerSound();
	    }
	};
	var LC_Scene_Item_create = Scene_Item.prototype.create;
	Scene_Item.prototype.create = function() {
		LC_Scene_Item_create.call(this);
		this._categoryWindow._firstOpen = true;
		this._categoryWindow.processOk();
	};
	var LC_Scene_Item_createItemWindow = Scene_Item.prototype.createItemWindow;
	Scene_Item.prototype.createItemWindow = function() {
		LC_Scene_Item_createItemWindow.call(this);
		this._itemWindow.setHandler('cancel', this.exitScene.bind(this));
	};
	var LC_Window_ItemCategory_makeCommandList = Window_ItemCategory.prototype.makeCommandList;
	Window_ItemCategory.prototype.makeCommandList = function() {
	    this.addCommand(TextManager.item,    'item');
	};
	var LC_Window_ItemCategory_windowWidth = Window_ItemCategory.prototype.windowWidth;
	Window_ItemCategory.prototype.windowWidth = function() {
		if (SceneManager._scene instanceof Scene_Item){
			return 0;	
		}
		return LC_Window_ItemCategory_windowWidth.call(this);
	};
})();
