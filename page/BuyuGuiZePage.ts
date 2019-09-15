/**
* name 捕鱼规则
*/
module gamebuyu.page {
    export class BuyuGuiZePage extends game.gui.base.Page {
        static TAB_BS: number = 0;//倍數
        static TAB_JJ: number = 1;//简介

        static TYPE_NORMAL: number = 1;
        static TYPE_GOLD: number = 2;
        static TYPE_BOSS: number = 3;
        static TYPE_SPECIAL: number = 4;

        private _viewUI: ui.nqp.game_ui.buyu.BuYu_GuiZeUI;
        private _index: number;

        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._asset = [
                Path_game_buyu.atlas_game_ui + "buyu/guize.atlas",
                Path_game_buyu.atlas_game_ui + "buyu/tongyong.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
            ];
        }

        // 页面初始化函数
        protected init(): void {
            this._viewUI = this.createView('game_ui.buyu.BuYu_GuiZeUI');
            this.addChild(this._viewUI);
            this._viewUI.scale(1.1, 1.1);
            this._isNeedBlack = true;
            this._isClickBlack = true;
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            this._viewUI.tab_Type.selectHandler = new Handler(this, this.selectHandler);
            this._viewUI.tab_Type.selectedIndex = 0;
            this._viewUI.panel_0.vScrollBarSkin = "";
            this._viewUI.panel_1.vScrollBarSkin = "";
            //BOSS
            this._viewUI.list_1.hScrollBarSkin = '';
            this._viewUI.list_1.scrollBar.elasticDistance = 100;
            this._viewUI.list_1.itemRender = this.createChildren("game_ui.buyu.component.BangZhuItem1UI", HelpItem1);
            this._viewUI.list_1.renderHandler = new Handler(this, this.renderHandler1);
            this._viewUI.list_1.dataSource = this.getDataByType(BuyuGuiZePage.TYPE_BOSS);
            //黄金鱼
            this._viewUI.list_2.hScrollBarSkin = '';
            this._viewUI.list_2.scrollBar.elasticDistance = 100;
            this._viewUI.list_2.itemRender = this.createChildren("game_ui.buyu.component.BangZhuItem1UI", HelpItem1);
            this._viewUI.list_2.renderHandler = new Handler(this, this.renderHandler1);
            this._viewUI.list_2.dataSource = this.getDataByType(BuyuGuiZePage.TYPE_GOLD);
            //普通鱼
            this._viewUI.list_3.hScrollBarSkin = '';
            this._viewUI.list_3.scrollBar.elasticDistance = 100;
            this._viewUI.list_3.itemRender = this.createChildren("game_ui.buyu.component.BangZhuItem1UI", HelpItem1);
            this._viewUI.list_3.renderHandler = new Handler(this, this.renderHandler1);
            this._viewUI.list_3.dataSource = this.getDataByType(BuyuGuiZePage.TYPE_NORMAL);
            //特殊鱼
            this._viewUI.list_4.hScrollBarSkin = '';
            this._viewUI.list_4.scrollBar.elasticDistance = 100;
            this._viewUI.list_4.itemRender = this.createChildren("game_ui.buyu.component.BangZhuItem2UI", HelpItem2);
            this._viewUI.list_4.renderHandler = new Handler(this, this.renderHandler2);
            this._viewUI.list_4.dataSource = this.getDataByType(BuyuGuiZePage.TYPE_SPECIAL);
            this._viewUI.on(LEvent.MOUSE_DOWN, this, this.onMouseHandler);
            this._viewUI.on(LEvent.MOUSE_MOVE, this, this.onMouseHandler);
            this._viewUI.on(LEvent.MOUSE_UP, this, this.onMouseHandler);
        }

        private _downX: number;
        private _downY: number;
        private onMouseHandler(e: LEvent): void {
            this._viewUI.list_1.mouseEnabled = true;
            this._viewUI.list_2.mouseEnabled = true;
            this._viewUI.list_3.mouseEnabled = true;
            this._viewUI.list_4.mouseEnabled = true;
            this._viewUI.panel_0.mouseEnabled = true;
            this._viewUI.panel_1.mouseEnabled = true;
            switch (e.type) {
                case LEvent.MOUSE_DOWN:
                    this._downX = e.stageX;
                    this._downY = e.stageY;
                    break;
                case LEvent.MOUSE_MOVE:
                    let diffX: number = Math.abs(this._downX - e.stageX);
                    let diffY: number = Math.abs(this._downY - e.stageY);
                    if (diffX > diffY) {
                        this._viewUI.panel_0.mouseEnabled = false;
                        this._viewUI.panel_1.mouseEnabled = false;
                    } else {
                        this._viewUI.list_1.mouseEnabled = false;
                        this._viewUI.list_2.mouseEnabled = false;
                        this._viewUI.list_3.mouseEnabled = false;
                        this._viewUI.list_4.mouseEnabled = false;
                    }
                    break;
            }
        }

        private selectHandler(index: number): void {
            this._index = index;
            this.updateView();
        }

        private renderHandler1(cell: HelpItem1, index: number) {
            if (cell) {
                cell.setData(cell.dataSource);
            }
        }

        private renderHandler2(cell: HelpItem2, index: number) {
            if (cell) {
                cell.setData(cell.dataSource);
            }
        }

        private updateView(): void {
            this._viewUI.panel_0.visible = this._index == BuyuGuiZePage.TAB_BS;
            this._viewUI.panel_1.visible = this._index == BuyuGuiZePage.TAB_JJ;
        }

        private getDataByType(type: number): any[] {
            if (!Template.data) return;
            let dataArr = Template.data['tb_fish'];
            let len = dataArr.length;
            let resultArr = [];
            for (let i = 0; i < len; i++) {
                let data = dataArr[i];
                if (!data) continue;
                if (type == BuyuGuiZePage.TYPE_SPECIAL) {
                    if (data.type >= BuyuGuiZePage.TYPE_SPECIAL)
                        resultArr.push(data);
                } else {
                    if (data.type == type)
                        resultArr.push(data);
                }
            }
            return resultArr;
        }

        // 清理下页面
        close(): void {
            super.close();
        }
    }

    class HelpItem1 extends ui.nqp.game_ui.buyu.component.BangZhuItem1UI {
        setData(value: any) {
            this.label_Name.text = value.name;
            this.label_Rate.text = "倍数:" + value.rate_range[0];
            this.image_Icon.skin = StringU.substitute(Path_game_buyu.ui_buyu + "guize/{0}.png", value.id);
        }
    }

    class HelpItem2 extends ui.nqp.game_ui.buyu.component.BangZhuItem2UI {
        setData(value: any) {
            this.label_Name.text = value.name;
            this.label_Rate.text = "倍数:" + value.rate_range[0] + "~" + value.rate_range[1];
            this.label_Desc.text = value.xiangqing;
            this.image_Icon.skin = StringU.substitute(Path_game_buyu.ui_buyu + "guize/{0}.png", value.id);
        }
    }
}