module gamebuyu.page {
	/**
	* 经典模式战利品掉落
	*/
    export class BuyuLootPage extends game.gui.base.Page {
        //金币上限
        static MAX_COIN: number = 15;
        //钻石上限
        static MAX_DIAMOND: number = 5;
        //每行显示的数量
        static MAX_PER_LINE: number = 5;

        //绘制对象
        private _loots: LootDrawtor[];
        //数字绘制对象
        private _nums: NumDrawtor[];
        private _viewUI: Sprite;
        private _bornV: Vector2;
        private _targetV: Vector2;
        private _tempP: Point;
        //上边界
        private _top: number = 0;
        //下边界
        private _bottom: number = 0;
        //左边界
        private _left: number = 0;
        //右边界
        private _right: number = 0;
        //发射器
        private _fireMgr: FireMgr;
        //捕鱼管理器
        private _buyuMgr: BuyuMgr;

        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._asset = [
                Path.ui_atlas_effect + "coin.atlas",
                Path.ui_atlas_effect + "shuzi.atlas",
            ];
            this._loots = [];
            this._nums = [];
            this._fireMgr = new FireMgr(v, this, "setLoot");
            let story = this._game.sceneObjectMgr.story as BuyuStory;
            this._buyuMgr = story.buyuMgr;
        }

        createdLoadEffect(): void {
            // 不需要加载特效
        }

        // 页面初始化函数
        protected init(): void {
            this._viewUI = this.createView(Sprite);
            this._viewUI.size(main.widthDesginPixelw, main.heightDesginPixelw);
            this.addChild(this._viewUI);
            this._bornV = new Vector2();
            this._targetV = new Vector2();
            this._tempP = new Point();

            this._right = main.widthDesginPixelw;
            this._bottom = main.heightDesginPixelw;
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            this._game.sceneObjectMgr.on(BuyuMgr.EVENT_KILL_FISH, this, this.onKillFish);
        }

        private getTargetPos(player: BuyuPlayer): Point {
            let page = this._game.uiRoot.HUD.getPage(BuyuPageDef.PAGE_BUYU_MAIN) as BuyuSceneHudPage;
            if (!page) return;
            let item = page.getGunItemByPlayer(player) as BuyuGunItem;
            if (!item) return;
            this._tempP = item.getGoldGlobalPos(this._tempP);
            this._tempP = this._viewUI.globalToLocal(this._tempP);
            return this._tempP;
        }

        // private getTargetPos2(posNum: number) {
        //     let page = this._game.uiRoot.HUD.getPage(BuyuPageDef.PAGE_CLASSICAL_HUD) as ClassicalHudPage;
        //     if (!page) return;
        //     let item = page.paoDic.get(posNum) as gui.component.ClassicalGunItem;
        //     let p: Point = item.getGoldGlobalPos();
        //     p = this._lootLayer.globalToLocal(p);
        //     return new Vector2(p.x, p.y);
        // }

