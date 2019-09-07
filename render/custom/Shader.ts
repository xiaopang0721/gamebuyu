/**
* name 
*/
module gamebuyu.render.custom {
	export class UIShaderValue extends Laya.Value2D {
		// 渲染模式
		blendMode: string;
		texcoord: any;
		// 大小数据
		v_size: Array<number> = [];
		// 位置数据
		pos: Array<number> = [];
		// 锚点数据
		pivot: Array<number> = [];
		// 旋转角度
		angle: number = 0;
		// 透明度
		v_alpha: number = 1;
		// 屏幕高宽比
		aspect_ratio: number = 1;

		constructor() {
			super(0, 0);
			let vlen: number = 8 * Laya.CONST3D2D.BYTES_PE;
			//设置在shader程序文件里定义的属性相关描述：【属性长度，属性类型，false，属性起始位置索引*CONST3D2D.BYTES_PE】
			this.position = [2, Laya.WebGLContext.FLOAT, false, vlen, 0];
			this.texcoord = [2, Laya.WebGLContext.FLOAT, false, vlen, 2 * Laya.CONST3D2D.BYTES_PE];
		}
	}

	// ui
	export class UIShader extends Laya.Shader {
		private static _shader: Laya.Shader
		/**
		 *当前着色器的一个实例对象 
		 */
		static get shader(): Laya.Shader {
			if (!this._shader) {
				this._shader = new UIShader();
			}
			return this._shader;
		}
		//顶点着色器程序
		static vsCode: string =
		"attribute vec2 position;\n" +
		"attribute vec2 texcoord;\n" +
		"uniform vec2 size;\n" +
		"uniform vec2 v_size;\n" +
		"uniform vec2 pos;\n" +
		"uniform vec2 pivot;\n" +
		"uniform float angle;\n" +
		"uniform float aspect_ratio;\n" +

		"varying vec2 v_texcoord;\n" +
		"void main(){\n" +
		"	v_texcoord = texcoord;\n" +
		"	float sina=sin(angle);\n" +
		"	float cosa=cos(angle);\n" +
		// 锚点
		"	float pivot_w = v_size.x * (1.0 - pivot.x * 2.0);\n" +
		"	float pivot_h = v_size.y * (1.0 - pivot.y * 2.0);\n" +
		"	vec2 v2Pos1=vec2(position.x * v_size.x + pivot_w, (position.y * v_size.y - pivot_h) * aspect_ratio);\n" +
		"	vec2 v2Pos2=vec2(v2Pos1.x * cosa - v2Pos1.y * sina, v2Pos1.x * sina + v2Pos1.y * cosa);\n" +
		"	v2Pos2.y = v2Pos2.y / aspect_ratio;\n" +
		// 锚点扣回
		"	v2Pos2.x -= pivot_w;\n" +
		"	v2Pos2.y += pivot_h;\n" +
		"   vec4 vt0= vec4(v2Pos2.x + pos.x, v2Pos2.y + pos.y, 0, 1);\n" +
		"   gl_Position = vt0;\n" +
		"}";
		// 片元着色器程序。
		static psCode: string =
		"precision mediump float;\n" +
		"uniform sampler2D texture;\n" +
		"uniform float v_alpha;" +
		"varying vec2 v_texcoord;\n" +

		"void main(void)\n" +
		"{\n" +
		"	vec4 infoUv = texture2D(texture, v_texcoord.xy);\n" +
		"	infoUv.w *= v_alpha;\n" +
		"	infoUv.xyz *= infoUv.w;\n" +
		"	gl_FragColor = infoUv;\n" +
		"}";
		constructor() {
			//顶点着色器程序和片元着色器程序。
			let vsCode: string = UIShader.vsCode;
			let psCode: string = UIShader.psCode;
			super(vsCode, psCode, "UIShader");
		}

		// protected binLocation(): void {
		// 	this._context.bindAttribLocation(this._program, 0, "v3Pos");
		// 	this._context.bindAttribLocation(this._program, 1, "v2uv");
		// }
	}

	export class UVMovShaderValue extends UIShaderValue {
		mov_x: number = 1;
		mov_y: number = 1;
		ratio_x: number = 1;
		ratio_y: number = 1;

