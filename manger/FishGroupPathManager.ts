/**
* name 
*/
module gamebuyu.manager {
    //鱼碰撞模版接口
    interface tb_fish_collision {
        id: number;
        points: Array<number>;
    }
    // 鱼群模版接口
    interface tb_fish_group {
        id: number;
        group_typ: number;
        long: number;			// 鱼群的长度
        entrys: Array<number>;
        points: Array<number>;
        boss: number;
        along_line: boolean;	// 是否尚着路线行走
        vec2?: Array<Vector2>;
        lines?: Array<number>;
        len_tail: number;
        len_head: number;
    }

    // 鱼群路线
    interface tb_fish_line {
        id: number;
        time: number;
        points: Array<number>;
        speed?: number;
        vec2?: Array<Vector2>;
    }

    export class FishGroupPathManager {
        static DEBUG_LINES: number[] = [];
        private static _tempVec2: Vector2;
        private static _data: Object;
        private static _fishGroupTemp: { [key: number]: any };
        private static _fishCollisionTemp: { [key: number]: any };
        private static _fishLineTemp: any;

        static get data(): Object {
            return this._data;
        }
        static setData(v: Object) {
            this._data = v;
            this._tempVec2 = new Vector2();

            //鱼群模板
            this._fishGroupTemp = {};
            let tb_fish_group = this._data["tb_fish_group"];
            for (let item of tb_fish_group) {
                if (item && item.id) {
                    this._fishGroupTemp[item.id] = item;
                }
            }
            //碰撞模板
            this._fishCollisionTemp = {};
            let tb_fish_collision = this._data["tb_fish_collision"];
            for (let item of tb_fish_collision) {
                if (item && item.id) {
                    this._fishCollisionTemp[item.id] = item;
                }
            }
            //鱼线模板
            this._fishLineTemp = [];
            let tb_fish_line = this._data["tb_fish_line"];
            for (let item of tb_fish_line) {
                if (item && item.id) {
                    this._fishLineTemp[item.id] = item;
                }
            }
        }

		/**
		 * tb_fish_group根据对应id取数据
		 *	id:int	鱼群id
		 *	group_typ:int	鱼群类型
		 *	long:int	鱼的中心点补充长度
		 *	entrys:array	鱼的模版id
		 *	points:array	鱼群坐标
		 *	boss:int	boss序号
		 *	x:int	父级坐标x
		 *	y:int	父级坐标y
		*/
        static getFishGroupTempById(groupID: number): tb_fish_group {
            if (!this._fishGroupTemp) return;
            let fish_group: tb_fish_group = this._fishGroupTemp[groupID] as tb_fish_group;
            if (!fish_group)
                throw new Error("找不到鱼群，groupID：" + groupID);
            if (!fish_group.vec2) {
                fish_group.vec2 = this.updateVector2FromPoints(fish_group.points);
            }
            return fish_group;
        }

		/**
		 * tb_fish_collision根据对应id取数据
		 *	id:int	鱼id
		 *	points:array	碰撞坐标
		
		*/
        static getCollisionTempById(id: number): tb_fish_collision {
            let fish_group: tb_fish_collision = this._fishCollisionTemp[id] as tb_fish_collision;
            // if (!fish_group)
            // throw new Error("找不到鱼碰撞模版，ID：" + id);
            return fish_group;
        }

		/**
		 * tb_fish_line根据对应id取数据
		 *	id:int	路线id
		 *	time:int	路线的时间
		 *	points:array	路线坐标
		 *	x:int	父级坐标x
		 *	y:int	父级坐标y
		*/
        private static getFishLineTempById(lineID: number): tb_fish_line {
            let line: tb_fish_line = this._fishLineTemp[lineID] as tb_fish_line;
            if (!line) return;
            if (!line.vec2) {
                line.vec2 = this.updateVector2FromPoints(line.points);

                // 计算一下速度
                let len: number = 0;
                // 前置节点
                let prev: Vector2 = this._tempVec2.set(line.vec2[0]);
                // 节点数量
                let count: number = line.vec2.length;
                for (let i = 1; i < count; i++) {
                    let cur: Vector2 = line.vec2[i];
                    let cur_len = prev.sub(cur).len;
                    len = len + cur_len;
                    // 设置一下前置节点
                    prev.set(cur);
                }

                // 所有的路程除于耗时,得到速度
                line.speed = len / line.time;
            }
            return line;
        }


		/**
		 * 获取移动路线坐标
		 * @param lineID 
		 */
        static getLinePointsById(lineID: number): number[] {
            // let line:tb_fish_line = Template.getSingeTempDataById(this._data["tb_fish_line"], lineID) as tb_fish_line;
            let line: tb_fish_line = this.getFishLineTempById(lineID);
            return line.points;
        }