        //鱼死亡监听
        private onKillFish(fish: Fish, killOid?: number, fishTemp?: any): void {
            if (!this._game.mainScene) return;
            let oid = fish.killer;
            if (!oid && killOid) oid = killOid;;
            let player = this._buyuMgr.getPlayeryOid(oid) as BuyuPlayer;
            if (!player) return;
            let isSelf: boolean = player.isMainPlayer;
            // if (!isSelf) return;

            let temp = fishTemp ? fishTemp : fish.fishTemp;
            if (!temp) return;
            let camera = this._game.mainScene.camera;
            //炮台位置(结束点)
            let targetX, targetY;

            let p = this.getTargetPos(player);
            if (!p) return;
            targetX = p.x;
            targetY = p.y;

            //鱼的位置(出生点)
            this._tempP.x = camera.getScenePxByCellX(fish.pos.x) * this._game.clientScale;
            this._tempP.y = camera.getScenePxByCellY(fish.pos.y) * this._game.clientScale;
            this._tempP = this._viewUI.globalToLocal(this._tempP);
            let bornX = this._tempP.x;
            let bornY = this._tempP.y;
            let rate = temp.rate_range[0];
            //计算奖励
            let awardGold = this.getAwards(fish);
            //1.飘金币
            //计算金币数量 打底2个，每4倍额外增加一个
            let coinCount = 2 + Math.ceil(rate / 4);
            coinCount = coinCount > BuyuLootPage.MAX_COIN ? BuyuLootPage.MAX_COIN : coinCount;
            if (awardGold > 0) {
                this.setLoots(LootDrawtor.TYPE_COIN, coinCount, bornX, bornY, targetX, targetY, null, player);
            }

            //2.飘字
            let mainPlayer = this._buyuMgr.mainPlayer;
            let numType = mainPlayer && mainPlayer.unit.oid == fish.killer ? NumDrawtor.TYPE_SELF : NumDrawtor.TYPE_OTHER;
            let groupID = fish.groupID;
            let fishIndex = fish.position;
            let groupTemp: any = FishGroupPathManager.getFishGroupTempById(groupID);
            //是否是一网打尽
            let isYwdj = groupTemp && groupTemp.group_typ == 4;
            //是否是BOSS
            let isBoss = groupTemp && groupTemp.group_typ == 6 && groupTemp.boss > 0 && fishIndex == groupTemp.boss - 1;
            //是否显示
            let isShow = temp && temp.show == 1;
            if (isShow || isYwdj || isBoss) {
                this._game.mainScene.camera.shock(750);
                this._fireMgr && this._fireMgr.start(bornX, bornY);
                //微信震动接口
                // let api = window['externalInterfacePI'];
                // if (api && api.wxShock) {
                //     api.wxShock(true);
                // }
                //随机播放死亡语音
                if (MathU.randomRange(1, 3) == 1 && temp.great != 1 && !isYwdj)
                    this._game.playSound(Path_game_buyu.music_buyu + "boss_die" + MathU.randomRange(1, 10) + ".mp3");
                else
                    this._game.playSound(Path_game_buyu.music_buyu + "huangjinyu.mp3");
            } else {
                this._game.playSound(Path_game_buyu.music_buyu + "yubaoqian.mp3", false);
            }

            if (awardGold > 0) {
                let rowNum = Math.ceil(coinCount / BuyuLootPage.MAX_PER_LINE);
                this.setNum(numType, awardGold, bornX, bornY);
                player && player.event(BuyuPlayer.GOLD_CHANGED, [awardGold]);
                bornY += rowNum * 50;
            }

        }

        /**
         * 获取奖励
         */
        private getAwards(fish: Fish): number {
            if (!fish) return 0;
            return fish.lootMoney;
        }

        setLoots(type: number, count: number, bornX: number, bornY: number, targetX: number, targetY: number, itemID?: number, player?: BuyuPlayer) {
            let maxCount = 10;
            let width = 70;
            let height = 75;
            switch (type) {
                case LootDrawtor.TYPE_COIN:
                    maxCount = BuyuLootPage.MAX_COIN;
                    width = 70;
                    height = 80;
                    break;
            }
            count = count > maxCount ? maxCount : count;
            let diffY: number = 0;
            let countPerLine: number = count > BuyuLootPage.MAX_PER_LINE ? BuyuLootPage.MAX_PER_LINE : count;
            let index = -countPerLine / 2;
            for (let i = 0; i < count; i++) {
                let x = bornX + index * width;
                let y = bornY + diffY;
                Laya.timer.once(50 * i, this, () => {
                    this.setLoot(type, x, y, targetX, targetY, itemID);
                });
                if ((i + 1) % BuyuLootPage.MAX_PER_LINE == 0) {
                    diffY += height;
                    index = -countPerLine / 2;
                } else {
                    index++;
                }
            }

        }

