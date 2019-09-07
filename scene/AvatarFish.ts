/**
* name 
*/
module gamebuyu.scene {
    // 动作
    const FISH_ACTION_MOVE = 1;
    const FISH_ACTION_LEISURE = 2;
    const FISH_ACTION_BEATEN = 3;
    const FISH_ACTION_DIE = 4;
    const FISH_ACTION_BOTTOM = 5;
    const FISH_ACTION_TOP = 6;
    const FISH_ACTION_TOPADD = 7;

    const FISH_ACTION = {
        1: 'move',
        2: 'leisure',
        3: 'beaten',
        4: 'die',
        5: 'bottom',
        6: 'top',
        7: 'topAdd'
    }

    // 死亡时长
    const FADE_DURATION = 1500;
    // 受击时长
    const BEATEN_DURATION = 500;
    // 帧率
    const AVATAR_FRAMERATE = 12;
    // 死亡帧率
    const AVATAR_FRAMERATE_DIE = 30;

    export class AvatarFish extends gamecomponent.scene.AvatarBase {
        private _fish: Fish;
        get fish(): Fish {
            return this._fish;
        }

        protected _oid: number;
        get oid(): number {
            return this._oid;
        }

        //是否BOSS鱼
        private _isBoss: boolean = false;
        //鱼的缩放比例
        private _fish_scale: number = 0;
        protected _entry: number = 0;
        private _fishTemp: any;
        //是否死亡展示爆金币
        private _isPlayGold: boolean = false;
        set entry(v: number) {
            if (this._entry == v) {
                return;
            }
            for (let key in this._assets) {
                let refAsset = this._assets[key];
                if (refAsset instanceof RefAsset) {
                    // logd("AvatarFish clear:" + key + " " + ref.url);
                    refAsset.release();
                    this._assets[key] = null;
                }
            }
            this.resetFade();
            this._fishTemp = this._fish ? this._fish.fishTemp : null;
            if (this._fishTemp) {
                this.showOrder = this._fishTemp.show_order;
                this._showDead = this._fishTemp.show_dead != 0;
                this._fish_scale = this._fishTemp.fish_scale * 0.01;
                let groupID = this._fish.groupID;
                let fishIndex = this._fish.position;
                let groupTemp = groupID ? FishGroupPathManager.getFishGroupTempById(groupID) : null;
                if (groupTemp && (groupTemp.group_typ == 4 || groupTemp.group_typ == 6 && groupTemp.boss > 0 && fishIndex == groupTemp.boss - 1) && !this._effectTexture) {
                    this._groupType = groupTemp.group_typ;
                    this.initEffectTexture();
                    //一网打尽 和 首领鱼要播放爆金币
                    this._isPlayGold = true;
                } else if (groupTemp && groupTemp.group_typ == 8) {
                    this._isBoss = true;
                }
                if (this._fishTemp.show == 1)
                    this._isPlayGold = true;
                this.initShadowTexture();

                if (this._fishTemp.type == 2) {
                    // this._needBottomTex = true;
                    this._needTopTex = true;
                } else {
                    this._needBottomTex = this._fishTemp.b_effect == 1;
                    this._needTopTex = this._fishTemp.t_effect == 1;
                    this._needTopAddTex = this._fishTemp.t_overlay == 1;
                    this._needStar = this._fishTemp.t_tuowei == 1;
                }
            }
            else {
                this.showOrder = 0;
                this._showDead = false;
                this._fish_scale = 0;
                this._isBoss = false;
                this._needBottomTex = false;
                this._needTopTex = false;
                this._needTopAddTex = false;
                this._needStar = false;
                this._needCircle = false;
            }

            this._textures = {};
            // 移除碰撞点
            this.removeHitPoints();

            this._entry = v;
            if (this._entry) {
                this.loadTexture();
                if (this._needBottomTex)
                    this.loadTexture(FISH_ACTION_BOTTOM);
                if (this._needTopTex)
                    this.loadTexture(FISH_ACTION_TOP);
                if (this._needTopAddTex)
                    this.loadTexture(FISH_ACTION_TOPADD);
                // if (this._needStar) {
                // 	this.loadTexture3(Path.custom_atlas_scene + "goldFish.atlas", Path.scene + "goldFish/", (arr) => {
                // 		this._starEffectTexures = arr;
                // 	});
                // }
                // 初始化碰撞数据
                this.initHitData();
                // 如果没数据使用自动碰撞点
                if (!this._hitData) {
                    if (!this._autoHitPoint) {
                        this._autoHitPoint = new Vector2GridObject();
                        this._autoHitPoint.owner = this._fish;
                        this._fish.buyuStory.gridMgr.addObject(this._autoHitPoint);
                    }
                }
                else {
                    for (let point of this._hitData) {
                        let hitPoint = point.clone();
                        hitPoint.radius = point.radius;
                        hitPoint.owner = this._fish;
                        this._fish.buyuStory.gridMgr.addObject(hitPoint);
                        this._hitPoints.push(hitPoint);
                    }
                }
            }
        }

        // 显示排序
        private _showOrder: number = 0;
        private set showOrder(v: number) {
            this._showOrder = v;
            this.updateSortScore();
        }

