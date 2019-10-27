/**
* 游戏大厅
*/
module gamebuyu.page {
    export class BuyuMainPage extends game.gui.base.Page {
        private _viewUI: ui.nqp.game_ui.buyu.BuYu_HUDUI;
        private _difenTmep: any = [0.01, 0.1, 1];
        private _leastTmep: any = [1, 10, 100];
        private _clipArr: any[] = [ClipUtil.HUD_FONT1, ClipUtil.HUD_FONT2, ClipUtil.HUD_FONT3];
        private _difenClipList: ClipUtil[] = [];
        private _leastClipList: ClipUtil[] = [];

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
                Path_game_buyu.ui_buyu + "sk/buyu_0.png",
                Path_game_buyu.ui_buyu + "sk/buyu_1.png",
                Path_game_buyu.ui_buyu + "sk/buyu_2.png",
                Path_game_buyu.ui_buyu + "sk/buyu_3.png",
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
            for (let index = 0; index < 3; index++) {
                if (!this._difenClipList[index]) {
                    this._difenClipList[index] = new ClipUtil(this._clipArr[index]);
                    this._difenClipList[index].x = this._viewUI["txt_difen" + index].x;
                    this._difenClipList[index].y = this._viewUI["txt_difen" + index].y;
                    this._viewUI["txt_difen" + index].parent && this._viewUI["txt_difen" + index].parent.addChild(this._difenClipList[index]);
                    this._viewUI["txt_difen" + index].removeSelf();
                }
                if (!this._leastClipList[index]) {
                    this._leastClipList[index] = new ClipUtil(this._clipArr[index]);
                    this._leastClipList[index].x = this._viewUI["txt_least" + index].x;
                    this._leastClipList[index].y = this._viewUI["txt_least" + index].y;
                    this._leastClipList[index].scale(0.8, 0.8);
                    this._viewUI["txt_least" + index].parent && this._viewUI["txt_least" + index].parent.addChild(this._leastClipList[index]);
                    this._viewUI["txt_least" + index].removeSelf();
                }
            }
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            (this._viewUI.view_hud as TongyongHudNqpPage).onOpen(this._game, BuyuPageDef.GAME_NAME);
            //按钮监听
            this._viewUI.img_room0.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.img_room1.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.img_room2.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.img_room3.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_join.on(LEvent.CLICK, this, this.onBtnClickWithTween);

            for (let index = 0; index < this._viewUI.box_right.numChildren; index++) {
                this._viewUI.box_right._childs[index].visible = true;
                Laya.Tween.from(this._viewUI.box_right._childs[index], {
                    right: -300
                }, 200 + index * 100, Laya.Ease.linearNone);
            }
            //房间条件
            for (let index = 0; index < this._difenClipList.length; index++) {
                this._difenClipList[index].setText(this._difenTmep[index], true, false);
            }
            for (let index = 0; index < this._leastClipList.length; index++) {
                this._leastClipList[index].setText(this._leastTmep[index], true, false);
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
                case this._viewUI.btn_join:
                    let maplv = TongyongUtil.getJoinMapLv(BuyuPageDef.GAME_NAME, mainPlayer.playerInfo.money);
                    if (!maplv) return;
                    //后两个场次需要vip1才可以进去
                    if (maplv >= Web_operation_fields.GAME_ROOM_CONFIG_FISH_3) {
                        if (!this.checkVipLevel()) return;
                    }
                    this._game.sceneObjectMgr.intoStory(BuyuPageDef.GAME_NAME, maplv.toString(), true);
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
                if (mode >= Web_operation_fields.GAME_ROOM_CONFIG_FISH_3) {
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
            }, true);
        }

        public close(): void {
            if (this._viewUI) {
                this._viewUI.img_room0.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.img_room1.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.img_room2.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.img_room3.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_join.off(LEvent.CLICK, this, this.onBtnClickWithTween);
            }
            super.close();
        }
    }
}