import { Matrix4 } from '../../Matrix4';
import { Mesh } from '../Mesh';
import { Node } from './Node';
import { Disposable } from '../../Utils';
import { ModelData } from '../data/ModelData';
import { ModelNode } from '../data/ModelNode';
import { Material } from '../Material';
import { MeshPart } from './MeshPart';
import { FileTextureProvider } from '../utils/TextureProvider';
import { ModelMesh } from '../data/ModelMesh';
import { ModelMaterial } from '../data/ModelMaterial';
import { ColorAttribute } from '../attributes/ColorAttribute';
import { FloatAttribute } from '../attributes/FloatAttribute';
import { BlendingAttribute } from '../attributes/BlendingAttribute';
import { GL20 } from '../GL20';
import { Texture } from '../../Texture';
import { ModelTexture } from '../data/ModelTexture';
import { TextureAttribute } from '../attributes/TextureAttribute';
import { BoundingBox } from '../BoundingBox';
import { NodePart } from './NodePart';

export class Model implements Disposable {
  public materials: Material[] = [];
  public nodes: Node[] = [];
  //public final Array<Animation> animations = new Array();
  public meshes: Mesh[] = [];
  public meshParts: MeshPart[] = [];
  protected disposables: Disposable[] = [];
  protected gl: WebGLRenderingContext;

  constructor(gl, modelData: ModelData = null) {
    this.gl = gl;
    if (modelData) {
      this.Model(modelData, new FileTextureProvider());
    }
  }

  public Model(modelData: ModelData, textureProvider: FileTextureProvider) {
    this.load(modelData, textureProvider);
  }

  protected load(modelData: ModelData, textureProvider: FileTextureProvider) {
    this.loadMeshes(modelData.meshes);
    this.loadMaterials(modelData.materials, textureProvider);
    this.loadNodes(modelData.nodes);
    //this.loadAnimations(modelData.animations);
    this.calculateTransforms();
  }

  //  protected void loadAnimations (Iterable<ModelAnimation> modelAnimations) {
  //      for (final ModelAnimation anim : modelAnimations) {
  //          Animation animation = new Animation();
  //          animation.id = anim.id;
  //          for (ModelNodeAnimation nanim : anim.nodeAnimations) {
  //              final Node node = getNode(nanim.nodeId);
  //              if (node == null) continue;
  //              NodeAnimation nodeAnim = new NodeAnimation();
  //              nodeAnim.node = node;

  //              if (nanim.translation != null) {
  //                  nodeAnim.translation = new Array<NodeKeyframe<Vector3>>();
  //                  nodeAnim.translation.ensureCapacity(nanim.translation.size);
  //                  for (ModelNodeKeyframe<Vector3> kf : nanim.translation) {
  //                      if (kf.keytime > animation.duration) animation.duration = kf.keytime;
  //                      nodeAnim.translation
  //                          .add(new NodeKeyframe<Vector3>(kf.keytime, new Vector3(kf.value == null ? node.translation : kf.value)));
  //                  }
  //              }

  //              if (nanim.rotation != null) {
  //                  nodeAnim.rotation = new Array<NodeKeyframe<Quaternion>>();
  //                  nodeAnim.rotation.ensureCapacity(nanim.rotation.size);
  //                  for (ModelNodeKeyframe<Quaternion> kf : nanim.rotation) {
  //                      if (kf.keytime > animation.duration) animation.duration = kf.keytime;
  //                      nodeAnim.rotation
  //                          .add(new NodeKeyframe<Quaternion>(kf.keytime, new Quaternion(kf.value == null ? node.rotation : kf.value)));
  //                  }
  //              }

