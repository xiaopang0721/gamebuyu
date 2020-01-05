/**
* //捕鱼 
*/
module gamebuyu.page {
	export class BuyuPageDef extends game.gui.page.PageDef {
		static GAME_NAME: string;
		static PAGE_BUYU_HUD: string = "1";//捕鱼hud
		static PAGE_BUYU_MAIN: string = "2";//捕鱼场景主界面
		static PAGE_BUYU_GUIZE: string = "101";//捕鱼规则
		static PAGE_LOOT: string = "4";//战利品
		static PAGE_BUYU_GREAT: string = "6";//捕鱼太棒了
		static PAGE_BUYU_BOSS: string = "7";//BOSS来袭
		static PAGE_BUYU_FISH: string = "8";//鱼潮来袭

		/**
		  * 捕鱼房间信息
		  * name 名字
		  * minGold 进入房间最少要多少捕鱼币
		  * rateGold 1倍炮要花多少金币
		  */
		static ROOM_INFO: { [key: number]: any } = {};
		static ROOM_CONFIG: any[] = [];

		static myinit(str: string) {
			super.myinit(str);
			BuyuClip.init();
			PageDef._pageClassMap[BuyuPageDef.PAGE_BUYU_HUD] = BuyuMainPage;
			PageDef._pageClassMap[BuyuPageDef.PAGE_BUYU_MAIN] = BuyuSceneHudPage;
			PageDef._pageClassMap[BuyuPageDef.PAGE_BUYU_GUIZE] = BuyuGuiZePage;
			PageDef._pageClassMap[BuyuPageDef.PAGE_BUYU_GREAT] = BuyuGreatPage;
			PageDef._pageClassMap[BuyuPageDef.PAGE_BUYU_BOSS] = BuyuBossPage;
			PageDef._pageClassMap[BuyuPageDef.PAGE_BUYU_FISH] = BuyuFishPage;
			PageDef._pageClassMap[BuyuPageDef.PAGE_LOOT] = BuyuLootPage;



			this.ROOM_INFO[Web_operation_fields.GAME_ROOM_CONFIG_FISH_1] = { mode: Web_operation_fields.GAME_ROOM_CONFIG_FISH_1, name: "体验场", minGold: 0, rateGold: 1 };
			this.ROOM_INFO[Web_operation_fields.GAME_ROOM_CONFIG_FISH_2] = { mode: Web_operation_fields.GAME_ROOM_CONFIG_FISH_2, name: "小资场", minGold: 1, rateGold: 0.01 };
			this.ROOM_INFO[Web_operation_fields.GAME_ROOM_CONFIG_FISH_3] = { mode: Web_operation_fields.GAME_ROOM_CONFIG_FISH_3, name: "老板场", minGold: 10, rateGold: 0.1 };
			this.ROOM_INFO[Web_operation_fields.GAME_ROOM_CONFIG_FISH_4] = { mode: Web_operation_fields.GAME_ROOM_CONFIG_FISH_4, name: "富豪场", minGold: 100, rateGold: 1 };

			this.ROOM_CONFIG = [
				Web_operation_fields.GAME_ROOM_CONFIG_FISH_1,
				Web_operation_fields.GAME_ROOM_CONFIG_FISH_2,
				Web_operation_fields.GAME_ROOM_CONFIG_FISH_3,
				Web_operation_fields.GAME_ROOM_CONFIG_FISH_4
			]


			this["__needLoadAsset"] = [
				Path_game_buyu.atlas_game_ui + "buyu/hud.atlas",
				Path_game_buyu.atlas_game_ui + 'buyu/bosslaixi.atlas',
				Path_game_buyu.atlas_game_ui + 'buyu/guize.atlas',
				Path_game_buyu.atlas_game_ui + "buyu/great.atlas",
				Path_game_buyu.atlas_game_ui + "buyu/tongyong.atlas",
				Path_game_buyu.atlas_game_ui + "buyu/hudscene.atlas",
				Path_game_buyu.atlas_game_ui + "buyu/pao.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "qifu.atlas",
				PathGameTongyong.atlas_game_ui_tongyong_general + "anniu.atlas",
				PathGameTongyong.atlas_game_ui_tongyong_general_effect + "anniug.atlas",
				Path.ui_atlas_effect + "coin.atlas",
				Path.ui_atlas_effect + "shuzi.atlas",
				Path.temp + 'fish_group.json',
				Path.temp + 'template.bin',

				Path.map_far + 'bg_buyu.jpg',
				Path.map_far + 'bg_buyu51.jpg',
				Path.map_far + 'bg_buyu52.jpg',
				Path.map_far + 'bg_buyu53.jpg',
				Path.map_far + 'bg_buyu54.jpg',
				Path.map + 'pz_buyu.png',
				Path.map + 'pz_buyu51.png',
				Path.map + 'pz_buyu52.png',
				Path.map + 'pz_buyu53.png',
				Path.map + 'pz_buyu54.png',
				Path.custom_atlas_scene + "bullet.atlas",
				Path.custom_atlas_scene + "single.atlas",
				Path.custom_atlas_scene + "lightning.atlas",
				Path.custom_atlas_scene + "bullet.atlas",
			]

			if (WebConfig.needMusicPreload) {
				this["__needLoadAsset"] = this["__needLoadAsset"].concat([
					Path_game_buyu.music_buyu + "bg.mp3",
					Path_game_buyu.music_buyu + "boss.mp3",
					Path_game_buyu.music_buyu + "boss_die1.mp3",
					Path_game_buyu.music_buyu + "boss_die2.mp3",
					Path_game_buyu.music_buyu + "boss_die3.mp3",
					Path_game_buyu.music_buyu + "boss_die4.mp3",
					Path_game_buyu.music_buyu + "boss_die5.mp3",
					Path_game_buyu.music_buyu + "boss_die6.mp3",
					Path_game_buyu.music_buyu + "boss_die7.mp3",
					Path_game_buyu.music_buyu + "boss_die8.mp3",
					Path_game_buyu.music_buyu + "boss_die9.mp3",
					Path_game_buyu.music_buyu + "boss_die10.mp3",
					Path_game_buyu.music_buyu + "btn.mp3",
					Path_game_buyu.music_buyu + "close.mp3",
					Path_game_buyu.music_buyu + "dantoubaozha.mp3",
					Path_game_buyu.music_buyu + "dianyu.mp3",
					Path_game_buyu.music_buyu + "fire.mp3",
					Path_game_buyu.music_buyu + "great.mp3",
					Path_game_buyu.music_buyu + "huangjinyu.mp3",
					Path_game_buyu.music_buyu + "jiangli.mp3",
					Path_game_buyu.music_buyu + "say1.mp3",
					Path_game_buyu.music_buyu + "say2.mp3",
					Path_game_buyu.music_buyu + "say3.mp3",
					Path_game_buyu.music_buyu + "say4.mp3",
					Path_game_buyu.music_buyu + "say5.mp3",
					Path_game_buyu.music_buyu + "say6.mp3",
					Path_game_buyu.music_buyu + "say7.mp3",
					Path_game_buyu.music_buyu + "say8.mp3",
					Path_game_buyu.music_buyu + "say9.mp3",
					Path_game_buyu.music_buyu + "say10.mp3",
					Path_game_buyu.music_buyu + "say11.mp3",
					Path_game_buyu.music_buyu + "say12.mp3",
					Path_game_buyu.music_buyu + "say13.mp3",
					Path_game_buyu.music_buyu + "say14.mp3",
					Path_game_buyu.music_buyu + "shouqian.mp3",
					Path_game_buyu.music_buyu + "showitem.mp3",
					Path_game_buyu.music_buyu + "taibangle.mp3",
					Path_game_buyu.music_buyu + "yubaoqian.mp3",
					Path_game_buyu.music_buyu + "yuchao.mp3",
					Path_game_buyu.music_buyu + "zhuanpan.mp3",
				])
			}

			for (let i: number = 0; i < 27; i++) {
				if (i == 25) continue;
				this["__needLoadAsset"].push(Path_game_buyu.custom_atlas_fish + (i + 1) + "/move.atlas", );
				if (i >= 17) {
					this["__needLoadAsset"].push(Path_game_buyu.custom_atlas_fish + (i + 1) + "/top.atlas", );
					this["__needLoadAsset"].push(Path_game_buyu.custom_atlas_fish + (i + 1) + "/bottom.atlas", );
				}
				if (i < 10) {
					this["__needLoadAsset"].push(Path.custom_atlas_scene + "yw/" + (i + 1) + ".atlas", );
				}
			}


		}


		static parseBuYuData(assetsLoader: AssetsLoader) {
			if (!Template.data) {
				let tempData = Laya.loader.getRes(Path.temp + "template.bin");
				assetsLoader.release(Path.temp + 'template.bin', true);
				if (tempData) {
					let dataStr = StringU.readZlibData(new ByteArray(tempData));
					Template.setData(JSON.parse(dataStr));
				}
			}

			if (!FishGroupPathManager.data) {
				let fishTemData = Laya.loader.getRes(Path.temp + 'fish_group.json');
				assetsLoader.release(Path.temp + 'fish_group.json', true);
				fishTemData && FishGroupPathManager.setData(fishTemData);
			}
		}

		/**
		 * 根据模式ID获取房间信息
		 * @param mode 模式ID
		 */
		static getRoomInfoByMode(mode: number): any {
			let info = this.ROOM_INFO[mode];
			if (info) {
				return info;
			}
			return null;
		}

	}
}