		UV: Array<number> = [0, 0, 1, 0, 1, 1, 0, 1];
	}
	// UV动画
	export class UVMovShader extends Laya.Shader {
		private static _shader: Laya.Shader
		/**
		 *当前着色器的一个实例对象 
		 */
		static get shader(): Laya.Shader {
			if (!this._shader) {
				this._shader = new UVMovShader();
			}
			return this._shader;
		}

		constructor() {
			//顶点着色器程序和片元着色器程序。
			let vsCode: string = UIShader.vsCode;
			let psCode: string =
				"precision mediump float;\n" +
				"uniform sampler2D texture;\n" +
				"uniform float v_alpha;" +

				"uniform float UV[8];\n" +

				"varying vec2 v_texcoord;\n" +
				"uniform float mov_x;\n" +
				"uniform float mov_y;\n" +
				"uniform float ratio_x;\n" +
				"uniform float ratio_y;\n" +

				"void main(void)\n" +
				"{\n" +
				// 处理下UV
				"	vec2 temp = vec2(UV[0], UV[1]);\n" +
				"	temp.x += (UV[2]-UV[0]) * v_texcoord.x;\n" +
				"	temp.y += (UV[5]-UV[3]) * v_texcoord.y;\n" +

				"	vec2 uv = vec2(temp.x, temp.y);\n" +
				"	uv.x = fract(uv.x * ratio_x- mov_x);\n" +
				"	uv.y = fract(uv.y * ratio_y + mov_y);\n" +
				"	vec4 infoUv = texture2D(texture, uv.xy);\n" +
				"	infoUv.w *= v_alpha;\n" +
				"	infoUv.xyz *= infoUv.w;\n" +
				"	gl_FragColor = infoUv;\n" +
				"}";
			super(vsCode, psCode, 'UVMovShader');
		}
	}

	export class WaveShaderValue extends UIShaderValue {
		motion: number = 1;
		w_angle: number = 15;
	}
	// 水波
	export class WaveShader extends Laya.Shader {
		private static _shader: Laya.Shader
		/**
		 *当前着色器的一个实例对象 
		 */
		static get shader(): Laya.Shader {
			if (!this._shader) {
				this._shader = new WaveShader();
			}
			return this._shader;
		}

		constructor() {
			//顶点着色器程序和片元着色器程序。
			let vsCode: string = UIShader.vsCode;
			let psCode: string =
				"precision mediump float;\n" +
				"uniform sampler2D texture;\n" +
				"varying vec2 v_texcoord;\n" +
				"uniform float motion;\n" +
				"uniform float v_alpha;\n" +
				"uniform float w_angle;\n" +

				"void main()\n" +
				"{\n" +
				"	vec2 tmp = v_texcoord;\n" +
				"	tmp.x = tmp.x + 0.001 * sin(motion +  tmp.x * w_angle);\n" +
				"	tmp.y = tmp.y + 0.001 * sin(motion +  tmp.y * w_angle);\n" +
				"	vec4 infoUv = texture2D(texture, tmp);\n" +
				"	infoUv.w *= v_alpha;\n" +
				"	infoUv.xyz *= infoUv.w;\n" +
				"	gl_FragColor = infoUv;\n" +
				"}";
			super(vsCode, psCode, "WaveShader");
		}
	}

	export class FELightSweepShaderValue extends UIShaderValue {
		private static _filters: Array<ColorFilter>;
		private static get filters(): Array<ColorFilter> {
			if (!this._filters) {
				this._filters = [new ColorFilter([
					2, 0, 0, 0, 0, //R
					0, .5, 0, 0, 0, //G
					0, 0, .5, 0, 0, //B
					0, 0, 0, 1, 0, //A
				])];
			}
			return this._filters;
		}

		// 控制斜率
		A: number;
		B: number;
		// 控制移动速度
		dx: number;
		dy: number;
		// 控制直线的距离
		radius: number;
		// 控制曝光度
		shineFactor: number;

		time: number;

		UV: Array<number> = [0, 0, 1, 0, 1, 1, 0, 1];

		constructor() {
			super();
			if(this.setFilters && typeof this.setFilters === "function")
			{
				this.setFilters(FELightSweepShaderValue.filters);
			}
		}
	}

	// 扫光
	export class FELightSweepShader extends Laya.Shader {
		private static _shader: Laya.Shader;
		/**
		 *当前着色器的一个实例对象 
		 */
		static get shader(): Laya.Shader {
			if (!this._shader) {
				this._shader = new FELightSweepShader();
			}
			return this._shader;
		}

