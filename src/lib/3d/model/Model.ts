import { Matrix4 } from '../../Matrix4';
import { Quaternion } from '../../Quaternion';
import { Texture } from '../../Texture';
import { ArrayMap, Disposable } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { BlendingAttribute } from '../attributes/BlendingAttribute';
import { ColorAttribute } from '../attributes/ColorAttribute';
import { FloatAttribute } from '../attributes/FloatAttribute';
import { TextureAttribute } from '../attributes/TextureAttribute';
import { VertexAttributes } from '../attributes/VertexAttributes';
import { BoundingBox } from '../BoundingBox';
import { GL20 } from '../GL20';
import { Material } from '../Material';
import { Mesh } from '../Mesh';
import { FileTextureProvider } from '../utils/TextureProvider';
import { Animation } from './Animation';
import { ModelAnimation } from './data/ModelAnimation';
import { ModelData } from './data/ModelData';
import { ModelMaterial } from './data/ModelMaterial';
import { ModelMesh } from './data/ModelMesh';
import { ModelNode } from './data/ModelNode';
import { ModelTexture } from './data/ModelTexture';
import { MeshPart } from './MeshPart';
import { Node } from './Node';
import { NodeAnimation } from './NodeAnimation';
import { NodeKeyframe } from './NodeKeyframe';
import { NodePart } from './NodePart';

export class Model implements Disposable {
  public materials: Material[] = [];
  public nodes: Node[] = [];
  public animations: Animation[] = [];
  public meshes: Mesh[] = [];
  public meshParts: MeshPart[] = [];
  protected disposables: Disposable[] = [];

  constructor(private gl: WebGLRenderingContext) {}

  public async load(modelData: ModelData, textureProvider: FileTextureProvider = new FileTextureProvider()) {
    this.loadMeshes(modelData.meshes);
    await this.loadMaterials(modelData.materials, textureProvider);
    this.loadNodes(modelData.nodes);
    this.loadAnimations(modelData.animations);
    this.calculateTransforms();
  }

  protected loadAnimations(modelAnimations: ModelAnimation[]) {
    for (const anim of modelAnimations) {
      const animation = new Animation();
      animation.id = anim.id;
      for (const nanim of anim.nodeAnimations) {
        const node = this.getNode(nanim.nodeId);
        if (!node) continue;
        const nodeAnim = new NodeAnimation();
        nodeAnim.node = node;

        if (!!nanim.translation) {
          nodeAnim.translation = new Array<NodeKeyframe<Vector3>>();
          for (const kf of nanim.translation) {
            if (kf.keytime > animation.duration) animation.duration = kf.keytime;
            nodeAnim.translation.push(
              new NodeKeyframe<Vector3>(kf.keytime, new Vector3().setFrom(!kf.value ? node.translation : kf.value))
            );
          }
        }

        if (!!nanim.rotation) {
          nodeAnim.rotation = new Array<NodeKeyframe<Quaternion>>();
          for (const kf of nanim.rotation) {
            if (kf.keytime > animation.duration) animation.duration = kf.keytime;
            nodeAnim.rotation.push(
              new NodeKeyframe<Quaternion>(kf.keytime, new Quaternion().setFrom(!kf.value ? node.rotation : kf.value))
            );
          }
        }

        if (!!nanim.scaling) {
          nodeAnim.scaling = new Array<NodeKeyframe<Vector3>>();
          for (const kf of nanim.scaling) {
            if (kf.keytime > animation.duration) animation.duration = kf.keytime;
            nodeAnim.scaling.push(
              new NodeKeyframe<Vector3>(kf.keytime, new Vector3().setFrom(!kf.value ? node.scale : kf.value))
            );
          }
        }

        if (
          (!!nodeAnim.translation && nodeAnim.translation.length > 0) ||
          (!!nodeAnim.rotation && nodeAnim.rotation.length > 0) ||
          (!!nodeAnim.scaling && nodeAnim.scaling.length > 0)
        )
          animation.nodeAnimations.push(nodeAnim);
      }
      if (animation.nodeAnimations.length > 0) this.animations.push(animation);
    }
  }

  private nodePartBones: Map<NodePart, ArrayMap<string, Matrix4>> = new Map<NodePart, ArrayMap<string, Matrix4>>();
  protected loadNodes(modelNodes: ModelNode[]) {
    this.nodePartBones.clear();
    for (const node of modelNodes) {
      this.nodes.push(this.loadNode(node));
    }

    for (const [key, value] of this.nodePartBones) {
      if (!key.invBoneBindTransforms) key.invBoneBindTransforms = new ArrayMap<Node, Matrix4>();
      key.invBoneBindTransforms.clear();

      for (let i = 0; i < value.size; i++) {
        const k = value.keys[i];
        const v = value.values[i];
        key.invBoneBindTransforms.set(this.getNode(k), new Matrix4().set(v.values).invert());
      }
    }
  }

