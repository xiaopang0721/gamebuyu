/**
* 金币赛机器人
*/
module gamebuyu.manager {
	export class ActionRobot extends ActionBase {
		private _owner: BuyuPlayer;
		// 休息时间
		private _restTime: number;
		// 目标
		private _target: Fish;

		constructor(owner: BuyuPlayer) {
			super();
			this._owner = owner;
			this._restTime = 0;
			this._findTime = 0;
		}

		update(deltaTime: number): boolean {
			super.update(deltaTime);
			if(this._owner && this._owner.fireType == BuyuPlayer.FIRE_TYPE_AIM){
				// 瞄准状态不管
				return false;
			}
			this._owner.isDoFireing = false;
			// if (this._restTime) {
			// 	// 休息中
			// 	this._restTime -= deltaTime;
			// 	if (this._restTime < 0) {
			// 		this._restTime = 0;
			// 	}
			// 	return false;
			// }
			// if (Math.random() < 0.0008) {
			// 	// 几率非常的低 随机休息1~4秒
			// 	this._restTime = Math.random() * 3 + 1;
			// 	return false;
			// }
			// 找鱼
			this.findFindTarget(deltaTime);
			if(this._target){
				this._owner.selectFish = this._target;
				this._owner.isDoFireing = true;
				this._owner.fireType = data.BuyuPlayer.FIRE_STATE_HAND;
				this._owner.towardTarget(this._target.pos)
			}
			return false;
		}

		// 找鱼频率
		private _findTime: number;
		private findFindTarget(deltaTime: number): void {
			if (this._target) {
				if (!this._target.lookInCamera2 ||this._target.isDied || Math.random() < 0.02) {
					// 目标死亡 或1/50的几率更换目标
					this._target = null;
				}
			}
			this._findTime -= deltaTime;
			if (this._findTime > 0) {
				return;
			}
			this._findTime = 500/1000;
			if (!this._target) {
				// 这里写找鱼规则
				let fishs: Array<Fish> = [];
				let list = this._owner.buyuMgr? this._owner.buyuMgr.fishList : null;
				for(let key in list){
					let obj = list[key];
					if (obj instanceof Fish && !obj.isDied && obj.lookInCamera2) {
						fishs.push(obj);
					}
				}

				if (fishs.length) {
					this._target = fishs[Math.floor(Math.random() * fishs.length)];
				}
			}

		}

		finalize(): boolean {
			this._owner = null;
			return super.finalize();
		}
	}
}