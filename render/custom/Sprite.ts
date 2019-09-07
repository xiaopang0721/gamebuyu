/**
* name 
*/
module gamebuyu.render.custom {
    import WebGLContext = laya.webgl.WebGLContext;
    import BlendMode = Laya.BlendMode;
    import IndexBuffer2D = Laya.IndexBuffer2D;
    import VertexBuffer2D = Laya.VertexBuffer2D;
    import Shader = Laya.Shader;

    // 自定义
    export class CSprite extends Laya.Sprite {
        private static _vertexBuffer: VertexBuffer2D;
        // 公用的顶点&纹理坐标缓冲区
        static getVertexBuffer(): VertexBuffer2D {
            if (!this._vertexBuffer) {
                this._vertexBuffer = VertexBuffer2D.create();
                this._vertexBuffer.append(new Float32Array([
                    -1, 1, 0, 0, 1, 1, 1, 1,
                    1, 1, 1, 0, 1, 1, 1, 1,
                    1, -1, 1, 1, 1, 1, 1, 1,
                    -1, -1, 0, 1, 1, 1, 1, 1,
                ]));
            }
            return this._vertexBuffer;
        }
        private static _indexBuffer: IndexBuffer2D;
        // 公用的顶点缓冲区
        static getIndexBuffer(): IndexBuffer2D {
            if (!this._indexBuffer) {
                this._indexBuffer = IndexBuffer2D.create();
                this._indexBuffer.append(new Uint16Array([0, 1, 2, 0, 2, 3]));
            }
            return this._indexBuffer;
        }

        // 着色器参数
        protected _shader: Shader;
        // 着色器参数
        protected _shaderValue: UIShaderValue;
		/**
		 * 顶点&纹理坐标信息
		 */
        protected _vertices: Array<number>;
		/**
		 * 顶点数据
		 */
        protected _indexs: Array<number>;
		/**
		 * 顶点缓冲区(顶点&纹理颜色等)
		 */
        protected _vertexBuffer: VertexBuffer2D;
        get vertexBuffer(): VertexBuffer2D {
            if (!this._vertexBuffer) {
                if (this._vertices) {
                    this._vertexBuffer = VertexBuffer2D.create();
                    this._vertexBuffer.append(new Float32Array(this._vertices));
                }
                else {
                    this._vertexBuffer = CSprite.getVertexBuffer();
                }
            }
            return this._vertexBuffer;
        }
		/**
		 * 片元缓冲区
		 */
        protected _indexBuffer: IndexBuffer2D;
        get indexBuffer(): IndexBuffer2D {
            if (!this._indexBuffer) {
                if (this._indexs) {
                    this._indexBuffer = IndexBuffer2D.create();
                    this._indexBuffer.append(new Uint16Array(this._indexs));
                }
                else {
                    this._indexBuffer = CSprite.getIndexBuffer();
                }
            }
            return this._indexBuffer;
        }
        protected indexNum: number = 0;

        private _scaleX: number = 1;
        set scaleX(v: number) {
            this._scaleX = v;
        }
        get scaleX(): number {
            return this._scaleX;
        }

        private _scaleY: number = 1;
        set scaleY(v: number) {
            this._scaleY = v;
        }
        get scaleY(): number {
            return this._scaleY;
        }

        scale(scaleX: number, scaleY: number, speedMode?: boolean): Sprite {
            this._scaleX = scaleX;
            this._scaleY = scaleY;
            return this;
        }
        /**旋转角度，默认值为0。以角度为单位。*/
        private _rotation: number = 0;
        set rotation(v: number) {
            this._rotation = v;
        }
        get rotation(): number {
            return this._rotation;
        }

        constructor(texture: Texture) {
            super();
            this.customRenderEnable = true;
            if (texture)
                this.initData(texture);
        }

		/**
		 * 初始化数据
		 */
        public initData(texture: Texture): void {
            this.indexNum = 6;
            this._width = texture.sourceWidth;
            this._height = texture.sourceHeight;
            this._shader = this.createShader();
            this._shaderValue = this.createShaderValue();
            this._shaderValue.textureHost = texture;
        }

        protected createShader(): Shader {
            return UIShader.shader;
        }

        protected createShaderValue(): UIShaderValue {
            return new UIShaderValue();
        }