        // 死亡效果
        private _showDead: boolean = false;

        protected _name: string;


        // 动作
        private _action: number;
        get action(): number {
            return this._action;
        }
        set action(v: number) {
            if (this._action == v) {
                return;
            }
            this._action = v;
            this.loadTexture2(this._action);
            // 重置消失信息
            this.resetFade();
        }

        // 是否被打
        private _hasBeaten: boolean = false;

        // 视图旋转角度
        private _angle: number = 0;
        // 消失时间
        private _fadeTime: number;
        // 是否可见
        get visible(): boolean {
            if (!this._fish || !this._fish.visible) return false;
            return this._fish.waitBorn ? false : this._visible;
        }

        set visible(v) {
            this._visible = v;
        }

        private _effectTexture: Texture;
        private _effectWidth: number = 0;
        private _effectHeight: number = 0;
        private _shadowTexture: Texture;
        private _shadowWidth: number = 0;
        private _shadowHeight: number = 0;
        private _starEffectTexures: Texture[];
        private _groupType: number;

        constructor(g: Game, v: Fish) {
            super(g);
            this._fish = v;
            this._oid = this._fish.unit.oid;
            this._fishTemp = this._fish.fishTemp;
            let name = this._fishTemp ? this._fishTemp.name : L.GetLang(125);
            this._name = "G:" + this._fish.groupID + " L:" + this._fish.lineID + " N:" + name;

            this._sortScore = 10;

            this._frameRate = AVATAR_FRAMERATE;
            this._assets = [];
            this._textures = {};
            this.update(0);
        }

        private updateSortScore(): void {
            this._sortScore = 10 + this._showOrder * 10 + this._action;
        }

        // 素材
        private _assets: { [key: number]: RefAsset };
        // 加载贴图
        private loadTexture(key?: number) {
            if (key) {
                this.loadTexture2(key);
            }
            else {
                this.loadTexture2(FISH_ACTION_MOVE);
                // this.loadTexture2(FISH_ACTION_DIE);
            }
        }
        private loadTexture2(key: number) {
            let refAsset = this._assets[key];
            if (!refAsset) {
                let url = Path_game_buyu.custom_atlas_fish + this._entry.toFixed(0) + '/' + FISH_ACTION[key] + '.atlas';
                refAsset = RefAsset.Get(url);
                refAsset.retain();
                this._assets[key] = refAsset;
                if (!refAsset.parseComplete) {
                    refAsset.once(LEvent.COMPLETE, this, () => {
                        this.loadTexture2Over(key);
                    });
                }
            }
            if (refAsset.parseComplete) {
                this.loadTexture2Over(key);
            }
        }
        private loadTexture2Over(key): void {
            if (this._action == key) {
                // 让显示失效
                this.drawInfoInvalided = true;
            }
            else {
                switch (key) {
                    case FISH_ACTION_BOTTOM:
                        this._texturesBottom = this.cacheTexures(this.getFishTxePreUrl(FISH_ACTION_BOTTOM));
                        break;
                    case FISH_ACTION_TOP:
                        this._texturesTop = this.cacheTexures(this.getFishTxePreUrl(FISH_ACTION_TOP));
                        break;
                    case FISH_ACTION_TOPADD:
                        this._texturesTopAdd = this.cacheTexures(this.getFishTxePreUrl(FISH_ACTION_TOPADD));
                        break;
                }
            }
        }
        private getFishTxePreUrl(key): string {
            return Path_game_buyu.fish + this._entry.toFixed(0) + '/' + FISH_ACTION[key] + "/";
        }

        private loadTexture3(url: string, preUrl: string, callFun: Function) {
            let refAsset = this._assets[url];
            if (!refAsset) {
                refAsset = RefAsset.Get(url);
                refAsset.retain();
                this._assets[url] = refAsset;
                if (!refAsset.parseComplete) {
                    refAsset.once(LEvent.COMPLETE, this, () => {
                        this.loadTexture3Over(refAsset, url, preUrl, callFun);
                    });
                }
            }
            if (refAsset.parseComplete) {
                this.loadTexture3Over(refAsset, url, preUrl, callFun);
            }
        }
        private loadTexture3Over(refAsset: RefAsset, url: string, preUrl: string, callFun: Function): void {
            let arr: any = this.cacheTexures(preUrl);
            callFun && callFun(arr);
        }

        //初始化特效贴图
        private initEffectTexture(): void {
            let url;
            if (this._groupType == 6)
                url = Path_game_buyu.scene_single + 'tu_sly.png';
            else if (this._groupType == 4)
                url = Path_game_buyu.scene_single + 'tu_ywdj.png';
            this._effectTexture = url ? Loader.getRes(url) : null;
            if (this._effectTexture) {
                this._effectWidth = this._effectTexture.sourceWidth;
                this._effectHeight = this._effectTexture.sourceHeight;
            }
        }

        //初始化阴影贴图
        private initShadowTexture(): void {
            this._shadowTexture = Loader.getRes(Path_game_buyu.scene_single + "shadow.png");
            if (this._shadowTexture) {
                this._shadowWidth = this._shadowTexture.sourceWidth;
                this._shadowHeight = this._shadowTexture.sourceHeight;
            }
        }

