import { Matrix4 } from '../../Matrix4';
import { Quaternion } from '../../Quaternion';
import { Color } from '../../Utils';
import { Vector2 } from '../../Vector2';
import { Vector3 } from '../../Vector3';
import { VertexAttribute } from '../attributes/VertexAttribute';
import { GL20 } from '../GL20';
import { ModelData } from '../model/data/ModelData';
import { ModelMaterial } from '../model/data/ModelMaterial';
import { ModelMesh } from '../model/data/ModelMesh';
import { ModelMeshPart } from '../model/data/ModelMeshPart';
import { ModelNode } from '../model/data/ModelNode';
import { ModelNodePart } from '../model/data/ModelNodePart';
import { ModelTexture } from '../model/data/ModelTexture';
import { Model } from '../model/Model';
import { UBJsonReader } from './UBJsonReader';

export class G3dModelLoader {
  public static VERSION_HI = 0;
  public static VERSION_LO = 1;
  private reader: UBJsonReader;

  constructor() {
    this.reader = new UBJsonReader();
  }

  public async load(gl: WebGLRenderingContext, fileName: string): Promise<Model> {
    const shipData = await this.parseModel(fileName);
    const shipModel = new Model(gl);
    await shipModel.load(shipData);
    return shipModel;
  }

  public async parseModel(fileName: string): Promise<ModelData> {
    var path = fileName.substring(0, fileName.lastIndexOf('/'));
    const buffer = await fetch(fileName).then(res => res.arrayBuffer());
    const json = this.reader.parse(buffer);

    const model = new ModelData();
    const version = json['version'];
    model.version[0] = version[0];
    model.version[1] = version[1];
    if (model.version[0] !== G3dModelLoader.VERSION_HI || model.version[1] !== G3dModelLoader.VERSION_LO)
      throw new Error('Model version not supported');

    model.id = this.getString(json['id'], '');
    this.parseMeshes(model, json);
    this.parseMaterials(model, json, path);
    this.parseNodes(model, json);
    this.parseAnimations(model, json);
    return model;
  }

  protected parseMeshes(model: ModelData, json: any) {
    const meshes = json['meshes'];
    if (meshes !== undefined) {
      for (const mesh of meshes) {
        const jsonMesh = new ModelMesh();
        const id = this.getString(mesh['id'], '');
        jsonMesh.id = id;
        const attributes = mesh['attributes'];
        jsonMesh.attributes = this.parseAttributes(attributes);
        jsonMesh.vertices = mesh['vertices'];
        const meshParts = mesh['parts'];
        const parts = new Array<ModelMeshPart>();
        for (const meshPart of meshParts) {
          const jsonPart = new ModelMeshPart();
          const partId = this.getString(meshPart['id'], null);
          if (partId === null) {
            throw new Error('Not id given for mesh part');
          }
          for (const other of parts) {
            if (other.id === partId) {
              throw new Error("Mesh part with id '" + partId + "' already in defined");
            }
          }
          jsonPart.id = partId;
          const type = this.getString(meshPart['type'], null);
          if (type === null) {
            throw new Error("No primitive type given for mesh part '" + partId + "'");
          }
          jsonPart.primitiveType = this.parseType(type);
          jsonPart.indices = meshPart['indices'];
          parts.push(jsonPart);
        }
        jsonMesh.parts = parts;
        model.meshes.push(jsonMesh);
      }
    }
  }

  protected parseType(type: string) {
    if (type === 'TRIANGLES') {
      return GL20.GL_TRIANGLES;
    } else if (type === 'LINES') {
      return GL20.GL_LINES;
    } else if (type === 'POINTS') {
      return GL20.GL_POINTS;
    } else if (type === 'TRIANGLE_STRIP') {
      return GL20.GL_TRIANGLE_STRIP;
    } else if (type === 'LINE_STRIP') {
      return GL20.GL_LINE_STRIP;
    } else {
      throw new Error(
        "Unknown primitive type '" +
          type +
          "', should be one of triangle, trianglestrip, line, linestrip, lineloop or point"
      );
    }
  }

