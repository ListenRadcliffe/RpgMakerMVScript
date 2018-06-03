//=============================================================================
// LC_ItemRandomProperty.js
// Version: 1.1.0
//=============================================================================
/*:
 * @plugindesc 物品属性随机浮动 V1.1.0
 * @author 无名
 *
 * @help 给定一组随机配置（最多8个）
 * 使获取的物品的属性浮动随机数值
 * 【如给定的随机数是10，随机数值在-10 到 10之间】
 * =========================================
 * 放在YEP_ITEMCORE下面
 * =========================================
 * 备注<note>：
 * <lc_random_pro>
 * 100|0, 5, 0, 80|6, 10, 81, 100
 * 100|0, 5, 0, 80|0, 5, 81, 100
 * </lc_random_pro>
 * 每一行对应一条属性的配置，参考游戏里物品菜单里的顺序
 * 或者其他项给0自行测试
 * 100代表系统生成0-100的随机数
 * 后面跟范围配置，|分割
 * 如0, 5, 0, 80代表随机数如果在0-80之间，则属性变动的0-5之间
 * =========================================
 */
(function() {
    var itemManager_randomizeInitialStats = ItemManager.randomizeInitialStats;
    ItemManager.randomizeInitialStats = function(baseItem, newItem) {
        itemManager_randomizeInitialStats.call(this, baseItem, newItem);

        var config = ItemManager.analyzeNote(baseItem.note);
        if (config.length == 0) {
            return;
        }
        for (var i = 0; i < 8; ++i) {
            if (config[i] == undefined) {
                return;
            }
            newItem.params[i] += ItemManager.makeItemRandom(config[i]);
            if (!Yanfly.Param.ItemNegVar && baseItem.params[i] >= 0) {
                newItem.params[i] = Math.max(newItem.params[i], 0);
            }
        }
    };
    ItemManager.analyzeNote = function(note) {
        var startTag = '<lc_random_pro>';
        var start = note.indexOf(startTag) + startTag.length;
        var end = note.indexOf('</lc_random_pro>');
        var note = note.substring(start, end).trim().split("\n");
        var result = [];
        for(var i = 0;i < note.length;++i){
            var _result = note[i].split("|");
            for(j = 1;j < _result.length;++j){
                _result[j] = _result[j].split(",");
            }
            result[i] = _result;
        }
        return result;
    };
    ItemManager.makeItemRandom = function(config){ 
        // [100, [0, 5, 0, 80], [6, 10, 81, 100]]
        var random = Math.random() * config[0];
        var result = 0;
        for(var i = 1;i < config.length;++i){
            if(random >= config[i][2] && random < config[i][3]){
                result = ItemManager.randomNum(config[i][0], config[i][1]);
                break;
            }  
        }
        return parseInt(result);
    }
    ItemManager.randomNum = function(minNum, maxNum){ 
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
})();