import { Shader } from '../../../../../Shader';
import { Usage, VertexAttribute3D, VertexAttributes } from '../../../../attributes';
import { GL20 } from '../../../../GL20';
import { Material } from '../../../../Material';
import { Mesh3D } from '../../../../Mesh';
import { MeshPart, Node, NodePart } from '../../../../model';
import { GLTFAccessor } from '../../../data/data/GLTFAccessor';
import { GLTFMesh } from '../../../data/geometry/GLTFMesh';
import { PBRTextureAttribute } from '../../../scene3d/attributes/PBRTextureAttribute';
import { PBRUsage } from '../../../scene3d/attributes/PBRVertexAttributes';
import { NodePartPlus } from '../../../scene3d/model/NodePartPlus';
import { NodePlus } from '../../../scene3d/model/NodePlus';
import { WeightVector } from '../../../scene3d/model/WeightVector';
import { BlenderShapeKeys } from '../../blender/BlenderShapeKeys';
import { MaterialLoader } from '../../material/MaterialLoader';
import { GLTFTypes } from '../GLTFTypes';
import { MeshSpliter } from './MeshSpliter';
import { MeshTangentSpaceGenerator } from './MeshTangentSpaceGenerator';

export class MeshLoader {
  private meshMap = new Map<GLTFMesh, Array<NodePart>>();
  private meshes = new Array<Mesh3D>();

  constructor(protected gl: WebGLRenderingContext) {}

