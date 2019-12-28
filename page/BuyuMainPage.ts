/**
* 游戏大厅
*/
module gamebuyu.page {
    export class BuyuMainPage extends game.gui.base.Page {
        private _viewUI: ui.ajqp.game_ui.buyu.BuYu_HUDUI;
        private _difenTmep: any = [0.01, 0.1, 1];
        private _leastTmep: any = [1, 10, 100];

        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._asset = [
                PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "logo.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
                Path_game_buyu.atlas_game_ui + "buyu/hud.atlas",
                Path_game_buyu.atlas_game_ui + "buyu/tongyong.atlas",
                Path_game_buyu.atlas_game_ui + "buyu/hudscene.atlas",
                PathGameTongyong.atlas_game_ui_tongyong_general + "anniu.atlas",
                PathGameTongyong.atlas_game_ui_tongyong_general_effect + "anniug.atlas",
                Path.temp + "template.bin",
                Path.temp + "fish_group.json",
            ];
            this._isNeedDuang = false;
        }

        // 页面初始化函数
        protected init(): void {
            this._viewUI = this.createView('game_ui.buyu.BuYu_HUDUI', ["game_ui.tongyong.HudUI"]);
            this.addChild(this._viewUI);

            for (let index = 0; index < this._viewUI.box_right.numChildren; index++) {
                this._viewUI.box_right._childs[index].visible = false;
            }
            BuyuPageDef.parseBuYuData(this._assetsLoader);
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();

            (this._viewUI.view_hud as TongyongHudPage).onOpen(this._game, BuyuPageDef.GAME_NAME);
            //按钮监听
            // this._viewUI.img_room0.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            // this._viewUI.img_room1.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            // this._viewUI.img_room2.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            // this._viewUI.img_room3.on(LEvent.CLICK, this, this.onBtnClickWithTween);

            for (let index = 0; index < this._viewUI.box_right.numChildren; index++) {
                this._viewUI.box_right._childs[index].visible = true;
                Laya.Tween.from(this._viewUI.box_right._childs[index], {
                    x: 1280
                }, 200 + index * 100, Laya.Ease.linearNone, Handler.create(this, () => {
                    this._viewUI.box_right._childs[index].on(LEvent.CLICK, this, this.onBtnClickWithTween);
                }));
            }
            //房间条件
            for (let index = 0; index < this._difenTmep.length; index++) {
                this._viewUI["txt_difen" + (index + 1)].text = this._difenTmep[index] + "";
            }
            for (let index = 0; index < this._leastTmep.length; index++) {
                this._viewUI["txt_least" + (index + 1)].text = this._leastTmep[index] + "";
            }
            this._game.playMusic(Path.music + "buyu/bg.mp3");
        }

        // 重新布局
        protected layout(): void {
            super.layout();
        }

        /**按钮点击事件缓动完 回调 该做啥就做啥 */
        protected onBtnTweenEnd(e: any, target: any): void {
            let mainPlayer = this._game.sceneObjectMgr.mainPlayer;
            if (!mainPlayer) return;
            switch (target) {
                case this._viewUI.img_room0://体验场
                    this.checkMoneyToStory(Web_operation_fields.GAME_ROOM_CONFIG_FISH_1);
                    break;
                case this._viewUI.img_room1://0.01元场
                    this.checkMoneyToStory(Web_operation_fields.GAME_ROOM_CONFIG_FISH_2);
                    break;
                case this._viewUI.img_room2://0.1元场
                    this.checkMoneyToStory(Web_operation_fields.GAME_ROOM_CONFIG_FISH_3);
                    break;
                case this._viewUI.img_room3://1元场
                    this.checkMoneyToStory(Web_operation_fields.GAME_ROOM_CONFIG_FISH_4);
                    break;
            }
        }

        /**
         * 检查进入房间的vip等级，至少vip1
         */
        private checkVipLevel(): boolean {
            let mainPlayer = this._game.sceneObjectMgr.mainPlayer;
            if (!mainPlayer) return false;
            if (mainPlayer.playerInfo.vip_level < 1) {
                TongyongPageDef.ins.alertRecharge(StringU.substitute("老板，进入该场次需要 VIP 1 哦，充点小钱即可达到"), () => {
                    this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
                }, () => {
                }, true, TongyongPageDef.TIPS_SKIN_STR['cz'], TongyongPageDef.TIPS_SKIN_STR["title_ts"]);
                return false;
            }
            return true;
        }

        /**
         * 检查进入房间的条件
         * @param mode 
         */
        public checkMoneyToStory(mode: number): void {
            let mainPlayer = this._game.sceneObjectMgr.mainPlayer;
            if (!mainPlayer) return;
            let haveMoney = this._game.sceneObjectMgr.mainPlayer.playerInfo.money;
            let roomInfo = BuyuPageDef.getRoomInfoByMode(mode);
            if (haveMoney < roomInfo.minGold) {
                let str = StringU.substitute("老板，您的金币少于{0}哦~\n补充点金币去大杀四方吧~", roomInfo.minGold);
                this.gotoRecharge(str);
            } else {
                if (mode >= Web_operation_fields.GAME_ROOM_CONFIG_FISH_3 && !WebConfig.enterGameLocked) {
                    if (!this.checkVipLevel()) return;
                }
                //进入
                this._game.sceneObjectMgr.intoStory(BuyuPageDef.GAME_NAME, mode.toString(), true);
            }
        }

        /**
		 * 走！咱们充钱去
		 * @param str 
		 * @param ecb 
		 * @param ccb 
		 */
        private gotoRecharge(str: string, ecb: Function = null, ccb: Function = null) {
            this._game.alert(str, () => {
                if (ecb) {
                    ecb();
                }
                this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
            }, () => {
                if (ccb) {
                    ccb();
                }
            }, true, Tips.TIPS_SKIN_STR["cz"]);
        }

        public close(): void {
            if (this._viewUI) {
                this._viewUI.img_room0.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.img_room1.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.img_room2.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.img_room3.off(LEvent.CLICK, this, this.onBtnClickWithTween);
            }
            super.close();
        }
    }
}