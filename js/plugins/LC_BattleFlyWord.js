//=============================================================================
// LC_BattleFlyWord.js
// Version: 1.2.0
//=============================================================================
/*:
 * @plugindesc 战斗文字弹幕 V1.2.0
 * @author 无名
 *
 * @param Window Top Y
 * @type number
 * @desc 显示弹幕窗口顶部的Y坐标
 * @default 0
 *
 * @param Window Bottom Y
 * @type number
 * @desc 显示弹幕窗口底部的Y坐标
 * @default 300
 *
 * @param Min Speed
 * @type number
 * @desc 弹幕滚动的最小速度
 * @default 5
 *
 * @param Max Speed
 * @type number
 * @desc 弹幕滚动的最大速度
 * @default 10
 *
 * @param Font Family
 * @type string
 * @desc 字体样式
 * @default GameFont
 *
 * @param Font Italic
 * @type boolean
 * @desc 是否斜体true/false
 * @default false
 *
 * @param Font Outline Color
 * @type string
 * @desc 边框颜色
 * @default #FFFFFF
 *
 * @param Font Outline Width
 * @type number
 * @desc 边框宽度
 * @default 0
 *
 * @param Font Size
 * @type number
 * @desc 字体大小
 * @default 20
 *
 * @param Font Color
 * @type string
 * @desc 字体颜色
 * @default #FFFFFF

 * @help 
 * ===============================
 * 技能备注：
 * <flyword>
 * 弹幕1
 * 弹幕2
 * 弹幕3
 * </flyword> 
 * ===============================
 * 敌群事件：
 * 条件勾选回合 0 + 0*X
 * 创建插件指令
 * switch on 开启敌群战斗弹幕，默认开启
 * switch off 关闭
 * ===============================
 * 设置新字体参照工程目录下的fonts文件夹中gamefont.css
 * @font-face {
 *   font-family: GameFont;
 *   src: url("mplus-1m-regular.ttf");
 * }
 * @font-face {
 *   font-family: Ink;
 *   src: url("Inkfree.ttf");
 * }
 * Inkfree.ttf放在fonts目录下，Font Family配置Ink
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.20:
 * - 增加字体样式，斜体，边框大小，边框颜色全局定义.
 *
 * Version 1.11:
 * - 修正技能未配置弹幕出现其他字符.
 *
 * Version 1.10:
 * - 优化弹幕遮挡其他窗口.
 * - 新增配置全局字体大小和颜色
 *
 * Version 1.00:
 * - 初版
 */