		/**
		 * 获取路线的移动速度
		 * @param lineID 
		 */
        static getSpeedFromLineID(lineID: number): number {
            let line: tb_fish_line = this.getFishLineTempById(lineID);
            return line && line.speed;
        }

		/**
		 * 获取路线的时间
		 * @param lineID 
		 */
        static getTimeFromLineID(lineID: number): number {
            let line: tb_fish_line = this.getFishLineTempById(lineID);
            return line.time;
        }

		/**
		 * 鱼群关联路径(测试用)
		 */
        static testGroupRelateLines(): void {
            let arr: Array<Object> = Template.data["tb_fish_group_line"];
            let len: number = arr.length;
            for (let i: number = 0; i < len; i++) {
                let obj: any = arr[i];
                if (!obj) continue;
                let group = this.getFishGroupTempById(obj.group_id);
                if (group) {
                    group.lines = obj.lines_id
                }
            }
        }

        // 从节点数组组织成向量
        private static updateVector2FromPoints(points: Array<number>): Array<Vector2> {
            let vecter2Array = [];
            let plen: number = points.length;
            for (let i = 0; i < plen; i = i + 2) {
                let v: Vector2 = new Vector2(points[i], points[i + 1]);
                vecter2Array[vecter2Array.length] = v;
            }
            return vecter2Array;
        }

        private static buildPath(info: tb_fish_group, index: number, line: tb_fish_line, outPath: Array<Vector2>): void {
            outPath.length = 0;

            // 根据鱼身生成新的出生点(往右边扩展)插入路径
            let l = info.len_head;

            // 如果是沿着路线行走的,则需要补上偏移
            let offsetInGroup = this._tempVec2;
            if (info.along_line) {
                // 沿路线走的话加上偏移
                l += info.vec2[index].len;
                // 如果沿路线移动不需要鱼群偏移
                offsetInGroup.set(Vector2.zero);
            } else {
                offsetInGroup.set(info.vec2[index]);
            }

            let idx: number = 0;
            let startPos = Vector2.right.clone().mul(l);
            startPos.add(line.vec2[0]).add(offsetInGroup);
            outPath[idx] = startPos;
            idx++;
            // 这条鱼在鱼群中的偏移位置
            line.vec2.forEach(v => {
                // if(line.id == 35001){
                // 	logd("==================vec",v.x,v.y)
                // }
                outPath[idx] = v.clone().add(offsetInGroup);
                idx++;
            });
        }

        private static findPosInPath(path: Array<Vector2>, len: number, outPos: Vector2): number {
            let total: number = 0;
            let plen: number = path.length;
            for (let i = 1; i < plen; i++) {
                let prev: Vector2 = path[i - 1];
                let cur: Vector2 = path[i];

                let dist = prev.dist(cur);
                total += dist;
                if (len < total) {
                    let t = 1 - (total - len) / dist;
                    outPos.set(prev).lerp(cur, t);
                    return i - 1;
                }
            }
            outPos.set(path[plen - 1]);
            return -1;
        }

		/**
		 * 根据经过的时间及鱼群ID和线路ID取得坐标
		 * @param groupID 鱼群模版ID
		 * @param index 鱼在鱼群中的索引
		 * @param lineID 
		 * @param moveSeconds 
		 * @param outPos 返回鱼的位置
		 * @param outOri 返回鱼的朝向
		 * @param outPath 返回接下来鱼的移动路径
		 */
        static getPostion(groupID: number, index: number, lineID: number, moveSeconds: number, outPos: Vector2, outOri: Vector2, outPath: Array<Vector2>) {
            let info: tb_fish_group = this.getFishGroupTempById(groupID);
            let line: tb_fish_line = this.getFishLineTempById(lineID);

            // 生成这条的移动路线
            this.buildPath(info, index, line, outPath);
            // if(lineID == 35001){
            // 	for (let poss of outPath) {
            // 		logd("outPath:",poss.x,poss.y,info.len_head);
            // 	}
            // }

            // 取得当前鱼所有的路线节点
            let i: number = this.findPosInPath(outPath, moveSeconds * line.speed, outPos);

            // 根据节点所在位置剃除节点
            if (i >= 0) {
                outPath.splice(0, i + 1);
                outOri.set(outPath[0]).sub(outPos).normalize();
            } else {
                let length = outPath.length;
                let dist: number = outPath[length - 2].dist(outPath[length - 1]);
                outOri.set(outPath[length - 1]).sub(outPath[length - 2]).normalize();
                outPath.splice(0, length - 1);
                Vector2.temp.set(outOri).len = dist;
                outPath[0].add(Vector2.temp);
            }
        }
    }
}
