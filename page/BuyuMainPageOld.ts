/**
* 游戏大厅
*/
module gamebuyu.page {
    export class BuyuMainPageOld extends game.gui.base.Page {
        private _viewUI: ui.game_ui.buyu.BuYu_HUDUI;
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
                this._viewUI.box_right._childs[index].visible = true;
                Laya.Tween.from(this._viewUI.box_right._childs[index], {
                    right: -300
                }, 200 + index * 100, Laya.Ease.linearNone);
            }

            BuyuPageDef.parseBuYuData(this._assetsLoader);
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            (this._viewUI.view_hud as TongyongHudPage).onOpen(this._game, BuyuPageDef.GAME_NAME);
            //按钮监听
            this._viewUI.img_room0.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.img_room1.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.img_room2.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.img_room3.on(LEvent.CLICK, this, this.onBtnClickWithTween);

            //房间条件
            let len = BuyuPageDef.ROOM_CONFIG.length;
            for (let index = 0; index < len; index++) {
                if (index == 0) continue;
                let idx = BuyuPageDef.ROOM_CONFIG[index];
                let info = BuyuPageDef.ROOM_INFO[idx];
                let labelLeast = this._viewUI['lab_least' + index];
                let labelMoney = this._viewUI['lab_money' + index];
                if (labelLeast) {
                    labelLeast.text = "底分：" + info.rateGold;
                }
                if (labelMoney) {
                    labelMoney.text = "准入：" + info.minGold;
                }
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
         * 检查进入房间的条件
         * @param mode 
         */
        public checkMoneyToStory(mode: number): void {
            let mainPlayer = this._game.sceneObjectMgr.mainPlayer;
            if (!mainPlayer) return;
            if (mainPlayer.playerInfo.isguest && mode != Web_operation_fields.GAME_ROOM_CONFIG_FISH_1) {
                TongyongPageDef.ins.alertRecharge("亲爱的玩家，您正使用游客模式进行游戏，该模式下的游戏数据（包括付费数据）在删除游戏、更换设备后清空！对此造成的损失，本平台将不承担任何责任。为保障您的虚拟财产安全，我们强力建议您绑定手机号升级为正式账号。", () => {
                    this._game.uiRoot.general.open(DatingPageDef.PAGE_BINDPHONE);
                }, () => {
                }, false, PathGameTongyong.ui_tongyong_general + "btn_qw.png");
                return;
            }
            let haveMoney = this._game.sceneObjectMgr.mainPlayer.GetMoney();
            let roomInfo = BuyuPageDef.getRoomInfoByMode(mode);
            if (haveMoney < roomInfo.minGold) {
                let str = StringU.substitute("老板，您的金币少于{0}哦~\n补充点金币去大杀四方吧~", roomInfo.minGold);
                this.gotoRecharge(str);
            } else {
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
            TongyongPageDef.ins.alertRecharge(str, () => {
                if (ecb) {
                    ecb();
                }
                this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
            }, () => {
                if (ccb) {
                    ccb();
                }
            }, false, PathGameTongyong.ui_tongyong_general + "btn_cz.png");
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