//=============================================================================
// BattleSummonActor.js
//=============================================================================

/*:
* @plugindesc 战斗中召唤插件
* @author 路人甲
*
*
* @help 一个可以让你在战斗中召唤队友的插件。
* 你也可以在战斗命令的目录做“交换成员”命令指令。
* 通过动态扩展队伍大小，即使战斗队伍已满员，你也可以进行召唤。
* 另外声明一下，本插件是属于临时性召唤，战斗结束时召唤的角色也会消失。
*
* ------------------------------------------------------------------------------------------------　
* 技能栏注释：
* <summon_actor:[被召唤的演员的ID]>
* 这是一个基本的召唤注释。召唤ID指向的角色。
*
* <summon_require_state:[状态ID]>
* 当这个注释处于召唤技能状态时，它会自动将状态ID的状态分配给召唤的角色，
* 由于某些原因（释放技能，状态时间等原因）而取消此状态时，召唤物将立即消失。 （因为它已经被取消而不是死亡
* 如果你正在使用一个在死亡时发挥其效果的插件，看起来它的效果将不会以很高的概率展现出来，具体取决于实施情况）
*
* 角色注释：
* <summon_vanish_anime_id:[动画ID]>
* 消失时播放动画的ID。
* 召唤单位的坐标 <summon_position:700,200>   700为X轴  200为Y轴
* <summon_appear_anime_id:[动画ID]>
* 召唤时动画的ID。
* ------------------------------------------------------------------------------------------------
* ．
* 【规格和注意事项】
* ・被召唤角色可以像其他角色一样进行操作
* ・同一个角色 ID只能存在一个在战场。如果你尝试使用召唤技能两次，即使你指定已经加入队伍角色ID的人被召唤时，也会显示失败。
* ・召唤除了技能以外的状态效果全部被消耗之后才实行。所以在含有一定限制性状态的条件下实现召唤功能时需要注意。
* ・召唤角色是以最低等级、以及不包含装备的状态出现。所以在设定角色状态时请考虑这一点。
* ・当HP变为0或战斗结束时被召唤的角色将会消失。此时被召唤的各项能力值、buff等全部重置。
* ・由于上述原因，我们不建议召唤临时脱离队伍的角色。因为这样该角色人物的等级被重置。
* ・有可能会与操作队伍成员数量的插件产生冲突。请把这个插件放在下面。
*/