        customRender(context: Laya.RenderContext, x: number, y: number): void {
            // 只要自定义渲染
            this._renderType = laya.renders.RenderSprite.CUSTOM;
            this.update();
            let webGLContext = context.ctx as Laya.WebGLContext2D;
            let oldBlendType = webGLContext.globalCompositeOperation;
            let curBlendType = (this._shaderValue && this._shaderValue.blendMode) || this.blendMode;
            curBlendType && (webGLContext.globalCompositeOperation = curBlendType);
            this._shaderValue && webGLContext.setIBVB && (typeof webGLContext.setIBVB === 'function') && webGLContext.setIBVB(0, 0, this.indexBuffer, this.vertexBuffer, this.indexNum, null, this._shader, this._shaderValue, 0, 0);
            curBlendType && (webGLContext.globalCompositeOperation = oldBlendType);
        }

        update(): void {
            this.updateTransform();
        }

		/**
		 * 更新变换信息
		 */
        protected updateTransform(x?: number, y?: number, width?: number, height?: number, angle?: number, alpha?: number, shaderValue?: UIShaderValue): void {
            !x && (x = 0);
            !y && (y = 0);
            !width && (width = this._width);
            !height && (height = this._height);
            !angle && (angle = 2 * Math.PI - Math.PI * Number(this.rotation / 180));
            !alpha && (alpha = this.alpha);
            !shaderValue && (shaderValue = this._shaderValue);

            if (!shaderValue) return;
            // 画布大小
            let canvasWidth = Laya.Render._mainCanvas.width;
            let canvasHeight = Laya.Render._mainCanvas.height;
            let parent = this.parent as Sprite;
            // 大小(全局缩放&换算屏幕比) 注意：顶点映射到全屏的单位为2   
            shaderValue.v_size[0] = width * parent.globalScaleX * this._scaleX / canvasWidth;
            shaderValue.v_size[1] = height * parent.globalScaleY * this._scaleY / canvasHeight;
            // 位置
            let p = Point.TEMP.setTo(x, y);
            this.localToGlobal(p);
            // 转换到顶点坐标系
            p.y = -p.y;
            // 换算屏幕比&转UI坐标系&计算锚点
            let w = shaderValue.v_size[0] * 2;
            let h = shaderValue.v_size[1] * 2;
            shaderValue.pos[0] = -1 + p.x / (canvasWidth / 2) + (.5 - this.pivotX) * w;
            shaderValue.pos[1] = 1 + p.y / (canvasHeight / 2) + (-.5 + this.pivotY) * h;
            // 锚点
            shaderValue.pivot[0] = this.pivotX;
            shaderValue.pivot[1] = this.pivotY;
            // 角度
            shaderValue.angle = angle;
            // 透明度
            shaderValue.v_alpha = alpha;
            // 屏幕高宽比
            shaderValue.aspect_ratio = canvasHeight / canvasWidth;
        }

		/**
		 * 释放
		 */
        dispose(): void {
            if (this._shaderValue) {
                this._shaderValue.clear();
                this._shaderValue = null;
            }
        }
    }

    // UV动画
    export class UVMovSprite extends CSprite {
        // 开始时间
        protected _startTimer: number;

        protected _speedX: number = 1;
		/**
		 * x轴速度 百分比/s
		 */
        set speedX(v: number) {
            this._speedX = v;
        }

        protected _speedY: number = 1;
		/**
		 * y轴速度 百分比/s
		 */
        set speedY(v: number) {
            this._speedY = v;
        }

		/**
		 * 设置滚动的单位宽度（控制贴图被拉长）
		 */
        set unitWidth(v: number) {
            let value = <UVMovShaderValue>this._shaderValue;
            value.ratio_x = this.width / v;
        }

		/**
		 * 设置滚动的单位高度（控制贴图被拉长）
		 */
        set unitHeight(v: number) {
            let value = <UVMovShaderValue>this._shaderValue;
            value.ratio_y = this.height / v;
        }

        constructor(texture: Texture) {
            super(texture);
            this._startTimer = Laya.timer.currTimer;
        }

        protected createShader(): Shader {
            return UVMovShader.shader;
        }

        protected createShaderValue(): UIShaderValue {
            return new UVMovShaderValue();
        }

