import { Attributes, BlendingAttribute, FloatAttribute, TextureAttribute, Usage } from '../attributes';
import { Camera } from '../Camera';
import { GL20 } from '../GL20';
import { Renderable } from '../Renderable';
import { RenderContext } from '../RenderContext';
import { DefaultShader, DefaultShaderConfig } from './DefaultShader';

export class DepthShaderConfig extends DefaultShaderConfig {
  public depthBufferOnly = false;
  public defaultAlphaTest = 0.5;

  constructor(vertexShader: string = '', fragmentShader: string = '') {
    super(vertexShader, fragmentShader);
    this.defaultCullFace = GL20.GL_FRONT;
  }
}
export class DepthShader extends DefaultShader {
  private static defaultVertex: string = `
    attribute vec3 a_position;
    uniform mat4 u_projViewWorldTrans;

    #if defined(diffuseTextureFlag) && defined(blendedFlag)
    #define blendedTextureFlag
    attribute vec2 a_texCoord0;
    varying vec2 v_texCoords0;
    #endif


    #ifdef boneWeight0Flag
    #define boneWeightsFlag
    attribute vec2 a_boneWeight0;
    #endif //boneWeight0Flag

    #ifdef boneWeight1Flag
    #ifndef boneWeightsFlag
    #define boneWeightsFlag
    #endif
    attribute vec2 a_boneWeight1;
    #endif //boneWeight1Flag

    #ifdef boneWeight2Flag
    #ifndef boneWeightsFlag
    #define boneWeightsFlag
    #endif
    attribute vec2 a_boneWeight2;
    #endif //boneWeight2Flag

    #ifdef boneWeight3Flag
    #ifndef boneWeightsFlag
    #define boneWeightsFlag
    #endif
    attribute vec2 a_boneWeight3;
    #endif //boneWeight3Flag

    #ifdef boneWeight4Flag
    #ifndef boneWeightsFlag
    #define boneWeightsFlag
    #endif
    attribute vec2 a_boneWeight4;
    #endif //boneWeight4Flag

    #ifdef boneWeight5Flag
    #ifndef boneWeightsFlag
    #define boneWeightsFlag
    #endif
    attribute vec2 a_boneWeight5;
    #endif //boneWeight5Flag

    #ifdef boneWeight6Flag
    #ifndef boneWeightsFlag
    #define boneWeightsFlag
    #endif
    attribute vec2 a_boneWeight6;
    #endif //boneWeight6Flag

    #ifdef boneWeight7Flag
    #ifndef boneWeightsFlag
    #define boneWeightsFlag
    #endif
    attribute vec2 a_boneWeight7;
    #endif //boneWeight7Flag

    #if defined(numBones) && defined(boneWeightsFlag)
    #if (numBones > 0) 
    #define skinningFlag
    #endif
    #endif

    #if defined(numBones)
    #if numBones > 0
    uniform mat4 u_bones[numBones];
    #endif //numBones
    #endif

    #ifdef PackedDepthFlag
    varying float v_depth;
    #endif //PackedDepthFlag

    void main() {
      #ifdef blendedTextureFlag
        v_texCoords0 = a_texCoord0;
      #endif // blendedTextureFlag
      
      #ifdef skinningFlag
        mat4 skinning = mat4(0.0);
        #ifdef boneWeight0Flag
          skinning += (a_boneWeight0.y) * u_bones[int(a_boneWeight0.x)];
        #endif //boneWeight0Flag
        #ifdef boneWeight1Flag				
          skinning += (a_boneWeight1.y) * u_bones[int(a_boneWeight1.x)];
        #endif //boneWeight1Flag
        #ifdef boneWeight2Flag		
          skinning += (a_boneWeight2.y) * u_bones[int(a_boneWeight2.x)];
        #endif //boneWeight2Flag
        #ifdef boneWeight3Flag
          skinning += (a_boneWeight3.y) * u_bones[int(a_boneWeight3.x)];
        #endif //boneWeight3Flag
        #ifdef boneWeight4Flag
          skinning += (a_boneWeight4.y) * u_bones[int(a_boneWeight4.x)];
        #endif //boneWeight4Flag
        #ifdef boneWeight5Flag
          skinning += (a_boneWeight5.y) * u_bones[int(a_boneWeight5.x)];
        #endif //boneWeight5Flag
        #ifdef boneWeight6Flag
          skinning += (a_boneWeight6.y) * u_bones[int(a_boneWeight6.x)];
        #endif //boneWeight6Flag
        #ifdef boneWeight7Flag
          skinning += (a_boneWeight7.y) * u_bones[int(a_boneWeight7.x)];
        #endif //boneWeight7Flag
      #endif //skinningFlag

      #ifdef skinningFlag
        vec4 pos = u_projViewWorldTrans * skinning * vec4(a_position, 1.0);
      #else
        vec4 pos = u_projViewWorldTrans * vec4(a_position, 1.0);
      #endif

      #ifdef PackedDepthFlag
        v_depth = pos.z / pos.w * 0.5 + 0.5;
      #endif //PackedDepthFlag

      gl_Position = pos;
    }
   `;