  public load(node: Node, glMesh: GLTFMesh, dataResolver: DataResolver, materialLoader: MaterialLoader) {
    (node as NodePlus).morphTargetNames = BlenderShapeKeys.parse(glMesh);

    let parts = this.meshMap.get(glMesh);
    if (parts == undefined) {
      parts = new Array<NodePart>();

      for (const primitive of glMesh.primitives) {
        const glPrimitiveType = GLTFTypes.mapPrimitiveMode(primitive.mode);

        // material
        let material: Material;
        if (!!primitive.material) {
          material = materialLoader.get(primitive.material);
        } else {
          material = materialLoader.getDefaultMaterial();
        }

        // vertices
        const vertexAttributes = new Array<VertexAttribute3D>();
        const glAccessors = new Array<GLTFAccessor>();

        const bonesIndices = new Array<number[]>();
        const bonesWeights = new Array<number[]>();

        let hasNormals = false;
        let hasTangent = false;

        for (const [key, value] of primitive.attributes) {
          const attributeName = key;
          const accessorId = value;
          const accessor = dataResolver.getAccessor(accessorId);
          let rawAttribute = true;

          if (attributeName === 'POSITION') {
            if (!(GLTFTypes.TYPE_VEC3 === accessor.type && accessor.componentType == GLTFTypes.C_FLOAT))
              throw new Error('illegal position attribute format');
            vertexAttributes.push(VertexAttribute3D.Position());
          } else if (attributeName === 'NORMAL') {
            if (!(GLTFTypes.TYPE_VEC3 === accessor.type && accessor.componentType == GLTFTypes.C_FLOAT))
              throw new Error('illegal normal attribute format');
            vertexAttributes.push(VertexAttribute3D.Normal());
            hasNormals = true;
          } else if (attributeName === 'TANGENT') {
            if (!(GLTFTypes.TYPE_VEC4 === accessor.type && accessor.componentType == GLTFTypes.C_FLOAT))
              throw new Error('illegal tangent attribute format');
            vertexAttributes.push(new VertexAttribute3D(Usage.Tangent, 4, GL20.GL_FLOAT, false, Shader.TANGENT));
            hasTangent = true;
          } else if (attributeName.startsWith('TEXCOORD_')) {
            if (!GLTFTypes.TYPE_VEC2 === accessor.type)
              throw new Error('illegal texture coordinate attribute type : ' + accessor.type);
            if (accessor.componentType == GLTFTypes.C_UBYTE)
              throw new Error('unsigned byte texture coordinate attribute not supported');
            if (accessor.componentType == GLTFTypes.C_USHORT)
              throw new Error('unsigned short texture coordinate attribute not supported');
            if (accessor.componentType != GLTFTypes.C_FLOAT)
              throw new Error('illegal texture coordinate component type : ' + accessor.componentType);
            const unit = this.parseAttributeUnit(attributeName);
            vertexAttributes.push(VertexAttribute3D.TexCoords(unit));
          } else if (attributeName.startsWith('COLOR_')) {
            const unit = this.parseAttributeUnit(attributeName);
            const alias = unit > 0 ? Shader.COLOR + unit : Shader.COLOR;
            if (GLTFTypes.TYPE_VEC4 === accessor.type) {
              if (GLTFTypes.C_FLOAT == accessor.componentType) {
                vertexAttributes.push(new VertexAttribute3D(Usage.ColorUnpacked, 4, GL20.GL_FLOAT, false, alias));
              } else if (GLTFTypes.C_USHORT == accessor.componentType) {
                vertexAttributes.push(
                  new VertexAttribute3D(Usage.ColorUnpacked, 4, GL20.GL_UNSIGNED_SHORT, true, alias)
                );
              } else if (GLTFTypes.C_UBYTE == accessor.componentType) {
                vertexAttributes.push(
                  new VertexAttribute3D(Usage.ColorUnpacked, 4, GL20.GL_UNSIGNED_BYTE, true, alias)
                );
              } else {
                throw new Error('illegal color attribute component type: ' + accessor.type);
              }
            } else if (GLTFTypes.TYPE_VEC3 === accessor.type) {
              if (GLTFTypes.C_FLOAT == accessor.componentType) {
                vertexAttributes.push(new VertexAttribute3D(Usage.ColorUnpacked, 3, GL20.GL_FLOAT, false, alias));
              } else if (GLTFTypes.C_USHORT == accessor.componentType) {
                throw new Error('RGB unsigned short color attribute not supported');
              } else if (GLTFTypes.C_UBYTE == accessor.componentType) {
                throw new Error('RGB unsigned byte color attribute not supported');
              } else {
                throw new Error('illegal color attribute component type: ' + accessor.type);
              }
            } else {
              throw new Error('illegal color attribute type: ' + accessor.type);
            }
          } else if (attributeName.startsWith('WEIGHTS_')) {
            rawAttribute = false;

            if (!GLTFTypes.TYPE_VEC4 === accessor.type) {
              throw new Error('illegal weight attribute type: ' + accessor.type);
            }

            const unit = this.parseAttributeUnit(attributeName);
            if (unit >= bonesWeights.length) {
              const diff = unit - bonesIndices.length;
              for (let i = 0; i < diff + 1; i++) {
                bonesIndices.push([]);
              }
            }

            if (accessor.componentType == GLTFTypes.C_FLOAT) {
              bonesWeights[unit] = dataResolver.readBufferFloat(accessorId);
            } else if (accessor.componentType == GLTFTypes.C_USHORT) {
              throw new Error('unsigned short weight attribute not supported');
            } else if (accessor.componentType == GLTFTypes.C_UBYTE) {
              throw new Error('unsigned byte weight attribute not supported');
            } else {
              throw new Error('illegal weight attribute type: ' + accessor.componentType);
            }
          } else if (attributeName.startsWith('JOINTS_')) {
            rawAttribute = false;

            if (!GLTFTypes.TYPE_VEC4 === accessor.type) {
              throw new Error('illegal joints attribute type: ' + accessor.type);
            }

            const unit = this.parseAttributeUnit(attributeName);
            if (unit >= bonesIndices.length) {
              const diff = unit - bonesIndices.length;
              for (let i = 0; i < diff + 1; i++) {
                bonesIndices.push([]);
              }
            }

            if (accessor.componentType == GLTFTypes.C_UBYTE) {
              // unsigned byte
              bonesIndices[unit] = dataResolver.readBufferUByte(accessorId);
            } else if (accessor.componentType == GLTFTypes.C_USHORT) {
              // unsigned short
              bonesIndices[unit] = dataResolver.readBufferUShort(accessorId);
            } else {
              throw new Error('illegal type for joints: ' + accessor.componentType);
            }
          } else if (attributeName.startsWith('_')) {
            console.error('GLTF', 'skip unsupported custom attribute: ' + attributeName);
          } else {
            throw new Error('illegal attribute type ' + attributeName);
          }

          if (rawAttribute) {
            glAccessors.push(accessor);
          }
        }

        // morph targets
        if (!!primitive.targets) {
          const morphTargetCount = primitive.targets.length;
          (node as NodePlus).weights = new WeightVector(morphTargetCount);

          for (let t = 0; t < primitive.targets.length; t++) {
            let unit = t;
            for (const [key, value] of primitive.targets[t]) {
              const attributeName = key;
              const accessorId = value;
              const accessor = dataResolver.getAccessor(accessorId);
              glAccessors.push(accessor);

              if (attributeName === 'POSITION') {
                if (!(GLTFTypes.TYPE_VEC3 === accessor.type) && accessor.componentType == GLTFTypes.C_FLOAT)
                  throw new Error('illegal morph target position attribute format');
                vertexAttributes.push(
                  new VertexAttribute3D(PBRUsage.PositionTarget, 3, GL20.GL_FLOAT, false, Shader.POSITION + unit, unit)
                );
              } else if (attributeName === 'NORMAL') {
                if (!(GLTFTypes.TYPE_VEC3 === accessor.type) && accessor.componentType == GLTFTypes.C_FLOAT)
                  throw new Error('illegal morph target normal attribute format');
                vertexAttributes.push(
                  new VertexAttribute3D(PBRUsage.NormalTarget, 3, GL20.GL_FLOAT, false, Shader.NORMAL + unit, unit)
                );
              } else if (attributeName === 'TANGENT') {
                if (!(GLTFTypes.TYPE_VEC3 === accessor.type) && accessor.componentType == GLTFTypes.C_FLOAT)
                  throw new Error('illegal morph target tangent attribute format');
                vertexAttributes.push(
                  new VertexAttribute3D(PBRUsage.TangentTarget, 3, GL20.GL_FLOAT, false, Shader.TANGENT + unit, unit)
                );
              } else {
                throw new Error('illegal morph target attribute type ' + attributeName);
              }
            }
          }
        }

        const bSize = bonesIndices.length * 4;

        const bonesAttributes = new Array<VertexAttribute3D>();
        for (let b = 0; b < bSize; b++) {
          const boneAttribute = VertexAttribute3D.BoneWeight(b);
          vertexAttributes.push(boneAttribute);
          bonesAttributes.push(boneAttribute);
        }

        // add missing vertex attributes (normals and tangent)
        let computeNormals = false;
        let computeTangents = false;
        let normalMapUVs: VertexAttribute3D = null;
        if (glPrimitiveType == GL20.GL_TRIANGLES) {
          if (!hasNormals) {
            vertexAttributes.push(VertexAttribute3D.Normal());
            glAccessors.push(null);
            computeNormals = true;
          }
          if (!hasTangent) {
            // tangent is only needed when normal map is used
            const normalMap = material.get(PBRTextureAttribute.NormalTexture) as PBRTextureAttribute;
            if (!!normalMap) {
              vertexAttributes.push(new VertexAttribute3D(Usage.Tangent, 4, GL20.GL_FLOAT, false, Shader.TANGENT));
              glAccessors.push(null);
              computeTangents = true;
              for (const attribute of vertexAttributes) {
                if (attribute.usage == Usage.TextureCoordinates && attribute.unit == normalMap.uvIndex) {
                  normalMapUVs = attribute;
                }
              }
              if (!normalMapUVs) throw new Error('UVs not found for normal map');
            }
          }
        }

        const attributesGroup = new VertexAttributes(vertexAttributes);

        const vertexFloats = attributesGroup.vertexSize / 4;

        const maxVertices = glAccessors[0].count;

        const vertices = new Array<number>(maxVertices * vertexFloats);

        for (let b = 0; b < bSize; b++) {
          const boneAttribute = bonesAttributes[b];
          for (let i = 0; i < maxVertices; i++) {
            vertices[i * vertexFloats + boneAttribute.offset / 4] = bonesIndices[b / 4][i * 4 + (b % 4)];
            vertices[i * vertexFloats + boneAttribute.offset / 4 + 1] = bonesWeights[b / 4][i * 4 + (b % 4)];
          }
        }

        for (let i = 0; i < glAccessors.length; i++) {
          const glAccessor = glAccessors[i];
          const attribute = vertexAttributes[i];

          if (!glAccessor) continue;
          if (!glAccessor.bufferView) {
            throw new Error('bufferView is null (mesh compression ?)');
          }

          const glBufferView = dataResolver.getBufferView(glAccessor.bufferView);

          // not used for now : used for direct mesh ....
          if (!!glBufferView.target) {
            if (glBufferView.target == 34963) {
              // ELEMENT_ARRAY_BUFFER
            } else if (glBufferView.target == 34962) {
              // ARRAY_BUFFER
            } else {
              throw new Error('bufferView target unknown : ' + glBufferView.target);
            }
          }

          const floatBuffer = dataResolver.getBufferFloat(glAccessor);

          const attributeFloats = GLTFTypes.accessorStrideSize(glAccessor) / 4;

          // buffer can be interleaved, so vertex stride may be different than vertex size
          const floatStride = !glBufferView.byteStride ? attributeFloats : glBufferView.byteStride / 4;

          for (let j = 0; j < glAccessor.count; j++) {
            floatBuffer.position(j * floatStride);

            const vIndex = j * vertexFloats + attribute.offset / 4;

            floatBuffer.get(vertices, vIndex, attributeFloats);
          }
        }

        // indices
        if (!!primitive.indices) {
          const indicesAccessor = dataResolver.getAccessor(primitive.indices);

          if (!indicesAccessor.type.equals(GLTFTypes.TYPE_SCALAR)) {
            throw new Error('indices accessor must be SCALAR but was ' + indicesAccessor.type);
          }

          const maxIndices = indicesAccessor.count;

          switch (indicesAccessor.componentType) {
            case GLTFTypes.C_UINT:
              {
                console.error('GLTF', 'integer indices partially supported, mesh will be split');
                console.error('GLTF', 'splitting mesh: ' + maxVertices + ' vertices, ' + maxIndices + ' indices.');

                let verticesPerPrimitive: number;
                if (glPrimitiveType == GL20.GL_TRIANGLES) {
                  verticesPerPrimitive = 3;
                } else if (glPrimitiveType == GL20.GL_LINES) {
                  verticesPerPrimitive = 2;
                } else {
                  throw new Error('integer indices only supported for triangles or lines');
                }

                const indices = new Array<number>(maxIndices);
                dataResolver.getBufferInt(indicesAccessor).get(indices);

                const splitVertices = new Array<number[]>();
                const splitIndices = new Array<number[]>();

                MeshSpliter.split(
                  splitVertices,
                  splitIndices,
                  vertices,
                  attributesGroup,
                  indices,
                  verticesPerPrimitive
                );

                const stride = attributesGroup.vertexSize / 4;
                const groups = splitIndices.length;
                let totalVertices = 0;
                let totalIndices = 0;
                for (let i = 0; i < groups; i++) {
                  const groupVertices = splitVertices[i];
                  const groupIndices = splitIndices[i];
                  const groupVertexCount = groupVertices.length / stride;

                  totalVertices += groupVertexCount;
                  totalIndices += groupIndices.length;

                  console.error(
                    'GLTF',
                    'generate mesh: ' + groupVertexCount + ' vertices, ' + groupIndices.length + ' indices.'
                  );

                  this.generateParts(
                    node,
                    parts,
                    material,
                    glMesh.name,
                    groupVertices,
                    groupVertexCount,
                    groupIndices,
                    attributesGroup,
                    glPrimitiveType,
                    computeNormals,
                    computeTangents,
                    normalMapUVs
                  );
                }
                console.error(
                  'GLTF',
                  'mesh split: ' +
                    parts.length +
                    ' meshes generated: ' +
                    totalVertices +
                    ' vertices, ' +
                    totalIndices +
                    ' indices.'
                );
              }
              break;
            case GLTFTypes.C_USHORT:
            case GLTFTypes.C_SHORT: {
              const indices = new Array<number>(maxIndices);
              dataResolver.getBufferShort(indicesAccessor).get(indices);
              this.generateParts(
                node,
                parts,
                material,
                glMesh.name,
                vertices,
                maxVertices,
                indices,
                attributesGroup,
                glPrimitiveType,
                computeNormals,
                computeTangents,
                normalMapUVs
              );
              break;
            }
            case GLTFTypes.C_UBYTE: {
              const indices = new Array<number>(maxIndices);
              const byteBuffer = dataResolver.getBufferByte(indicesAccessor);
              for (let i = 0; i < maxIndices; i++) {
                indices[i] = byteBuffer.get() & 0xff;
              }
              this.generateParts(
                node,
                parts,
                material,
                glMesh.name,
                vertices,
                maxVertices,
                indices,
                attributesGroup,
                glPrimitiveType,
                computeNormals,
                computeTangents,
                normalMapUVs
              );
              break;
            }
            default:
              throw new Error('illegal componentType ' + indicesAccessor.componentType);
          }
        } else {
          // non indexed mesh
          this.generateParts(
            node,
            parts,
            material,
            glMesh.name,
            vertices,
            maxVertices,
            null,
            attributesGroup,
            glPrimitiveType,
            computeNormals,
            computeTangents,
            normalMapUVs
          );
        }
      }
      this.meshMap.set(glMesh, parts);
    }
    for (const part of parts) {
      node.parts.push(part);
    }
  }