        setLoot(type: number, bornX: number, bornY: number, targetX: number, targetY: number, itemID?: number) {
            //限制下最大个数吧、
            let len: number = this._loots.length;
            if (len > 50) return;
            this._bornV.x = bornX;
            this._bornV.y = bornY;
            this._targetV.x = targetX;
            this._targetV.y = targetY;
            let lootDw: LootDrawtor = LootDrawtor.create(type, this._bornV, this._targetV, itemID);
            this._loots[len] = lootDw;
        }

        setNum(type: number, num: number, bornX: number, bornY: number, showBz?: boolean) {
            let len = this._nums.length;
            if (len > 12) return;
            this._bornV.x = bornX;
            this._bornV.y = bornY;
            let numDw: NumDrawtor = NumDrawtor.create(type, num, this._bornV, showBz);
            this._nums[len] = numDw;
        }

        private _nextUpdateTime: number = 0;
        private _timeDelta: number = 0;
        update(diff: number): void {
            //如果是小游戏上并且处于后台 就不执行了
            if (!this._viewUI) return;
            this._viewUI.graphics.clear();
            this._loots.sort(this.lootSort);
            let i: number = 0;
            let len: number = this._loots.length;
            for (i = 0; i < len; i++) {
                let loot: LootDrawtor = this._loots[i];
                if (!loot) continue;
                if (loot.isDestroy || loot.curPos.x < this._left || loot.curPos.x > this._right || loot.curPos.y < this._top || loot.curPos.y > this._bottom) {
                    ObjectPools.free(loot);
                    this._loots.splice(i, 1);
                    i = i <= 0 ? 0 : i - 1;
                    len = this._loots.length;
                } else {
                    loot.onDraw(diff, this._viewUI.graphics);
                }
            }
            len = this._nums.length;
            for (i = 0; i < len; i++) {
                let num: NumDrawtor = this._nums[i];
                if (num.isDestroy) {
                    ObjectPools.free(num);
                    this._nums.splice(i, 1);
                    i = i <= 0 ? 0 : i - 1;
                    len = this._nums.length;
                } else {
                    num.onDraw(diff, this._viewUI.graphics);
                }
            }
            this._fireMgr && this._fireMgr.update(diff);
        }

        private lootSort(a: LootDrawtor, b: LootDrawtor): number {
            return b.type - a.type;
        }

