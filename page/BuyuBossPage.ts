/**
* name 经典模式BOSS来袭地图事件特效
*  Author：AnswerHom
*/
module gamebuyu.page {
    export class BuyuBossPage extends game.gui.base.Page {

        private _viewUI: ui.nqp.game_ui.buyu.BuYu_BossUI;

        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._asset = [
                Path_game_buyu.atlas_game_ui + 'buyu/bosslaixi.atlas',
                Path_game_buyu.atlas_game_ui + 'buyu/guize.atlas',
            ];
        }

        // 页面初始化函数
        protected init(): void {
            this._viewUI = this.createView('game_ui.buyu.BuYu_BossUI');
            this.addChild(this._viewUI);
            this._viewUI.image_Name.visible = false;
            this._viewUI.ani1.stop();
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            this._viewUI.ani1.on(LEvent.COMPLETE, this, this.close);
            this._viewUI.image_Icon.scale(-3, 3);
            this._viewUI.box_Bo.visible = false;
        }

        setType(fishID: number): void {
            this._game.playSound(Path_game_buyu.music_buyu + "boss.mp3");
            this.loadTexture(fishID);
        }

        private _bossCome: AnimationFrame;
        private loadTexture(fishID: number) {
            this.onLoad(fishID);
        }

        private onLoad(fishID: number): void {
            this._viewUI.image_Icon.skin = StringU.substitute(Path_game_buyu.ui_buyu + "guize/{0}.png", fishID);
            this._viewUI.image_Name.visible = true;
            this._viewUI.ani1.play(0, false);
            let path = null;
            switch (fishID) {
                case 23:
                    path = Path_game_buyu.ui_buyu + "bosslaixi/wz_300jl.png";
                    break;
                case 24:
                    path = Path_game_buyu.ui_buyu + "bosslaixi/wz_500jl.png";
                    break;
                case 25:
                    path = Path_game_buyu.ui_buyu + "bosslaixi/wz_1000jl.png";
                    break;
            }
            this._viewUI.image_Name.skin = path;
        }

        public close(): void {
            if (this._viewUI) {
                if (this._bossCome) {
                    this._bossCome.destroy();
                    this._bossCome = null;
                }
                this._viewUI.ani1.off(LEvent.COMPLETE, this, this.close);
            }
            super.close();
        }
    }
}