  private static defaultFragment: string = `
    #ifdef GL_ES 
    #define LOWP lowp
    #define MED mediump
    #define HIGH highp
    precision mediump float;
    #else
    #define MED
    #define LOWP
    #define HIGH
    #endif

    #if defined(diffuseTextureFlag) && defined(blendedFlag)
    #define blendedTextureFlag
    varying MED vec2 v_texCoords0;
    uniform sampler2D u_diffuseTexture;
    uniform float u_alphaTest;
    #endif

    #ifdef PackedDepthFlag
    varying HIGH float v_depth;
    #endif //PackedDepthFlag

    void main() {
      #ifdef blendedTextureFlag
        if (texture2D(u_diffuseTexture, v_texCoords0).a < u_alphaTest)
          discard;
      #endif // blendedTextureFlag
      
      #ifdef PackedDepthFlag
        HIGH float depth = v_depth;
        const HIGH vec4 bias = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
        HIGH vec4 color = vec4(depth, fract(depth * 255.0), fract(depth * 65025.0), fract(depth * 16581375.0));
        gl_FragColor = color - (color.yzww * bias);
      #endif //PackedDepthFlag
    }
   `;

  public static getDefaultVertexShader(): string {
    return DepthShader.defaultVertex;
  }

  public static getDefaultFragmentShader(): string {
    return DepthShader.defaultFragment;
  }

  public static createPrefix(renderable: Renderable, config: DepthShaderConfig) {
    let prefix = DefaultShader.createPrefix(renderable, config);
    if (!config.depthBufferOnly) prefix += '#define PackedDepthFlag\n';
    return prefix;
  }

  public numBones: number;
  public weights: number;
  private alphaTestAttribute: FloatAttribute;

  constructor(
    gl: WebGLRenderingContext,
    renderable: Renderable,
    config: DepthShaderConfig,
    prefix: string = '',
    vertexShader: string = '',
    fragmentShader: string = ''
  ) {
    super(gl, renderable, config, prefix, vertexShader, fragmentShader);
    const attributes = DepthShader.combineDepthAttributes(renderable);

    if (!!renderable.bones && renderable.bones.length > config.numBones) {
      throw new Error('too many bones: ' + renderable.bones.length + ', max configured: ' + config.numBones);
    }

    this.numBones = !renderable.bones ? 0 : config.numBones;
    let w = 0;
    const n = renderable.meshPart.mesh.getVertexAttributes().size();
    for (let i = 0; i < n; i++) {
      const attr = renderable.meshPart.mesh.getVertexAttributes().get(i);
      if (attr.usage == Usage.BoneWeight) w |= 1 << attr.unit;
    }
    this.weights = w;
    this.alphaTestAttribute = new FloatAttribute(FloatAttribute.AlphaTest, config.defaultAlphaTest);
  }

  public begin(camera: Camera, context: RenderContext) {
    super.begin(camera, context);
  }

  public end() {
    super.end();
  }

  public canRender(renderable: Renderable): boolean {
    if (!!renderable.bones && renderable.bones.length > this.numBones) return false;
    const attributes = DepthShader.combineDepthAttributes(renderable);
    if (attributes.has(BlendingAttribute.Type)) {
      if ((this.attributesMask & BlendingAttribute.Type) != BlendingAttribute.Type) return false;
      if (
        attributes.has(TextureAttribute.Diffuse) !=
        ((this.attributesMask & TextureAttribute.Diffuse) == TextureAttribute.Diffuse)
      )
        return false;
    }
    const skinned = (renderable.meshPart.mesh.getVertexAttributes().getMask() & Usage.BoneWeight) == Usage.BoneWeight;
    return skinned == this.weights > 0;
  }

  public renderWithCombinedAttributes(renderable: Renderable, combinedAttributes: Attributes) {
    if (combinedAttributes.has(BlendingAttribute.Type)) {
      const blending = combinedAttributes.get(BlendingAttribute.Type) as BlendingAttribute;
      combinedAttributes.remove(BlendingAttribute.Type);
      const hasAlphaTest = combinedAttributes.has(FloatAttribute.AlphaTest);
      if (!hasAlphaTest) combinedAttributes.set(this.alphaTestAttribute);
      if (blending.opacity >= (combinedAttributes.get(FloatAttribute.AlphaTest) as FloatAttribute).value)
        super.renderWithCombinedAttributes(renderable, combinedAttributes);
      if (!hasAlphaTest) combinedAttributes.remove(FloatAttribute.AlphaTest);
      combinedAttributes.set(blending);
    } else super.renderWithCombinedAttributes(renderable, combinedAttributes);
  }

  // TODO: Move responsibility for combining attributes to RenderableProvider
  private static combineDepthAttributes(renderable: Renderable): Attributes {
    DepthShader.tmpAttributes.clear();
    if (!!renderable.environment) DepthShader.tmpAttributes.setAttributes(renderable.environment.getAttributes());
    if (!!renderable.material) DepthShader.tmpAttributes.setAttributes(renderable.material.getAttributes());
    return DepthShader.tmpAttributes;
  }
}