        // 碰撞数据
        private _hitData: Array<Vector2GridObject>;
        private _autoHitPoint: Vector2GridObject;
		/**
		 * 自动碰撞点
		 */
        get autoHitPoint(): Vector2GridObject {
            return this._autoHitPoint;
        }
        private _hitPoints: Array<Vector2GridObject> = [];
		/**
		 * 自定义碰撞点
		 */
        get hitPoints(): Array<Vector2GridObject> {
            return this._hitPoints;
        }
        // 初始化碰撞数据
        private initHitData(): void {
            this._hitData = null;
            // TODO碰撞数据 从模板里取
            let template = FishGroupPathManager.getCollisionTempById(this._fish.entryid);
            if (template) {
                let hitValue: Array<number> = template.points;

                let data = [];
                let len = hitValue.length / 3;
                for (let i = 0; i < len; i++) {
                    let sidx = i * 3;
                    let point = new Vector2GridObject(hitValue[sidx], hitValue[sidx + 1]);
                    point.radius = hitValue[sidx + 2];
                    data.push(point);
                }
                if (data.length) {
                    this._hitData = data;
                }
            }
        }
		/**
		 * 更新碰撞信息
		 * @param idx 
		 */
        updateHitPoint(radius: number): void {
            this._autoHitPoint.radius = radius * this._scale;
            this._autoHitPoint.set(this._pos);
        }
		/**
		 * 更新碰撞信息
		 * @param idx 
		 */
        updateHitPoints(flipV: boolean): void {
            if (!this._hitData || !this._hitPoints) return;
            let pi2: number = Math.PI / 2;
            let pi3: number = pi2 * 3;
            let len = this._hitPoints.length;
            let matrix = new Laya.Matrix();
            for (let i = 0; i < len; i++) {
                let point = this._hitPoints[i];
                let hiteData = this._hitData[i];
                point.radius = hiteData.radius * this._scale;
                matrix.identity();
                matrix.tx = hiteData.x;
                matrix.ty = hiteData.y;
                matrix.scale(this._scale, this._scale);
                if (this._angle > pi2 && this._angle < pi3) {
                    matrix.scale(1, -1);
                }
                if (flipV) {//反向计算
                    matrix.rotate(-this._angle);
                    matrix.scale(1, -1);
                }
                else {
                    matrix.rotate(this._angle);
                }
                point.x = matrix.tx + this._pos.x;
                point.y = matrix.ty + this._pos.y;
            }
        }

        private _updateGridTime: number = 0;
        // 更新网格位置
        private updateGrid(diff: number): void {
            this._updateGridTime -= diff;
            if (this._updateGridTime > 0) {
                return;
            }
            // 500毫秒更新一次
            this._updateGridTime += 500;
            if (this._autoHitPoint) {
                // 更新网格位置
                this._fish.buyuStory.gridMgr.updateObject(this._autoHitPoint);
            }
            else {
                // 移除多余的
                let pointsLen = this._hitPoints.length;
                for (let i = 0; i < pointsLen; i++) {
                    this._fish.buyuStory.gridMgr.updateObject(this._hitPoints[i]);
                }
            }
        }

        update(diff: number): void {
            if (!this._fish || !this.visible) {
                return;
            }
            this.entry = this._fish.entryid;
            // 更新位置
            this._pos.set(this._fish.pos);
            let realScale = this._fish_scale != 0 ? (this._fish.scale * this._fish_scale) : this._fish.scale;
            //被玩家杀死的鱼才播放特效
            if (this._fish.isDied && this._fish.killer && this._showDead) {
                // 死亡放大
                this._scale = realScale * 1.5;
                this._angle += Math.PI / 300 * diff;
            }
            else {
                // 更新缩放
                this._scale = realScale;
                // 更新方向
                this._angle = this._fish.angle;
            }
            // 更新动画帧
            this._frameCurIdx = this.getCurrentIdx() + 1;
            // 更新动作
            this.updateAction(diff);
            this._hasBeaten = false;
            if (this._fish.isDied) {
                //！！！！特殊修改，如果不是被玩家打死的鱼让他继续游吧
                // if (this._fish.killer) {
                if (this.getfadeing()) {
                    // 消失过程中
                    this.updateFade(diff);
                }
                else {
                    // 死亡动作播放结束后触发消失
                    this.startFade();
                }
                // }
                // 移除碰撞
                this.removeHitPoints();
            }
            else {
                // 更新碰撞
                this.updateGrid(diff);
                // 是否受击中
                this._hasBeaten = this._fish.lastBeatenTime + BEATEN_DURATION > Laya.timer.currTimer;
            }
        }

        // 重置消失信息
        private resetFade(): void {
            this._fadeTime = -1;
        }

        // 开始消失
        private startFade(): void {
            this._fadeTime = FADE_DURATION;
            // logd("startFade")
        }

        // 结束消失
        private endFade(): void {
            this.resetFade();
            this._fish.dieEnd();
        }

        // 是否消失中
        private getfadeing(): boolean {
            return this._fadeTime != -1;
        }

