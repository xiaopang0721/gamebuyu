/**
* 捕鱼玩家对象
*/
module gamebuyu.data {
    export class BuyuPlayer extends Laya.EventDispatcher implements gamecomponent.object.IClear {
        isCanClear: boolean;
        private _unit: Unit;
        get unit(): Unit {
            return this._unit;
        }
        //------------ 事件 ---------------
        static POSITION_CHANGED: string = "position_changed";
        static FIRE_TYPE_CHANGED: string = "fire_type_changed";
        static FIRE_STATE_CHANGED: string = "fire_state_changed";
        static FIRE_LEVEL_CHANGED: string = "fire_level_changed";
        static QIFU_ENDTIME_CHANGED: string = "qifu_endtime_changed";
        static GOLD_CHANGED: string = "gold_changed";
        static BROKE_STATE_CHANGED: string = "broke_state_changed";
        static FIRE_IT: string = "fire_it";
        static PLAYER_TIPS: string = "player_tips";
        //------------ 开火状态 ---------------
        static FIRE_STATE_HAND: number = 0;//手动开火
        static FIRE_STATE_STOP: number = 1;//停止开火
        //------------ 开火类型 ---------------
        static FIRE_TYPE_HAND: number = 0;//手动射击
        static FIRE_TYPE_AUTO: number = 1;//自动开火
        static FIRE_TYPE_AIM: number = 3;//瞄准

        public isShowBulletTip: boolean = false;
        private _lastFireTime: number = 0;
        //当前剧情
        private _story: BuyuStory;
        private _sceneObjectMgr: SceneObjectMgr;
        get sceneObjectMgr(): SceneObjectMgr {
            return this._sceneObjectMgr;
        }
        /**
         * 是否是主玩家
         */
        private _isMainPlayer: boolean = false;
        get isMainPlayer() {
            return this._isMainPlayer;
        }

        /**
         * 允许存在场景的属于主玩家的最大子弹数
         */
        static MAX_BULLET: number = 30;
        //子弹计数
        private _bulletCount: number = 0;
        public get bulletCount(): number {
            return this._bulletCount;
        }
        public set bulletCount(value: number) {
            this._bulletCount = value;
        }

        /**
		 * 获取炮台编号
		 */
        private _position: number = 0;
        get position(): number {
            return this._position;
        }

        /**
         * 是否机器人
         */
        private _isRobot: boolean = false;
        get isRobot(): boolean {
            return this._isRobot;
        }
        private _actionManager: manager.ActionManager;
        /**是否房主*/
        private _isRoomMaster: boolean;
        get isRoomMaster() {
            return this._isRoomMaster;
        }

        /**
         * 当前炮倍数
         */
        private _fireLevel: number = 0;
        get fireLevel() {
            return this._fireLevel;
        }

        /**
         * 金币
         */
        private _gold: number = 0;
        get gold() {
            return this._gold;
        }

        /**
         * 祈福结束时间
         */
        private _qifu_endTime: number = 0;
        get qifu_endTime() {
            return this._qifu_endTime;
        }

        //炮射速间隔
        private _fireSpeed: number = 250;//旧版200

        //开火状态
        private _fireState: number = 0;
        get fireState() {
            return this._fireState;
        }
        set fireState(value: number) {
            if (this._fireState != value) {
                this._fireState = value;
            }
        }

        //开火方式
        private _fireType: number = 0;
        get fireType(): number {
            return this._fireType;
        }
        set fireType(value: number) {
            if (this._fireType != value) {
                if (this._fireType == BuyuPlayer.FIRE_TYPE_AIM) {
                    this.selectFish = null;
                }
                this._fireType = value;
                this.event(BuyuPlayer.FIRE_TYPE_CHANGED);
            }
        }

        /**
		 * 炮管目标朝向
		 */
        private _ori: Vector2;
        set ori(v: Vector2) {
            this._ori.set(v);
            this._ori.normalize();
        }
        get ori() {
            return this._ori;
        }

        /**
         * 当前朝向
         */
        private _curOri: Vector2;
        get curOri(): Vector2 {
            return this._curOri;
        }

