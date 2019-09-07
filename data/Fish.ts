/**
* name 
*/
module gamebuyu.data {
    // 鱼的基础移动速度500/s
    const FISH_BASE_MOVE_SPEED: number = 50;
    // 神灯鱼的出生延迟2秒
    const GOLD_FISH_BORN_DELAY: number = 2;

    export class Fish implements ISceneObject {
        private _unit: Unit;
        isCanClear: boolean;
        get unit(): Unit {
            return this._unit;
        }
        visible: boolean;
        lookInCamera: boolean;
        lookInCamera2: boolean;
        private _sceneObjectMgr: SceneObjectMgr;
        get sceneObjectMgr(): SceneObjectMgr {
            return this._sceneObjectMgr;
        }
        // 行为管理器(托管)
        protected _actionManager: ActionManager;
        get actionManager(): ActionManager {
            return this._actionManager;
        }
        // 模板id
        entryid: number;
        //模板
        fishTemp: any;

        // 是否死亡
        protected _isDied: boolean = false;
        get isDied(): boolean {
            return this._isDied;
        }
        set isDied(v: boolean) {
            if (this._isDied == v) {
                return;
            }
            this._isDied = v;
            // logd("鱼死了",v ? true : false);
            if (this._isDied) this._actionManager.clear();
        }

        private _isStandby: boolean = false;
		/**
		 * 是否待机状态
		 */
        get isStandby(): boolean {
            return this._isStandby;
        }

        // 位置信息
        protected _pos: Vector2;
        get pos(): Vector2 {
            return this._pos;
        }
        // 缩放
        private _scale: number = 1;
        get scale(): number {
            return this._scale;
        }
        set scale(v: number) {
            this._scale = v;
        }

        // 朝向
        private _ori: Vector2;
        set ori(v: Vector2) {
            this._ori.set(v);
            this._angle = this._ori.angle(Vector2.right) + Math.PI / 2;
        }
        get ori(): Vector2 {
            return this._ori;
        }
        private _angle: number = 0;
        get angle(): number {
            return this._angle;
        }

        protected _wantToOri: Vector2
        // 转向
        turnToward(v: Vector2) {
            this._wantToOri.set(v).normalize();
            if (this._isYuchaolaixi) {
                this.ori = this._wantToOri;
            }
        }

        // 移动速度
        protected _moveSpeed: number;
        protected _oldMoveSpeed: number;
        get moveSpeed(): number {
            return this._moveSpeed;
        }

        private _speedScale: number;
		/**
		 * 速度倍率
		 */
        get speedScale(): number {
            return this._speedScale;
        }
        set speedScale(v: number) {
            this._speedScale = v;
            this._moveSpeed = FISH_BASE_MOVE_SPEED * v;
        }


        // 击杀者
        protected _killer: number;
        get killer(): number {
            return this._killer;
        }
        // 击杀时间
        private _killTimer: number;
        get killTimer(): number {
            return this._killTimer;
        }
        // 击杀获得得金钱
        private _lootMoney: number;
        get lootMoney(): number {
            return this._lootMoney;
        }
        set lootMoney(v: number) {
            this._lootMoney = v;
            if (v) {
                this._killTimer = Laya.timer.currTimer;
            }
        }
        //是否死于炸金币
        public isBoom: boolean = false;
        // 是否于潮来袭(跑掉的)
        private _isYuchaolaixi: boolean = false;
        // 是否鱼潮来袭得鱼
        private _inYuchao: boolean = false;
        //boss鱼
        private _isBoss: boolean = false;
        // 出生时间
        protected _bornTime: number = 0;
        set bornTime(value: number) {
            this._bornTime = value;
        }
        private _waitBorn: boolean = false;
		/**
		 * 是否出生等待
		 */
        get waitBorn(): boolean {
            return this._waitBorn;
        }


        private _lastBeatenTime: number = 0;
        private _lastSayTime: number = 0;
		/**
		 * 最后一次被打的时间
		 */
        get lastBeatenTime(): number {
            return this._lastBeatenTime;
        }

		/**
		 * 鱼群id
		 */
        private _groupId: number = 0;
        get groupID(): number {
            return this._groupId;
        }

        private _groupTemp: any;
		/**
		 * 鱼线id
		 */
        private _lineId: number = 0;
        get lineID(): number {
            return this._lineId;
        }
		/**
		 * 鱼索引
		 */
        private _position: number = 0;
        get position(): number {
            return this._position;
        }

        protected _formLeft: boolean = false;

        private _buyuStory: BuyuStory;
		get buyuStory(): BuyuStory {
			return this._buyuStory;
		}