        // 更新消失信息
        private updateFade(diff: number) {
            this._fadeTime -= diff;
            if (this._fadeTime < 0) {
                this.endFade();
            }
        }

        // 更新动作
        protected updateAction(diff: number): void {
            if (!this._fish) return;
            if (this._fish.isDied) {
                // 死亡优先级最高
                this._runTime = this._runTime % this._totalTime;
                this._loop = false;
            }
            this.action = FISH_ACTION_MOVE; // 只有移动动作
        }

        /*是否播放进行中*/
        protected isActionPlaying(): Boolean {
            return this._runTime < this._totalTime || this._drawInfoInvalided;
        }

        /*启用休闲动作*/
        private _enableLeisureAction: Boolean = false;
        /*下一次休闲动作启动的时间*/
        private _nextLeisureStartTime: number = 0;

        // 随机播放休闲动作
        protected ranLeisureAction(): boolean {
            //启用休闲动作，则随机时间+ 随机动作，随机方向
            if (this._enableLeisureAction && Laya.timer.currTimer > this._nextLeisureStartTime) {
                //随机下一次启动的时间
                this._nextLeisureStartTime = MathU.randomRange(5000, 10000) + Laya.timer.currTimer;
                return true;
            }
            return false;
        }


        /////////////////// 基础动作信息开始 ///////////////////
        /*显示失效标志*/
        private _drawInfoInvalided: boolean;
        private set drawInfoInvalided(v: boolean) {
            this._drawInfoInvalided = v;
            v && this.updateSortScore();
        }
        // 贴图信息
        // protected _textures: Array<Texture>;
        private _texturesBottom: { [key: string]: Texture };
        private _texturesTop: { [key: string]: Texture };
        private _texturesTopAdd: { [key: string]: Texture };
        private _needBottomTex: boolean = false;
        private _needTopTex: boolean = false;
        private _needTopAddTex: boolean = false;
        private _needStar: boolean = false;
        private _needCircle: boolean = false;
        /*最后一次绘制到现在的时间*/
        private _runTime: number = 0;
        // 是否循环
        protected _loop: boolean = true;
        /*帧率*/
        private _frameRate: number = 1;
        /*帧时间 帧/ms*/
        private _frameTime: number = 0;
        /*帧数量*/
        private _frameCount: number = 0;
        /*动画最后一帧索引*/
        private _frameLastIdx: number = 0;
        // 动画当前帧
        private _frameCurIdx: number = 0;
        /*动画总时间*/
        private _totalTime: number = 0;
        /*速度*/
        private _animationSpeed: number = 1.0;
        get animationSpeed(): number {
            return this._animationSpeed;
        }
        set animationSpeed(value: number) {
            if (this._animationSpeed == value) {
                return;
            }
            this._animationSpeed = value;
            this._runTime = this._frameCurIdx ? this._frameCurIdx * this._frameTime : 0;
            //计算出每帧的消耗时间
            this._frameTime = 1000 / this._frameRate * this._animationSpeed;
            //完整动画时长
            this._totalTime = this._frameTime * this._frameCount;
        }

        // 获得当前帧
        protected getCurrentIdx(): number {
            // if (this._fish.isDied){
            // 	// 死的最后一帧
            // 	return this._frameLastIdx;
            // }
            if (this._loop || (this._runTime < this._totalTime)) {
                //获得无限完整动画循环之后剩余的时间
                let frameYu: number = this._runTime % this._totalTime;
                //定位到帧位置
                let idx: number = Math.floor(frameYu / this._frameTime);
                if (isNaN(idx)) return 1;
                if (idx >= this._frameCount)
                    return this._frameLastIdx;
                return idx;
            }

            // 最后一帧
            return this._frameLastIdx;

        }

        // 绘制信息计算 
        protected drawInfoCalculate(): void {
            let ref = this._assets[this._action];
            if (!ref || !ref.parseComplete) {
                return;
            }
            this._drawInfoInvalided = false;
            // 获取贴图
            let textures: { [key: string]: Texture } = this.cacheTexures(this.getFishTxePreUrl(this._action));
            if (!textures) return;

            // 重置绘制时间 TODO看是否需要计算已消耗得时间
            this._runTime = 0;
            this.animationSpeed = 0;
            this._loop = false;
            this._frameCount = 0;
            this._frameLastIdx = 0;

            if (!textures || textures == {}) {
                return;
            }
            this._textures = textures;

            // 设置帧长
            this._frameCount = Object.keys(this._textures).length;
            this._frameLastIdx = this._frameCount - 1;
            this._frameCurIdx = 0;
            // this._frameCurIdx2 = 0;
            // 移动动作需要循环播放
            this._loop = this._action == FISH_ACTION_MOVE;
            this.animationSpeed = this._fish.speedScale;
        }

        //缓存纹理
        private cacheTexures(preUrl: string): { [key: string]: Texture } {
            // 获取贴图
            let textures: { [key: string]: Texture } = {};
            let texture: Texture;
            let idx = 1;
            do {
                let url = preUrl + idx + '.png';
                texture = Loader.getRes(url);
                if (texture) {
                    textures[idx.toString()] = texture;
                    idx++;
                }
                else {
                    break;
                }
            }
            while (true);

            return textures;
        }