(function() {
    function LC_Summon_Utils() {
        throw new Error('This is a static class');
    }

    LC_Summon_Utils.loadImage = function(filename, hue) {
        return ImageManager.loadBitmap('img/enemies/', filename, hue, false);

    };

    LC_Summon_Utils.loadNotetags = function(actor) {
        const regex = /<LC_Summon\s*Image\s*:\s*(.*)\s*>/im;
        const regex1 = /<LC_Summon\s*Scale\s*:\s*(.*)\s*>/im;
        const regex2 = /<LC_Summon\s*Hue\s*:\s*(.*)\s*>/im;
        const note = $dataActors[actor.actorId()].note;
        actor.lc_summon_image = {
            source : false,
            scale : false,
            hue : false
        };
        if(note.match(regex)) {
            actor.lc_summon_image.source = String(RegExp.$1);
        }
        if(note.match(regex1)) {
            actor.lc_summon_image.scale = parseFloat(RegExp.$1);
        }
        if(note.match(regex2)) {
            actor.lc_summon_image.hue = parseInt(RegExp.$1);
        }
        return actor;
    };
    LC_Summon_Utils.hasSummonImage = function(actor) {
        if(actor && actor.lc_summon_image && actor.lc_summon_image.source != false){
            return true;
        }
        return false;
    };
    LC_Summon_Utils.summonImageSource = function(actor) {
        if(actor && actor.lc_summon_image && actor.lc_summon_image.source != false){
            return actor.lc_summon_image.source;
        }
        return false;
    };
    LC_Summon_Utils.summonImageHue = function(actor) {
        if(actor && actor.lc_summon_image && actor.lc_summon_image.hue != false){
            return actor.lc_summon_image.hue;
        }
        return 0;
    };
    LC_Summon_Utils.summonImageScale = function(actor) {
        if(actor && actor.lc_summon_image && actor.lc_summon_image.scale != false){
            return actor.lc_summon_image.scale;
        }
        return 1;
    };

    var kz_Game_Party_prototype_initialize = Game_Party.prototype.initialize;
    Game_Party.prototype.initialize = function() {
        kz_Game_Party_prototype_initialize.call(this);
        this._summonMemberCount = 0;
    };

    var kz_Game_Party_prototype_maxBattleMembers = Game_Party.prototype.maxBattleMembers;
    Game_Party.prototype.maxBattleMembers = function() {
        return kz_Game_Party_prototype_maxBattleMembers.call(this) + this._summonMemberCount;
    };

    Game_Party.prototype.summonActorInBattle = function(actorId, stateId, position)
    {
        this.lastSummonResult = 1;
        // 召唤物
        var target = $gameActors.actor(actorId);

        if (target) {
            if (this._actors.indexOf(actorId) < 0)
            {
                this._actors.splice(this.maxBattleMembers(), 0, actorId);
                this._summonMemberCount ++;
                target._summoned = true;
                target._summon_p = position;
                target = LC_Summon_Utils.loadNotetags(target);
                if (stateId > 0)
                {
                    target._summoned_require_state = stateId;
                    target.addState(stateId);
                }
                target.appear();
                SceneManager._scene._spriteset.addLastActorSprite();
                var targetSprite = SceneManager._scene._spriteset.findSpriteFromBattler(target);
                target.startAppearAnime();
                this.lastSummonResult = 2;
            }
        }
    }

    Game_Party.prototype.removeActorFromBattle = function(actorId)
    {
        var target = $gameActors.actor(actorId);
        if (target && this._actors.contains(actorId))
        {
            SceneManager._scene._spriteset.removeLastActorSprite(target);
            this.removeActor(actorId)
            if (target._summoned)
            {
                this._summonMemberCount --;
                $gameActors.deleteActor(actorId);
            }
            return true;
        }
        return false;
    }

    Game_Party.prototype.removeAllSummons = function()
    {
        var targetActorIds = [];
        this._actors.forEach(function(actorId){
        if ($gameActors.actor(actorId)._summoned)
        {
            targetActorIds.push(actorId);
        }
        });

        for (var i = 0; i < targetActorIds.length; i++)
        {
            this.removeActorFromBattle(targetActorIds[i]);
        }
    }

    //结合数据保存和数据重置
    Game_Actors.prototype.deleteActor = function(actorId) {
        if (this._data[actorId]) {
            this._data[actorId] = new Game_Actor(actorId);
        }
    };

    //消灭条件处理
    var kz_Game_Actor_prototype_refresh = Game_Actor.prototype.refresh;
    Game_Actor.prototype.refresh = function() {
        kz_Game_Actor_prototype_refresh.call(this);    

        //死亡消失
        if (this.isDead() && this._summoned)
        {
            this.startVanishAnime();
        }

        //由于未达到状态而消失
        if (this._summoned_require_state && !this.isStateAffected(this._summoned_require_state))
        {
            this.startVanishAnime();
        }
    };

    Game_Actor.prototype.startVanishAnime = function()
    {
        var vanishAnimeId = $dataActors[this.actorId()].meta.summon_vanish_anime_id
        if (vanishAnimeId)
        {
            this.startAnimation(parseInt(vanishAnimeId,10));
            BattleManager._logWindow.waitForEffect();
        }
        this._removeAfterAnime = true;
    }

    Game_Actor.prototype.startAppearAnime = function()
    {
        var appearAnimeId = $dataActors[this.actorId()].meta.summon_appear_anime_id
        if (appearAnimeId)
        {
            this.startAnimation(parseInt(appearAnimeId,10));
            BattleManager._logWindow.waitForEffect();
        }
        this._appearAfterAnime = true;
    }

    var kz_Game_Action_prototype_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function( target) {
        $gameParty.lastSummonResult = 0;
        kz_Game_Action_prototype_apply.call(this, target);
        var summonActorId = this.item().meta.summon_actor;
        var summon_position = this.item().meta.summon_position;
        
        // console.log(this.subject());
        
        
        if (summonActorId)
        {
            var summonState = this.item().meta.summon_require_state;
            var numSummonState = summonState ? parseInt(summonState, 10) : -1;
            var numActorId = parseInt(summonActorId, 10);
            $gameParty.summonActorInBattle(numActorId, numSummonState, summon_position);
            target.result().success = true;
        }
    }

    var kz_Sprite_Actor_setActorHome = Sprite_Actor.prototype.setActorHome;
    var kz_BattleSummonActor_Parameters = PluginManager.parameters('BattleSummonActor');
    Sprite_Actor.prototype.setActorHome = function(index) {
        kz_Sprite_Actor_setActorHome.call(this, index);
        // 召唤物
        var distance = Number(kz_BattleSummonActor_Parameters['Distance'] || 500);
        if(this._actor._summoned){
            var position = String(this._actor._summon_p || "100, 100").split(",");
            this.setHome(Number(position[0]), Number(position[1]));
        }
    };

    var kz_BattleManager_update = BattleManager.update;
    BattleManager.update = function() {
        var spriteset = SceneManager._scene._spriteset;
        $gameParty.allMembers().forEach(function(actor) {
            var sprite = spriteset.findSpriteFromBattler(actor);
            if (!sprite.isAnimationPlaying() && !actor.isAnimationRequested())
            {
                if (actor._removeAfterAnime)
                {
                    BattleManager.summonVanish(actor);
                    return;
                }

                if (actor._appearAfterAnime)
                {
                    sprite.opacity = 255;
                    actor._appearAfterAnime = false;
                    return;
                }
            }
            else if(actor._appearAfterAnime)
            {
                sprite.opacity = 0;
            }
        });

        kz_BattleManager_update.call(this);
    };

    BattleManager.summonVanish = function(actor)
    {
        var removed = $gameParty.removeActorFromBattle(actor.actorId());
        if (removed)
        {
            this._logWindow.showSummonVanish(actor.name());
        }
    }

    var kz_BattleManager_processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function() {
        kz_BattleManager_processVictory.call(this);
        $gameParty.removeAllSummons();
    }

    var kz_BattleManager_processEscape = BattleManager.processEscape;
    BattleManager.processEscape = function() {
        var success = kz_BattleManager_processEscape.call(this);
        if (success)
        {
            $gameParty.removeAllSummons();
        }
        return success;
    }

    Spriteset_Battle.prototype.renewAllActors = function() {
        for (var i = 0; i < this._actorSprites.length; i++) {
            this._battleField.removeChild(this._actorSprites[i]);
        }
        this.createActors();
    };

    Spriteset_Battle.prototype.addLastActorSprite = function() {
        var newActorSprite = new Sprite_Actor();
        this._actorSprites.push(newActorSprite);
        this._battleField.addChild(newActorSprite);
    };

    Spriteset_Battle.prototype.removeLastActorSprite = function(targetActor) {
        var targetActorSprite = this.findSpriteFromBattler(targetActor);
        var num = this._actorSprites.indexOf(targetActorSprite);
        this._actorSprites.splice(num, 1);
        this._battleField.removeChild(targetActorSprite);
    };

    Spriteset_Battle.prototype.findSpriteFromBattler = function(battler)
    {
        var targetSet = battler.isActor() ? this._actorSprites : this._enemySprites;
        var result = null;
        targetSet.forEach(function(sprite)
        {
            if (sprite._battler == battler)
            {
                result = sprite;
            }
        });
        return result;
    }

    var kz_Sprite_Actor_prototype_startEntryMotion = Sprite_Actor.prototype.startEntryMotion;
    Sprite_Actor.prototype.startEntryMotion = function() {
        if (this._actor && this._actor._summoned) {
            this.startMove(0, 0, 0);
        }
        else
        {
            kz_Sprite_Actor_prototype_startEntryMotion.call(this);
        }
    };

    var kz_Window_BattleLog_prototype_endAction = Window_BattleLog.prototype.endAction;
    Window_BattleLog.prototype.endAction = function(subject) {
        this.showSummonResult(subject);
        kz_Window_BattleLog_prototype_endAction.call(this, subject);
    };

    Window_BattleLog.prototype.showSummonResult = function(subject) {
        if ($gameParty.lastSummonResult == 2)
        {
            this.push('addText', "召唤成功");
            $gameParty.lastSummonResult = 0;
            this.push('wait');
            this.push('clear');
        }
        else if ($gameParty.lastSummonResult == 1)
        {
            this.push('addText', "召唤失败");
            $gameParty.lastSummonResult = 0;
            this.push('wait');
            this.push('clear');
        }
    };

    Window_BattleLog.prototype.showSummonVanish = function(actorName) {    
        var text = "%1被消灭了！";
        this.push('addText', text.format(actorName));
        this.push('wait');
        this.push('clear');
    };

    //-----------------------------------------------------------------------------
    // Sprite_Actor
    //-----------------------------------------------------------------------------

    LC_Summon_Utils.Sprite_Actor_initialize = Sprite_Actor.prototype.initialize;
    Sprite_Actor.prototype.initialize = function() {
        LC_Summon_Utils.Sprite_Actor_initialize.call(this);
        this._actionStartStuffs = ['thrust', 'swing', 'missile', 'skill', 'spell', 'item'];
    };

    LC_Summon_Utils.Sprite_Actor_updateBitmap = Sprite_Actor.prototype.updateBitmap;
    Sprite_Actor.prototype.updateBitmap = function() {
        if(this._battlerName !== name) {
            this._shadowSprite.opacity = 255;
            this._stateSprite.opacity = 255;
            this._mainSprite.scale.set(1);
            this._stateSprite.y = 0;
        };
        LC_Summon_Utils.Sprite_Actor_updateBitmap.call(this);
        if(LC_Summon_Utils.hasSummonImage(this._actor)) {
            if(this._staticSpriteName !== LC_Summon_Utils.summonImageSource(this._actor)) {
                this._staticSpriteName = LC_Summon_Utils.summonImageSource(this._actor);
                this._mainSprite.bitmap = LC_Summon_Utils.loadImage(this._staticSpriteName, LC_Summon_Utils.summonImageHue(this._actor));
                this._mainSprite.scale.set(LC_Summon_Utils.summonImageScale(this._actor));
                this._shadowSprite.opacity = 0;
                this._stateSprite.opacity = 0;
            }
        }
    };

    LC_Summon_Utils.Sprite_Actor_updateFrame = Sprite_Actor.prototype.updateFrame;
    Sprite_Actor.prototype.updateFrame = function() {
        LC_Summon_Utils.Sprite_Actor_updateFrame.call(this);
        if(LC_Summon_Utils.hasSummonImage(this._actor)) {
            this._mainSprite.scale.set(LC_Summon_Utils.summonImageScale(this._actor));
            const bit = this._mainSprite.bitmap;
            this._mainSprite.setFrame(0, 0, bit.width, bit.height);
        }
    };

    LC_Summon_Utils.Sprite_Actor_setupWeaponAnimation = Sprite_Actor.prototype.setupWeaponAnimation;
    Sprite_Actor.prototype.setupWeaponAnimation = function() {
        if(!LC_Summon_Utils.hasSummonImage(this._actor)) {
            LC_Summon_Utils.Sprite_Actor_setupWeaponAnimation.call(this);
        };
    };

    Sprite_Actor.prototype.startWhiten = function() {
        this._effectType = 'white';
        this._effectDuration = 16;
    };

    Sprite_Actor.prototype.startBlink = function() {
        this._effectType = 'blink';
        this._effectDuration = 20;
    };

    LC_Summon_Utils.Sprite_Actor_update = Sprite_Actor.prototype.update;
    Sprite_Actor.prototype.update = function() {
        LC_Summon_Utils.Sprite_Actor_update.call(this);
        if(LC_Summon_Utils.hasSummonImage(this._actor)) {
            this.updateStaticEffect();
        }
    };

    Sprite_Actor.prototype.updateStaticEffect = function() {
        if(this._effectType && this._effectDuration > 0) {
            this._effectDuration--;
            if(this._effectType === 'white') this.updateWhiten();
            else if(this._effectType === 'blink') this.updateBlink();
            if(this._effectDuration === 0) {
                this._effectType = null;
            }
        }
    };

    Sprite_Actor.prototype.updateWhiten = function() {
        var alpha = 128 - (16 - this._effectDuration) * 10;
        this._mainSprite.setBlendColor([255, 255, 255, alpha]);
    };

    Sprite_Actor.prototype.updateBlink = function() {
        this.opacity = (this._effectDuration % 10 < 5) ? 255 : 0;
    };

    LC_Summon_Utils.Sprite_Actor_startMotion = Sprite_Actor.prototype.startMotion;
    Sprite_Actor.prototype.startMotion = function(motionType) {
        LC_Summon_Utils.Sprite_Actor_startMotion.apply(this, arguments);
        if(LC_Summon_Utils.hasSummonImage(this._actor)) {
            if(motionType === 'damage') {
                this.startBlink();
            } else if(this._actionStartStuffs.contains(motionType)) {
                this.startWhiten();
            }
        }
    };

})();    