        public close(): void {
            this._fireMgr && this._fireMgr.destroy();
            if (this._viewUI) {
                Laya.timer.clearAll(this);
                this._game.sceneObjectMgr.off(BuyuMgr.EVENT_KILL_FISH, this, this.onKillFish);
            }
            super.close();
        }
    }

    //发射器
    class FireMgr {
        //总发射时间
        static TOTAL_TIME: number = 500;
        //发射间隔
        static INTERVAL: number = 250;
        //出生随机半径
        static BORN_RADIUS: number = 100;
        //扩散随机半径
        static FLY_RADIUS: number = 800;
        //每次随机最小
        static MIN_COUNT: number = 20;
        //每次随机最大
        static MAX_COUNT: number = 40;

        //发射点
        public firePoint: Vector2;
        private _diffPoint: Vector2;
        //计时器
        public _timer: number;
        public _startTime: number;
        private _game: Game;
        private _caller: any;
        private _fireFun: any;

        constructor(game: Game, caller: any, fireFun: any) {
            this.firePoint = new Vector2();
            this._diffPoint = new Vector2();
            this._timer = 0;
            this._game = game;
            this._caller = caller;
            this._fireFun = fireFun;
        }

        start(bornX: number, bornY: number): void {
            this._timer = 500;
            this.firePoint.x = bornX;
            this.firePoint.y = bornY;
            this._startTime = this._game.sync.serverTimeBys * 1000 + 500;
        }

        update(diff: number): void {
            let nowTime = this._game.sync.serverTimeBys * 1000;
            if (!this._startTime || nowTime - this._startTime > FireMgr.TOTAL_TIME) return;
            this._timer += diff;
            if (this._timer >= FireMgr.INTERVAL) {
                //随机本次发射数量
                let count = MathU.randomRange(FireMgr.MIN_COUNT, FireMgr.MAX_COUNT);
                for (let i = 0; i < count; i++) {
                    let bx: number, by: number, tx: number, ty: number;
                    let bornV = this.getRandomPoint(0, FireMgr.BORN_RADIUS);
                    bx = this._diffPoint.x; by = this._diffPoint.y;
                    let targetV = this.getRandomPoint(3 * FireMgr.BORN_RADIUS, FireMgr.FLY_RADIUS);
                    tx = this._diffPoint.x; ty = this._diffPoint.y;
                    if (this._caller && this._fireFun) {
                        let delay = MathU.randomRange(0, FireMgr.INTERVAL);
                        Laya.timer.once(delay, this, (v0, v1, v2, v3) => {
                            this._caller[this._fireFun](LootDrawtor.TYPE_COIN2, v0, v1, v2, v3);
                        }, [bx, by, tx, ty]);
                    }
                }
                this._timer = 0;
            }
        }

        /**
         * 距离发射点一定半径内，随机坐标点
         * @param startRadius 
         * @param endRadius
         */
        private getRandomPoint(startRadius: number, endRadius: number): void {
            let randomRadius = MathU.randomRange(startRadius, endRadius);
            //随机角度
            let radius = startRadius + randomRadius;
            let randomAngle = MathU.randomRange(0, 360);
            let diffX = radius * Math.cos(randomAngle);
            let diffY = radius * Math.sin(randomAngle);
            this._diffPoint.x = this.firePoint.x + diffX;
            this._diffPoint.y = this.firePoint.y + diffY;
        }

        destroy(): void {
            Laya.timer.clearAll(this);
            this.firePoint = null;
        }
    }

    //战利品绘制
    class LootDrawtor implements IPoolsObject {
        poolName: string = "LootDrawtor";
        //战利品类型
        static TYPE_COIN: number = 0;//金币
        static TYPE_COIN2: number = 1;//金币新动画

        private static TYPE_BORN: number = 1;//第一种出生方式
        private static TYPE_BORN2: number = 2;//第二种出生方式

        private static STAY_TIME: number = 600;//出生之后暂停的时间
        private _curPos: Vector2 = new Vector2();//当前位置
        get curPos(): Vector2 {
            return this._curPos;
        }
        private _bornPos: Vector2 = new Vector2();//出生的位置
        private _targetPos: Vector2 = new Vector2();//目标位置
        private _bornTimer: number;//出生耗时
        private _easeObjs: Array<EaseObj> = [];
        private _textures: Texture[] = [];
        private _guangTexture: Texture;
        private _guangTueW: number = 0;
        private _guangTueH: number = 0;
        /*动画总时间*/
        private _totalTime: number = 0;
        /*最后一次绘制到现在的时间*/
        private _runTime: number = 0;
        /*帧率*/
        private _frameRate: number = 12;
        /*帧时间 帧/ms*/
        private _frameTime: number = 0;
        /*帧数量*/
        private _frameCount: number = 0;
        /*是否循环 */
        private _loop: boolean = true;
        /*动画最后一帧索引*/
        private _frameLastIdx: number = 0;
        /**当前帧 */
        private _frameCurIdx: number = 0;

        isDestroy: boolean = false;

        // 是否结束
        get isDropEnd(): boolean {
            return this._runTime > this._bornTimer;
        }
        private _type: number;
        get type(): number {
            return this._type;
        }
        //起始缩放
        private _startScale: number;
        //结束缩放
        private _endScale: number;
        //当前缩放
        private _scale: number = 1;
        private _alpha: number = 1;
        private _guangAlpha: number = 1;
        //随机帧数
        private _randomFrameCount: number = 0;
        private _assetLoader: AssetsLoader = new AssetsLoader();

        static create(type: number, v1: Vector2, v2: Vector2, itemID?: number): LootDrawtor {
            let obj = ObjectPools.malloc(LootDrawtor) as LootDrawtor;
            obj.create(type, v1, v2, itemID);
            return obj;
        }

        private create(type: number, bornV: Vector2, targetV: Vector2, itemID?: number, isMain: boolean = false) {
            this._type = type;
            this._bornPos.set(bornV);
            this._curPos.set(bornV);
            this._targetPos.set(targetV);
            this.isDestroy = false;
            this.initTexture(type, itemID);
        }

        private initTexture(type: number, itemID?: number): void {
            if (type == LootDrawtor.TYPE_COIN || type == LootDrawtor.TYPE_COIN2) {
                let idx = 1;
                let texture: Texture;
                do {
                    let url = Path_game_buyu.ui + 'coin/' + idx + '.png';
                    texture = Loader.getRes(url);
                    if (texture) {
                        this._textures[idx - 1] = texture;
                        idx++;
                    }
                    else {
                        break;
                    }
                }
                while (true);
                this.calInfo();
            }
        }

        private calInfo(): void {
            this._frameCount = this._textures.length;
            this._frameLastIdx = this._frameCount - 1;
            this._frameTime = 1000 / this._frameRate;
            this._totalTime = this._frameTime * this._frameCount;
            if (this._type == LootDrawtor.TYPE_COIN2) {
                //随机一个初始和结束缩放 
                //起始 0.2 - 0.8
                this._scale = this._startScale = 0.1 + 0.2 * Math.random();
                //结束 1 - 3
                this._endScale = 1 + 2 * Math.random();
                //随机帧数
                this._randomFrameCount = MathU.randomRange(5, 10);
                this.creatEff(LootDrawtor.TYPE_BORN2);
            } else {
                this._scale = 0.6;
                this.creatEff(LootDrawtor.TYPE_BORN);
            }
        }

        private creatEff(type: number): void {
            let duration: number;
            let sx, sy;//已上一阶段的差值
            let ex, ey;
            let st, et;
            let ss, es;
            let als, ale;
            this.clearEase();
            switch (type) {
                case LootDrawtor.TYPE_BORN:
                    st = 0, et = 2 * this._frameTime; // 向上
                    sy = 0; ey = -60;
                    this.createEase(st, et - st, sy, ey, laya.utils.Ease.linearNone, this.easeY);

                    st = et, et = 6 * this._frameTime; // 掉下来
                    sy = ey; ey = 50;
                    this.createEase(st, et - st, sy, ey, laya.utils.Ease.bounceOut, this.easeY);

                    st = et, et = 15 * this._frameTime;//原地待命
                    this.createEase(st, et - st, 0, 0, laya.utils.Ease.linearNone, null);

                    st = et, et = 30 * this._frameTime;//飞到目的地
                    sx = 0, ex = this._targetPos.x - this._curPos.x;
                    sy = ey, ey = this._targetPos.y - this._curPos.y;
                    ss = this._scale; es = 0.3;
                    this.createEase(st, et - st, sx, ex, laya.utils.Ease.backIn, this.easeX);
                    this.createEase(st, et - st, sy, ey, laya.utils.Ease.backIn, this.easeY);
                    this.createEase(st, et - st, ss, es, laya.utils.Ease.backIn, this.easeScale);

                    duration = 30 * this._frameTime;
                    break;
                case LootDrawtor.TYPE_BORN2://炸出金币
                    st = 0, et = this._randomFrameCount * this._frameTime;//飞到目的地
                    sx = 0, ex = this._targetPos.x - this._curPos.x;
                    sy = 0, ey = this._targetPos.y - this._curPos.y;
                    ss = 0, es = this._endScale - this._startScale;
                    this.createEase(st, et - st, sx, ex, laya.utils.Ease.linearNone, this.easeX);
                    this.createEase(st, et - st, sy, ey, laya.utils.Ease.linearNone, this.easeY);
                    this.createEase(st, et - st, ss, es, laya.utils.Ease.expoOut, this.easeScale);

                    //alpha
                    st = (this._randomFrameCount - 2) * this._frameTime;
                    et = this._randomFrameCount * this._frameTime;
                    als = 1, ale = 0;
                    this.createEase(st, et - st, als, ale, laya.utils.Ease.linearNone, this.easeAlpha);

                    duration = this._randomFrameCount * this._frameTime;
                    break;
            }
            this._bornTimer = duration;
        }

        private easeX(v: number): void {
            this._curPos.x = this._bornPos.x + v;
        }

        private easeY(v: number): void {
            this._curPos.y = this._bornPos.y + v;
        }

        private easeScale(v: number): void {
            this._scale = v;
        }

        private easeAlpha(v: number): void {
            this._alpha = v;
        }

        private createEase(startTimer: number, duration: number, startValue: number, endValue: number, easeFunc: Function, callbackFunc: Function): void {
            let easeObj: EaseObj = EaseObj.create(startTimer, duration, startValue, endValue, easeFunc, Handler.create(this, callbackFunc, null, false));
            this._easeObjs[this._easeObjs.length] = easeObj;
        }

        private clearEase(): void {
            for (let obj of this._easeObjs) {
                ObjectPools.free(obj);
            }
            this._easeObjs.length = 0;
        }

        // 获得当前帧
        protected getCurrentIdx(): number {
            //如果不循环，并且时间超过了动画总长，则直接给出最后一张图x
            if (this._loop || (this._runTime < this._totalTime)) {
                //获得无限完整动画循环之后剩余的时间
                let frameYu: number = this._runTime % this._totalTime;
                //定位到帧位置
                let idx: number = Math.floor(frameYu / this._frameTime);
                if (idx >= this._frameCount)
                    return this._frameLastIdx;
                return idx;
            }
            else {
                return this._frameLastIdx;
            }
        }

        onDraw(diff: number, g: Graphics): void {
            this._runTime += diff;
            if (!this._textures || this._textures.length <= 0) return;
            //更新动作帧
            if (!this.isDropEnd)
                this.showDrop();
            else {
                //结束
                this.isDestroy = true;
            }
            //特效
            if (this._guangTexture) {
                let matrix = new Laya.Matrix();
                matrix.tx = - this._guangTueW / 2;
                matrix.ty = - this._guangTueH / 2;
                matrix.rotate(this._runTime / 800 % 360);
                matrix.scale(this._scale, this._scale);
                matrix.tx += this._curPos.x;
                matrix.ty += this._curPos.y;
                if (this._runTime >= 20 * this._frameTime) {
                    this._guangAlpha -= 50 * diff / 1000;
                    this._guangAlpha = this._guangAlpha < 0 ? 0 : this._guangAlpha;
                } else {
                    this._guangAlpha = 0.5 + 0.5 * Math.abs(Math.sin(this._runTime / 150));
                }
                g.drawTexture(this._guangTexture, 0, 0, this._guangTueW, this._guangTueH, matrix, this._guangAlpha);
            }
            // 更新动画帧
            this._frameCurIdx = this.getCurrentIdx();
            let texture = this._textures[this._frameCurIdx];
            if (texture) {
                // this._curPos.y += Math.sin(this._runTime / 150);
                let width;
                let height;
                let tw: number = texture.sourceWidth;
                let th: number = texture.sourceHeight;
                width = tw;
                height = th;
                let matrix = new Laya.Matrix();
                matrix.tx = - tw / 2;
                matrix.ty = - th / 2;
                matrix.scale(this._scale, this._scale);
                matrix.tx += this._curPos.x;
                matrix.ty += this._curPos.y;
                g.drawTexture(texture, 0, 0, width, height, matrix, this._alpha);
            }
        }

        //掉落心跳
        private showDrop(): void {
            if (this.isDropEnd) {
                return;
            }
            let __runtime = this._runTime;
            for (let obj of this._easeObjs) {
                obj.update(__runtime);
            }
        }

        /**
		 * 进池 （相当于对象dispose函数）
		 */
        intoPool(...arg): void {
            this._easeObjs.length = 0;
            this._textures.length = 0;
            this._guangTexture = null;
            this._guangTueW = this._guangTueH = 0;
            this._scale = 1;
            this._alpha = 1;
            this._guangAlpha = 1;
            this._runTime = 0;
            if (this._assetLoader) {
                this._assetLoader.clear();
            }
        }
		/**
		 * 出池 （相当于对象初始化函数）
		 */
        outPool(...arg): void { };
    }

    //数字绘制
    export class NumDrawtor implements IPoolsObject {
        poolName: string = "NumDrawtor";
        static TYPE_SELF: number = 0;//自己
        static TYPE_OTHER: number = 1;//他人

        static TYPE_BORN: number = 0;
        isDestroy: boolean = false;

        private _bornPos: Vector2 = new Vector2();
        private _curPos: Vector2 = new Vector2();
        private _textures: Texture[] = [];
        private _easeObjs: EaseObj[] = [];
        private _runTime: number = 0;
        private _frameTime: number = 0;
        private _frameRate: number = 12;
        private _scale: number = 0;
        private _bornTime: number;
        private _haveBaozha: boolean = false;
        get isShowEnd() {
            return this._runTime >= this._bornTime;
        }

        static create(type: number, num: number, v1: Vector2, showBz: boolean = false): NumDrawtor {
            let obj = ObjectPools.malloc(NumDrawtor) as NumDrawtor;
            obj.create(type, num, v1, showBz);
            return obj;
        }

        create(type: number, num: number, bornV: Vector2, showBz: boolean = false) {
            this._textures.length = 0;
            this._runTime = 0;
            this._scale = 0;
            this._bornPos.set(bornV);
            this._curPos.set(bornV);
            this.isDestroy = false;
            this.initTexture(type, num, showBz);
        }

        private initTexture(type: number, num: number, showBz: boolean = false) {
            let isSelf = type == NumDrawtor.TYPE_SELF;
            this._haveBaozha = showBz;
            let texture;
            if (showBz) {
                texture = Loader.getRes(Path_game_buyu.ui + 'tongyong/baozha.png');
                this._textures.push(texture);
            }
            let addName = (isSelf ? "js_10" : "ys_10") + ".png";
            texture = Loader.getRes(Path_game_buyu.ui + 'shuzi/' + addName);
            this._textures.push(texture);
            let upNum: number = Math.ceil(num);
            let numStr = "";
            let len = numStr.length;
            if (upNum == num) {
                numStr = num.toString();
            }
            else {
                numStr = EnumToString.getPointBackNum(num, 2).toString();
            }
            len = numStr.length;
            let name = "";
            for (let i = 0; i < len; i++) {
                let char = numStr[i];
                if (char == ".") {
                    name = (isSelf ? "js_" : "ys_") + "11";
                } else {
                    name = (isSelf ? "js_" : "ys_") + char;
                }
                let url = Path_game_buyu.ui + 'shuzi/' + name + '.png';
                texture = Loader.getRes(url);
                if (texture) {
                    this._textures.push(texture);
                }
            }

            this._frameTime = 1000 / this._frameRate;
            this.creatEff(NumDrawtor.TYPE_BORN);
        }

        private creatEff(type: number): void {
            let duration: number;
            let sx, sy;//已上一阶段的差值
            let ex, ey;
            let st, et;
            let ss, es;
            this.clearEase();
            switch (type) {
                case NumDrawtor.TYPE_BORN:
                    st = 0, et = 8 * this._frameTime; // 出现
                    ss = 0; es = 1.8;
                    this.createEase(st, et - st, ss, es, laya.utils.Ease.elasticOut, this.easeScale);

                    st = 16 * this._frameTime, et = 18 * this._frameTime; // 消失
                    ss = 1; es = 0;
                    this.createEase(st, et - st, ss, es, laya.utils.Ease.linearNone, this.easeScale);

                    duration = 18 * this._frameTime;
                    break;
            }
            this._bornTime = duration;
        }

        private easeScale(v: number): void {
            this._scale = v;
        }

        private createEase(startTimer: number, duration: number, startValue: number, endValue: number, easeFunc: Function, callbackFunc: Function): void {
            let easeObj: EaseObj = EaseObj.create(startTimer, duration, startValue, endValue, easeFunc, Handler.create(this, callbackFunc, null, false));
            this._easeObjs[this._easeObjs.length] = easeObj;
        }

        private clearEase(): void {
            for (let obj of this._easeObjs) {
                ObjectPools.free(obj);
            }
            this._easeObjs.length = 0;
        }

        //缩放心跳
        private updateScale(): void {
            if (this.isShowEnd) {
                return;
            }
            let __runtime = this._runTime;
            for (let obj of this._easeObjs) {
                obj.update(__runtime);
            }
        }

        onDraw(diff: number, g: Graphics) {
            this._runTime += diff;
            if (!this.isShowEnd)
                this.updateScale();
            else
                this.isDestroy = true;
            let len = this._textures.length;
            let end = len;
            for (let i = 0; i < end; i++) {
                let texture = this._textures[i];
                if (!texture) continue;
                let index = i;
                let tw: number = texture.sourceWidth;
                let th: number = texture.sourceHeight;
                let matrix = new Laya.Matrix();
                matrix.tx = -tw / 2;
                matrix.ty = -th / 2;
                matrix.scale(this._scale, this._scale);
                matrix.tx += this._curPos.x + 50 * index + (this._haveBaozha && i == 0 ? 150 : 0);
                matrix.ty += this._curPos.y;
                g.drawTexture(texture, 0, 0, tw, th, matrix);
            }
        }

        /**
		 * 进池 （相当于对象dispose函数）
		 */
        intoPool(...arg): void {
            this._easeObjs.length = 0;
            this._textures.length = 0;
            this._runTime = 0;
            this._scale = 0;
        }
		/**
		 * 出池 （相当于对象初始化函数）
		 */
        outPool(...arg): void { };
    }

    class EaseObj implements IPoolsObject {
        poolName: string = 'EaseObj';
        // 开始的时间
        private _startTimer: number;
        // 持续时间
        private _duration: number;
        //结束时间
        private _endTime: number;
        // 初始值
        private _startValue: number;
        // 更改总计
        private _changeValue: number;
        // 缓动函数
        private _easeFunc: Function;
        // 回调函数
        private _hander: Handler;
		/**
		 * 进池 （相当于对象dispose函数）
		 */
        intoPool(...arg): void {
            this.reset();
        }
		/**
		 * 出池 （相当于对象初始化函数）
		 */
        outPool(...arg): void { };

        static create(startTimer: number, duration: number, startValue: number, endValue: number, easeFunc: Function, hander: Handler): EaseObj {
            let obj = ObjectPools.malloc(EaseObj) as EaseObj;
            obj.create(startTimer, duration, startValue, endValue, easeFunc, hander);
            return obj;
        }

        create(startTimer: number, duration: number, startValue: number, endValue: number, easeFunc: Function, hander: Handler): void {
            this._startTimer = startTimer;
            this._duration = duration;
            this._endTime = this._startTimer + this._duration;
            this._startValue = startValue;
            this._changeValue = endValue - startValue;
            this._easeFunc = easeFunc;
            this._hander = hander;
        }

        update(runtime: number): void {
            if (!this._easeFunc) return;
            if (runtime < this._startTimer) {
                // 还没开始
                return;
            }
            if (runtime > this._endTime) {
                // 结束了
                return;
            }
            let v = this._easeFunc(runtime - this._startTimer, this._startValue, this._changeValue, this._duration);
            this._hander.runWith(v);
        }

        reset(): void {
            this._easeFunc = null;
            if (this._hander) {
                this._hander.recover();
                this._hander = null;
            }
        }
    }
}