  //              if (nanim.scaling != null) {
  //                  nodeAnim.scaling = new Array<NodeKeyframe<Vector3>>();
  //                  nodeAnim.scaling.ensureCapacity(nanim.scaling.size);
  //                  for (ModelNodeKeyframe<Vector3> kf : nanim.scaling) {
  //                      if (kf.keytime > animation.duration) animation.duration = kf.keytime;
  //                      nodeAnim.scaling
  //                          .add(new NodeKeyframe<Vector3>(kf.keytime, new Vector3(kf.value == null ? node.scale : kf.value)));
  //                  }
  //              }

  //              if ((nodeAnim.translation != null && nodeAnim.translation.size > 0)
  //                  || (nodeAnim.rotation != null && nodeAnim.rotation.size > 0)
  //                  || (nodeAnim.scaling != null && nodeAnim.scaling.size > 0)) animation.nodeAnimations.add(nodeAnim);
  //          }
  //          if (animation.nodeAnimations.size > 0) animations.add(animation);
  //      }
  //  }

  private nodePartBones: Map<NodePart, Map<String, Matrix4>> = new Map<NodePart, Map<String, Matrix4>>();
  protected loadNodes(modelNodes: ModelNode[]) {
    this.nodePartBones.clear();
    for (const node of modelNodes) {
      this.nodes.push(this.loadNode(node));
    }

    this.nodePartBones.forEach((value: Map<string, Matrix4>, key: NodePart) => {
      if (key.invBoneBindTransforms == null) key.invBoneBindTransforms = new Map<Node, Matrix4>();
      key.invBoneBindTransforms.clear();

      value.forEach((value1: Matrix4, key1: string) => {
        key.invBoneBindTransforms.set(this.getNode(key1), new Matrix4().set(value1.values).invert());
      });
    });
  }

