/**
* 子弹
*/
module gamebuyu.data {
    // 子弹状态
    export const BULLET_STATE_FLY = 1;		// 飞行中
    export const BULLET_STATE_BOMB = 2;		// 爆炸
    export const BULLET_STATE_OUT = 3;		// 消失

    export const BULLET_TYPE_NORMAL: number = 0;//普通子弹
    export const BULLET_TYPE_BOOM: number = 1;//特殊子弹 炸金币
    export const BULLET_TYPE_DANTOU: number = 3;//弹头子弹

    // 子弹飞行速度 逻辑格
    const BULLET_FLY_SPEED = 1000;
    // 张网时间
    const BULLET_ZW_TIME = 150;
    // 消失时间
    const BULLET_OUT_TIME = 500;
    // 子弹超时时间
    const BULLET_TIME_OUT = 8000;

    export class Bullet extends core.obj.GuidObject implements ICollide, ISceneObject {
        static TYPE = 'Bullet';
        isCanClear: boolean;
        lookInCamera: boolean;
        // 场景对象管理器
        protected _sceneObjectMgr: SceneObjectMgr;
        // 碰撞是否单次
        get colloderOnce(): boolean {
            return true;
        }

        private _canColloder: boolean = false;
		/**
		 * 是否可参与碰撞
		 */
        set canColloder(v: boolean) {
            this._canColloder = v;
            if (!v) {
                this._timeout = Laya.timer.currTimer + BULLET_TIME_OUT;
            }
        }

        private _timeout: number;

        // 位置信息
        protected _pos: Vector2GridObject;
        get pos(): Vector2GridObject {
            return this._pos;
        }

        // 朝向
        protected _ori: Vector2;
        set ori(v: Vector2) {
            this._ori.set(v);
            this._angle = this._ori.angle(Vector2.right) + Math.PI;
        }
        get ori(): Vector2 {
            return this._ori;
        }
        private _angle: number;
        get angle(): number {
            return this._angle;
        }

        // 飞行速度
        private _flySpeed: number;
        // 皮肤
        skin: string;
        // 受击效果
        hitSkin: string;
        // 倍率
        valueRate: number = 1;
        //是否是特殊炸金币
        isSpecial: boolean = false;
        // 缩放
        private _scale: number = 1;
        get scale(): number {
            return this._scale;
        }

        // 子弹状态
        private _state: number;
        get state(): number {
            return this._state;
        }
        set state(v: number) {
            if (!this._ownerPlayer) return;
            if (this._state == v) return;
            switch (v) {
                case BULLET_STATE_FLY:
                    // 飞行状态
                    this._scale = 1;
                    this.colliderEnabled = true;
                    break;
                case BULLET_STATE_BOMB:
                    this.colliderEnabled = false;
                    // 爆炸状态
                    this._scale = .1;
                    Laya.Tween.to(this, { '_scale': 1 }, BULLET_ZW_TIME, Laya.Ease.backInOut);
                    Laya.timer.once(BULLET_OUT_TIME, this, () => {
                        this.state = BULLET_STATE_OUT;
                    });
                    break;
                case BULLET_STATE_OUT:
                    if (this._state != v)
                        this.delSlef();
                    break;
            }
            this._state = v;
        }

        // 是否启用碰撞
        protected _colliderEnabled: boolean = false;
        public set colliderEnabled(v: boolean) {
            if (!this._canColloder || this._colliderEnabled == v) {
                return;
            }
            this._colliderEnabled = v;
            if (v) {
                this._gridMgr.addObject(this._pos);
                this._gridMgr.addCollider(this);
            }
            else {
                this._gridMgr.delObject(this._pos);
                this._gridMgr.delCollider(this);
            }
        }

        // 所有者
        protected _owner: number;
        get owner(): number {
            return this._owner;
        }
        protected _ownerPlayer: BuyuPlayer;

        // 目标
        protected _target: number;
        private _buyuMgr: BuyuMgr;
        private _gridMgr: CollideManager;

        constructor(v: SceneObjectMgr) {
            super();
            this._sceneObjectMgr = v;
            this._pos = new Vector2GridObject();
            this._pos.owner = this;
            this._pos.radius = 2; // 子弹碰撞半径2像素
            this._ori = new Vector2();
            this.valueRate = 1;
            this._flySpeed = BULLET_FLY_SPEED;
            this._scale = 1;
            let story = this._sceneObjectMgr.story as BuyuStory;
            this._buyuMgr = story.buyuMgr;
            this._gridMgr = story.gridMgr;
        }

        init(owner: number, x: number, y: number, ori: Vector2, target?: number, isTouch?: boolean): void {
            this._owner = owner;
            this._pos.x = x;
            this._pos.y = y;
            this.ori = ori;
            this._target = target;

            let mainPlayer = this._buyuMgr.mainPlayer;
            if (mainPlayer && this._owner == mainPlayer.unit.oid) {
                this._ownerPlayer = mainPlayer;
            }
            else {
                let player = this._buyuMgr.getPlayeryOid(this._owner);
                if (player instanceof BuyuPlayer)
                    this._ownerPlayer = player;
            }
            this.updateBulletCount(true);

            if (isTouch) {
                this.state = 0;
                let touchTarget: Fish = this._buyuMgr.getFishByOid(this._target);
                if (touchTarget) {
                    this._pos.x = touchTarget.pos.x;
                    this._pos.y = touchTarget.pos.y;
                    this.onBomb(touchTarget);
                    this.state = BULLET_STATE_OUT;
                }
            }
            else {
                this.state = BULLET_STATE_FLY;
            }
        }