        // 绘制
        onMultiDraw(diff: number, gArr: Graphics[], scene: SceneRoot): void {
            //运行时间累计
            if (!this._fish || this._fish.entryid <= 0 || !this._fish.sceneObjectMgr.mapInfo) {
                return;
            }
            this._runTime += diff;

            if (!this.visible) return;
            let bg: Graphics = gArr[0];
            let fg: Graphics = gArr[1];
            let pg: Graphics = gArr[2];
            let ng: Graphics = gArr[3];
            let hg: Graphics = gArr[4];
            //绘制信息是否失效
            if (this._drawInfoInvalided) {
                this.drawInfoCalculate();
            }

            // 绘制
            let drawX: number = scene.camera.getScenePxByCellX(this._pos.x);
            let drawY: number = scene.camera.getScenePxByCellY(this._pos.y);

            // 碰撞信息
            // let rect = this._hitRect;
            // rect.setTo(0, 0, 0, 0);

            let texture = this._textures[this._frameCurIdx];
            if (!texture) {
                isShowDebug && this.drawNotTexture(ng, hg, scene, drawX, drawY, this._angle, this._scale);
                return;
            }
            let tsw: number = texture.sourceWidth;
            let tsh: number = texture.sourceHeight;
            let tw: number = texture.width;
            let th: number = texture.height;

            // rect.width = texture.width * this._scale;
            // rect.height = texture.height * this._scale;
            // rect.x = drawX;
            // rect.y = drawY;

            // 更新一下碰撞数据
            if (this._autoHitPoint) {
                this.updateHitPoint(Math.max(tw, th) / 2);
            }
            else {
                this.updateHitPoints(scene.camera.flipV);
            }
            // 播放速度
            this.animationSpeed = this._fish.speedScale;

            //绘制特效
            this.drawEffect(bg, ng, texture, tsw, tsh, drawX, drawY);

            //底层特效
            let textureBottom = this._texturesBottom ? this._texturesBottom[this._frameCurIdx] : null;
            if (textureBottom) {
                let scale = this._fishTemp.type == 3 ? 2 : 1;
                let tbsw: number = textureBottom.sourceWidth * scale;
                let tbsh: number = textureBottom.sourceHeight * scale;
                fg.drawTexture(textureBottom, 0, 0, tbsw, tbsh, this.getMatrix(scene, textureBottom, tbsw, tbsh, drawX, drawY, .5));
            }
            // 绘制形象
            if (this._hasBeaten) {
                this.drawBeaten(fg, drawX, drawY, texture, tsw, tsh, tw, th, scene);
            }
            else {
                //实体
                fg.drawTexture(texture, 0, 0, tsw, tsh, this.getMatrix(scene, texture, tsw, tsh, drawX, drawY, .5));
            }
            //顶层叠加特效
            // let textureTopAdd = this._texturesTopAdd ? this._texturesTopAdd[this._frameCurIdx] : null;
            // if (textureTopAdd && main.canShowFishEffect) {
            // 	let ttasw: number = textureTopAdd.sourceWidth;
            // 	let ttash: number = textureTopAdd.sourceHeight;
            // 	let args = fg.drawTexture(textureTopAdd, 0, 0, ttasw * 2, ttash * 2, this.getMatrix(scene, textureTopAdd, ttasw, ttash, drawX, drawY));
            // 	if (fg.cmds[fg.cmds.length - 1] == args) {
            // 		fg.cmds.pop();
            // 		args.unshift(args['callee'])
            // 		fg._saveToCmd(this.customRenderAdd, args);
            // 	}
            // }
            //顶层特效
            let textureTop = this._texturesTop ? this._texturesTop[this._frameCurIdx] : null;
            if (textureTop) {
                let scale = this._fishTemp.type == 3 ? 2 : 1;
                let ttsw: number = textureTop.sourceWidth * scale;
                let ttsh: number = textureTop.sourceHeight * scale;
                fg.drawTexture(textureTop, 0, 0, ttsw, ttsh, this.getMatrix(scene, textureTop, ttsw, ttsh, drawX, drawY, .5));
            }

            if (this._fish.isDied) {
                if (this._frameRate != AVATAR_FRAMERATE_DIE) {
                    this._frameRate = AVATAR_FRAMERATE_DIE;
                    this._animationSpeed = 0;
                }
                // if (this._fish.killer && this._isPlayGold) {
                //     this.drawGold(bg, drawX, drawY, diff);
                //     // this.drawGoldLine(bg, drawX, drawY);
                // }
            } else {
                if (this._frameRate != AVATAR_FRAMERATE) {
                    this._frameRate = AVATAR_FRAMERATE;
                    this._animationSpeed = 0;
                }
                if (this._needStar) {
                    this.drawStarEffect(scene, fg, texture, tsw, tsh, drawX, drawY);
                }
                // let diffY = tsh / 2 + 5;
                // diffY += 45;
                // this.drawShadow(bg, drawX, drawY, diffY, scene);
            }

            if (isShowDebug) {
                // 调试信息
                this.drawHitPoints(diff, pg, scene);
                this.drawName(ng, null, scene, drawX, drawY, 0, 0.2, 20);
                if (FishGroupPathManager.DEBUG_LINES.indexOf(this._fish.lineID) >= 0)
                    this.drawLine(ng, scene);
            }
        }