        resetOri(): void {
            this._curOri.x = 0;
            this._curOri.y = -1;
            this._ori.x = 0;
            this._ori.y = -1;
        }

        private _isStartHua: boolean = false;
        get isStartHua() {
            return this._isStartHua;
        }

        set isStartHua(value: boolean) {
            this._isStartHua = value;
        }

		/**
		 * 是否破产
		 */
        private _isBroke: boolean = false;
        get isBroke(): boolean {
            return this._isBroke;
        }

        set isBroke(value: boolean) {
            if (this._isBroke != value) {
                this._isBroke = value;
                this.event(BuyuPlayer.BROKE_STATE_CHANGED);
            }
        }

        private _isDoFireing: boolean = false;
        // 是否主动开火
        set isDoFireing(v: boolean) {
            this._isDoFireing = v;
        }
        get isDoFireing(): boolean {
            return this._isDoFireing;
        }

        //选中的鱼
        public selectFish: Fish;
        public selectFishList: Fish[];
        private _buyuMgr: BuyuMgr;
        private _targetV: Vector2;
        private _game: Game;

        constructor(unit: Unit, v: SceneObjectMgr) {
            super();
            this._unit = unit;
            this._sceneObjectMgr = v;
            this._game = this._sceneObjectMgr.game as Game;
            this._story = v.story as BuyuStory;
            this._ori = new Vector2(0, -1);
            this._curOri = new Vector2(0, -1);
            this._targetV = new Vector2();
            this.curToward = -1;
            this._isRobot = unit.type == Unit.TYPE_ID_ROBOT;
            unit.on(Unit.EVENT_TYPE_CHANGED, this, this.updateType);
            unit.AddListen(Unit.UNIT_INT_MONEY, this, this.updateGold);
            unit.AddListen(Unit.UNIT_INT_BYTE3, this, this.checkUpdate);
            unit.AddListen(Unit.UNIT_INT_BYTE2, this, this.checkUpdate2);
            unit.AddListen(Unit.UNIT_INT_BYTE1, this, this.updatePosition);
            unit.AddListen(Unit.UNIT_INT_QI_FU_END_TIME, this, this.updateQiFu);
            this.updateType();
            this.updatePosition();
            this.updateGold();
            this.updateQiFu();
            this.checkUpdate();
            this.checkUpdate2();
            this._buyuMgr = this._story.buyuMgr;
            if (this._buyuMgr) {
                this._buyuMgr.on(BuyuMgr.EVENT_UPDATE_MAIN_PLAYER, this, this.updateMainPlayer);
            }
            this.updateMainPlayer();
        }

        public get buyuMgr(): BuyuMgr {
            return this._buyuMgr;
        }

        private updateType() {
            if (!this._unit) return;
            this._isRobot = this._unit.type == Unit.TYPE_ID_ROBOT;
        }

        /**
         * 更新位置
         */
        private updatePosition(): void {
            if (!this._unit) return;
            //炮台位置
            let pos = this._unit.GetIndex();
            this._position = pos;
            this._sceneObjectMgr.event(BuyuPlayer.POSITION_CHANGED);
        }

        /**
         * 更新祈福时间
         */
        private updateQiFu(): void {
            if (!this._unit) return;
            let curEndTime = this._unit.GetQFEndTime(this._unit.GetQiFuType() - 1);
            if (this._qifu_endTime != curEndTime) {
                this._qifu_endTime = curEndTime;
                this.event(BuyuPlayer.QIFU_ENDTIME_CHANGED);
            }
        }

        /**
         * 检查下标变化
         */
        private checkUpdate(): void {
            if (!this._unit) return;
            //炮台倍数
            let curLv = this._unit.GetFireLevel();
            if (this._fireLevel != curLv) {
                this._fireLevel = curLv;
                this.event(BuyuPlayer.FIRE_LEVEL_CHANGED);
            }
        }

        /**
         * 检查下标变化
         */
        private checkUpdate2(): void {
            if (!this._unit) return;

            //是否房主
            let flag = this._unit.GetRoomMaster();
            // logd("房主",flag)
            this._isRoomMaster = flag > 0;
        }

        private updateMainPlayer(): void {
            if (!this._buyuMgr || !this._buyuMgr.mainPlayer) return;
            this._isMainPlayer = this == this._buyuMgr.mainPlayer;
        }

