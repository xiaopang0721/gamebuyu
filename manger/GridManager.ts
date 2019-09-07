module gamebuyu.manager {
	// 网格边长
	const kGridWidth: number = 800;
	// --为了可以1维转2维存储网格，所以定义一下超大的列		
	const kMaxGridColumn: number = 65536;

	/**
	 * 网格对象,除了有网格坐标也包含该网格所有对象
	 */
	export class Grid {
		/**
		 * 2维转1维坐标算法
		 * @param x 
		 * @param y 
		 */
		static makeID(x: number, y: number): number {
			let id: number = y * kMaxGridColumn + x;
			return id;
		}

		id: number;
		objs: Array<IGridPosObject>;
		length: number;
		x: number;
		y: number;

		constructor(id: number, x: number, y: number) {
			this.objs = [];
			this.id = id;
			this.x = x;
			this.y = y;
		}
	}

	/**
	 * 可以作为网格对象具有的属性
	 */
	export interface IGridPosObject {
		x: number;			// 坐标x 来自Vector2
		y: number;			// 坐标y 来自Vector2
		radius: number;		// 半径
		owner: any;			// 所有者对象, 可能是Snake也可能是Food
		grid: any;			// 所在的网格

		updateTick: number;	// 心跳序号

		// 缓存着从该网格找到的对象
		cacheObjs: Array<IGridPosObject>;

		// 求距离的方法
		dist: (other: IGridPosObject) => number;
	}

	export class Vector2GridObject extends core.utils.Vector2 implements IGridPosObject, IPoolsObject {
		// 池名称 
		poolName: string = 'Vector2GridObject';
		/**
		 * 进池 （相当于对象dispose函数）
		 */
		intoPool(...arg): void {
			// this.oid = 0;
			// this.index = 0;
			// this.tag = '';
			this.owner = null;
			isDebug && console.assert(this.grid == null);
			// this.grid = null;
			this.cacheObjs.length = 0;

		}
		/**
		 * 出池 （相当于对象初始化函数）
		 */
		outPool(...arg): void {
			this.x = arg[0];
			this.y = arg[1];
		}

		radius: number;		// 半径
		owner: any;			// 所有者对象, 可能是Snake也可能是Food
		grid: any;			// 所在的网格

		updateTick: number;	// 心跳序号

		// 缓存着从该网格找到的对象
		cacheObjs: Array<IGridPosObject>;

		constructor(x?: number, y?: number) {
			super(x, y);
			this.cacheObjs = [];
		}

		dist(o: any) {
			return super.dist(o);
		}

		clone(): Vector2GridObject {
			return ObjectPools.malloc(Vector2GridObject, null, this.x, this.y) as Vector2GridObject;
		}
	}

	/**
	 * 网格管理器,用于碰撞检测以及蛇的AI
	 */
	export class GridManager {
		private _grids: { [key: number]: Grid; };		// 所有的网格
		private _updateTick: number;		// 每次心跳+1, 用于控制每帧是否需要重新计算

		constructor() {
			this._updateTick = 0;
			this._grids = {};
		}

		/**
		 * addObject 将节点坐标加入网格对象
		 */
		addObject(pos: IGridPosObject) {
			isDebug && console.assert(pos.owner)
			//  --新网格坐标
			let grid: Grid = this.__FindGridByPos(pos.x, pos.y);
			pos.grid = grid;
			isDebug && console.assert(pos.grid != null, L.GetLang(123));
			// 检查一下重复插入
			grid.objs.indexOf(pos) == -1 && (grid.objs[grid.objs.length] = pos);
			// console.log("addObject ", pos.owner.oid, "grid:", grid.x, grid.y);
		}

		/**
		 * updateObject
		 */
		updateObject(pos: IGridPosObject) {
			isDebug && console.assert(pos.grid != null, L.GetLang(124));
			let oldGrid: Grid = pos.grid;

			// 新网格坐标
			let newGrid: Grid = this.__FindGridByPos(pos.x, pos.y)

			if (oldGrid != newGrid) {
				isDebug && console.assert(oldGrid.x != newGrid.x || oldGrid.y != newGrid.y, "updateObject  oldGrid != newGrid");
				// 从老的地方删除
				let index = oldGrid.objs.indexOf(pos);
				if (index >= -1) oldGrid.objs.splice(index, 1);
				pos.grid = null;
				// 加入新的网格
				//TODO:注意检查一下重复插入
				newGrid.objs[newGrid.objs.length] = pos;
				pos.grid = newGrid;

				//console.log("updateObject ",pos.oid, pos.tag, pos.index, "oldGrid:", oldGrid.x, oldGrid.y,  "newGrid:", newGrid.x, newGrid.y);
			}
		}

		/**
		 * delObject 从网格管理器里面移除该对象
		 */
		delObject(pos: IGridPosObject): boolean {
			let grid: Grid = pos.grid;
			if (grid == null)
				return false;
			let idx = grid.objs.indexOf(pos);
			idx != -1 && grid.objs.splice(idx, 1);
			pos.grid = null;
			pos.cacheObjs.length = 0;
			// console.log("delObject ", pos.owner.oid, pos.x, pos.y, "grid:", grid.x, grid.y);
			return true;
		}

		/**
		 * clearCache 心跳计算+1,让缓存失效
		 */
		clearCache() {
			this._updateTick += 1;
		}

		/**
		 * FindObject 传入节点查找,旁边的节点
		 */
		findObject(pos: IGridPosObject, dist: number = 4): Array<IGridPosObject> {
			if (pos.updateTick == this._updateTick && pos.cacheObjs) {
				return pos.cacheObjs;
			}

			let grid: Grid = pos.grid;
			let x: number = grid.x, y: number = grid.y;

			// --离我最近的关节
			// let node:IGridPosObject = null
			// let dist:number = Number.MAX_VALUE;

			let list: Array<IGridPosObject> = pos.cacheObjs;
			list.length = 0;//清空一下
			for (let i = (x == 0 ? x : (x - 1)); i <= x + 1; i++) {
				for (let j = (y == 0 ? y : (y - 1)); j < y + 1; j++) {
					let tempGrid: Grid = this.__CreateGrid(i, j);
					tempGrid.objs.forEach((element, index, object) => {
						isDebug && console.assert(element.grid);
						if (element.owner == null) {
							// logw('网格碰撞节点泄漏', element.tag, element.oid);
							object.splice(index, 1);
						}
						// 不属于自身 并且 如果距离小于1 则记录下来
						else if (pos.owner != element.owner && pos.dist(element) < dist) {
							list.push(element);
						}
					});
				}
			}

			// 缓存检索结果
			pos.updateTick = this._updateTick;

			return list;
		}

		// 根据坐标找到所在的网格
		private __FindGridByPos(x: number, y: number): Grid {
			let gridX: number = Math.floor(x / kGridWidth);
			let gridY: number = Math.floor(y / kGridWidth);
			return this.__CreateGrid(gridX, gridY);
		}

		// 创建或者查找网格对象s
		protected __CreateGrid(gridX: number, gridY: number): Grid {
			let id: number = Grid.makeID(gridX, gridY);
			let grid: Grid = this._grids[id];
			if (grid == null) {
				grid = new Grid(id, gridX, gridY);
				this._grids[id] = grid;
			}
			return grid;
		}
	}
}