        //鱼身变形
        private getMatrix(scene, texture, tsw, tsh, drawX, drawY, rate: number = 1): Matrix {
            let matrix: Laya.Matrix = new Laya.Matrix();
            matrix.tx = - tsw * rate;
            matrix.ty = - tsh * rate;
            matrix.scale(this._scale, this._scale);
            let pi2: number = Math.PI / 2;
            if (this._angle > pi2 && this._angle < pi2 * 3) {
                if (this._fishTemp && this._fishTemp.type == 7)
                    this._angle -= Math.PI;
                else
                    matrix.scale(1, -1);
            }
            if (scene.camera.flipV) {
                matrix.scale(1, -1);
            }
            matrix.rotate(this._angle);
            if (scene.camera.flipV) {
                matrix.scale(1, -1);
            }
            matrix.tx += drawX;
            matrix.ty += drawY;
            return matrix;
        }

        //叠加效果
        private customRenderAdd(x, y, cmd): void {
            let func: Function = cmd.shift();
            let webGLContext = laya.renders.Render.context.ctx as Laya.WebGLContext2D;
            let oldBlendType = webGLContext.globalCompositeOperation;
            let curBlendType = Laya.BlendMode.ADD;
            curBlendType && (webGLContext.globalCompositeOperation = curBlendType);
            if (func instanceof Function && func.apply instanceof Function)
                func.apply(this, [x, y, cmd]);
            curBlendType && (webGLContext.globalCompositeOperation = oldBlendType);
        }

        //绘制点点特效
        private drawStarEffect(scene: SceneRoot, fg: Graphics, fishTexture: Texture, tsw: number, tsh: number, fishDrawX: number, fishDrawY: number) {
            if (!this._starEffectTexures) return;//帧率过低
            let len: number = this._starEffectTexures.length;
            if (len <= 0) return;
            let curIndex = Math.floor(this._runTime / this._frameTime) % len;
            let texture = this._starEffectTexures[curIndex];
            if (!texture) return;
            let tw: number = texture.sourceWidth;
            let th: number = texture.sourceHeight;
            let matrix = new Matrix();
            matrix.tx = - tw / 2 - tsw / 4;
            matrix.ty = - th / 2;
            matrix.scale(this._scale, this._scale);
            let pi2: number = Math.PI / 2;
            if (this._angle > pi2 && this._angle < pi2 * 3) {
                matrix.scale(1, -1);
            }
            if (scene.camera.flipV) {
                matrix.scale(1, -1);
            }
            matrix.rotate(this._angle);
            if (scene.camera.flipV) {
                matrix.scale(1, -1);
            }
            matrix.tx += fishDrawX;
            matrix.ty += fishDrawY;
            fg.drawTexture(texture, 0, 0, tw, th, matrix);
        }

        //绘制阴影
        private drawShadow(bg: Graphics, fishDrawX: number, fishDrawY: number, diffY: number, scene: SceneRoot) {
            if (!this._shadowTexture) return;//帧率过低
            let y = scene.camera.height / 3;
            if (fishDrawY + diffY * 0.8 < y) return;
            let dx = fishDrawX - this._shadowWidth / 2;
            let dy = fishDrawY + diffY;
            bg.drawTexture(this._shadowTexture, dx, dy, this._shadowWidth, this._shadowHeight, null, 0.75);
        }

        // 绘制受击
        private _shaderValue: gamebuyu.render.custom.FELightSweepShaderValue;
        private drawBeaten(fg: Graphics, drawX: number, drawY: number, texture: Texture, tsw: number, tsh: number, tw: number, th: number, scene: SceneRoot): void {
            if (!this._shaderValue) {
                this._shaderValue = new gamebuyu.render.custom.FELightSweepShaderValue();
                this._shaderValue.A = 1;
                this._shaderValue.B = .5;
                this._shaderValue.dx = 6;
                this._shaderValue.dy = 0;
                this._shaderValue.radius = .3;
                this._shaderValue.shineFactor = 3;
            }
            // 时间
            this._shaderValue.time = (Laya.timer.currTimer - this._fish.lastBeatenTime) / 1000 % 1;

            // 贴图信息
            this._shaderValue.textureHost = texture;
            this._shaderValue.UV = texture.uv;

            // 画布大小
            let canvasWidth = Laya.Render._mainCanvas.width;
            let canvasHeight = Laya.Render._mainCanvas.height;

            let parent = scene.avatarLayer as Sprite;

            // 大小(全局缩放&换算屏幕比) 注意：顶点映射到全屏的单位为2
            let pivotX = (tsw / 2 - texture.offsetX) / tw;
            let pivotY = (tsh / 2 - texture.offsetY) / th;

            this._shaderValue.v_size[0] = tw * parent.globalScaleX * this._scale / canvasWidth;
            this._shaderValue.v_size[1] = th * parent.globalScaleY * this._scale / canvasHeight;

            // 视图转换
            let pi2: number = Math.PI / 2;
            if (this._angle > pi2 && this._angle < pi2 * 3) {
                this._shaderValue.v_size[1] *= -1;
            }
            // 同步角度
            let angle = scene.camera.flipV ? this._angle : 2 * Math.PI - this._angle;

            // 位置
            let p = Point.TEMP.setTo(drawX, drawY);
            parent.localToGlobal(p);
            // 转换到顶点坐标系
            p.y = -p.y;

            // 换算屏幕比&转UI坐标系&计算锚点
            let w = this._shaderValue.v_size[0] * 2;
            let h = this._shaderValue.v_size[1] * 2;
            this._shaderValue.pos[0] = -1 + p.x / (canvasWidth / 2) + (.5 - pivotX) * w;
            this._shaderValue.pos[1] = 1 + p.y / (canvasHeight / 2) + (-.5 + pivotY) * h;
            // 锚点
            this._shaderValue.pivot[0] = pivotX;
            this._shaderValue.pivot[1] = pivotY;
            // 角度
            this._shaderValue.angle = angle;
            // 屏幕高宽比
            this._shaderValue.aspect_ratio = canvasHeight / canvasWidth;
            // 绘制命令
            fg._saveToCmd(this.customRender, [this._shaderValue]);
        }

