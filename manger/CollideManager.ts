module gamebuyu.manager {
	/**
	 * 碰撞体
	 */
	export interface ICollide {
		/**
		 * 是否单次
		 */
		colloderOnce: boolean;
		/**
		 * 位置
		 */
		pos: IGridPosObject;
		/**
		 * 触发碰撞
		 */
		OnTriggerEnter2D(go: IGridPosObject): boolean;
	}

	/**
	 * 碰撞管理器
	 */
	export class CollideManager extends GridManager {

		private _collides: Array<ICollide>;

		constructor(v: SceneObjectMgr) {
			super();
			this._collides = [];
		}

		// 加入碰撞体
		addCollider(obj: ICollide): void {
			(this._collides.indexOf(obj) == -1) && (this._collides[this._collides.length] = obj);
		}

		// 删除碰撞体
		delCollider(obj: ICollide) {
			let index = this._collides.indexOf(obj);
			if (index >= 0) this._collides.splice(index, 1);
		}


		update(diff: number): void {
			// 让所有的缓存碰撞失效
			this.clearCache();
			for (let collide of this._collides) {
				this.checkCollide(collide);
			}
		}

		// 碰撞检测
		private checkCollide(collide: ICollide) {
			let pos: IGridPosObject = collide.pos;
			isDebug && console.assert(pos.grid);
			let grid: Grid = pos.grid;
			let x: number = grid.x, y: number = grid.y;
			let x0:number = x == 0 ? x : (x - 1);
			let y0:number = y == 0 ? y : (y - 1);
			let x1:number = x + 1;
			let y1:number = y + 1;
			for (let i = x0; i <= x1; i++) {
				for (let j = y0; j < y1; j++) {
					let tempGrid: Grid = this.__CreateGrid(i, j);
					let oLen:number = tempGrid.objs.length;
					for(let k:number = 0; k < oLen; k++){
						let element  = tempGrid.objs[k];
						if(!element) continue;
						isDebug && console.assert(element.grid);
						if (element.owner == null) {
							// logw('网格碰撞节点泄漏', element.owner);
							tempGrid.objs.splice(k, 1);
							k = k <= 0? 0 : k -1;
							oLen = tempGrid.objs.length;
						}
						// 不属于自身 并且碰撞的
						else if (collide != element.owner && pos.dist(element) < pos.radius + element.radius) {
							if (collide.OnTriggerEnter2D(element) && collide.colloderOnce) {
								return;
							}
						}
					}
					// tempGrid.objs.forEach((element, index, object) => {
					// 	isDebug && console.assert(element.grid);
					// 	if (element.owner == null) {
					// 		// logw('网格碰撞节点泄漏', element.owner);
					// 		object.splice(index, 1);
					// 	}
					// 	// 不属于自身 并且碰撞的
					// 	else if (collide != element.owner && pos.dist(element) < pos.radius + element.radius) {
					// 		if (collide.OnTriggerEnter2D(element) && collide.colloderOnce) {
					// 			return;
					// 		}
					// 	}
					// });
				}
			}
		}

		clear(): void {
			this._collides.length = 0;
		}
	}
}
