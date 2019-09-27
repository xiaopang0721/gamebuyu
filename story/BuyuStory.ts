/**
* name 捕鱼剧情
*/
module gamebuyu.story {
	export class BuyuStory extends gamecomponent.story.StoryFishBase {
		static readonly MAP_STATE_NOMAL = 0;//初始化
		static readonly MAP_STATE_BEGIN = 1;//开始
		static readonly MAP_STATE_END = 2;//结束
		private _buyuMgr: BuyuMgr;
		get buyuMgr(): BuyuMgr {
			return this._buyuMgr;
		}
		private _gridMgr: CollideManager;
        /**
         * 网格管理器
         */
		get gridMgr(): CollideManager {
			return this._gridMgr;
		}

		constructor(v: Game, mapid: string, maplv: number) {
			super(v, mapid, maplv);
			this._tempStartFireMsg = new hanlder.s2c_start_fire_result();
			this.init();
		}

		//地图对应资源id
		public get mapUrl(): string {
			return this.mapid + this.maplv;
		}


		private _layerList: Laya.Sprite[];
		//初始化
		init() {
			if (!this._buyuMgr) {
				this._buyuMgr = new BuyuMgr(this._game);
			}
			if (!this._gridMgr) {
				this._gridMgr = new CollideManager(this._game.sceneObjectMgr);
			}
			if (!this._layerList) {
				this._layerList = []
				this._layerList.push(new Layer());
				this._layerList.push(new Layer());
				this._layerList.push(new Layer());
				this._layerList.push(new Layer());
				this._layerList.push(new Layer());
				this._game.mainScene && this._game.mainScene.setLayerConfigArr(this._layerList);
			}

			// this._game.mainScene.setLayerConfigArr([
			// 	"new game.scene.Layer()",
			// 	"new game.scene.Layer()",
			// 	"new game.scene.Layer()",
			// 	"new game.scene.Layer()",
			// 	"new game.scene.Layer(false,0.8,Laya.BlendMode.ADD)",
			// ]);
			this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_LOAD_MAP, this, this.onIntoNewMap);
		}


		resize(w: number, h: number): void {
			this._buyuMgr && this._buyuMgr.resize(w, h);
		}

		//进入地图回调
		private onIntoNewMap(info: MapAssetInfo): void {
			if (!info || !info.id) return;
			this._game.network.addHanlder(Protocols.SMSG_START_FIRE_RESULT, this, this.onStartFireResult);
			this._game.network.addHanlder(Protocols.SMSG_DIANYU_RESULT, this, this.onDianyuResult);
			this._game.uiRoot.closeAll();
			this._game.uiRoot.HUD.open(BuyuPageDef.PAGE_BUYU_MAIN);
			this._game.uiRoot.HUD.open(BuyuPageDef.PAGE_LOOT);
		}

		//发送进入地图协议
		enterMap() {
			//各种判断
			this._game.network.call_match_game(this._mapid, this.maplv);
			return true;
		}

		//视图对象创建
		inLook(obj: any, isFollow: boolean = false): AvatarBase {
			let avatar: AvatarBase
			if (obj instanceof Unit && obj.type == UnitField.TYPE_ID_FISH) {
				let fish = this._buyuMgr.getFishByOid(obj.oid);
				if (fish) {
					avatar = new AvatarFish(this._game, fish);
				}
			} else if (obj instanceof Bullet) {
				avatar = new AvatarBullet(this._game, obj);
			}
			if (avatar) return avatar;
			return super.inLook(obj, isFollow);
		}

		//更新视图对象
		updateInLook(obj: GuidObject): string {
			if (!this._game.mainScene) return;
			if (obj instanceof Unit && obj.type == UnitField.TYPE_ID_FISH) {
				//鱼的剔除判断
				let fish = this._buyuMgr.getFishByOid(obj.oid);
				if (fish) {
					fish.lookInCamera = this._game.mainScene.camera.lookIn(fish.pos);
					fish.lookInCamera2 = false;
					if (fish.lookInCamera) {
						fish.lookInCamera2 = this._game.mainScene.camera.lookIn2(fish.pos);
						fish.visible = true;
						return SceneRoot.INLOOK;
					} else {
						fish.visible = false;
						return SceneRoot.OUTLOOK;
					}
				}
			}
			return super.updateInLook(obj);
		}

		//创建假精灵
		createofflineUnit() {

		}

		//离开地图
		leavelMap() {
			//各种判断
			this._game.network.removeHanlder(Protocols.SMSG_START_FIRE_RESULT, this, this.onStartFireResult);
			this._game.network.removeHanlder(Protocols.SMSG_DIANYU_RESULT, this, this.onDianyuResult);
			this._game.network.call_leave_game();
			return true;
		}