  protected loadNode(modelNode: ModelNode): Node {
    const node = new Node();
    node.id = modelNode.id;

    if (!!modelNode.translation)
      node.translation.set(modelNode.translation.x, modelNode.translation.y, modelNode.translation.z);
    if (!!modelNode.rotation)
      node.rotation.set(modelNode.rotation.x, modelNode.rotation.y, modelNode.rotation.z, modelNode.rotation.w);
    if (!!modelNode.scale) node.scale.set(modelNode.scale.x, modelNode.scale.y, modelNode.scale.z);

    if (!!modelNode.parts) {
      for (const modelNodePart of modelNode.parts) {
        let meshPart: MeshPart = null;
        let meshMaterial: Material = null;

        if (!!modelNodePart.meshPartId) {
          for (const part of this.meshParts) {
            if (modelNodePart.meshPartId === part.id) {
              meshPart = part;
              break;
            }
          }
        }

        if (!!modelNodePart.materialId) {
          for (const material of this.materials) {
            if (modelNodePart.materialId === material.id) {
              meshMaterial = material;
              break;
            }
          }
        }

        if (!meshPart || !meshMaterial) throw new Error('Invalid node: ' + node.id);

        const nodePart = new NodePart();
        nodePart.meshPart = meshPart;
        nodePart.material = meshMaterial;
        node.parts.push(nodePart);
        if (!!modelNodePart.bones) this.nodePartBones.set(nodePart, modelNodePart.bones);
      }
    }

    if (!!modelNode.children) {
      for (const child of modelNode.children) {
        node.addChild(this.loadNode(child));
      }
    }

    return node;
  }

  protected loadMeshes(meshes: ModelMesh[]) {
    for (const mesh of meshes) {
      this.convertMesh(mesh);
    }
  }

  protected;
  convertMesh(modelMesh: ModelMesh) {
    let numIndices = 0;
    for (const part of modelMesh.parts) {
      numIndices += part.indices.length;
    }
    const hasIndices = numIndices > 0;
    const attributes = new VertexAttributes(modelMesh.attributes);
    const numVertices = modelMesh.vertices.length / (attributes.vertexSize / 4);
    const mesh = new Mesh(this.gl, true, true, numVertices, numIndices, attributes);
    this.meshes.push(mesh);
    this.disposables.push(mesh);

    mesh.vertices.updateVertices(0, modelMesh.vertices, 0, modelMesh.vertices.length);
    let offset = 0;
    let indicesOffset = 0;
    for (const part of modelMesh.parts) {
      const meshPart = new MeshPart();
      meshPart.id = part.id;
      meshPart.primitiveType = part.primitiveType;
      meshPart.offset = offset;
      meshPart.size = hasIndices ? part.indices.length : numVertices;
      meshPart.mesh = mesh;
      if (hasIndices) {
        mesh.indices.updateIndices(indicesOffset, part.indices, 0, part.indices.length);
        indicesOffset += part.indices.length;
      }
      offset += meshPart.size;
      this.meshParts.push(meshPart);
    }
    for (const part of this.meshParts) part.update();
  }

  protected async loadMaterials(modelMaterials: ModelMaterial[], textureProvider: FileTextureProvider) {
    for (const mtl of modelMaterials) {
      this.materials.push(await this.convertMaterial(mtl, textureProvider));
    }
  }