        update(): void {
            super.update();
            let time = Laya.timer.currTimer - this._startTimer;
            let value = <UVMovShaderValue>this._shaderValue;
            value.mov_x = time * this._speedX / 1000;
            value.mov_y = time * this._speedY / 1000;
            value.mov_x -= Math.floor(value.mov_x);
            value.mov_y -= Math.floor(value.mov_y);
        }
    }

    // 水波
    export class WaveSprite extends CSprite {
        private _motion: number;
        private _needWave: boolean = true;

        constructor(texture: Texture) {
            super(texture);
            this._motion = 0;
            this._needWave = true;
        }

        /**是否波动 */
        set needWave(value: boolean) {
            this._needWave = value;
            if (!value) {
                this._motion = 0;
            }
        }

        protected createShader(): Shader {
            return WaveShader.shader;
        }

        protected createShaderValue(): UIShaderValue {
            return new WaveShaderValue();
        }

        update(): void {
            super.update();
            let value = <WaveShaderValue>this._shaderValue;
            if (value && this._needWave) {//帧率过低水波就不动了
                value.motion = this._motion;
                this._motion += 0.05;
                if (this._motion > 1.0e20) {
                    this._motion = 0.0;
                }
            }

        }
    }


    class Lightning {
        startTime: number;
        endTime: number;
        // 引用坐标不可修改
        startPos: Vector2;
        endPos: Vector2;
        // 着色器参数
        shaderValue: UVMovShaderValue;
    }

    // 电层
    export class LightningSprite extends UVMovSprite {
        private static _time: number = 1200;
        private static _frameTime: number = 1000 / 12;

        private _datas: Array<Lightning> = [];
        private _camera: Camera;

        private _unitWidth: number;
        private _unitHeight: number;

        private _ballsSprite: Sprite;

        private _drawStarPoss: Array<Vector2> = [];

        private _sbTextures: Array<Texture> = [];
        private _dbTextures: Array<Texture> = [];

        constructor(texture: Texture, camera: Camera, ballsSprite: Sprite) {
            super(texture);
            this._ballsSprite = ballsSprite;
            this._ballsSprite.blendMode = Laya.BlendMode.ADD;
            this._camera = camera;

            // 获取贴图
            let tex: Texture;
            let idx = 1;
            do {
                let url = Path.scene + 'lightning/sb_' + idx + '.png';
                tex = Loader.getRes(url);
                if (tex) {
                    this._sbTextures.push(tex);
                    idx++;
                }
                else {
                    break;
                }
            }
            while (true);

            idx = 1;
            do {
                let url = Path.scene + 'lightning/db_' + idx + '.png';
                tex = Loader.getRes(url);
                if (tex) {
                    this._dbTextures.push(tex);
                    idx++;
                }
                else {
                    break;
                }
            }
            while (true);


            this.frameLoop(1, this, this.drawBalls);
        }

		/**
		 * 设置滚动的单位宽度（控制贴图被拉长）
		 */
        set unitWidth(v: number) {
            this._unitWidth = v;
        }

		/**
		 * 设置滚动的单位高度（控制贴图被拉长）
		 */
        set unitHeight(v: number) {
            this._unitHeight = v;
        }

        protected createShader(): Shader {
            return UVMovShader.shader;
        }

        protected createShaderValue(): UIShaderValue {
            return new UVMovShaderValue();
        }

        add(startPos: Vector2, endPos: Vector2, delay: number) {
            let data = new Lightning();
            data.startPos = startPos;
            data.endPos = endPos;
            data.startTime = Laya.timer.currTimer + delay;
            data.endTime = data.startTime + LightningSprite._time;
            data.shaderValue = new UVMovShaderValue();
            data.shaderValue.blendMode = Laya.BlendMode.ADD;
            data.shaderValue.textureHost = this._shaderValue.textureHost;
            this._datas.push(data);
        }