        private updateGold(): void {
            if (!this._unit) return;
            this._gold = this._unit.GetMoney();
            this.checkBroke();
            this.event(BuyuPlayer.GOLD_CHANGED);
        }

        /**
         * 检查破产
         */
        private checkBroke(): void {
            if (!this._story) return;
            let maplv = this._story.maplv;
            let info = BuyuPageDef.getRoomInfoByMode(maplv);
            if (info)
                this.isBroke = this._gold < info.rateGold;
        }

        // 更新射的朝向,用于补间
        public updateOrientation(delateTime: number, isImmediately: boolean = false): boolean {
            if (isImmediately) {
                let isEual = this._curOri.equal(this._ori);
                this._curOri.x = this._ori.x;
                this._curOri.y = this._ori.y;
                return isEual;
            } else {
                //转成秒
                delateTime = delateTime / 1000;
                if (!this._curOri.equal(this._ori)) {
                    this._curOri.lerp(this._ori, 8 * delateTime).normalize();
                }
            }
            // --该返回值只对客户端有效
            return this._curOri.equal(this._ori);
        }

        update(diff: number) {
            //检查是否需要托管 机器人由房主驱动
            let haveAction = this._isRobot && this._buyuMgr.mainPlayer && this._buyuMgr.mainPlayer.isRoomMaster;
            if (haveAction) {
                if (!this._actionManager) {
                    this._actionManager = new ActionManager();
                    let action = new manager.ActionRobot(this);
                    this._actionManager.exec(action);
                }
                this._actionManager.updateActions(diff * 0.001);
            }
            else {
                if (this._actionManager) {
                    this._actionManager.clear();
                    this._actionManager = null;
                }
            }

            //如果是机器人 或 主玩家 才需要选择目标和开火
            if (Laya.stage.isVisibility && (this._isRobot || this._isMainPlayer)) {
                //瞄准
                if (this._fireType == BuyuPlayer.FIRE_TYPE_AIM) {
                    //如果是瞄准 要拿到瞄准的ID
                    this.checkTarget();
                }
                this.checkFire();
            }
        }

        private checkTarget(): void {
            if (!this.selectFish
                || this.selectFish.isDied
                || (this._game.mainScene && !this._game.mainScene.camera.lookIn2(this.selectFish.pos))) {
                this.findTarget();
            }
        }

        //自动寻找目标
        findTarget(): void {
            let oid = this._buyuMgr.getMaxOrderFishOid();
            this.selectFish = this._buyuMgr.getFishByOid(oid);
        }

        private checkFire(): void {
            //是否停止开火
            let isStop = this._fireState == BuyuPlayer.FIRE_STATE_STOP;
            //手动开火
            let isCanHand = this._fireType == BuyuPlayer.FIRE_STATE_HAND && this._isDoFireing;
            //自动开火
            let isCanAuto = this._fireType == BuyuPlayer.FIRE_TYPE_AUTO;
            //瞄准
            let isCanAim = this._fireType == BuyuPlayer.FIRE_TYPE_AIM && this.selectFish != null;
            //是否能开火
            let isCanFire: boolean = !isStop && !this._isBroke && (isCanHand || isCanAim || isCanAuto);
            if (isCanFire) {
                //--------------检查条件--------------
                //判断最大子弹
                let maxCount: number = BuyuPlayer.MAX_BULLET;
                let isMaxCount = this.bulletCount >= maxCount;
                if (isMaxCount && this._isDoFireing) {
                    if (!this.isShowBulletTip) {
                        this._isMainPlayer && this.event(BuyuPlayer.PLAYER_TIPS, ["您已经发射太多子弹了,休息一下吧"]);
                        this.isShowBulletTip = true;
                    }
                    return;
                }
                //金钱是否足够发射这个炮倍的子弹
                let isRate = this.checkCurFireRateMoney();
                if (!isRate) {
                    if (!this.isShowBulletTip) {
                        this._isMainPlayer && this.event(BuyuPlayer.PLAYER_TIPS, ["您的捕鱼币不足以使用该倍率的炮台，请切换低倍率炮台"]);
                        this.isShowBulletTip = true;
                    }
                    return;
                }

                let nowTime = this._buyuMgr.nowServerTime;
                //发射炮
                let diff = (nowTime - this._lastFireTime) * 1000;
                if (diff >= this._fireSpeed) {
                    //开火吧少年！
                    this.fire();
                    this._game.playSound(Path_game_buyu.music_buyu + "fire.mp3", false);
                    this._lastFireTime = nowTime;
                }
            }
        }

