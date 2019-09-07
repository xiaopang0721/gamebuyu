/**
* 机器蛇行为管理器 
*/
module gamebuyu.manager {

    export class ActionManager {
        private _actions: Array<ActionBase> = [];
        constructor() {
        }

        get isEmpty(): boolean {
            return !this._actions.length;
        }

        // 行为更新
        public updateActions(deltaTime: number) {
            //--取得栈顶进行心跳
            let top: number = this._actions.length - 1;
            let action: ActionBase = this._actions[top];
            if (action != null && action.update(deltaTime)) {
                action.finalize();
                this._actions.splice(top, 1);
            }
        }

        // 执行行为
        public exec(action: ActionBase) {
            this.clear();
            this._actions.push(action);
        }

        // 插入行为
        public push(action: ActionBase) {
            this._actions.push(action);
            //-- 如果初始化失败，则移除
            if (!action.initialize()) {
                action.finalize();
                this._actions.splice(this._actions.length - 1, 1);
            }
        }

        // 清理
        clear(): void {
            let len = this._actions.length;
            if (len > 0) {
                for (let i = len; i > 0; i--) {
                    let element = this._actions[i - 1];
                    element && element.finalize();
                }
                this._actions.length = 0;
            }
        }
    }
}