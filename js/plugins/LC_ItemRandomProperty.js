//=============================================================================
// LC_ItemRandomProperty.js
// Version: 1.0.0
//=============================================================================
/*:
 * @plugindesc 物品属性随机浮动 V1.0.0
 * @author 无名
 *
 * @help 给定一组随机数（最多8个）<1,2,3,4,5,6,7,8>
 * 使获取的物品的属性浮动随机数值
 * 【如给定的随机数是10，随机数值在-10 到 10之间】
 * =========================================
 * 放在YEP_ITEMCORE下面
 * =========================================
 * 备注<note>：
 * <lc_random_properties:1,2,3,4,5,6,7,8>
 *  1,2,3,4,5,6,7,8对应的属性参考游戏里物品菜单里的顺序
 * 或者其他项给0自行测试
 * =========================================
 */
(function() {
    var itemManager_randomizeInitialStats = ItemManager.randomizeInitialStats;
    ItemManager.randomizeInitialStats = function(baseItem, newItem) {
        itemManager_randomizeInitialStats.call(this, baseItem, newItem);
        var randoms = (String(baseItem.meta.lc_random_properties)).split(',');
        if (randoms.length == 0) {
            return;
        }
        for (var i = 0; i < 8; ++i) {
            var random = (parseInt(randoms[i]) || 0);
            var randomValue = random * 2 + 1;
            var offset = random;
            newItem.params[i] += Math.floor(Math.random() * randomValue - offset);
            if (!Yanfly.Param.ItemNegVar && baseItem.params[i] >= 0) {
                newItem.params[i] = Math.max(newItem.params[i], 0);
            }
        }
    };
})();