/**
* 路径配置
*/
module gamebuyu.data {
	export class Path {
		static ui: string = 'ui/';
		static music_buyu: string = 'music/buyu/';
		static ui_buyu: string = "buyu_ui/game_ui/buyu/";
		static atlas_game_ui: string = "buyu_res/atlas/buyu_ui/game_ui/";
		
		static scene_single: string = 'scene/single/';
		static fish: string = 'scene/fish/';
		static scene_bullet: string = 'scene/bullet/';
		static scene_yw: string = 'scene/yw/';

		static get custom_atlas():string {
			return "custom_atlas/" + WebConfig.platform + "/";
		}
		static get custom_atlas_fish():string {
			return Path.custom_atlas + "scene/fish/";
		}
		static get custom_atlas_yw():string {
			return Path.custom_atlas + "scene/yw/";
		}
	}
}