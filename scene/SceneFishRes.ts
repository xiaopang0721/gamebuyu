module gamebuyu.scene {
	export class SceneFishRes {
		/**
		 * 炮台位置
		 */
		static PAO_POSDATA: { [key: number]: Vector2};
		/**
		 * 炮管长度
		 */
		static PAO_LONG: number = 100;
		/**
		 * 炮最小朝向
		 */
		static MIN_TOWARD: number = 65;
		/**
		 * 炮最大朝向
		 */
		static MAX_TOWARD: number = 127;
		/**
		 * 获取炮台位置
		 * @param idx 
		 */
		static getPaoPos(idx: number): Vector2 {
			return this.PAO_POSDATA[idx];
		}

		/**
		 * 获取炮台皮肤
		 * @param 炮台倍数
		 */
		static getSkin(rate: number): string {
			return "pao" + rate;
		}

		/**
		 * 获取子弹皮肤
		 * @param rate 炮台倍数
		 */
		static getBulletSkin(rate: number): string {
			return "zd_" + rate;
		}

		/**
		 * 获取子弹击中效果
		 * @param isHuaYu 是否是划鱼
		 * @param rate 炮台倍数
		 */
		static getHitEffect(rate: number): string {
			return rate.toString();
		}
	}
}