module gamebuyu.data {

    export class BuyuMapInfo extends gamecomponent.object.MapInfo {
        //BOSS来袭
        static EVENT_BOSS_EVENT: string = "BuyuMapInfo.EVENT_BOSS_EVENT";
        //鱼潮来袭
        static EVENT_FISH_EVENT: string = "BuyuMapInfo.EVENT_FISH_EVENT";
        
        static EVENT_SEATED_LIST: string = "BuyuMapInfo.EVENT_SEATED_LIST";

        private _yclxTime: number = 0;
		/**
		 * 鱼潮来袭时间
		 */
        get yclxTime(): number {
            return this._yclxTime;
        }

        constructor(v: SceneObjectMgr) {
            super(v);
            this._sceneObjectMgr = v;
            //更新完毕之后
            this._after_update = this.onUpdate;
        }

        init(): void {

        }

        //当对象更新发生时
        protected onUpdate(flags: number, mask: UpdateMask, strmask: UpdateMask): void {
            super.onUpdate(flags, mask, strmask);
            let isNew = flags & core.obj.OBJ_OPT_NEW;

            // 鱼潮来袭
            if (isNew || mask.GetBit(MapField.MAP_INT_YU_CHAO_LAI_QI_TIME)) {
                this._yclxTime = this.GetYuChaoLaiQiTime();
                // logd("================= BuyuMapInfo.onUpdate " + this._yclxTime);
                this._sceneObjectMgr.event(BuyuMapInfo.EVENT_FISH_EVENT);
            }
            if (isNew || strmask.GetBit(MapField.MAP_STR_SEATED_LIST)) {
				this._sceneObjectMgr.event(BuyuMapInfo.EVENT_SEATED_LIST);
			}
        }

        update(diff: number): void {

        }

    }
}
