/**
* name 经典模式鱼潮来袭地图事件特效
*  Author：AnswerHom
*/
module gamebuyu.page {
    export class BuyuFishPage extends game.gui.base.Page {

        private _viewUI: ui.nqp.game_ui.buyu.BuYu_BossUI;
        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._asset = [
                Path_game_buyu.atlas_game_ui + 'buyu/bosslaixi.atlas',
            ];
        }

        // 页面初始化函数
        protected init(): void {
            this._viewUI = this.createView('game_ui.buyu.BuYu_BossUI');
            this.addChild(this._viewUI);
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            this._viewUI.ani1.play(0, false);
            this._viewUI.ani1.on(LEvent.COMPLETE, this, this.close);
            this._game.playSound(Path_game_buyu.music_buyu + "boss.mp3");
            this._viewUI.box_Bo.visible = true;
            this._viewUI.box_Bo.x = main.widthDesginPixelw;
            this.playBo();
        }

        //播放海浪动画
        private playBo(): void {
            Laya.Tween.to(this._viewUI.box_Bo, { x: -this._viewUI.box_Bo.width }, 1000, null, Handler.create(this, this.onEndBo, null));
        }
        private onEndBo(): void {
            this._viewUI.box_Bo.visible = false;
        }

        public close(): void {
            if (this._viewUI) {
                this._viewUI.ani1.off(LEvent.COMPLETE, this, this.close);
                Laya.Tween.clearAll(this._viewUI.box_Bo);
            }
            super.close();
        }
    }
}