		constructor() {
			//顶点着色器程序和片元着色器程序。
			let vsCode: string = UIShader.vsCode;
			let psCode: string =
				"precision mediump float;\n" +
				"uniform sampler2D texture;\n" +
				"varying vec2 v_texcoord;\n" +
				"uniform float v_alpha;" +

				"uniform float UV[8];\n" +

				"uniform float time;\n" +
				"uniform float opacity;\n" +

				"uniform float A, B;\n" +
				"uniform float dx, dy;\n" +
				"uniform float radius;\n" +
				"uniform float shineFactor;\n" +

				"uniform vec4 colorAlpha;\n" +
				"uniform mat4 colorMat;\n" +

				"void main(void)\n" +
				"{\n" +
				"	float nowLineC = -A*(dx*time) - B*(dy*time);\n" +
				"	float x = v_texcoord.x;\n" +
				"	float y = v_texcoord.y;\n" +
				"	float allLineC = -A*x - B*y;\n" +
				"	float dist = abs(allLineC - nowLineC) / sqrt(A*A + B*B);\n" +

				// "	vec2 temp = v_texcoord;\n" +
				// 处理下UV
				"	vec2 temp = vec2(UV[0], UV[1]);\n" +
				"	temp.x += (UV[2]-UV[0]) * v_texcoord.x;\n" +
				"	temp.y += (UV[5]-UV[3]) * v_texcoord.y;\n" +

				"	vec4 infoUv = texture2D(texture, temp);\n" +
				"	infoUv.w *= v_alpha;\n" +
				"	infoUv.xyz *= infoUv.w;\n" +

				"	float multi = 1.0;\n" +
				"	float factor = 1.0 - dist/radius;\n" +
				"	if (dist < radius) {\n" +
				"		multi = multi + (shineFactor - 1.0) * factor;\n" +
				"		infoUv.xyz = vec3(infoUv.r, infoUv.g, infoUv.b)*multi;\n" +
				"	}\n" +

				"	gl_FragColor = infoUv;\n" +

				"	mat4 alphaMat =colorMat;\n" +
				"	alphaMat[0][3] *= gl_FragColor.a;\n" +
				"	alphaMat[1][3] *= gl_FragColor.a;\n" +
				"	alphaMat[2][3] *= gl_FragColor.a;\n" +
				"	gl_FragColor = gl_FragColor * alphaMat;\n" +
				"	gl_FragColor += colorAlpha/255.0*gl_FragColor.a;\n" +
				"}";
			super(vsCode, psCode, "FELightSweepShader");
		}
	}

	export class AddSweepShaderValue extends UIShaderValue {

		// 控制斜率
		A: number;
		B: number;
		// 控制移动速度
		dx: number;
		dy: number;
		// 控制直线的距离
		radius: number;
		// 控制曝光度
		shineFactor: number;

		time: number;

		UV: Array<number> = [0, 0, 1, 0, 1, 1, 0, 1];

		constructor() {
			super();
		}
	}

	// 叠加
	export class AddSweepShader extends Laya.Shader {
		private static _shader: Laya.Shader;
		/**
		 *当前着色器的一个实例对象 
		 */
		static get shader(): Laya.Shader {
			if (!this._shader) {
				this._shader = new AddSweepShader();
			}
			return this._shader;
		}

		constructor() {
			//顶点着色器程序和片元着色器程序。
			let vsCode: string = UIShader.vsCode;
			let psCode: string =
				"precision mediump float;\n" +
				"uniform sampler2D texture;\n" +
				"varying vec2 v_texcoord;\n" +
				"uniform float v_alpha;" +

				"uniform float UV[8];\n" +

				"void main(void)\n" +
				"{\n" +

				// "	vec2 temp = v_texcoord;\n" +
				// 处理下UV
				"	vec2 temp = vec2(UV[0], UV[1]);\n" +
				"	temp.x += (UV[2]-UV[0]) * v_texcoord.x;\n" +
				"	temp.y += (UV[5]-UV[3]) * v_texcoord.y;\n" +

				"	vec4 infoUv = texture2D(texture, temp);\n" +
				"	infoUv.w *= v_alpha;\n" +
				"	infoUv.xyz *= infoUv.w;\n" +

				"	gl_FragColor = infoUv;\n" +


				"}";
			super(vsCode, psCode, "AddSweepShader");
		}
	}
}
