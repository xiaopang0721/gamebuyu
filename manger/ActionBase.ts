/**
* name 
*/
module gamebuyu.manager {
    interface ActionTimer {
        delay?: number;				// 延迟多久执行
        repeatCount?: number;		// 重复次数
        arg?: any;					// 回调参数
        func: (arg?: any) => void;	// 回调函数		

        __prevTime?: number;			// 上次执行时间
        __currentCount?: number;		// 执行次数
    }

    export class ActionBase {
        isFinal: boolean;
        timers: Array<ActionTimer>;

        // 收尾回调
        public onFinalize: () => boolean;

        constructor() {
            this.isFinal = false;
            this.timers = [];
        }

        // 增加定时器
        protected addTimer(t: ActionTimer): ActionTimer {
            // 重复次数至少是1次
            if (t.delay == null) t.delay = 0;
            if (t.repeatCount == null) t.repeatCount = 1;
            t.__prevTime = 0;
            t.__currentCount = 0;
            return t;
        }

        // 更新定时器
        protected updateTimer(deltaTime: number) {
            let len: number = this.timers.length;
            for (let i = 0; i < len; i++) {
                let timer = this.timers[i];

                timer.__prevTime += deltaTime;
                if (timer.__prevTime >= timer.delay) {
                    timer.__prevTime -= timer.delay;
                    timer.__currentCount += 1
                    timer.func(timer.arg);
                }

                // 移除定时器
                if (timer.__currentCount >= timer.repeatCount) {
                    this.timers.splice(i, 1);
                    i = i <= 0 ? 0 : i - 1;
                    len = this.timers.length;
                }
            }
        }

        // 删除定时器
        protected remoteTimer(t: ActionTimer): boolean {
            let len: number = this.timers.length;
            for (let i = 0; i < len; i++) {
                let ele = this.timers[i];
                if (ele == t) {
                    this.timers.splice(i, 1);
                    return true;
                }
            }
            return false;
        }

        // 初始化，返回子类是否有继续执行的必要
        public initialize(): boolean {
            return true;
        }

        // 释放
        public finalize(): boolean {
            this.isFinal = true;
            if (this.onFinalize != null) {
                this.onFinalize()
                this.onFinalize = null;
            }
            return true;
        }

        // -- 返回true行为执行完毕 
        public update(deltaTime: number): boolean {
            this.updateTimer(deltaTime);
            return true;
        }
    }

    // 移动栈
    // @target		有值时追踪目标
    // @distance 	接近距离
    export class ActionMoveTarget extends ActionBase {
        private _owner: Fish;
        private _target: Vector2;
        private _endTime: number;

        constructor(owner: Fish, target: Vector2) {
            super();
            this._owner = owner;
            this.setTarget(target);
        }

        // 更新到新的移动目标
        private setTarget(target: Vector2) {
            let distance: number = Vector2.temp.set(this._owner.pos).sub(target).len;
            this._endTime = this._owner.sceneObjectMgr.game.sync.serverTimeBys + distance / this._owner.moveSpeed;
            if (!this._target) {
                this._target = target.clone();
            }
            else {
                this._target.set(target);
            }
        }

        clearTarget() {
            this._endTime = 0;
            this._target = null;
        }

        public update(deltaTime: number): boolean {
            super.update(deltaTime);
            if (this._target == null)
                return true;
            if (this._owner.pos.dist(this._target) < this._owner.moveSpeed / 30) {
                return true;
            }
            Vector2.temp.set(this._target).sub(this._owner.pos);
            this._owner.turnToward(Vector2.temp);
            if (this._endTime > this._owner.sceneObjectMgr.game.sync.serverTimeBys) {
                return false;
            }

            return true;
        }

        finalize(): boolean {
            this._owner = null;
            this._target = null;
            return super.finalize();
        }
    }

    export class ActionMovePath extends ActionBase {
        private _owner: Fish;
        private _path: Array<Vector2>;

        constructor(owner: Fish, path: Array<Vector2>) {
            super();
            this._owner = owner;
            this._path = path;
        }

        public update(deltaTime: number): boolean {
            super.update(deltaTime);
            if (!this._path || !this._path.length)
                return true;

            this._owner.actionManager.push(new ActionMoveTarget(this._owner, this._path.shift()));
            return false;
        }

        finalize(): boolean {
            this._owner = null;
            this._path = null;
            return super.finalize();
        }

    }
}