  protected async convertMaterial(mtl: ModelMaterial, textureProvider: FileTextureProvider): Promise<Material> {
    const result = new Material();
    result.id = mtl.id;
    if (mtl.ambient !== undefined) result.set(new ColorAttribute(ColorAttribute.Ambient, mtl.ambient));
    if (mtl.diffuse !== undefined) result.set(new ColorAttribute(ColorAttribute.Diffuse, mtl.diffuse));
    if (mtl.specular !== undefined) result.set(new ColorAttribute(ColorAttribute.Specular, mtl.specular));
    if (mtl.emissive !== undefined) result.set(new ColorAttribute(ColorAttribute.Emissive, mtl.emissive));
    if (mtl.reflection !== undefined) result.set(new ColorAttribute(ColorAttribute.Reflection, mtl.reflection));
    if (mtl.shininess > 0) result.set(new FloatAttribute(FloatAttribute.Shininess, mtl.shininess));
    if (mtl.opacity !== 1)
      result.set(new BlendingAttribute(GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA, true, mtl.opacity));

    const textures = new Map<string, Texture>();

    if (mtl.textures !== undefined) {
      for (const tex of mtl.textures) {
        let texture: Texture;
        if (textures.has(tex.fileName)) {
          texture = textures.get(tex.fileName);
        } else {
          texture = await textureProvider.load(this.gl, tex.fileName);
          textures.set(tex.fileName, texture);
          this.disposables.push(texture);
        }

        //  const descriptor = new TextureDescriptor(texture);
        //  descriptor.minFilter = texture.getMinFilter();
        //  descriptor.magFilter = texture.getMagFilter();
        //  descriptor.uWrap = texture.getUWrap();
        //  descriptor.vWrap = texture.getVWrap();

        const offsetU = !tex.uvTranslation ? 0 : tex.uvTranslation.x;
        const offsetV = !tex.uvTranslation ? 0 : tex.uvTranslation.y;
        const scaleU = !tex.uvScaling ? 1 : tex.uvScaling.x;
        const scaleV = !tex.uvScaling ? 1 : tex.uvScaling.y;

        let ta: TextureAttribute;
        switch (tex.usage) {
          case ModelTexture.USAGE_DIFFUSE:
            ta = new TextureAttribute(TextureAttribute.Diffuse, offsetU, offsetV, scaleU, scaleV);
            break;
          case ModelTexture.USAGE_SPECULAR:
            ta = new TextureAttribute(TextureAttribute.Specular, offsetU, offsetV, scaleU, scaleV);
            break;
          case ModelTexture.USAGE_BUMP:
            ta = new TextureAttribute(TextureAttribute.Bump, offsetU, offsetV, scaleU, scaleV);
            break;
          case ModelTexture.USAGE_NORMAL:
            ta = new TextureAttribute(TextureAttribute.Normal, offsetU, offsetV, scaleU, scaleV);
            break;
          case ModelTexture.USAGE_AMBIENT:
            ta = new TextureAttribute(TextureAttribute.Ambient, offsetU, offsetV, scaleU, scaleV);
            break;
          case ModelTexture.USAGE_EMISSIVE:
            ta = new TextureAttribute(TextureAttribute.Emissive, offsetU, offsetV, scaleU, scaleV);
            break;
          case ModelTexture.USAGE_REFLECTION:
            ta = new TextureAttribute(TextureAttribute.Reflection, offsetU, offsetV, scaleU, scaleV);
            break;
        }

        ta.setTexture(texture);
        ta.setOffset(offsetU, offsetV);
        ta.setScale(scaleU, scaleV);
        result.set(ta);
      }
    }

    return result;
  }

  public manageDisposable(disposable: Disposable) {
    if (this.disposables.indexOf(disposable) < 0) this.disposables.push(disposable);
  }

  public getManagedDisposables(): Disposable[] {
    return this.disposables;
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  public calculateTransforms() {
    const n = this.nodes.length;
    for (let i = 0; i < n; i++) {
      this.nodes[i].calculateTransforms(true);
    }
    for (let i = 0; i < n; i++) {
      this.nodes[i].calculateBoneTransforms(true);
    }
  }

  public calculateBoundingBox(out: BoundingBox): BoundingBox {
    out.inf();
    return this.extendBoundingBox(out);
  }

  public extendBoundingBox(out: BoundingBox): BoundingBox {
    const n = this.nodes.length;
    for (let i = 0; i < n; i++) this.nodes[i].extendBoundingBox(out);
    return out;
  }

  public getAnimation(id: string, ignoreCase: boolean = false): Animation {
    const n = this.animations.length;
    if (ignoreCase) {
      for (let i = 0; i < n; i++)
        if (this.animations[i].id.toUpperCase() === id.toUpperCase()) return this.animations[i];
    } else {
      for (let i = 0; i < n; i++) if (this.animations[i].id === id) return this.animations[i];
    }
    return null;
  }

  public getMaterial(id: string, ignoreCase: boolean = true): Material {
    const n = this.materials.length;
    let material: Material;
    if (ignoreCase) {
      for (let i = 0; i < n; i++)
        if ((material = this.materials[i]).id.toUpperCase() === id.toUpperCase()) return material;
    } else {
      for (let i = 0; i < n; i++) if ((material = this.materials[i]).id === id) return material;
    }
    return null;
  }

  public getNode(id: string, recursive: boolean = true, ignoreCase: boolean = false): Node {
    return Node.getNode(this.nodes, id, recursive, ignoreCase);
  }
}
