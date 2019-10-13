module gamebuyu.page {
	/**
	* 经典玩家炮组件
	*/
    export class BuyuGunItem extends Laya.Box {
        //转盘速度
        static ROTATION_SPEED: number = 600;
        //光转速度
        static GUANG_ROTATION_SPEED: number = 30;
        //转盘时间
        static ZHUANPAN_TIME: number = 5000;
        //延迟显示增加金币的时间
        static DELAY_TIME: number = 2500;
        //增加金币消失时间
        static HIDE_TIME: number = 2000;
        //获得奖励提示出现的时间
        static AWARD_SHOW_TIME: number = 5;

        //炮台视图对象
        private _viewUI: ui.nqp.game_ui.buyu.component.BuYu_GunItemUI;
        get viewUI(){
            return this._viewUI;
        }
        //炮台逻辑位置
        private _logicPos: number;
        get logicPos() {
            return this._logicPos;
        }
        set logicPos(value: number) {
            this._logicPos = value;
        }
        //炮台显示位置
        private _showPos: number;
        get showPos() {
            return this._showPos;
        }

        //地图Lv
        private _mapLv: number;
        //主炮是否打开选项
        private _isOpen: boolean = false;
        //玩家数据
        private _player: BuyuPlayer;
        private _game: Game;
        //数字组件
        private _clip: BuyuClip;
        private _goldClip: BuyuClip;
        //是否是主玩家
        private _isMainPlayer: boolean = false;
        get isMainPlayer() {
            return this._isMainPlayer;
        }
        //炮动画
        private _paoAnim: UIFrameAnimation;
        //倍数
        private _awardObjList: any[] = [];
        //金币显示列表
        private _buyuMgr: BuyuMgr;

		/**
		 * 初始化炮台
		 * @param showPos 显示位置
		 * @param game 
		 */
        constructor(showPos: number, game: Game) {
            super();
            this._showPos = showPos;
            this._game = game;
            //视图对象
            this._viewUI = new ui.nqp.game_ui.buyu.component.BuYu_GunItemUI();
            this.addChild(this._viewUI);
            this.size(this._viewUI.width, this._viewUI.height);
            //初始化UI
            this.initGunView();
            //注册点击事件
            this._viewUI.btn_Add.on(LEvent.CLICK, this, this.onClickDown);
            this._viewUI.btn_Dec.on(LEvent.CLICK, this, this.onClickDown);
            this._viewUI.image_Tips.visible = false;
            this.mouseThrough = true;
            this._viewUI.mouseThrough = true;
            this._viewUI.box_Root.mouseThrough = true;
            this._viewUI.box_Player.mouseThrough = true;
            if (!this._paoAnim) {
                this._paoAnim = ObjectPools.malloc(UIFrameAnimation, [60], 60) as UIFrameAnimation;
                this._paoAnim.addTarget(this._viewUI.image_PaoSkin, [{ height: 152, y: 100 }, { height: 133, y: 124 }, { height: 152, y: 100 }], [{ frame: 0 }, { frame: 3 }, { frame: 8 }]);//显示动画
            }
            if (!this._clip) {
                this._clip = new BuyuClip(BuyuClip.ZHUANPAN_FONT);
                this._viewUI.box_ZhuanPan.addChild(this._clip);
                this._clip.y = 90;
                this._clip.centerX = -5;
                this._clip.anchorX = this._clip.anchorY = 0.5;
            }
            if (!this._goldClip) {
                this._goldClip = new BuyuClip(BuyuClip.MONEY_FONT);
                this._viewUI.box_Gold.addChild(this._goldClip);
                this._goldClip.scale(0.85, 0.85);
                this._goldClip.pos(this._viewUI.clip_Gold.x, this._viewUI.clip_Gold.y);
                this._viewUI.clip_Gold.removeSelf();
            }
            this._mapLv = this._game.sceneObjectMgr.story.maplv;
            let story = this._game.sceneObjectMgr.story as BuyuStory;
            this._buyuMgr = story.buyuMgr;
        }

        //心跳
        update(diff: number): void {
            if (!this._player) return;
            this.updateToward(diff);
            this.updateZhuanPan(diff);
            this.checkTipsMoney(diff);
        }

        public hitAddOrDecButton(target: Sprite): boolean {
            if (target.contains(this._viewUI.btn_Add) || target.contains(this._viewUI.btn_Dec)) {
                return true;
            }
            return false;
        }

		/**
		 * 点击事件
		 */
        private onClickDown(e: LEvent): void {
            this._game.uiRoot.btnTween(e.currentTarget, this, (arg, btn)=>{
                switch (btn) {
                    case this._viewUI.btn_Add:
                        if (this._player) {
                            this.changeRate(this._player.fireLevel + 1);
                        }
                        break;
                    case this._viewUI.btn_Dec:
                        if (this._player) {
                            this.changeRate(this._player.fireLevel - 1);
                        }
                        break;
                }
            });
        }

		/**
		 * 改变炮倍数
		 * @param rate 
		 */
        private changeRate(rate: number): void {
            if (rate < 1) rate = 10;
            if (rate > 10) rate = 1;
            this._game.network.call_change_fire_lv(rate);
        }

		/**
		 * 设置炮变形
		 */
        private initGunView(): void {
            this.clearUI();
            switch (this._showPos) {
                case 1://左下
                    //UI默认是左下 不处理
                    break;
                case 2://右下
                    this._viewUI.box_Gold.x = -3;
                    this._viewUI.label_Name.x = -15;
                    this._viewUI.image_InfoBG.scaleX = -1;
                    this._viewUI.image_InfoBG.x = 225;
                    this._viewUI.box_Player.x = 0;
                    this._viewUI.box_Gold.x = 47;
                    this._viewUI.label_Name.x = 25;
                    this._viewUI.box_ZhuanPan.x = 322;
                    this._viewUI.label_Name.align = "right";
                    break;
                case 3://左上
                    this._viewUI.image_Pao.scaleY = -1;
                    this._viewUI.image_Pao.y = 34;
                    this._viewUI.box_PlayerBottom.scaleY = -1;
                    this._viewUI.box_PlayerBottom.y = 75;
                    this._viewUI.image_InfoBG.scaleY = -1;
                    this._viewUI.image_InfoBG.y = 77;
                    this._viewUI.box_Gold.y = 6;
                    this._viewUI.label_Name.y = 54;
                    this._viewUI.box_PlayerInfo.y = 0;
                    this._viewUI.image_PoChan.y = 23;
                    this._viewUI.box_ZhuanPan.y = 224;
                    this._viewUI.box_DengDai.y = 19;
                    this._viewUI.box_Rate.y = 0;
                    break;
                case 4://右上
                    this._viewUI.image_Pao.scaleY = -1;
                    this._viewUI.image_Pao.y = 34;
                    this._viewUI.box_PlayerBottom.y = 75;
                    this._viewUI.box_PlayerBottom.scaleY = -1;
                    this._viewUI.image_InfoBG.scaleY = -1;
                    this._viewUI.image_InfoBG.y = 77;
                    this._viewUI.box_Gold.y = 10;
                    this._viewUI.label_Name.y = 54;
                    this._viewUI.box_PlayerInfo.y = 0;
                    this._viewUI.image_PoChan.y = 23;
                    this._viewUI.box_Rate.y = 0;
                    this._viewUI.label_Name.align = "right";

                    this._viewUI.box_Gold.x = -3;
                    this._viewUI.label_Name.x = -15;
                    this._viewUI.image_InfoBG.scaleX = -1;
                    this._viewUI.image_InfoBG.x = 186;
                    this._viewUI.box_Player.x = 0;
                    this._viewUI.box_ZhuanPan.x = 322;
                    this._viewUI.box_ZhuanPan.y = 224;
                    this._viewUI.box_DengDai.y = 19;
                    break;
            }
            //计算锚点
            let p: Point = new Point(this._viewUI.image_Pao.x, this._viewUI.image_Pao.y);
            p = this._viewUI.box_Player.localToGlobal(p);
            p = this.globalToLocal(p);
            this.pivot(p.x, p.y);
            //转盘隐藏
            this._viewUI.box_ZhuanPan.visible = false;
            //位置提示
            this._viewUI.box_Wz.visible = false;
            //破产
            this._viewUI.image_PoChan.visible = true;
            this.updateGunView();
        }

        private hideWz(): void {
            this._viewUI.ani4.clear();
            this._viewUI.box_Wz.visible = false;
        }

		/**
		 * 通过是否是主炮来变换形态
		 */
        private updateGunView(): void {
            this._viewUI.image_PlayerBottom.skin = this._isMainPlayer ? Path_game_buyu.ui_buyu + "hudscene/ptd.png" : Path_game_buyu.ui_buyu + "hudscene/ptd1.png";
            this._viewUI.btn_Add.visible = this._isMainPlayer;
            this._viewUI.btn_Dec.visible = this._isMainPlayer;
            switch (this._showPos) {
                case 1://左下
                    //UI默认是左下 不处理
                    this._viewUI.box_PlayerInfo.x = this._isMainPlayer ? 7 : 35;
                    break;
                case 2://右下
                    this._viewUI.box_PlayerInfo.x = this._isMainPlayer ? 235 : 208;
                    break;
                case 3://左上
                    this._viewUI.box_PlayerInfo.x = this._isMainPlayer ? 7 : 35;
                    break;
                case 4://右上
                    this._viewUI.box_PlayerInfo.x = this._isMainPlayer ? 273 : 247;
                    break;
            }
        }

		/**
		 * 设置数据
		 * @param player 
		 */
        setData(player: BuyuPlayer): void {
            if (this._player == player) return;
            this.clearUI();
            if (!player) return;
            this._player = player;
            this._viewUI.box_DengDai.visible = false;
            this._viewUI.box_Player.visible = true;
            this._viewUI.box_PlayerInfo.visible = true;
            this.onMainPlayer();
            //UI信息
            this.updateInfo();

            //下标监听
            this._player.on(BuyuPlayer.GOLD_CHANGED, this, this.updateGold);
            this._player.on(BuyuPlayer.BROKE_STATE_CHANGED, this, this.updateBroke);
            this._player.on(BuyuPlayer.FIRE_LEVEL_CHANGED, this, this.updateRate);
            this._player.on(BuyuPlayer.QIFU_ENDTIME_CHANGED, this, this.updateQiFu);
            this._player.on(BuyuPlayer.FIRE_IT, this, this.playFireAnim);
            this._player.on(BuyuPlayer.FIRE_TYPE_CHANGED, this, this.updateFireType);
            this._game.sceneObjectMgr.on(BuyuMgr.EVENT_KILL_FISH, this, this.onKillFish);
            this._buyuMgr.on(BuyuMgr.EVENT_UPDATE_MAIN_PLAYER, this, this.onMainPlayer);
        }

        private _firstAlert: boolean;
        private onMainPlayer(): void {
            this._isMainPlayer = this._player == this._buyuMgr.mainPlayer;
            //炮变换
            this.updateGunView();
            //主玩家操作
            if (this._isMainPlayer) {
                //位置提示
                if (!this._firstAlert) {
                    if (this._mapLv == Web_operation_fields.GAME_ROOM_CONFIG_FISH_1) {
                        //体验场提示
                        this.showTips();
                    }
                    this._firstAlert = true;
                    this._viewUI.box_Wz.visible = true;
                    Laya.timer.once(5000, this, this.hideWz);
                }
            }
        }

        private onKillFish(fish: Fish, killOid?: number): void {
            let killer = fish.killer;
            if (!killer && killOid) killer = killOid;
            if (this._player.unit && this._player.unit.oid == killer) {
                //判断转盘
                let lootMoney = EnumToString.getPointBackNum(fish.lootMoney, 2);
                let temp = fish.fishTemp;
                let groupID = fish.groupID;
                let groupTemp: any = FishGroupPathManager.getFishGroupTempById(groupID);
                let isYwdj = groupTemp && groupTemp.group_typ == 4;
                let fishIndex = fish.position;
                let isBoss = groupTemp && groupTemp.group_typ == 6 && groupTemp.boss > 0 && fishIndex == groupTemp.boss - 1;
                if (temp && temp.show == 1 || isYwdj || isBoss) {
                    this._clip.setText(lootMoney, false, false);
                    if (isYwdj) {
                        this._viewUI.image_Name.skin = Path_game_buyu.ui_buyu + "hudscene/ywdj.png";
                    } else {
                        this._viewUI.image_Name.skin = Path_game_buyu.ui_buyu + "hudscene/ym_" + temp.id + ".png";
                    }
                    this.isShowZhuanPan = true;
                }
                //判断获得金币
                if (this._isMainPlayer) {
                    this.upGoldEff(lootMoney);
                    //太棒了
                    if (isBoss || isYwdj || temp.type == 5) {
                        this._game.uiRoot.general.open(BuyuPageDef.PAGE_BUYU_GREAT, (p: BuyuGreatPage) => {
                            p.setData(lootMoney);
                        });
                    }
                }
            }
        }

        //转盘
        private _isShowZhuanPan: boolean = false;
        private _timer: number = 0;
        set isShowZhuanPan(value: boolean) {
            this._viewUI.box_ZhuanPan.visible = value;
            if (value) {
                this._isShowZhuanPan = true;
                this._timer = Laya.timer.currTimer;
                this._viewUI.box_ZhuanPan.scale(2, 2);
                this._viewUI.ani3.play(0, true);
                Laya.Tween.to(this._viewUI.box_ZhuanPan, { scaleX: 1, scaleY: 1 }, 800, Laya.Ease.elasticOut);
                this.shakeClip1();
                this._game.playSound(Path.music + "zhuanpan.mp3");
            } else {
                this._isShowZhuanPan = false;
                this._timer = 0;
                this._viewUI.image_ZhuanPan.rotation = 0;
                Laya.Tween.clearAll(this._clip);
                this._viewUI.ani3.clear();
                this._game.stopSound(Path.music + "zhuanpan.mp3");
            }
        }

        private shakeClip1(): void {
            Laya.Tween.clearAll(this._clip);
            Laya.Tween.to(this._clip, { rotation: 15 }, 200, null, Handler.create(this, this.shakeClip2));
        }

        private shakeClip2(): void {
            Laya.Tween.clearAll(this._clip);
            Laya.Tween.to(this._clip, { rotation: -15 }, 200, null, Handler.create(this, this.shakeClip1));
        }

        //飘金币
        private _upGoldEffArr: BuyuClip[] = [];
        private upGoldEff(value: number): void {
            value = EnumToString.getPointBackNum(value, 2);
            let valueClip = value >= 0 ? new BuyuClip(BuyuClip.ADD_MONEY_FONT) : new BuyuClip(BuyuClip.SUB_MONEY_FONT);
            let preSkin = value >= 0 ? (PathGameTongyong.ui_tongyong_general + "tu_jia.png") : (PathGameTongyong.ui_tongyong_general + "tu_jian.png");
            valueClip.scale(1, 1);
            valueClip.anchorX = 0.5;
            valueClip.anchorY = 0.5;
            valueClip.setText(Math.abs(value), true, false, preSkin);

            valueClip.x = this._viewUI.box_Gold.x + this._viewUI.box_Gold.width * (this._showPos == 1 || this._showPos == 3 ? 2 : 1) / 3;
            valueClip.y = this._viewUI.box_Gold.y + (this._showPos == 3 || this._showPos == 4 ? 0 : this._viewUI.box_Gold.height);
            this._viewUI.box_Gold.parent.addChild(valueClip);
            this._upGoldEffArr.push(valueClip);
            Laya.Tween.clearAll(valueClip);
            let targetPosY: number = 0;
            if (this._showPos == 3 || this._showPos == 4) {
                targetPosY = valueClip.y + 80;
            } else {
                targetPosY = valueClip.y - 80;
            }
            Laya.Tween.to(valueClip, { y: targetPosY }, 1000, Laya.Ease.cubicOut, Handler.create(this, this.onUpGoldEffComplete, [valueClip]));
        }

        private onUpGoldEffComplete(valueClip: BuyuClip): void {
            if (valueClip) {
                let index: number = this._upGoldEffArr.indexOf(valueClip);
                if (index != -1) this._upGoldEffArr.splice(index, 1);
                Laya.Tween.clearAll(valueClip);
                valueClip.removeSelf();
                valueClip.destroy(true);
                valueClip = null;
            }
        }

        private clearAllUpGoldEff(): void {
            for (let i: number = 0; i < this._upGoldEffArr.length; i++) {
                let clip = this._upGoldEffArr[i];
                clip.removeSelf();
                clip.destroy(true);
                clip = null;
            }
            this._upGoldEffArr.length = 0;
        }

        clearUI(): void {
            this._viewUI.box_DengDai.visible = true;
            this._viewUI.box_Player.visible = false;
            this._viewUI.box_ZhuanPan.visible = false;
            this._viewUI.box_PlayerInfo.visible = false;
            this._game.sceneObjectMgr.off(BuyuMgr.EVENT_KILL_FISH, this, this.onKillFish);
            this._buyuMgr && this._buyuMgr.off(BuyuMgr.EVENT_UPDATE_MAIN_PLAYER, this, this.onMainPlayer);
            if (this._player) {
                this._player.off(BuyuPlayer.GOLD_CHANGED, this, this.updateGold);
                this._player.off(BuyuPlayer.BROKE_STATE_CHANGED, this, this.updateBroke);
                this._player.off(BuyuPlayer.FIRE_LEVEL_CHANGED, this, this.updateRate);
                this._player.off(BuyuPlayer.QIFU_ENDTIME_CHANGED, this, this.updateQiFu);
                this._player.off(BuyuPlayer.FIRE_IT, this, this.playFireAnim);
                this._player.off(BuyuPlayer.FIRE_TYPE_CHANGED, this, this.updateFireType);
                this._player = null;
            }

        }

		/**
		 * 更新信息
		 */
        private updateInfo(): void {
            if (!this._player) return;
            //名字
            this._viewUI.label_Name.text = this._player.unit.GetName();
            //炮台金币
            this.updateGold();
            //破产标志
            this.updateBroke();
            //炮台倍数
            this.updateRate();
            //祈福状态
            this.updateQiFu();
        }

        //金币
        private updateGold(): void {
            if (this._goldClip) {
                let gold = this._player.gold;
                gold = EnumToString.getPointBackNum(gold, 2)
                // let goldStr = gold.toString();
                this._goldClip.setText(gold, true);
            }
        }

        //显示破产
        private updateBroke(): void {
            if (!this._player) return;
            this._viewUI.image_PoChan.visible = this._player.isBroke;
        }

        //提示钱不够
        private _checkMoneyTimer: number = 0;
        private _isShowTips: boolean = false;
        private checkTipsMoney(diff: number): void {
            if (this._isShowTips || !this._isMainPlayer) return;
            this._checkMoneyTimer += diff;
            if (this._checkMoneyTimer >= 1000 && this._player.bulletCount <= 0 && this._player.isBroke) {
                this._checkMoneyTimer = 0;
                this._isShowTips = true;
                //在付费场就让他滚出去
                if (this._mapLv != Web_operation_fields.GAME_ROOM_CONFIG_FISH_1) {
                    //破产
                    TongyongPageDef.ins.alertRecharge("您的余额不足，已被请出渔场，是否前往充值？", () => {
                        this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
                    }, () => {
                        this._game.sceneObjectMgr.leaveStory(true);
                    }, null, null);
                } else {
                    //体验场 
                    let temp: any = Template.getConfigTempById(1);
                    if (temp) {
                        let str = StringU.substitute("您的捕鱼币用完了，这是系统赠送给您的{0}捕鱼币！", getSampleNum(temp.pochan));
                        TongyongPageDef.ins.alertRecharge(str, () => {
                            //领取协议
                            this._game.network.call_fish_get_dole();
                            this._isShowTips = false;
                        }, () => {
                            //领取协议
                            this._game.network.call_fish_get_dole();
                            this._isShowTips = false;
                        }, true, Path_game_buyu.ui_buyu + "tongyong/btn_lq.png");
                    }
                }
            }
        }

        private showTips(): void {
            this._viewUI.image_Tips.visible = true;
            Laya.timer.once(3000, this, () => {
                this._viewUI.image_Tips.visible = false;
            });
        }

        //改变朝向
        private updateToward(diff?: number): void {
            if (!this._player) return;
            //判断是否是立即模式
            let flag = this._player.updateOrientation(diff, true);
            if (!flag) {
                if (this._player) {
                    let ori = this._player.curOri.clone();
                    if (this._showPos > 2) {
                        ori.x = -ori.x;
                    }
                    let angle = ori.angle(Vector2.right) + Math.PI;
                    this._viewUI.image_Pao.rotation = MathU.getRotation(angle);
                }
            }
        }

        //改变炮台倍数
        private updateRate(): void {
            let mlv = this._mapLv;
            let info = BuyuPageDef.ROOM_INFO[mlv];
            if (!info) return;
            this._viewUI.label_Rate.text = EnumToString.getPointBackNum((info.rateGold * this._player.fireLevel), 2) + "";
            this.updatePaoSkin();
        }

        //改变炮台皮肤
        private updatePaoSkin(): void {
            if (!this._player) return;
            let rate = this._player.fireLevel;
            this._viewUI.image_PaoSkin.skin = Path_game_buyu.ui_buyu + "pao/" + SceneFishRes.getSkin(rate) + ".png";
        }

        //改变祈福状态
        private updateQiFu(qifu_endtime?: number): void {
            if (!this._player) return;
            this._viewUI.img_qifu.visible = this._player.isHaveQifu;
        }

        private playFireAnim(isSelf): void {
            if (!this._player) return;
            if (this._paoAnim) {
                if (!isSelf) this._game.playSound(Path_game_buyu.music_buyu + "fire.mp3", false);
                this._paoAnim.play();
            }
        }

        //转盘
        private updateZhuanPan(diff: number): void {
            let now = Laya.timer.currTimer;
            if (this._isShowZhuanPan) {
                if (now - this._timer >= BuyuGunItem.ZHUANPAN_TIME) {
                    this.isShowZhuanPan = false;
                }
            }
        }

		/**
		 * 获取金币栏位的全局位置
		 */
        getGoldGlobalPos(p: Point): Point {
            if (!p) p = new Point(this._viewUI.box_Gold.x, this._viewUI.box_Gold.y);
            else {
                p.x = this._viewUI.box_Gold.x;
                p.y = this._viewUI.box_Gold.y;
            }
            p = this._viewUI.box_PlayerInfo.localToGlobal(p);
            return p;
        }

        //改变开火状态
        private updateFireType(): void {
            if (!this._player) return;
            this.updatePaoSkin();
            let ori = this._player.curOri;
            let angle = ori.angle(Vector2.right) + Math.PI;
            this._viewUI.image_Pao.rotation = MathU.getRotation(angle);
        }

        destroy(): void {
            Laya.timer.clearAll(this);
            if (this._viewUI) {
                this.clearUI();
                this.clearAllUpGoldEff();
                if (this._clip) {
                    this._clip.destroy(true);
                    this._clip = null;
                }
                if (this._goldClip) {
                    this._goldClip.destroy(true);
                    this._goldClip = null;
                }
                if (this._paoAnim) {
                    ObjectPools.free(this._paoAnim);
                }
                Laya.Tween.clearAll(this._viewUI);
                this._viewUI.destroy(true);
            }
            super.destroy(true);
        }
    }


}