  protected loadNode(modelNode: ModelNode): Node {
    const node = new Node();
    node.id = modelNode.id;

    if (modelNode.translation != null)
      node.translation.set(modelNode.translation.x, modelNode.translation.y, modelNode.translation.z);
    if (modelNode.rotation != null)
      node.rotation.set(modelNode.rotation.x, modelNode.rotation.y, modelNode.rotation.z, modelNode.rotation.w);
    if (modelNode.scale != null) node.scale.set(modelNode.scale.x, modelNode.scale.y, modelNode.scale.z);

    if (modelNode.parts != null) {
      for (const modelNodePart of modelNode.parts) {
        let meshPart: MeshPart = null;
        let meshMaterial: Material = null;

        if (modelNodePart.meshPartId != null) {
          for (const part of this.meshParts) {
            if (modelNodePart.meshPartId === part.id) {
              meshPart = part;
              break;
            }
          }
        }

        if (modelNodePart.materialId != null) {
          for (const material of this.materials) {
            if (modelNodePart.materialId === material.id) {
              meshMaterial = material;
              break;
            }
          }
        }

        if (meshPart == null || meshMaterial == null) throw new Error('Invalid node: ' + node.id);

        const nodePart = new NodePart();
        nodePart.meshPart = meshPart;
        nodePart.material = meshMaterial;
        node.parts.push(nodePart);
        if (modelNodePart.bones != null) this.nodePartBones.set(nodePart, modelNodePart.bones);
      }
    }

    if (modelNode.children != null) {
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

  protected convertMesh(modelMesh: ModelMesh) {
    //  let numIndices = 0;
    //  for (const part of modelMesh.parts) {
    //      numIndices += part.indices.length;
    //  }
    //  const hasIndices = numIndices > 0;
    //  const attributes = new VertexAttributes(modelMesh.attributes);
    //  const numVertices = modelMesh.vertices.length / (attributes.vertexSize / 4);
    //  const mesh = new Mesh(true, numVertices, numIndices, attributes);
    //  meshes.add(mesh);
    //  disposables.add(mesh);
    //  BufferUtils.copy(modelMesh.vertices, mesh.getVerticesBuffer(), modelMesh.vertices.length, 0);
    //  int offset = 0;
    //  ((Buffer)mesh.getIndicesBuffer()).clear();
    //  for (ModelMeshPart part : modelMesh.parts) {
    //      MeshPart meshPart = new MeshPart();
    //      meshPart.id = part.id;
    //      meshPart.primitiveType = part.primitiveType;
    //      meshPart.offset = offset;
    //      meshPart.size = hasIndices ? part.indices.length : numVertices;
    //      meshPart.mesh = mesh;
    //      if (hasIndices) {
    //          mesh.getIndicesBuffer().put(part.indices);
    //      }
    //      offset += meshPart.size;
    //      meshParts.add(meshPart);
    //  }
    //  ((Buffer)mesh.getIndicesBuffer()).position(0);
    //  for (MeshPart part : meshParts)
    //      part.update();
  }

  protected async loadMaterials(modelMaterials: ModelMaterial[], textureProvider: FileTextureProvider) {
    for (const mtl of modelMaterials) {
      this.materials.push(await this.convertMaterial(mtl, textureProvider));
    }
  }

  protected async convertMaterial(mtl: ModelMaterial, textureProvider: FileTextureProvider): Promise<Material> {
    const result = new Material();
    result.id = mtl.id;
    if (mtl.ambient != null) result.set(new ColorAttribute(ColorAttribute.Ambient, mtl.ambient));
    if (mtl.diffuse != null) result.set(new ColorAttribute(ColorAttribute.Diffuse, mtl.diffuse));
    if (mtl.specular != null) result.set(new ColorAttribute(ColorAttribute.Specular, mtl.specular));
    if (mtl.emissive != null) result.set(new ColorAttribute(ColorAttribute.Emissive, mtl.emissive));
    if (mtl.reflection != null) result.set(new ColorAttribute(ColorAttribute.Reflection, mtl.reflection));
    if (mtl.shininess > 0) result.set(new FloatAttribute(FloatAttribute.Shininess, mtl.shininess));
    if (mtl.opacity !== 1)
      result.set(new BlendingAttribute(GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA, true, mtl.opacity));

    const textures = new Map<string, Texture>();

    if (mtl.textures != null) {
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

        const offsetU = tex.uvTranslation == null ? 0 : tex.uvTranslation.x;
        const offsetV = tex.uvTranslation == null ? 0 : tex.uvTranslation.y;
        const scaleU = tex.uvScaling == null ? 1 : tex.uvScaling.x;
        const scaleV = tex.uvScaling == null ? 1 : tex.uvScaling.y;

        let ta: TextureAttribute;
        switch (tex.usage) {
          case ModelTexture.USAGE_DIFFUSE:
            ta = new TextureAttribute(TextureAttribute.Diffuse);
            break;
          case ModelTexture.USAGE_SPECULAR:
            ta = new TextureAttribute(TextureAttribute.Specular);
            break;
          case ModelTexture.USAGE_BUMP:
            ta = new TextureAttribute(TextureAttribute.Bump);
            break;
          case ModelTexture.USAGE_NORMAL:
            ta = new TextureAttribute(TextureAttribute.Normal);
            break;
          case ModelTexture.USAGE_AMBIENT:
            ta = new TextureAttribute(TextureAttribute.Ambient);
            break;
          case ModelTexture.USAGE_EMISSIVE:
            ta = new TextureAttribute(TextureAttribute.Emissive);
            break;
          case ModelTexture.USAGE_REFLECTION:
            ta = new TextureAttribute(TextureAttribute.Reflection);
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

  //  public Animation getAnimation (final String id) {
  //      return getAnimation(id, true);
  //  }

  //  public Animation getAnimation (final String id, boolean ignoreCase) {
  //      final int n = animations.size;
  //      Animation animation;
  //      if (ignoreCase) {
  //          for (int i = 0; i < n; i++)
  //              if ((animation = animations.get(i)).id.equalsIgnoreCase(id)) return animation;
  //      } else {
  //          for (int i = 0; i < n; i++)
  //              if ((animation = animations.get(i)).id.equals(id)) return animation;
  //      }
  //      return null;
  //  }

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
