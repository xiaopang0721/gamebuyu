/**
* name 太棒了界面
*/
module gamebuyu.page {
    export class BuyuGreatPage extends game.gui.base.Page {
        static NUM_SHOW_TIME: number = 1000;//数字空转多久
        static NUM_STOP_INTERVAL: number = 500;//数字停留间隔

        private _viewUI: ui.game_ui.buyu.BuYu_GreatUI;
        private _clipArr: NumClip[] = [];
        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._asset = [
                Path_game_buyu.atlas_game_ui + "buyu/great.atlas",
                Path_game_buyu.atlas_game_ui + "buyu/tongyong.atlas",
            ];
        }

        // 页面初始化函数
        protected init(): void {
            this._viewUI = this.createView('game_ui.buyu.BuYu_GreatUI');
            this.addChild(this._viewUI);
            this._isNeedBlack = true;
            this._isClickBlack = true;
            for (let i = 0; i < 5; i++) {
                let index = i + 1;
                let clip = new NumClip();
                this._clipArr.push(clip);
                let oldClip = this._viewUI['clip_' + index];
                oldClip.visible = false;
                this._viewUI.box_Num.addChild(clip);
                clip.pos(oldClip.x, oldClip.y);
            }
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            this._viewUI.image_Wan.visible = false;
            Laya.timer.once(5000, this, this.close);
        }

        //帧心跳
        update(diff: number) {
            super.update(diff);
            if (this._clipArr) {
                for (let i: number = 0; i < this._clipArr.length; i++) {
                    this._clipArr[i].update(0);
                }
            }
        }

        setData(num: number) {
            let numStrArr = getSampleNum2(num);
            let start = 0, end = 0;
            if (numStrArr.length > 1) {
                //有单位
                this._viewUI.image_Wan.visible = true;
                this._clipArr[this._clipArr.length - 1].visible = false;
                end = this._clipArr.length - 2;
                start = end - numStrArr[0].length + 1;
            } else {
                end = this._clipArr.length - 1;
                start = end - numStrArr[0].length + 1;
            }
            let timeIdx = 0;
            let index = numStrArr[0].length - 1;
            for (let i = 4; i >= 0; i--) {
                let clip = this._clipArr[i];
                if (i >= start && i <= end) {
                    clip.visible = true;
                    Laya.timer.once(BuyuGreatPage.NUM_SHOW_TIME + BuyuGreatPage.NUM_STOP_INTERVAL * (timeIdx++), this, (numChar) => {
                        clip.stop(parseInt(numChar == "." ? 10 : numChar));
                    }, [numStrArr[0].charAt(index--)]);
                } else {
                    clip.visible = false;
                }
            }
        }

        // 清理下页面
        close(): void {
            Laya.timer.clearAll(this);
            if (this._clipArr && this._clipArr.length > 0) {
                for (let clip of this._clipArr) {
                    clip.destroy();
                }
                this._clipArr = null;
            }
            super.close();
        }
    }

    class NumClip extends Laya.Panel {
        private _clipArr: laya.ui.Clip[] = [];
        //0运动  1收到停止指令  2准备停止 3停止
        private _state: number = 0;
        //最终数字
        private _endNum: number = 0;
        private _curNum: number = 1;
        private _moveSpeed = 1000;
        private _stopIndex: number = 0;

        constructor() {
            super();
            this.size(80, 101);
            let clip1 = new laya.ui.Clip(Path_game_buyu.ui_buyu + "great/clip_shuzi.png", 11);
            let clip2 = new laya.ui.Clip(Path_game_buyu.ui_buyu + "great/clip_shuzi.png", 11);
            clip1.size(80, 101);
            clip2.size(80, 101);
            this._curNum = MathU.randomRange(0, 9);
            clip1.index = 0;
            clip2.index = this._curNum;
            this.addChild(clip1);
            this.addChild(clip2);
            clip2.y = -clip2.height;
            this._clipArr.push(clip1);
            this._clipArr.push(clip2);

        }

        stop(num: number): void {
            this._state = 1;
            this._endNum = num;
            logd("电鱼结果数字 = ", this._endNum);
        }

        update(diff: number): void {
            this.updateClip(20);
        }

        private updateClip(diff: number): void {
            if (this._state == 3) return;
            let diffY = this._moveSpeed * diff / 1000;
            let max = 0;
            for (let i = 0; i < 2; i++) {
                let clip = this._clipArr[i];
                clip.y += diffY;
            }
            this.checkClip();
        }

        private checkClip(): void {
            if (this._state == 3) return;
            for (let i = 0; i < 2; i++) {
                let clip = this._clipArr[i];
                this.checkState(i);
                //超出显示区域了
                if (clip.y >= clip.height) {
                    clip.y = -clip.height;
                }
            }
        }

        private checkState(index: number): void {
            let clip = this._clipArr[index];
            switch (this._state) {
                case 0:
                    this._curNum = (this._curNum + 1) % 10;
                    clip.index = this._curNum;
                    break;
                case 1:
                    clip.index = this._endNum;
                    this._stopIndex = index;
                    this._state = 2;
                    break;
                case 2:
                    if (this._stopIndex == index) {
                        this._state = 3;
                        clip.y = 0;
                    } else {
                        clip.visible = false;
                    }
                    break;
            }
        }

        destroy(): void {
            Laya.timer.clearAll(this);
            if (this._clipArr && this._clipArr.length > 0) {
                for (let clip of this._clipArr) {
                    clip.destroy(true);
                }
                this._clipArr = null;
            }
            super.destroy(true);
        }
    }
}