        constructor(unit: Unit, v: SceneObjectMgr) {
            this._sceneObjectMgr = v;
            this._buyuStory = v.story as BuyuStory;
            this._unit = unit;
            this._actionManager = new ActionManager();
            this._pos = new Vector2();
            this._ori = new Vector2();
            this._wantToOri = new Vector2();
            this.speedScale = 1;
            unit.AddListen(UnitField.UNIT_INT_ENTRY, this, this.updateEntry);
            unit.AddListen(UnitField.UNIT_INT_BORN_TIME, this, this.updateInfo);
            unit.AddListen(UnitField.UNIT_INT_LINE_I_D, this, this.updateInfo);
            unit.AddListen(UnitField.UNIT_INT_GROUP_I_D, this, this.updateInfo);
            unit.AddListen(UnitField.UNIT_INT_U160, this, this.updateInfo);
            unit.AddListen(UnitField.UNIT_INT_LOOT_MONEY, this, this.updateLoot);
            unit.AddListen(UnitField.UNIT_INT_KILL_BY, this, this.updateKiller);
            unit.AddListen(UnitField.UNIT_INT_BYTE2, this, this.updateCheckLive);
            this.updateEntry();
            this.updateInfo();
            this.updateLoot();
            this.updateKiller();
            this.updateCheckLive();
        }

        protected _isChangePos: boolean = false;
        set isChangePos(v: boolean) {
            this._isChangePos = v;
        }

        private updateEntry(): void {
            if (!this._unit) return;
            // 校验模板
            this.entryid = this._unit.GetEntry();
            if (Template.data)
                this.fishTemp = Template.getFishTempById(this.entryid);
        }

        private updateInfo(): void {
            if (!this._unit) return;
            // 初始坐标需要重算
            this._isChangePos = true;
            this._isBoss = false;

            this._lineId = this._unit.GetLineID();
            this._position = this._unit.GetFishPosition();
            this._bornTime = this._unit.GetBornTime();

            let groupId = this._unit.GetGroupID();
            if (this._groupId != groupId) {
                this._groupId = groupId;
                //判断BOSS来袭事件
                this._groupTemp = this._groupId ? FishGroupPathManager.getFishGroupTempById(this._groupId) : null;
                if (this._groupTemp && this._groupTemp.group_typ == 8) {
                    this._isBoss = true;
                    this.updateEntry();
                    this._sceneObjectMgr.event(BuyuMapInfo.EVENT_BOSS_EVENT, this.entryid);
                }
            }
        }

        private updateLoot(): void {
            // 校验战利品
            this.lootMoney = this._unit.GetLootMoney();
            this.checkFishDie();
        }

        private updateKiller(): void {
            // 击杀者
            this._killer = this._unit.GetKillBy();
            this.checkFishDie();
        }

        private updateCheckLive(): void {
            this.checkLiveStatus();
            this.checkFishDie();
        }

        private checkFishDie(): void {
            if (this.isDied && this._killer && this.lootMoney) {
                // 鱼死了
                this._sceneObjectMgr.event(BuyuMgr.EVENT_KILL_FISH, this);
            }
        }

        // 更新行为
        private updateAction(deltaTime: number): void {
            this._actionManager.updateActions(deltaTime);
        }

        // 校验生存状态
        checkLiveStatus(): void {
            let status = this._unit.GetLiveStatus();
            this.isDied = status == GlobalDef.kLiveStatusDie;
            this._isStandby = status == GlobalDef.kLiveStandby;
        }

        // 校验坐标
        protected checkPosition(): void {
            let groupID: number = this.groupID;
            let lineID: number = this.lineID;
            let index: number = this.position;
            if (this._isDied) {
                // 死鱼一条
                this.dieEnd();
                return;
            }

            // 是否鱼潮的鱼
            this._inYuchao = this._groupTemp ? this._groupTemp.group_typ == GlobalDef.kGroupTypYuChao : false;

            // 是否鱼潮来袭跑掉的鱼
            this._isYuchaolaixi = false;

            // 重算坐标前,先重置一下移动速度
            this._moveSpeed = FishGroupPathManager.getSpeedFromLineID(lineID);
            this._oldMoveSpeed = this._moveSpeed;

            // 移动的路径
            let path: Array<Vector2> = [];
            // 服务器的秒数 单位用秒
            let game = this._sceneObjectMgr.game as Game;
            let now = Math.ceil(game.sync.serverTimeBys);
            let moveTime = now - this._bornTime;
            if (moveTime < 0) {
                moveTime = 0;
            }

            // if (this._inYuchao) {
            //     logd("this._bornTime", this._bornTime)
            // }

            // 获取移动路径
            FishGroupPathManager.getPostion(groupID, index, lineID, moveTime, this.pos, this._wantToOri, path);

            // 是否翻转路径
            this._formLeft = this._unit.GetFromLeft() != 0;
            // this._formLeft = true;
            if (this._formLeft) {
                // path = [new Vector2(300,500),new Vector2(1000,500),new Vector2(300,500)];
                let centerX = this._sceneObjectMgr.mapAssetInfo.logicWidth / 2;
                // 坐标
                this._pos.x -= (this._pos.x - centerX) * 2;
                // 方向
                this._wantToOri.x *= -1;
                // 路径
                for (let poss of path) {
                    poss.x -= (poss.x - centerX) * 2;
                }
            }
            // logd("=============fish move",this._bornTime,now,moveTime,this._moveSpeed,path,lineID,groupID,this._pos);
            // 直接同步方向,不需要做缓动
            this.ori = this._wantToOri;
            // 将坐标同步到ai那边去
            let action: ActionMovePath = new ActionMovePath(this, path);

            this._actionManager.exec(action);
            this.LinePosList = [this._pos.clone()];
            this.LinePosList = this.LinePosList.concat(path);
        }

