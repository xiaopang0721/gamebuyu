/**
* 捕鱼数据管理器
*/
module gamebuyu.manager {
	export class BuyuMgr extends Laya.EventDispatcher {
		static EVENT_ADD_PLAYER: string = "BuyuMgr.add_player";
		static EVENT_REMOVE_PLAYER: string = "BuyuMgr.remove_player";
		static EVENT_UPDATE_MAIN_PLAYER: string = "BuyuMgr.update_main_player";
		static EVENT_KILL_FISH: string = "BuyuMgr.kill_fish";
		static EVENT_CAMER_FZ: string = "BuyuMgr.camer_fz";

		private _game: Game;
		//捕鱼玩家信息
		private _buyuPlayerList: { [key: string]: BuyuPlayer };
		get buyuPlayerList(): { [key: string]: BuyuPlayer } {
			return this._buyuPlayerList;
		}
		//鱼对象
		private _fishList: { [key: string]: Fish };
		get fishList(): { [key: string]: Fish } {
			return this._fishList;
		}

		// 闪电层
		private _lightningSprite: gamebuyu.render.custom.LightningSprite;
		// 闪电球层
		private _lightningBallSprite: Sprite;

		public mainPlayer: BuyuPlayer;
		//活着的鱼个数
		public liveFishCount: number = 0;
		constructor(v: Game) {
			super();
			this._game = v;
			this._fishList = {};
			this._buyuPlayerList = {};

			//炮台逻辑位置初始化
			SceneFishRes.PAO_POSDATA = {
				1: new Vector2(450, 685),
				2: new Vector2(830, 685),
				3: new Vector2(450, 35),
				4: new Vector2(830, 35),
			};
			this._lightningBallSprite = new Sprite();
			let texture = Loader.getRes(Path.scene + 'lightning/shandian.png');
			if (this._game.mainScene) {
				if (texture) {
					let img: Laya.WebGLImage = texture.bitmap;
					img && (img.enableMerageInAtlas = false);
					this._lightningSprite = new gamebuyu.render.custom.LightningSprite(texture, this._game.mainScene.camera, this._lightningBallSprite);
					this._lightningSprite.blendMode = Laya.BlendMode.ADD;
					this._lightningSprite.speedX = 0;
					this._lightningSprite.speedY = -1.5;
					this._lightningSprite.unitHeight = texture.height;
					this._lightningSprite.pivot(.5, 0);
					this._game.mainScene.addChild(this._lightningSprite);
					this._game.mainScene.addChild(this._lightningBallSprite);
				}
			}

			this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_ADD_UNIT, this, this.checkAddBuyuPlayer);
			this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_REMOVE_UNIT, this, this.checkRemoveBuyuUnit);
			this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_MAIN_UNIT_CHANGE, this, this.updateMainBuyuPlayer);
			this._game.sceneObjectMgr.on(BuyuPlayer.POSITION_CHANGED, this, this.onUpdateMainPos);
			let unitArr = this._game.sceneObjectMgr.unitDic;
			for (let key in unitArr) {
				let unit = unitArr[key];
				this.checkAddBuyuPlayer(unit);
			}
			this.resize(this._game.clientWidth, this._game.clientHeight);
			//主玩家
			this.updateMainBuyuPlayer(this._game.sceneObjectMgr.mainUnit);
		}

		resize(w: number, h: number): void {
			//重置炮台位置
			let ch: number = (h - main.heightDesginPixelw) / 2;
			let cw: number = (w - main.widthDesginPixelw) / 2;
			// logd("scene resize",cw,ch,clientWidth,clientHeight,this.scaleX,this.scaleY)
			for (let key in SceneFishRes.PAO_POSDATA) {
				let pos = SceneFishRes.PAO_POSDATA[key];
				let idx = parseInt(key);
				if (idx <= 2) {
					pos.y = main.heightDesginPixelw + ch - 30;
				}
				else {
					pos.y = -ch + 30;
				}
				SceneFishRes.PAO_POSDATA[key] = pos;
			}
			logd("BuyuMgr.resize");
		}

		update(diff: number): void {
			this.liveFishCount = 0;
			for (let key in this._fishList) {
				let fish = this._fishList[key];
				fish && fish.update(diff);
				if (fish && fish.unit && fish.lookInCamera2 && !fish.isDied) this.liveFishCount++;
			}
			// console.log("=======鱼",this.liveFishCount)
			for (let key in this._buyuPlayerList) {
				let player = this._buyuPlayerList[key];
				player && player.update(diff);
			}
		}

		private updateMainBuyuPlayer(unit: Unit): void {
			if (!unit) return;
			//主玩家
			this.mainPlayer = this.getBuyuPlayerByUnit(unit);
			this.onUpdateMainPos();
			this.event(BuyuMgr.EVENT_UPDATE_MAIN_PLAYER);
		}

		private onUpdateMainPos(): void {
			if (!this._game.mainScene || !this.mainPlayer) return;
			let idx = this.mainPlayer.position;
			this._game.mainScene.cameraFocus.set(SceneFishRes.getPaoPos(idx));
			isDebug && console.assert(idx < 5 && idx > 0, "Online.onReady 主玩家位置异常：" + idx);
			this._game.mainScene.camera.flipV = idx > 2;
			// logd("=======onUpdateMainPos", idx, this._game.mainScene.camera.flipV)
			this.event(BuyuMgr.EVENT_CAMER_FZ);
		}

		/**
		 * 检查Unit是否是BuyuPlayer是的话加入数组
		 * @param unit 精灵
		 */
		private checkAddBuyuPlayer(unit: Unit): void {
			unit.on(Unit.EVENT_TYPE_CHANGED, this, this.addBuyuUnit);
			this.addBuyuUnit(unit);
		}

		private addBuyuUnit(unit: Unit) {
			let type = unit.type;
			// logd("addBuyuPlayer type=",type)
			if (type > 0) {
				unit.off(Unit.EVENT_TYPE_CHANGED, this, this.addBuyuUnit);
			}
			if (type == Unit.TYPE_ID_PLAYER || type == Unit.TYPE_ID_ROBOT) {
				//玩家
				let player = new BuyuPlayer(unit, this._game.sceneObjectMgr);
				this._buyuPlayerList[unit.oid] = player;
				this.event(BuyuMgr.EVENT_ADD_PLAYER, player);
			} else if (type == Unit.TYPE_ID_FISH) {
				let fish = new Fish(unit, this._game.sceneObjectMgr);
				this._fishList[unit.oid] = fish;
			}
		}

		/**
		 * 检查Unit是否是BuyuPlayer是的话就从数据里剔除
		 * @param unit 精灵
		 */
		private checkRemoveBuyuUnit(unit: Unit): void {
			let type = unit.type
			unit.off(Unit.EVENT_TYPE_CHANGED, this, this.addBuyuUnit);
			if (type == Unit.TYPE_ID_PLAYER || type == Unit.TYPE_ID_ROBOT) {
				let player = this._buyuPlayerList[unit.oid];
				if (player) {
					player.clear();
					delete this._buyuPlayerList[unit.oid];
					this.event(BuyuMgr.EVENT_REMOVE_PLAYER, player);
				}
			} else if (type == Unit.TYPE_ID_FISH) {
				let fish = this._fishList[unit.oid];
				if (fish) {
					fish.clear();
					delete this._fishList[unit.oid];
				}
			}
		}

		/**
		 * 通过unit获取玩家精灵
		 * @param unit 
		 */
		getBuyuPlayerByUnit(unit: Unit): BuyuPlayer {
			if (!unit) return null;
			if (!this._buyuPlayerList) return null;
			let player = this._buyuPlayerList[unit.oid];
			if (player && player.unit) {
				return player;
			}
			return null;
		}

		/**
		 * 通过oid拿到鱼对象
		 * @param oid 
		 */
		getFishByOid(oid: number): Fish {
			if (!this._fishList) return null;
			let fish = this._fishList[oid];
			if (fish && fish.unit) {
				return fish;
			}
			return null;
		}

		getPlayeryOid(oid: number): BuyuPlayer {
			if (!this._buyuPlayerList) return null;
			let player = this._buyuPlayerList[oid];
			if (player && player.unit) {
				return player;
			}
			return null;
		}

		/**
		 * 获取倍数最大的鱼
		 */
		getMaxOrderFishOid(): number {
			let maxRate: number = 0;
			let oid: number;
			for (let key in this._fishList) {
				let fish = this._fishList[key];
				let temp = fish.fishTemp ? fish.fishTemp : Template.getFishTempById(fish.entryid);
				if (!temp) continue;
				if (!this._game.mainScene.checkInScene(fish.pos.x, fish.pos.y) || !this.checkToward(fish.pos.x, fish.pos.y)) continue;
				let rateAvg = (temp.rate_range[0] + temp.rate_range[1]) / 2
				if (rateAvg > maxRate && fish.unit) {
					oid = fish.unit.oid;
					maxRate = rateAvg;
				}
			}
			return oid;
		}

		/**
		 * 检查逻辑坐标和主玩家的朝向是否符合标准
		 */
		checkToward(x: number, y: number): boolean {
			let mainPlayer = this.mainPlayer;
			if (mainPlayer) {
				let posNum = mainPlayer.position;
				let playerV = SceneFishRes.getPaoPos(posNum);
				Vector2.temp.x = x - playerV.x;
				Vector2.temp.y = y - playerV.y;
				let toward = Vector2.temp.getToward();
				let min = posNum <= 2 ? SceneFishRes.MIN_TOWARD : Vector2.TowardCount - SceneFishRes.MAX_TOWARD;
				let max = posNum <= 2 ? SceneFishRes.MAX_TOWARD : Vector2.TowardCount - SceneFishRes.MIN_TOWARD;
				return toward >= min && toward <= max;
			}
		}

		get nowServerTime(): number {
			return this._game.sync.serverTimeBys;
		}

		// 电鱼结果
		onDianyuResult(msg: any): void {
			let dfish = this.getFishByOid(msg.fish_id);
			if (!dfish) {
				return;
			}
			let count = 0;
			for (let id of msg.dead_fishs) {
				let tfish = this.getFishByOid(id);
				if (tfish) {
					this._lightningSprite && this._lightningSprite.add(dfish.pos, tfish.pos, count * 80);
					count++;
				}
			}
		}

		// findAvatarByOid(oid: number): gamecomponent.scene.AvatarBase {
		// 	let avatars = this._game.mainScene.avatarLayer.avatars;
		// 	if (oid) {
		// 		let len: number = avatars.length;
		// 		for (let i = 1; i < len; i++) {
		// 			let avatar = avatars[i]
		// 			if (avatar.oid == oid) {
		// 				return avatar;
		// 			}
		// 		}
		// 	}
		// 	return null;
		// }

		clear(): void {
			logd("=====buyumgr clear")
			this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_ADD_UNIT, this, this.checkAddBuyuPlayer);
			this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_REMOVE_UNIT, this, this.checkRemoveBuyuUnit);
			this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_MAIN_UNIT_CHANGE, this, this.updateMainBuyuPlayer);
			this._game.sceneObjectMgr.off(BuyuPlayer.POSITION_CHANGED, this, this.onUpdateMainPos);
			this._game.mainScene.camera.flipV = false;
			for (let key in this._buyuPlayerList) {
				let player = this._buyuPlayerList[key];
				if (player) {
					player.unit && player.unit.off(Unit.EVENT_TYPE_CHANGED, this, this.addBuyuUnit);
					player.clear();
					player = null;
				}
			}
			this._buyuPlayerList = null;
			for (let key in this._fishList) {
				let fish = this._fishList[key];
				if (fish) {
					fish.unit && fish.unit.off(Unit.EVENT_TYPE_CHANGED, this, this.addBuyuUnit);
					fish.clear();
					fish = null;
				}
			}
			this._fishList = null;

			if (this._lightningSprite) {
				this._lightningSprite.removeSelf();
				this._lightningSprite.destroy();
				this._lightningSprite = null;
			}
			if (this._lightningBallSprite) {
				this._lightningBallSprite.removeSelf();
				this._lightningBallSprite.destroy();
				this._lightningBallSprite = null;
			}
			Laya.timer.clearAll(this)
			Laya.Tween.clearAll(this)
			this.offAll();
		}
	}
}