        private customRender(x, y, cmd): void {
            let webGLContext = laya.renders.Render.context.ctx as Laya.WebGLContext2D;
            let vertexBuffer = gamebuyu.render.custom.CSprite.getVertexBuffer();
            let indexBuffer = gamebuyu.render.custom.CSprite.getIndexBuffer();
            let shader = gamebuyu.render.custom.FELightSweepShader.shader;
            (typeof webGLContext.setIBVB === 'function') && webGLContext.setIBVB(0, 0, indexBuffer, vertexBuffer, 6, null, shader, cmd[0], 0, 0);
        }

        //绘制黄金鱼死亡
        // private _frameCurIdx2: number;
        // private _goldRunTime: number = 0;
        // private drawGold(fg: Graphics, drawX: number, drawY: number, diff: number): void {
        //     if (this._textureGolds.length <= 0) return;
        //     if (!this._frameCurIdx2) {
        //         this._frameCurIdx2 = this._frameCurIdx;
        //     }
        //     let index = this._frameCurIdx - this._frameCurIdx2;
        //     let texture = this._textureGolds[index];
        //     if (!texture) return;
        //     this._goldRunTime += diff;
        //     let tw: number = texture.sourceWidth;
        //     let th: number = texture.sourceHeight;
        //     let matrix = new Laya.Matrix();
        //     matrix.tx = - tw / 2;
        //     matrix.ty = - th / 2;
        //     matrix.scale(50 * this._goldRunTime / 1000, 50 * this._goldRunTime / 1000);
        //     matrix.tx += drawX;
        //     matrix.ty += drawY;
        //     fg.drawTexture(texture, 0, 0, tw, th, matrix);
        // }

        //播放光纤特效
        private _lineArray = [];
        private drawGoldLine(fg: Graphics, drawX: number, drawY: number): void {

            if (this._lineArray.length <= 0) {
                this.playLine(drawX, drawY);
            }
            //光线
            let len: number = this._lineArray.length;
            for (let i = 0; i < len; i++) {
                let line = this._lineArray[i];
                line.updateTexture();
                line.onDraw(fg);
            }
        }

        private playLine(drawX: number, drawY: number): void {
            //随机区域分散
            let count = 8;
            let angle = 360 / count;
            for (let i = 0; i < count; i++) {
                let startAngle = angle * i;
                let endAngle = angle * (i + 1);
                this.randomLine(startAngle, endAngle, drawX, drawY);
            }
        }

        private randomLine(start: number, end: number, centerX: number, centerY: number): void {
            let count = MathU.randomRange(4, 6);
            for (let i = 0; i < count; i++) {
                //随机旋转
                let rotation = MathU.randomRange(start, end);
                //距离中心点多少半径生成光线
                let radius = 500;
                let d = Math.PI * rotation / 180;
                //出生点
                let sourceX = centerX + radius * Math.cos(d);
                let sourceY = centerY + radius * Math.sin(d);
                let line = ObjectPools.malloc(EffectFrame, null, 7, 12, null) as EffectFrame;
                line.setAssetPath(Path.scene);
                line.setData("line", 12, 1);
                line.setLoop(true);
                line.centrePoint = new Vector2(0, 0);
                line.setOffset(sourceX, sourceY);
                line.setRotation(d);
                let height = MathU.randomRange(-50, 30);
                line.setSize(1280, height);
                this._lineArray[this._lineArray.length] = line;
            }
        }

        //绘制特效
        private drawEffect(fg: Graphics, ng: Graphics, texture: Texture, tsw: number, tsh: number, drawX: number, drawY: number): void {
            if (!this._effectTexture) return;
            let matrix = new Laya.Matrix();
            matrix.tx = - this._effectWidth / 2;
            matrix.ty = - this._effectHeight / 2;
            let scaleW = tsw / this._effectWidth;
            let scaleH = tsh / this._effectHeight;
            let scale;
            let g;
            if (this._groupType == 4) {
                scale = this._fish_scale * (Math.max(scaleW, scaleH) + 0.5);
                matrix.scale(scale, scale);
                matrix.rotate(this._runTime / 1000 % 360);
                g = fg;
            }
            else {
                scale = this._fish_scale * (Math.max(scaleW, scaleH) + .01) * 2;
                matrix.scale(scale, scale);
                g = fg;
            }
            matrix.tx += drawX;
            matrix.ty += drawY;
            g.drawTexture(this._effectTexture, 0, 0, this._effectWidth, this._effectHeight, matrix);
        }