        LinePosList: Array<Vector2>;

        update(diff: number): void {
            // 如果服务端坐标有发生变化
            if (this._isChangePos) {
                this.checkPosition();
                this._isChangePos = false;
            }
            let isRealDied: boolean = this._isDied /*&& (this._killer > 0 || !this.lookInCamera)*/;
            if (!isRealDied) {
                //不是被人打死的 速度加快 游出视线吧
                // if(this._isDied && this._oldMoveSpeed) this._moveSpeed = this._oldMoveSpeed * 8;
                let nowTime: number = this._sceneObjectMgr.game.sync.serverTimeBys;
                this._waitBorn = nowTime < this._bornTime;
                let mapInfo = this._sceneObjectMgr.mapInfo as BuyuMapInfo;
                if (!this._waitBorn && mapInfo) {
                    if (!this._inYuchao) {
                        if (!this._isYuchaolaixi) {
                            // 校验一下是否需要触发鱼潮来袭
                            if (this._bornTime < mapInfo.yclxTime) {
                                this.yuchaolaixi();
                            }
                            else if (this._bornTime == mapInfo.yclxTime) {
                                this.isDied = true;
                                this.dieEnd()
                            }
                        }
                    }
                    // 更新节点位置
                    let deltaTime = diff / 1000;
                    this.updateLocal(deltaTime);
                    this.updateAction(deltaTime);
                }
            }
            // else {
            // 	this._actionManager.clear();
            // }
        }

        private yuchaolaixi(): void {
            this._isYuchaolaixi = true;
            // 速度提高x倍 这里看下是否需要缓动
            this._moveSpeed *= 8;
        }

        // 更新每帧的位置
        protected updateLocal(delateTime: number) {
            if (!this.ori.equal(this._wantToOri)) {
                // let wantAngle:number = this._wantToOri.angle(Vector2.right) + Math.PI / 2;
                // let diffAngle:number =  Math.abs(wantAngle - this._angle);
                //如果角度大于
                if (this._isBoss && (this.pos.x < 0 || this.pos.x > main.widthDesginPixelw)) {
                    this.ori = this._wantToOri;
                }
                else {
                    this.ori.lerp(this._wantToOri, delateTime).normalize();
                    this.ori = this._ori;
                }

            }

            let offset: number = this._moveSpeed * delateTime;
            Vector2.temp.set(this._ori).len = offset;
            this._pos.add(Vector2.temp);
        }

        // 被打
        onBeaten(): void {
            let nowTiime: number = Laya.timer.currTimer;
            this._lastBeatenTime = nowTiime;
            //被打的时候叫一下,3秒内，只会叫一次
            if (this._lastSayTime < nowTiime && this.entryid && this.fishTemp && this.fishTemp.show_dead == 1 && MathU.randomRange(1, 100) <= 5) {
                this._sceneObjectMgr.game.playSound(Path_game_buyu.music_buyu + "say" + MathU.randomRange(1, 14) + ".mp3");
                this._lastSayTime = nowTiime + 5000;
            }
        }

        // 死亡结束后
        dieEnd(): void {
            this._pos.x = -3000;
            this.isBoom = false;
        }

        clear(): void {
            if (this._unit) {
                this._unit.removeListene(UnitField.UNIT_INT_ENTRY, this, this.updateEntry);
                this._unit.removeListene(UnitField.UNIT_INT_BORN_TIME, this, this.updateInfo);
                this._unit.removeListene(UnitField.UNIT_INT_LINE_I_D, this, this.updateInfo);
                this._unit.removeListene(UnitField.UNIT_INT_GROUP_I_D, this, this.updateInfo);
                this._unit.removeListene(UnitField.UNIT_INT_U160, this, this.updateInfo);
                this._unit.removeListene(UnitField.UNIT_INT_LOOT_MONEY, this, this.updateLoot);
                this._unit.removeListene(UnitField.UNIT_INT_KILL_BY, this, this.updateKiller);
                this._unit.removeListene(UnitField.UNIT_INT_BYTE2, this, this.updateCheckLive);
            }
            this._isDied = false;
            // this.hasBeaten = false;
            this._isChangePos = false;
            // this._unit = null;
        }
    }
}