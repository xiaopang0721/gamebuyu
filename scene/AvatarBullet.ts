/**
* name 
*/
module gamebuyu.scene {
    export class AvatarBullet extends gamecomponent.scene.AvatarBase {
        protected _bullet: Bullet;

        protected _oid: number;
        get oid(): number {
            return this._oid;
        }

        // 皮肤
        protected _skin: string;
        // 击中效果
        protected _hitSkin: string;
        // 视图旋转角度
        protected _angle: number = 0;
        // 缩放
        protected _scale: number = 1;
        // 贴图
        protected _textureZD: Texture; //子弹贴图

        constructor(g: Game, v: Bullet) {
            super(g);
            this._bullet = v;
            this._oid = this._bullet.oid;
            this._skin = this._bullet.skin;
            this._hitSkin = this._bullet.hitSkin;
            this._sortScore = 8;
             // 子弹贴图
            this._textureZD = Loader.getRes(Path_game_buyu.scene_bullet + this._skin + '.png');
            this.texture_url = Path_game_buyu.custom_atlas_yw + this._hitSkin + '.atlas';
            this.update(0);
        }

        update(diff: number): void {
            if (!this.visible || !this._bullet) {
                return;
            }
            // 更新位置
            this._pos.set(this._bullet.pos);
            this._scale = this._bullet.scale;
            // 视图朝向
            this._angle = this._bullet.angle;
        }

        // 绘制
        onMultiDraw(diff: number, gArr: Graphics[], scene: SceneRoot): void {
            if (!this.visible || !this._bullet) {
                return;
            }
            let bg: Graphics = gArr[0];
            let fg: Graphics = gArr[1];
            let pg: Graphics = gArr[2];
            let ng: Graphics = gArr[3];
            let hg: Graphics = gArr[4];

            let texture: Texture;
            switch (this._bullet.state) {
                case gamebuyu.data.BULLET_STATE_FLY:
                    texture = this._textureZD;
                    break;
                case gamebuyu.data.BULLET_STATE_BOMB:
                    texture = this._textures[1];
                    break;
            }
            if (!texture) {
                return;
            }

            let drawX: number = scene.camera.getScenePxByCellX(this._pos.x);
            let drawY: number = scene.camera.getScenePxByCellY(this._pos.y);

            let tw: number = texture.sourceWidth;
            let th: number = texture.sourceHeight;
            let matrix = new Laya.Matrix();
            matrix.tx = - tw / 2;
            matrix.ty = - th / 2;
            matrix.scale(this._scale, this._scale);
            matrix.rotate(this._angle);
            if (scene.camera.flipV) {
                matrix.scale(1, -1);
            }
            matrix.tx += drawX;
            matrix.ty += drawY;
            fg.drawTexture(texture, 0, 0, tw, th, matrix);

            // this.drawHitPoint(diff, pg, scene);
        }

        // 绘制碰撞点
        private drawHitPoint(diff: number, g: Graphics, scene: SceneRoot): void {
            const color = '#FF0000';
            const lineWidth = 2;
            let drawX: number = scene.camera.getScenePxByCellX(this._bullet.pos.x);
            let drawY: number = scene.camera.getScenePxByCellY(this._bullet.pos.y);
            g.drawCircle(drawX, drawY, this._bullet.pos.radius - lineWidth, null, color, lineWidth);
        }

        clear(checkNow: boolean): void {
            super.clear(checkNow);
            this._bullet = null;
            this._textureZD = null;
        }
    }
}