  protected parseAttributes(attributes: any): VertexAttribute[] {
    const vertexAttributes = new Array<VertexAttribute>();
    let unit = 0;
    let blendWeightCount = 0;
    for (const attr of attributes) {
      if (attr === 'POSITION') {
        vertexAttributes.push(VertexAttribute.Position());
      } else if (attr === 'NORMAL') {
        vertexAttributes.push(VertexAttribute.Normal());
      } else if (attr === 'COLOR') {
        vertexAttributes.push(VertexAttribute.ColorUnpacked());
      } else if (attr === 'COLORPACKED') {
        vertexAttributes.push(VertexAttribute.ColorPacked());
      } else if (attr === 'TANGENT') {
        vertexAttributes.push(VertexAttribute.Tangent());
      } else if (attr === 'BINORMAL') {
        vertexAttributes.push(VertexAttribute.Binormal());
      } else if (attr.startsWith('TEXCOORD')) {
        vertexAttributes.push(VertexAttribute.TexCoords(unit++));
      } else if (attr.startsWith('BLENDWEIGHT')) {
        vertexAttributes.push(VertexAttribute.BoneWeight(blendWeightCount++));
      } else {
        throw new Error(
          "Unknown vertex attribute '" + attr + "', should be one of position, normal, uv, tangent or binormal"
        );
      }
    }

    return vertexAttributes;
  }

  protected parseMaterials(model: ModelData, json: any, materialDir: string) {
    const materials = json['materials'];
    if (materials !== undefined) {
      for (const material of materials) {
        const jsonMaterial = new ModelMaterial();
        const id = this.getString(material['id'], null);
        if (id === null) throw new Error('Material needs an id.');
        jsonMaterial.id = id;
        // Read material colors
        const diffuse = material['diffuse'];
        if (diffuse !== undefined) jsonMaterial.diffuse = this.parseColor(diffuse);
        const ambient = material['ambient'];
        if (ambient !== undefined) jsonMaterial.ambient = this.parseColor(ambient);
        const emissive = material['emissive'];
        if (emissive !== undefined) jsonMaterial.emissive = this.parseColor(emissive);
        const specular = material['specular'];
        if (specular !== undefined) jsonMaterial.specular = this.parseColor(specular);
        const reflection = material['reflection'];
        if (reflection !== undefined) jsonMaterial.reflection = this.parseColor(reflection);
        jsonMaterial.shininess = this.getFloat(material['shininess'], 0);
        jsonMaterial.opacity = this.getFloat(material['opacity'], 1);
        const textures = material['textures'];
        if (textures !== undefined) {
          for (const texture of textures) {
            const jsonTexture = new ModelTexture();
            const textureId = this.getString(texture['id'], null);
            if (textureId === null) throw new Error('Texture has no id.');
            jsonTexture.id = textureId;
            const fileName = this.getString(texture['filename'], null);
            if (fileName === null) throw new Error('Texture needs filename.');
            jsonTexture.fileName =
              materialDir + (materialDir.length === 0 || materialDir.endsWith('/') ? '' : '/') + fileName;
            jsonTexture.uvTranslation = this.readVector2(texture['uvTranslation'], 0, 0);
            jsonTexture.uvScaling = this.readVector2(texture['uvScaling'], 1, 1);
            const textureType = this.getString(texture['type'], null);
            if (textureType === undefined) throw new Error('Texture needs type.');
            jsonTexture.usage = this.parseTextureUsage(textureType);
            if (jsonMaterial.textures === undefined) jsonMaterial.textures = new Array<ModelTexture>();
            jsonMaterial.textures.push(jsonTexture);
          }
        }
        model.materials.push(jsonMaterial);
      }
    }
  }

  protected parseTextureUsage(value: string): number {
    if (value.toUpperCase() === 'AMBIENT') return ModelTexture.USAGE_AMBIENT;
    else if (value.toUpperCase() === 'BUMP') return ModelTexture.USAGE_BUMP;
    else if (value.toUpperCase() === 'DIFFUSE') return ModelTexture.USAGE_DIFFUSE;
    else if (value.toUpperCase() === 'EMISSIVE') return ModelTexture.USAGE_EMISSIVE;
    else if (value.toUpperCase() === 'NONE') return ModelTexture.USAGE_NONE;
    else if (value.toUpperCase() === 'NORMAL') return ModelTexture.USAGE_NORMAL;
    else if (value.toUpperCase() === 'REFLECTION') return ModelTexture.USAGE_REFLECTION;
    else if (value.toUpperCase() === 'SHININESS') return ModelTexture.USAGE_SHININESS;
    else if (value.toUpperCase() === 'SPECULAR') return ModelTexture.USAGE_SPECULAR;
    else if (value.toUpperCase() === 'TRANSPARENCY') return ModelTexture.USAGE_TRANSPARENCY;
    return ModelTexture.USAGE_UNKNOWN;
  }

  protected parseColor(colorArray: any): Color {
    if (colorArray.length >= 3) return new Color(colorArray[0], colorArray[1], colorArray[2], 1);
    else throw new Error('Expected Color values <> than three.');
  }

