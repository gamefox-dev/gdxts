import { YDOWN } from '..';
import {
  Color,
  MathUtils,
  NumberUtil,
  PolygonBatch,
  Screen,
  Shader,
  TextureAtlas,
  Viewport,
  ViewportInputHandler
} from '../lib';

class OutlineBatch extends PolygonBatch {
  private static VS = `
    #ifdef GL_ES
      #define LOWP lowp
      precision highp float;
    #else
      #define LOWP
    #endif
    attribute vec4 ${Shader.POSITION};
    attribute vec4 ${Shader.COLOR};
    attribute vec2 ${Shader.TEXCOORDS};
    uniform mat4 ${Shader.MVP_MATRIX};
    varying vec4 v_color;
    varying vec2 v_texCoords;

    void main () {
      v_color = ${Shader.COLOR};
      v_texCoords = ${Shader.TEXCOORDS};
      gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
    }
  `;
  private static FS = `
    #ifdef GL_ES
      #define LOWP lowp
      precision highp float;
    #else
      #define LOWP
    #endif
    varying vec4 v_color;
    varying vec2 v_texCoords;
    uniform sampler2D u_texture;
    uniform mat4 ${Shader.MVP_MATRIX};

    #define FLOAT_MAX  1.70141184e38
    #define FLOAT_MIN  1.17549435e-38

    lowp vec4 encode_float(highp float v) {
      highp float av = abs(v);

      //Handle special cases
      if(av < FLOAT_MIN) {
        return vec4(1.0, 1.0, 1.0, 1.0);
      } else if(v > FLOAT_MAX) {
        return vec4(127.0, 128.0, 0.0, 0.0) / 255.0;
      } else if(v < -FLOAT_MAX) {
        return vec4(255.0, 128.0, 0.0, 0.0) / 255.0;
      }

      highp vec4 c = vec4(0,0,0,0);

      //Compute exponent and mantissa
      highp float e = floor(log2(av));
      highp float m = av * pow(2.0, -e) - 1.0;
      
      //Unpack mantissa
      c[1] = floor(128.0 * m);
      m -= c[1] / 128.0;
      c[2] = floor(32768.0 * m);
      m -= c[2] / 32768.0;
      c[3] = floor(8388608.0 * m);
      
      //Unpack exponent
      highp float ebias = e + 127.0;
      c[0] = floor(ebias / 2.0);
      ebias -= c[0] * 2.0;
      c[1] += floor(ebias) * 128.0; 

      //Unpack sign bit
      c[0] += 128.0 * step(0.0, -v);

      //Scale back to range
      return c / 256.0;
    }


    void main () {
      float a = v_color.a;
      if (a != 0.0) {
        gl_FragColor = v_color * texture2D(u_texture, v_texCoords);
        return;
      }
      vec4 outlineColor = encode_float(v_color.r);

      const float Pi = 6.28318530718; // Pi*2
    
      // GAUSSIAN BLUR SETTINGS {{{
      const float Directions = 16.0; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
      const float Quality = 4.0; // BLUR QUALITY (Default 4.0 - More is better but slower)
      float Size = v_color.g; // BLUR SIZE (Radius)
      // GAUSSIAN BLUR SETTINGS }}}
     
      vec4 Radius4 = ${Shader.MVP_MATRIX} * vec4(Size, Size, 0.0, 0.0);
      vec2 Radius = Radius4.xy;
      
      // Normalized pixel coordinates (from 0 to 1)
      vec2 uv = v_texCoords;
      // Pixel colour
      vec4 Color = texture2D(u_texture, uv);
      
      // Blur calculations
      for( float d=0.0; d<Pi; d+=Pi/Directions)
      {
        for(float i=1.0/Quality; i<=1.0; i+=1.0/Quality)
        {
          Color += texture2D( u_texture, uv+vec2(cos(d),sin(d))*Radius*i);		
        }
      }
      
      // Output to screen
      Color /= Quality * Directions - 15.0;
      gl_FragColor = outlineColor * Color.a;
    }
  `;

  private previousColor: Color = new Color(1, 1, 1, 1);
  private tmpColor: Color = new Color(1, 1, 1, 1);

  constructor(context: WebGLRenderingContext, twoColorTint: boolean = false, maxVertices: number = 10920) {
    super(context, twoColorTint, maxVertices);
    this.setShader(new Shader(context, OutlineBatch.VS, OutlineBatch.FS));
  }

  private normalizeColorNumber(n: number): number {
    n = MathUtils.clamp(n, 0.1, 0.9);
    return ~~(n * 255);
  }

  setOutlineInfo(enabled: boolean, color?: Color, blurSize?: number) {
    if (!enabled) {
      this.setColor(this.previousColor);
      this.previousColor.setFromColor(Color.WHITE);
      return;
    }
    this.previousColor.setFromColor(this.color);
    const packedColor = NumberUtil.colorToFloat(
      this.normalizeColorNumber(color.r),
      this.normalizeColorNumber(color.g),
      this.normalizeColorNumber(color.b),
      this.normalizeColorNumber(color.a)
    );
    this.tmpColor.unsafeSet(packedColor, blurSize, 0, 0);
    this.setColor(this.tmpColor);
  }
}

export const createTestOutlineScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();

  const batch = new OutlineBatch(gl);
  batch.setYDown(YDOWN);

  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const gems: any[] = [];

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      gems.push({
        x: x * 55,
        y: y * 55 + 5,
        type: Math.floor(Math.random() * 4),
        offsetAngle: Math.random() * Math.PI * 2
      });
    }
  }

  const atlas = await TextureAtlas.load(gl, './gem.atlas');
  const inputHandler = new ViewportInputHandler(viewport);

  const nextColor = new Color(0, 1, 1, 1);
  const color = new Color(1, 1, 1, 1);

  let accumulate = 0;
  const STEP = 0.5;

  const randomNext = () => {
    accumulate = 0;
    nextColor.set(Math.random(), Math.random(), Math.random(), 1);
  };

  const smoothTransition = (n: number, target: number) => n + (target - n) * 0.1;
  let angle = 0;

  return {
    update(delta) {
      if (inputHandler.isTouched()) {
        const coord = inputHandler.getTouchedWorldCoord(camera);
        gems.push({
          x: coord.x - 25,
          y: coord.y - 25,
          type: Math.floor(Math.random() * 4),
          offsetAngle: Math.random() * Math.PI * 2
        });
      }
      angle += Math.PI * 2 * delta;

      accumulate += delta;
      if (accumulate > STEP) {
        randomNext();
      }

      color.r = smoothTransition(color.r, nextColor.r);
      color.g = smoothTransition(color.g, nextColor.g);
      color.b = smoothTransition(color.b, nextColor.b);

      batch.setProjection(camera.combined);
      batch.begin();
      // atlas.findRegion('gem_01', 1).draw(batch, 0, 0, 300, 300);
      batch.setOutlineInfo(true, color, 3);
      for (let gem of gems) {
        atlas
          .findRegion(`gem_0${gem.type + 1}`, 1)
          .draw(batch, gem.x, gem.y, 50, 50, 25, 25, angle + gem.offsetAngle, 1.2, 1.2);
      }
      batch.setOutlineInfo(false);
      for (let gem of gems) {
        atlas.findRegion(`gem_0${gem.type + 1}`, 1).draw(batch, gem.x, gem.y, 50, 50, 25, 25, angle + gem.offsetAngle);
      }
      batch.end();
    },
    dispose() {
      batch.dispose();
      atlas.dispose();
      inputHandler.cleanup();
    }
  };
};