  private generateParts(
    node: Node,
    parts: NodePart[],
    material: Material,
    id: string,
    vertices: number[],
    vertexCount: number,
    indices: number[],
    attributesGroup: VertexAttributes,
    glPrimitiveType: number,
    computeNormals: boolean,
    computeTangents: boolean,
    normalMapUVs: VertexAttribute3D
  ) {
    if (computeNormals || computeTangents) {
      if (computeNormals && computeTangents) console.log('GLTF', 'compute normals and tangents for primitive ' + id);
      else if (computeTangents) console.log('GLTF', 'compute tangents for primitive ' + id);
      else console.log('GLTF', 'compute normals for primitive ' + id);
      MeshTangentSpaceGenerator.computeTangentSpaceWithData(
        vertices,
        indices,
        attributesGroup,
        computeNormals,
        computeTangents,
        normalMapUVs
      );
    }

    const mesh = new Mesh3D(this.gl, true, true, vertexCount, !indices ? 0 : indices.length, attributesGroup);
    this.meshes.push(mesh);
    mesh.setVertices(vertices);

    if (!!indices) {
      mesh.setIndices(indices);
    }

    let len = !indices ? vertexCount : indices.length;

    const meshPart = new MeshPart();
    meshPart.set(id, mesh, 0, len, glPrimitiveType);

    const nodePart = new NodePartPlus();
    nodePart.morphTargets = (node as NodePlus).weights;
    nodePart.meshPart = meshPart;
    nodePart.material = material;
    parts.push(nodePart);
  }

  private parseAttributeUnit(attributeName: string): number {
    const lastUnderscoreIndex = attributeName.lastIndexOf('_');
    try {
      return parseInt(attributeName.substring(lastUnderscoreIndex + 1));
    } catch (e) {
      throw new Error('illegal attribute name ' + attributeName);
    }
  }

  public getMeshes(): Mesh3D[] {
    return this.meshes;
  }
}