  protected readVector2(vectorArray: any, x: number, y: number): Vector2 {
    if (vectorArray === undefined) return new Vector2(x, y);
    else if (vectorArray.length === 2) return new Vector2(vectorArray[0], vectorArray[1]);
    else throw new Error('Expected Vector2 values <> than two.');
  }

  protected parseNodes(model: ModelData, json: any): ModelNode[] {
    const nodes = json['nodes'];
    if (nodes !== undefined) {
      for (const node of nodes) {
        model.nodes.push(this.parseNodesRecursively(node));
      }
    }

    return model.nodes;

    return null;
  }

  protected tempQ = new Quaternion();
  protected parseNodesRecursively(json: any): ModelNode {
    const jsonNode = new ModelNode();

    const id = this.getString(json['id'], null);
    if (id === null) throw new Error('Node id missing.');
    jsonNode.id = id;

    const translation = json['translation'];
    if (translation !== undefined && translation.length !== 3) throw new Error('Node translation incomplete');
    jsonNode.translation =
      translation === undefined ? null : new Vector3(translation[0], translation[1], translation[2]);

    const rotation = json['rotation'];
    if (rotation !== undefined && rotation.length !== 4) throw new Error('Node rotation incomplete');
    jsonNode.rotation =
      rotation === undefined ? null : new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3]);

    const scale = json['scale'];
    if (scale !== undefined && scale.length !== 3) throw new Error('Node scale incomplete');
    jsonNode.scale = scale === undefined ? null : new Vector3(scale[0], scale[1], scale[2]);

    const meshId = this.getString(json['mesh'], null);
    if (meshId !== null) jsonNode.meshId = meshId;

    const materials = json['parts'];
    if (materials !== undefined) {
      jsonNode.parts = new Array<ModelNodePart>();
      let i = 0;
      for (const material of materials) {
        const nodePart = new ModelNodePart();

        const meshPartId = this.getString(material['meshpartid'], null);
        const materialId = this.getString(material['materialid'], null);
        if (meshPartId === null || materialId === null) {
          throw new Error('Node ' + id + ' part is missing meshPartId or materialId');
        }
        nodePart.materialId = materialId;
        nodePart.meshPartId = meshPartId;

        const bones = material['bones'];
        if (bones !== undefined) {
          nodePart.bones = new Map<String, Matrix4>();
          for (const bone of bones) {
            const nodeId = this.getString(bone['node'], null);
            if (nodeId === null) throw new Error('Bone node ID missing');

            const transform = new Matrix4();

            let val = bone['translation'];
            if (val !== null && val.length >= 3) transform.translate(val[0], val[1], val[2]);

            val = bone['rotation'];
            if (val !== null && val.length >= 4) transform.rotate(this.tempQ.set(val[0], val[1], val[2], val[3]));

            val = bone['scale'];
            if (val !== null && val.length >= 3) transform.scale(val[0], val[1], val[2]);

            nodePart.bones.set(nodeId, transform);
          }
        }

        jsonNode.parts[i] = nodePart;
        i++;
      }
    }

    const children = json['children'];
    if (children !== undefined) {
      jsonNode.children = new Array<ModelNode>();

      let i = 0;
      for (const child of children) {
        jsonNode.children[i] = this.parseNodesRecursively(child);
        i++;
      }
    }

    return jsonNode;

    return null;
  }

  protected parseAnimations(model: ModelData, json: any) {
    //  JsonValue animations = json["animations");
    //  if (animations === null) return;
    //  model.animations.ensureCapacity(animations.length);
    //  for (JsonValue anim = animations.child; anim !==null; anim = anim.next) {
    //      JsonValue nodes = anim["bones");
    //      if (nodes === null) continue;
    //      ModelAnimation animation = new ModelAnimation();
    //      model.animations.add(animation);
    //      animation.nodeAnimations.ensureCapacity(nodes.length);
    //      animation.id = anim.getString("id");
    //      for (JsonValue node = nodes.child; node !==null; node = node.next) {
    //          ModelNodeAnimation nodeAnim = new ModelNodeAnimation();
    //          animation.nodeAnimations.add(nodeAnim);
    //          nodeAnim.nodeId = node.getString("boneId");
    //          // For backwards compatibility (version 0.1):
    //          JsonValue keyframes = node["keyframes");
    //          if (keyframes !==null && keyframes.isArray()) {
    //              for (JsonValue keyframe = keyframes.child; keyframe !==null; keyframe = keyframe.next) {
    //                  final float keytime = keyframe.getFloat("keytime", 0f) / 1000.f;
    //                  JsonValue translation = keyframe["translation");
    //                  if (translation !==null && translation.length === 3) {
    //                      if (nodeAnim.translation === null) nodeAnim.translation = new Array<ModelNodeKeyframe<Vector3>>();
    //                      ModelNodeKeyframe<Vector3> tkf = new ModelNodeKeyframe<Vector3>();
    //                      tkf.keytime = keytime;
    //                      tkf.value = new Vector3(translation.getFloat(0), translation.getFloat(1), translation.getFloat(2));
    //                      nodeAnim.translation.add(tkf);
    //                  }
    //                  JsonValue rotation = keyframe["rotation");
    //                  if (rotation !==null && rotation.length === 4) {
    //                      if (nodeAnim.rotation === null) nodeAnim.rotation = new Array<ModelNodeKeyframe<Quaternion>>();
    //                      ModelNodeKeyframe<Quaternion> rkf = new ModelNodeKeyframe<Quaternion>();
    //                      rkf.keytime = keytime;
    //                      rkf.value = new Quaternion(rotation.getFloat(0), rotation.getFloat(1), rotation.getFloat(2),
    //                          rotation.getFloat(3));
    //                      nodeAnim.rotation.add(rkf);
    //                  }
    //                  JsonValue scale = keyframe["scale");
    //                  if (scale !==null && scale.length === 3) {
    //                      if (nodeAnim.scaling === null) nodeAnim.scaling = new Array<ModelNodeKeyframe<Vector3>>();
    //                      ModelNodeKeyframe<Vector3> skf = new ModelNodeKeyframe();
    //                      skf.keytime = keytime;
    //                      skf.value = new Vector3(scale.getFloat(0), scale.getFloat(1), scale.getFloat(2));
    //                      nodeAnim.scaling.add(skf);
    //                  }
    //              }
    //          } else { // Version 0.2:
    //              JsonValue translationKF = node["translation");
    //              if (translationKF !==null && translationKF.isArray()) {
    //                  nodeAnim.translation = new Array<ModelNodeKeyframe<Vector3>>();
    //                  nodeAnim.translation.ensureCapacity(translationKF.length);
    //                  for (JsonValue keyframe = translationKF.child; keyframe !==null; keyframe = keyframe.next) {
    //                      ModelNodeKeyframe<Vector3> kf = new ModelNodeKeyframe<Vector3>();
    //                      nodeAnim.translation.add(kf);
    //                      kf.keytime = keyframe.getFloat("keytime", 0f) / 1000.f;
    //                      JsonValue translation = keyframe["value");
    //                      if (translation !==null && translation.length >= 3)
    //                          kf.value = new Vector3(translation.getFloat(0), translation.getFloat(1), translation.getFloat(2));
    //                  }
    //              }
    //              JsonValue rotationKF = node["rotation");
    //              if (rotationKF !==null && rotationKF.isArray()) {
    //                  nodeAnim.rotation = new Array<ModelNodeKeyframe<Quaternion>>();
    //                  nodeAnim.rotation.ensureCapacity(rotationKF.length);
    //                  for (JsonValue keyframe = rotationKF.child; keyframe !==null; keyframe = keyframe.next) {
    //                      ModelNodeKeyframe<Quaternion> kf = new ModelNodeKeyframe<Quaternion>();
    //                      nodeAnim.rotation.add(kf);
    //                      kf.keytime = keyframe.getFloat("keytime", 0f) / 1000.f;
    //                      JsonValue rotation = keyframe["value");
    //                      if (rotation !==null && rotation.length >= 4) kf.value = new Quaternion(rotation.getFloat(0),
    //                          rotation.getFloat(1), rotation.getFloat(2), rotation.getFloat(3));
    //                  }
    //              }
    //              JsonValue scalingKF = node["scaling");
    //              if (scalingKF !==null && scalingKF.isArray()) {
    //                  nodeAnim.scaling = new Array<ModelNodeKeyframe<Vector3>>();
    //                  nodeAnim.scaling.ensureCapacity(scalingKF.length);
    //                  for (JsonValue keyframe = scalingKF.child; keyframe !==null; keyframe = keyframe.next) {
    //                      ModelNodeKeyframe<Vector3> kf = new ModelNodeKeyframe<Vector3>();
    //                      nodeAnim.scaling.add(kf);
    //                      kf.keytime = keyframe.getFloat("keytime", 0f) / 1000.f;
    //                      JsonValue scaling = keyframe["value");
    //                      if (scaling !==null && scaling.length >= 3)
    //                          kf.value = new Vector3(scaling.getFloat(0), scaling.getFloat(1), scaling.getFloat(2));
    //                  }
    //              }
    //          }
    //      }
    //  }
  }

  private getString(object: any, defValue: string): string {
    return object !== undefined ? object : defValue;
  }

  private getFloat(object: any, defValue: number): number {
    return object !== undefined ? object : defValue;
  }
}