        private drawBalls(): void {
            let currTimer = Laya.timer.currTimer;
            this._ballsSprite.graphics.clear();
            for (let i = 0; i < this._datas.length;) {
                let data = this._datas[i];
                if (!data) continue;
                if (data.endTime < currTimer) {
                    this._datas.splice(i, 1);
                }
                else if (currTimer < data.startTime) {
                    i++;
                    continue;
                }
                else {
                    let idx = Math.floor((currTimer - data.startTime) / LightningSprite._frameTime);
                    let dx: number, dy: number;
                    let tw: number = 0, th: number = 0;
                    let texture: Texture;
                    // 绘制原始球
                    if (this._drawStarPoss.indexOf(data.startPos) == -1) {
                        this._drawStarPoss.push(data.startPos);
                        texture = this._sbTextures[idx % this._sbTextures.length];
                        if (texture) {
                            tw = texture.sourceWidth;
                            th = texture.sourceHeight;
                            dx = this._camera.getScenePxByCellX(data.startPos.x) - tw / 2;
                            dy = this._camera.getScenePxByCellY(data.startPos.y) - th / 2;
                            this._ballsSprite.graphics.drawTexture(texture, dx, dy, tw, th);
                        }

                    }
                    // 绘制目标球
                    texture = this._dbTextures[idx % this._dbTextures.length];
                    if (texture) {
                        tw = texture.sourceWidth;
                        th = texture.sourceHeight;
                        dx = this._camera.getScenePxByCellX(data.endPos.x) - tw / 2;
                        dy = this._camera.getScenePxByCellY(data.endPos.y) - th / 2;
                        this._ballsSprite.graphics.drawTexture(texture, dx, dy, tw, th);
                    }
                    i++;
                }
            }
            this._drawStarPoss.length = 0;
        }

        update(): void {

            let currTimer = Laya.timer.currTimer;
            let time = currTimer - this._startTimer;
            let speedx = time * this._speedX / 1000;
            let speedy = time * this._speedY / 1000;
            speedx -= Math.floor(speedx);
            speedy -= Math.floor(speedy);

            // 更新数据
            let len = this._datas ? this._datas.length : 0;
            for (let i = 0; i < len; i++) {
                let data = this._datas[i];
                if (!data) continue;
                if (currTimer < data.startTime) {
                    continue;
                }
                data.shaderValue.mov_x = speedx;
                data.shaderValue.mov_y = speedy;
                data.shaderValue.UV = data.shaderValue.textureHost.uv;

                let x = this._camera.getScenePxByCellX(data.startPos.x);
                let y = this._camera.getScenePxByCellY(data.startPos.y);
                let height = data.startPos.dist(data.endPos);
                Vector2.temp.set(data.startPos).sub(data.endPos);
                if (!this._camera.flipV) {
                    Vector2.temp.y = -Vector2.temp.y;
                }
                this._unitWidth && (data.shaderValue.ratio_x = data.shaderValue.textureHost.width / this._unitWidth);
                this._unitHeight && (data.shaderValue.ratio_y = height / this._unitHeight);
                this.updateTransform(x, y, null, height, Vector2.temp.angle(Vector2.down) + Math.PI / 2, null, data.shaderValue);
                let webGLContext = laya.renders.Render.context.ctx as Laya.WebGLContext2D;
                let oldBlendType = webGLContext.globalCompositeOperation;
                let curBlendType = this._shaderValue.blendMode || this.blendMode;
                curBlendType && (webGLContext.globalCompositeOperation = curBlendType);
                (typeof webGLContext.setIBVB === 'function') && webGLContext.setIBVB(0, 0, this.indexBuffer, this.vertexBuffer, this.indexNum, null, this._shader, data.shaderValue, 0, 0);
                curBlendType && (webGLContext.globalCompositeOperation = oldBlendType);
            }
        }

        customRender(context: Laya.RenderContext, x: number, y: number): void {
            // 只要自定义渲染
            this._renderType = laya.renders.RenderSprite.CUSTOM;
            this.update();
        }
    }

    // 扫光
    export class FELightSweepSprite extends CSprite {

        constructor(texture: Texture) {
            super(texture);
        }

        protected createShader(): Shader {
            return FELightSweepShader.shader;
        }

        protected createShaderValue(): UIShaderValue {
            return new FELightSweepShaderValue();
        }

        public initData(texture: Texture): void {
            super.initData(texture);
            let value = <FELightSweepShaderValue>this._shaderValue;
            value.A = 1;
            value.B = .5;
            value.dx = 6;
            value.dy = 0;
            value.radius = .2;
            value.shineFactor = 1.75;
        }

        update(): void {
            super.update();
            let value = <FELightSweepShaderValue>this._shaderValue;
            value.time = Laya.timer.currTimer / 1000 % 1;
        }

    }
}