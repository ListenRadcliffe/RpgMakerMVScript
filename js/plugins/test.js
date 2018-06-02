var Scene_Battle_start = Scene_Battle.prototype.start;
Scene_Battle.prototype.start = function() {
    Scene_Battle_start.call(this);
    this.sprite = new Sprite(new Bitmap(Graphics.width, Graphics.height));
    this.addChild(this.sprite);
    this.sprite.bitmap.fontSize = 72;
    this.sprite.bitmap.drawText("123456", 20, Graphics.height-20, Graphics.width - 40, 48, 'left');

    this.sprite.bitmap.fontSize = 35;
    this.sprite.bitmap.drawText("123456", 20, Graphics.height-100, Graphics.width - 40, 48, 'left');
};