        /**
		 * 判断金钱是否足够发射当前倍数的子弹
		 */
        checkCurFireRateMoney(): boolean {
            //TODO断线重连没有mapLv
            let maplv = this._story.maplv || 51;
            let info = BuyuPageDef.getRoomInfoByMode(maplv);
            return this._gold >= this._fireLevel * info.rateGold;
        }

        //开火
        fire(): void {
            let buyuStory: BuyuStory = this._sceneObjectMgr.story as BuyuStory;
            if (buyuStory && buyuStory.startFire) {
                //先计算下朝向
                this.updateFireToward();
                //射击或者瞄准
                let oid = this._fireType == BuyuPlayer.FIRE_TYPE_AIM && this.selectFish ? this.selectFish.unit.oid : 0;
                buyuStory.startFire(this, this._curToward, oid, true, 0);
            }
        }

        /**
         * 开火方向
         */
        public updateFireToward(): void {
            if (this.selectFish) {
                this._targetV.set(this.selectFish.pos);
            } else if (this.isDoFireing) {
                let camera = this._game.mainScene.camera;
                if (!camera) return;
                let x = camera.getCellXByScene(Laya.stage.mouseX / this._game.mainScene.scaleX);
                let y = camera.getCellYByScene(Laya.stage.mouseY / this._game.mainScene.scaleY);
                //点到屏幕外不管
                if (!this._game.mainScene.checkInScene(x, y)) {
                    return;
                }
                this._targetV.x = x;
                this._targetV.y = y;
            }
            if (this._targetV) {
                this.towardTarget(this._targetV);
            }
        }

        public towardTarget(targetPos: Vector2): void {
            let pos = this._position;
            let paoV = SceneFishRes.PAO_POSDATA[pos];
            Vector2.temp.set(targetPos);
            let toward = Vector2.temp.sub(paoV).getToward();
            let min = pos <= 2 ? SceneFishRes.MIN_TOWARD : Vector2.TowardCount - SceneFishRes.MAX_TOWARD;
            let max = pos <= 2 ? SceneFishRes.MAX_TOWARD : Vector2.TowardCount - SceneFishRes.MIN_TOWARD;
            if (pos <= 2) {
                if (toward < 32) toward = 128;
            } else {
                if (toward > 96) toward = 0;
            }
            toward = toward < min ? min : toward;
            toward = toward > max ? max : toward;
            this.curToward = toward;
        }

        private _curToward: number;
        // 朝向 -1用下标朝向
        public set curToward(v: number) {
            if (v == -1) {
                let initOri;
                if (this._position > 2)
                    initOri = Vector2.up;
                else
                    initOri = Vector2.down;
                v = initOri.getToward();
            }
            this._curToward = v;
            // this._curOri.fromToward(this._curToward);
        }
        public get curToward(): number {
            return this._curToward;
        }

        clear(): void {
            if (this._unit) {
                this._unit.off(Unit.EVENT_TYPE_CHANGED, this, this.updateType);
                this._unit.removeListene(Unit.UNIT_INT_MONEY, this, this.updateGold);
                this._unit.removeListene(Unit.UNIT_INT_BYTE3, this, this.checkUpdate);
                this._unit.removeListene(Unit.UNIT_INT_BYTE2, this, this.checkUpdate2);
                this._unit.removeListene(Unit.UNIT_INT_BYTE1, this, this.updatePosition);
                this._unit.removeListene(Unit.UNIT_INT_QI_FU_END_TIME, this, this.updateQiFu);
            }
            if (this._buyuMgr) {
                this._buyuMgr.off(BuyuMgr.EVENT_UPDATE_MAIN_PLAYER, this, this.updateMainPlayer);
            }
            this._unit = null;
        }
    }
}