//=============================================================================
// LC_BattleFlyWord
//=============================================================================
function LC_BattleFlyWord() { 
    this.initialize.call(this);
}
LC_BattleFlyWord.prototype.var = {
    tag : 'flyword', // 弹幕标签
    switch : true, // 控制战斗中是否开启弹幕，默认开启
    flyword : {
        text : '', // 弹幕内容
        x : '', // 弹幕位置
        y : '', // 弹幕位置
        speed : '', // 弹幕速度
        size : '', // 字体大小
        color : '', // 字体颜色
    }, // 弹幕对象
    flywords: [], // 执行的弹幕数组
};
LC_BattleFlyWord.prototype.initialize = function() {
    this._Parameters = PluginManager.parameters('LC_BattleFlyWord');
    this.var.config = {
        min_y : Number(this._Parameters['Window Top Y'] || 0), 
        max_y : Number(this._Parameters['Window Bottom Y'] || 300),
        min_speed : Number(this._Parameters['Min Speed'] || 5),
        max_speed : Number(this._Parameters['Max Speed'] || 10),
        font_size : Number(this._Parameters['Font Size'] || 20),
        font_color : String(this._Parameters['Font Color'] || '#FFFFFF'),
        font_family : String(this._Parameters['Font Family'] || 'GameFont'),
        font_outline_color : String(this._Parameters['Font Outline Color'] || '#FFFFFF'),
        font_outline_width : Number(this._Parameters['Font Outline Width'] || 0),
        font_italic : Boolean(this._Parameters['Font Italic'] || false),
    };
    this.initPluginCommand();
    this.initBattle();
    this.initFlyWindow();
};
// 初始化公共事件
LC_BattleFlyWord.prototype.initPluginCommand = function() {
    var Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    var that = this;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        Game_Interpreter_pluginCommand.call(this, command, args);
        switch(command){
            case "switch":
                that.switch(args[0]);
                break;
            default:
                break;
        }
    };
};
// 初始显示弹幕窗口
LC_BattleFlyWord.prototype.initFlyWindow = function() {
    // 开始
    var Scene_Battle_start = Scene_Battle.prototype.start;
    var that = this;
    Scene_Battle.prototype.start = function() {
        Scene_Battle_start.call(this);
        if(!that.var.switch){
            return;
        }
        this._flyWindow = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        this._flyWindow.bitmap.textColor = that.var.config.font_color;
        this._flyWindow.bitmap.fontSize = that.var.config.font_size;
        this._flyWindow.bitmap.fontFace = that.var.config.font_family;
        this._flyWindow.bitmap.outlineColor = that.var.config.font_outline_color;
        this._flyWindow.bitmap.outlineWidth = that.var.config.font_outline_width;
        this._flyWindow.bitmap.fontItalic = that.var.config.font_italic;
        
        this._flyword = that;
        this.addChild(this._flyWindow);
    };
    // 刷新
    var Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        Scene_Battle_update.call(this);
        this._drawText();
    };
    // 结束
    var Scene_Battle_stop = Scene_Battle.prototype.stop;
    Scene_Battle.prototype.stop = function() {
        Scene_Battle_stop.call(this);
        this.removeChild(this._flyWindow);
    };
    Scene_Battle.prototype._drawText = function() {
        if(!that.var.switch){
            return;
        }
        this._flyWindow.bitmap.clear();
        for (var i = 0; i < this._flyword.var.flywords.length; ++i) {
            var flyword = this._flyword.var.flywords[i];
            flyword.x = flyword.x - flyword.speed;
            if(flyword.x < -(flyword.text.length * flyword.size)){
                this._flyword.var.flywords.splice(i, 1);
                --i;
            }
            else{
                this._flyWindow.bitmap.drawText(flyword.text, flyword.x, flyword.y, Graphics.width, flyword.size, 'left');
                this._flyword.var.flywords[i].x = flyword.x;
            }
        }
        
    };
};

// 初始获取弹幕
LC_BattleFlyWord.prototype.initBattle = function() {
    // 开始
    var Game_Battler_startAnimation = Game_Battler.prototype.startAnimation;
    var that = this;
    Game_Battler.prototype.startAnimation = function(animationId, mirror, delay) {
        Game_Battler_startAnimation.call(this, animationId, mirror, delay);
        if(that.var.switch){
            that.getFlyWord(BattleManager._action._item);
        }
    };
};
// 获得技能弹幕字符串
LC_BattleFlyWord.prototype.getFlyWord = function(gameItem) {
    if(gameItem._dataClass != 'skill'){
        return;
    }
    // note
    this.analyzeNote($dataSkills[gameItem._itemId].note);
};
// 解析弹幕
LC_BattleFlyWord.prototype.analyzeNote = function(flywordString) {
    var startTag = '<' + this.var.tag + '>';
    var start = flywordString.indexOf(startTag) + startTag.length;
    var end = flywordString.indexOf('</' + this.var.tag + '>');
    var flyword_array = [];
    if(start != -1 && end != -1){
        flyword_array = flywordString.substring(start, end).trim().split("\n");
    }
    for(var i = 0;i < flyword_array.length;++i){
        var flyword = {};
        flyword.text = flyword_array[i];
        flyword.x = Graphics.boxWidth;
        flyword.y = this.randomNum(0, (this.var.config.max_y - this.var.config.min_y));
        flyword.speed = this.randomNum(this.var.config.min_speed, this.var.config.max_speed);
        flyword.size = this.var.config.font_size;
        flyword.color = this.var.config.font_color;
        this.var.flywords.push(flyword);
    }
};
// 切换触发弹幕
LC_BattleFlyWord.prototype.switch = function(flag) {
    switch(flag){
        case "on":
            this.var.switch = true;
            break;
        case "off":
            this.var.switch = false;
            break;
        default:
            break;
    }
};
//生成从minNum到maxNum的随机数
LC_BattleFlyWord.prototype.randomNum = function(minNum,maxNum){ 
    switch(arguments.length){ 
        case 1: 
            return parseInt(Math.random() * minNum + 1, 10); 
            break; 
        case 2: 
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10); 
            break; 
        default: 
            return 0;
    } 
};
(function(){
    new LC_BattleFlyWord();  
})();
