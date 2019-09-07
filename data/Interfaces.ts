/**
* name 
*/
module gamebuyu.data {
	/**
	 * 场景对象
	 */
    export interface ISceneObject  extends gamecomponent.object.IClear{
		/**
		 * 位置
		 */
        pos: Vector2;

		/**
		 * 是否在摄像机可视范围内
		 */
        lookInCamera: boolean;

		isCanClear:boolean;
    }
}