		clear() {
			this._game.network.removeHanlder(Protocols.SMSG_START_FIRE_RESULT, this, this.onStartFireResult);
			this._game.network.removeHanlder(Protocols.SMSG_DIANYU_RESULT, this, this.onDianyuResult);
			this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_LOAD_MAP, this, this.onIntoNewMap);
			if (this._buyuMgr) {
				this._buyuMgr.clear();
				this._buyuMgr = null;
			}
			if (this._gridMgr) {
				this._gridMgr.clear();
				this._gridMgr = null;
			}

			if (this._layerList) {
				let len = this._layerList && this._layerList.length > 0 ? this._layerList.length : 0;
				for (let index = 0; index < len; index++) {
					let layer = this._layerList[index];
					if (layer) {
						layer.removeSelf();
						layer.destroy()
						layer = null;
					}
				}
				this._layerList = null;
			}

			this._game.mainScene.setLayerConfigArr();
			this._game.sceneObjectMgr.clearOfflineObject();
			this._bullets.length = 0;
			this._firePosV0 = null;
			this._firePosV1 = null;
		}



		update(diff: number) {
			this._buyuMgr && this._buyuMgr.update(diff);
			this._gridMgr && this._gridMgr.update(diff);
		}

		//========================== 业务逻辑 ==============================
		// 临时变量
		protected _tempStartFireMsg: hanlder.s2c_start_fire_result;
		/**
		 * 开火
		 * @param toward 朝向
		 * @param target 锁定目标
		 * @param isSend 是否发协议
		 * @param isBoom 是否是特殊子弹 0普通子弹 1特殊子弹 2划鱼
		 */
		startFire(player: BuyuPlayer, toward: number, target?: number, isSend: boolean = true, isBoom: number = 0): void {
			if (isSend) {
				if (player.isRobot) {
					//如果没有鱼 不发
					if (player.unit && this._buyuMgr && this._buyuMgr.liveFishCount > 0)
						!this._game.isLockGame && this._game.network.call_robot_start_fire(player.unit.oid, toward, target);
					return;
				}
				else {
					!this._game.isLockGame && this._game.network.call_start_fire(toward, target, isBoom);
				}

			}
			this._tempStartFireMsg.toward = toward;
			this._tempStartFireMsg.oid = player.unit.oid;
			this._tempStartFireMsg.target_oid = target;
			this._tempStartFireMsg.is_boom = isBoom;
			this.onStartFireResult(0, this._tempStartFireMsg, true);
		}

		// 开火返回
		private _bullets: Bullet[] = []
		private _firePosV0: Vector2 = new Vector2();
		private _firePosV1: Vector2 = new Vector2();
		protected onStartFireResult(optcode: number, msg: hanlder.s2c_start_fire_result, fromClient?: boolean): void {
			if (!this._buyuMgr) return;
			let objectMgr = this._game.sceneObjectMgr;
			let isSelf: boolean = objectMgr.mainUnit && objectMgr.mainUnit.oid == msg.oid;
			if (!fromClient && isSelf) {
				// 主玩家的不管客户端优先模拟
				return;
			}

			//帧率低 就只显示自己的
			let player = isSelf ? this._buyuMgr.mainPlayer : this._buyuMgr.getPlayeryOid(msg.oid);
			if (player instanceof BuyuPlayer) {
				// 炮台位置
				let posNum = player.position;
				let pos = SceneFishRes.getPaoPos(posNum);
				this._firePosV0.x = pos.x;
				this._firePosV0.y = pos.y;
				let bullet = objectMgr.createOfflineObject(Bullet.TYPE, Bullet) as Bullet;
				bullet.canColloder = msg.target_oid == 0; // 全部客户端碰撞（锁定的不参与碰撞）
				bullet.pos.radius = 16;
				let rate = player.fireLevel;
				bullet.skin = SceneFishRes.getBulletSkin(rate);
				bullet.hitSkin = SceneFishRes.getHitEffect(rate);
				Vector2.temp.fromToward(msg.toward);
				this._firePosV1.x = Vector2.temp.x;
				this._firePosV1.y = Vector2.temp.y;
				player.ori = this._firePosV1;
				if (posNum > 2) {
					player.ori.y = -player.ori.y;
				}
				Vector2.temp.mul(SceneFishRes.PAO_LONG);
				this._firePosV0.add(Vector2.temp);
				bullet.init(msg.oid, this._firePosV0.x, this._firePosV0.y, this._firePosV1, msg.target_oid);
				this._bullets.push(bullet);
				player.event(BuyuPlayer.FIRE_IT, isSelf);
			}
		}

		// 电鱼结果
		private onDianyuResult(optcode: number, msg: any): void {
			logd("==================== 电鱼结果！！！！");
			this._game instanceof Game && this._buyuMgr && this._buyuMgr.onDianyuResult(msg);
		}

	}
}