        //绘制路线
        private drawLine(g: Graphics, scene: SceneRoot) {
            let lines = [];
            for (let index = 0; index < this._fish.LinePosList.length; index++) {
                let element = this._fish.LinePosList[index];
                lines.push(scene.camera.getScenePxByCellX(element.x));
                lines.push(scene.camera.getScenePxByCellY(element.y));
            }
            let lineId = this._fish.lineID;
            let color = "#FFFF00";
            for (let i = 0; i < lines.length / 4; i++) {
                let fromX = lines[4 * i + 2];
                let fromY = lines[4 * i + 3];
                let targetX = lines[4 * i];
                let targetY = lines[4 * i + 1];
                let x = (targetX + fromX) / 2;
                let y = (targetY + fromY) / 2;
                g.fillBorderText("LineID:" + lineId, x, y, 20 + "px SimHei", color, color, 1, "center");
            }
            g.drawLines(0, 0, lines, color, 2);
        }

        protected drawNotTexture(g: Graphics, hg: Graphics, scene: SceneRoot, x: number, y: number, ori: number, scale: number): void {
            let size = Math.ceil(scene.sceneFontSize * (scale < 1 ? 1 : scale));
            g.fillBorderText(this._entry + '：缺资源', x, y, size + "px SimHei", "#FF0000", "#000000", 2, "center");
        }

        // 绘制名字
        protected drawName(g: Graphics, hg: Graphics, scene: SceneRoot, x: number, y: number, ori: number, scale: number, headHeight: number): number {
            // 偏移像素
            let offsetY = headHeight * scale + 20;
            let size = 16;//
            // let size = Math.ceil(scene.sceneFontSize * (scale < 1 ? 1 : scale));
            if (this._name) {
                offsetY += size;
                //test 坐标一起打进去
                // name += "|" + this._snake.PosInfo.head.toString();
                g.fillBorderText(this._name + "S:" + this._sortScore + " D:" + this._oid, x, y - offsetY, size + "px SimHei", "#FFFFFF", "#000000", 2, "center");
            }
            return offsetY;
        }

        // 绘制碰撞点
        private drawHitPoints(diff: number, g: Graphics, scene: SceneRoot): void {
            const color = '#00FF00';
            const lineWidth = 2;
            let drawX: number;
            let drawY: number;

            if (this._autoHitPoint) {

                drawX = scene.camera.getScenePxByCellX(this._autoHitPoint.x);
                drawY = scene.camera.getScenePxByCellY(this._autoHitPoint.y);
                g.drawCircle(drawX, drawY, this._autoHitPoint.radius - lineWidth, null, color, lineWidth);
            }
            else {
                for (let element of this.hitPoints) {
                    drawX = scene.camera.getScenePxByCellX(element.x);
                    drawY = scene.camera.getScenePxByCellY(element.y);
                    g.drawCircle(drawX, drawY, element.radius - lineWidth, null, color, lineWidth);
                }
            }
        }

        // 移除碰撞点
        private removeHitPoints(): void {
            if (this._autoHitPoint) {
                this._fish.buyuStory.gridMgr.delObject(this._autoHitPoint);
                this._autoHitPoint = null;
            }
            let pointsLen = this._hitPoints.length;
            for (let i = 0; i < pointsLen; i++) {
                this._fish.buyuStory.gridMgr.delObject(this._hitPoints[i]);
            }
            this._hitPoints.length = 0;
        }

		/**
		 * 鼠标碰撞检测
		 */
        hitTest(x: number, y: number): boolean {
            Vector2.temp.x = x;
            Vector2.temp.y = y;
            let hitPoint = this._autoHitPoint;
            if (hitPoint) {
                return hitPoint.dist(Vector2.temp) < hitPoint.radius;
            }
            let hitPoints = this._hitPoints;
            if (hitPoints && hitPoints.length) {
                for (let point of hitPoints) {
                    if (point.dist(Vector2.temp) < point.radius) {
                        return true;
                    }
                }
            }
            return false;
        }

        clear(checkNow: boolean): void {
            this.entry = 0;
            this._fish = null;
            this._assets = null;
            this._textures = null;
            this._texturesBottom = null;
            this._texturesTop = null;
            this._texturesTopAdd = null;
            this._effectTexture = null;
            this._shadowTexture = null;
            this._starEffectTexures = null;
            this._isBoss = false;
            this._needBottomTex = false;
            this._needTopTex = false;
            this._needTopAddTex = false;
            this._needStar = false;
            if (this._lineArray && this._lineArray.length > 0) {
                for (let line of this._lineArray) {
                    ObjectPools.free(line);
                }
                this._lineArray.length = 0;
            }
            this.resetFade();
            super.clear(checkNow);
        }
    }
}