        update(diff: number): void {
            switch (this._state) {
                case BULLET_STATE_FLY:
                    if (this._timeout && this._timeout < Laya.timer.currTimer) {
                        this.state = BULLET_STATE_OUT;
                        return;
                    }
                    // 飞行状态向前推进
                    let distance = diff / 1000 * this._flySpeed;
                    this.advance(distance);
                    // 更新网格位置
                    this.updateGrid(diff);
                    break;
                case BULLET_STATE_BOMB:
                    // 爆炸状态
                    break;
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
            this._colliderEnabled && this._gridMgr.updateObject(this._pos);
        }

        // 向前推进
        protected _targetFish: Fish;
        protected advance(distance: number): void {
            let vec = this._pos;
            if (this._target && !this._targetFish) this._targetFish = this._buyuMgr.getFishByOid(this._target);
            if (this._targetFish) {
                if (this._targetFish.isDied) {
                    // 如果追踪目标死了
                    this._targetFish = null;
                    this._target = null;
                    // 转为普通子弹
                    this.canColloder = true;
                    this.colliderEnabled = true;
                }
                else {
                    if (vec.dist(this._targetFish.pos) < distance) {
                        vec.set(this._targetFish.pos);
                        // 炸
                        this.onBomb(this._targetFish);
                        return;
                    }
                    else {
                        // 朝向追踪目标
                        Vector2.temp.set(this._targetFish.pos).sub(vec).normalize();
                        this._ori.set(Vector2.temp);
                    }
                }
            }
            vec.add(Vector2.temp.set(this._ori).mul(distance))
            if (!this._targetFish) {
                // 计算反弹
                let map = this._sceneObjectMgr.mapAssetInfo;
                let lw = this._sceneObjectMgr.game.clientWidth > map.logicWidth ? this._sceneObjectMgr.game.clientWidth : map.logicWidth;
                let lh = this._sceneObjectMgr.game.clientHeight > map.logicHeight ? this._sceneObjectMgr.game.clientHeight : map.logicHeight;
                let diffw = (lw - map.logicWidth) * 0.5;
                let diffh = (lh - map.logicHeight) * 0.5;
                // 计算反弹
                if (vec.x < (0 - diffw)) {
                    vec.x = (0 - 2 * diffw) - vec.x;
                    this._ori.x = -this._ori.x;
                }
                if (vec.y < (0 - diffh)) {
                    vec.y = (0 - 2 * diffh) - vec.y;
                    this._ori.y = -this._ori.y;
                }
                let mw: number = map.logicWidth + diffw;
                if (vec.x > mw) {
                    vec.x = mw * 2 - vec.x;
                    this._ori.x = -this._ori.x;
                }
                let mh: number = map.logicHeight + diffh;
                if (vec.y > mh) {
                    vec.y = mh * 2 - vec.y;
                    this._ori.y = -this._ori.y;
                }
            }
            this.ori = this._ori;
        }

        // 触发碰撞
        OnTriggerEnter2D(go: IGridPosObject): boolean {
            // console.log("OnTriggerEnter2D", go.owner);
            let owner = go.owner;
            if (owner instanceof Fish) {
                this.onBomb(owner);
                return true;
            }
            return false;
        }

        // 炸鱼
        protected onBomb(target: Fish): void {
            if (!target && !this._sceneObjectMgr.mapInfo) return;
            this.state = BULLET_STATE_BOMB;
            let mainPlayer = this._buyuMgr.mainPlayer;

            //特殊处理下弹头
            if (mainPlayer && mainPlayer.unit && this._owner == mainPlayer.unit.oid) {
                !this._sceneObjectMgr.game.isLockGame && this._sceneObjectMgr.game.network.call_fire_at(target.unit.oid);
            }
            else if (this._ownerPlayer && this._ownerPlayer.isRobot && target.unit) {
                !this._sceneObjectMgr.game.isLockGame && this._sceneObjectMgr.game.network.call_robot_fire_at(this._owner, target.unit.oid);
            }
            target.onBeaten();
        }

        private delSlef(): void {
            Laya.timer.clear(this, this.delSlef);
            this.colliderEnabled = false;
            this._target = null;
            this.isSpecial = false;
            this.updateBulletCount(false);
            this._sceneObjectMgr.clearOfflineObject(this);
        }

        private updateBulletCount(isAdd: boolean): void {
            if (!this._ownerPlayer) return;
            isAdd ? this._ownerPlayer.bulletCount++ : this._ownerPlayer.bulletCount--;
        }

        dispose(): void {
            this.colliderEnabled = false;
            this._target = null;
            this._targetFish = null;
            this._ownerPlayer = null;
            Laya.Tween.clearAll(this);
            Laya.timer.clear(this, this.delSlef);
            this._buyuMgr = null;
            super.dispose();
        }

        clear() {
            this.dispose();
        }
    }
}