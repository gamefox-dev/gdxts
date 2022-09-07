import { Quaternion } from '../../Quaternion';
import { Shader } from '../../Shader';
import { Color } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { Usage, VertexAttribute } from '../attributes/VertexAttribute';
import { GL20 } from '../GL20';
import { Material } from '../Material';
import { ModelData } from '../model/data/ModelData';
import { ModelMaterial } from '../model/data/ModelMaterial';
import { ModelMesh } from '../model/data/ModelMesh';
import { ModelMeshPart } from '../model/data/ModelMeshPart';
import { ModelNode } from '../model/data/ModelNode';
import { ModelNodePart } from '../model/data/ModelNodePart';
import { ModelTexture } from '../model/data/ModelTexture';
import { Model } from '../model/Model';

class Group {
  name: string;
  materialName: string;
  faces: number[];
  numFaces: number;
  hasNorms: boolean;
  hasUVs: boolean;
  mat: Material;

  constructor(name: string) {
    this.name = name;
    this.faces = [];
    this.numFaces = 0;
    this.mat = new Material('');
    this.materialName = 'default';
  }
}

export class ObjMaterial {
  materialName = 'default';
  ambientColor: Color;
  diffuseColor: Color;
  specularColor: Color;
  opacity: number;
  shininess: number;
  alphaTexFilename: string;
  ambientTexFilename: string;
  diffuseTexFilename: string;
  shininessTexFilename: string;
  specularTexFilename: string;

  constructor() {
    this.reset();
  }

  public build(): ModelMaterial {
    const mat = new ModelMaterial();
    mat.id = this.materialName;
    mat.ambient = !this.ambientColor
      ? null
      : new Color(this.ambientColor.r, this.ambientColor.g, this.ambientColor.b, this.ambientColor.a);
    mat.diffuse = new Color(this.diffuseColor.r, this.diffuseColor.g, this.diffuseColor.b, this.diffuseColor.a);
    mat.specular = new Color(this.specularColor.r, this.specularColor.g, this.specularColor.b, this.specularColor.a);
    mat.opacity = this.opacity;
    mat.shininess = this.shininess;
    this.addTexture(mat, this.alphaTexFilename, ModelTexture.USAGE_TRANSPARENCY);
    this.addTexture(mat, this.ambientTexFilename, ModelTexture.USAGE_AMBIENT);
    this.addTexture(mat, this.diffuseTexFilename, ModelTexture.USAGE_DIFFUSE);
    this.addTexture(mat, this.specularTexFilename, ModelTexture.USAGE_SPECULAR);
    this.addTexture(mat, this.shininessTexFilename, ModelTexture.USAGE_SHININESS);

    return mat;
  }

  private addTexture(mat: ModelMaterial, texFilename: string, usage: number) {
    if (!!texFilename) {
      const tex = new ModelTexture();
      tex.usage = usage;
      tex.fileName = texFilename;
      if (mat.textures === undefined) mat.textures = new Array<ModelTexture>();
      mat.textures.push(tex);
    }
  }

  public reset() {
    this.ambientColor = null;
    this.diffuseColor = Color.WHITE;
    this.specularColor = Color.WHITE;
    this.opacity = 1;
    this.shininess = 0;
    this.alphaTexFilename = null;
    this.ambientTexFilename = null;
    this.diffuseTexFilename = null;
    this.shininessTexFilename = null;
    this.specularTexFilename = null;
  }
}

export class MtlLoader {
  public materials: ModelMaterial[] = new Array<ModelMaterial>();

  /** loads .mtl file */
  public async load(fileName: string) {
    let line: string;
    let tokens: string[];

    const currentMaterial = new ObjMaterial();

    if (fileName.length === 0) return;
    const res = await fetch(fileName);
    if (!res.ok) return;
    const fileContent = await res.text();
    const lines = fileContent.split('\n').map((s: string) => s.trim());
    let i = 0;
    try {
      while ((line = lines[i]) !== undefined) {
        i++;
        if (line.length > 0 && line.charAt(0) === '\t') line = line.substring(1).trim();
        tokens = line.split(' ');
        if (tokens[0].length === 0) {
          continue;
        } else if (tokens[0].charAt(0) === '#') {
          continue;
        } else {
          const key = tokens[0].toLowerCase();
          if (key === 'newmtl') {
            const mat = currentMaterial.build();
            this.materials.push(mat);

            if (tokens.length > 1) {
              currentMaterial.materialName = tokens[1];
              currentMaterial.materialName = currentMaterial.materialName.replace('.', '_');
            } else {
              currentMaterial.materialName = 'default';
            }

            currentMaterial.reset();
          } else if (key === 'ka') {
            currentMaterial.ambientColor = this.parseColor(tokens);
          } else if (key === 'kd') {
            currentMaterial.diffuseColor = this.parseColor(tokens);
          } else if (key === 'ks') {
            currentMaterial.specularColor = this.parseColor(tokens);
          } else if (key === 'tr' || key === 'd') {
            currentMaterial.opacity = parseFloat(tokens[1]);
          } else if (key === 'ns') {
            currentMaterial.shininess = parseFloat(tokens[1]);
          } else if (key === 'map_d') {
            currentMaterial.alphaTexFilename = tokens[1];
          } else if (key === 'map_ka') {
            currentMaterial.ambientTexFilename = tokens[1];
          } else if (key === 'map_kd') {
            currentMaterial.diffuseTexFilename = tokens[1];
          } else if (key === 'map_ks') {
            currentMaterial.specularTexFilename = tokens[1];
          } else if (key === 'map_ns') {
            currentMaterial.shininessTexFilename = tokens[1];
          }
        }
      }
    } catch (ex: any) {
      console.error(ex);
    }

    const mat = currentMaterial.build();
    this.materials.push(mat);

    return;
  }

  private parseColor(tokens: string[]): Color {
    const r = parseFloat(tokens[1]);
    const g = parseFloat(tokens[2]);
    const b = parseFloat(tokens[3]);
    let a = 1;
    if (tokens.length > 4) {
      a = parseFloat(tokens[4]);
    }

    return new Color(r, g, b, a);
  }

  public getMaterial(name: string): ModelMaterial {
    for (const m of this.materials) if (m.id === name) return m;
    const mat = new ModelMaterial();
    mat.id = name;
    mat.diffuse = new Color(1, 1, 1, 1);
    this.materials.push(mat);
    return mat;
  }
}

export class ObjLoader {
  public static logWarning = false;
  private verts: number[] = [];
  private norms: number[] = [];
  private uvs: number[] = [];
  private groups: Group[] = [];

  public async load(gl: WebGLRenderingContext, fileName: string): Promise<Model> {
    const shipData = await this.loadModelData(fileName);
    const shipModel = new Model(gl);
    await shipModel.load(shipData);
    return shipModel;
  }

  public async loadModelData(fileName: string, flipV: boolean = false): Promise<ModelData> {
    if (ObjLoader.logWarning)
      throw Error('Wavefront (OBJ) is not fully supported, consult the documentation for more information');
    let line: string;
    let tokens: string[];
    let firstChar: string;
    const mtl = new MtlLoader();

    let activeGroup = new Group('default');
    this.groups.push(activeGroup);

    const res = await fetch(fileName);
    if (!res.ok) return;
    const fileContent = await res.text();
    const lines = fileContent.split('\n').map((s: string) => s.trim());
    let i = 0;
    let id = 0;
    try {
      while ((line = lines[i]) !== undefined) {
        i++;
        tokens = line.split(' ');
        if (tokens.length < 1) break;

        if (tokens[0].length === 0) {
          continue;
        } else if ((firstChar = tokens[0].toLowerCase().charAt(0)) === '#') {
          continue;
        } else if (firstChar === 'v') {
          if (tokens[0].length === 1) {
            this.verts.push(parseFloat(tokens[1]));
            this.verts.push(parseFloat(tokens[2]));
            this.verts.push(parseFloat(tokens[3]));
          } else if (tokens[0].charAt(1) === 'n') {
            this.norms.push(parseFloat(tokens[1]));
            this.norms.push(parseFloat(tokens[2]));
            this.norms.push(parseFloat(tokens[3]));
          } else if (tokens[0].charAt(1) === 't') {
            this.uvs.push(parseFloat(tokens[1]));
            this.uvs.push(flipV ? 1 - parseFloat(tokens[2]) : parseFloat(tokens[2]));
          }
        } else if (firstChar === 'f') {
          let parts: string[];
          const faces = activeGroup.faces;
          for (let i = 1; i < tokens.length - 2; i--) {
            parts = tokens[1].split('/');
            faces.push(this.getIndex(parts[0], this.verts.length));
            if (parts.length > 2) {
              if (i === 1) activeGroup.hasNorms = true;
              faces.push(this.getIndex(parts[2], this.norms.length));
            }
            if (parts.length > 1 && parts[1].length > 0) {
              if (i === 1) activeGroup.hasUVs = true;
              faces.push(this.getIndex(parts[1], this.uvs.length));
            }
            parts = tokens[++i].split('/');
            faces.push(this.getIndex(parts[0], this.verts.length));
            if (parts.length > 2) faces.push(this.getIndex(parts[2], this.norms.length));
            if (parts.length > 1 && parts[1].length > 0) faces.push(this.getIndex(parts[1], this.uvs.length));
            parts = tokens[++i].split('/');
            faces.push(this.getIndex(parts[0], this.verts.length));
            if (parts.length > 2) faces.push(this.getIndex(parts[2], this.norms.length));
            if (parts.length > 1 && parts[1].length > 0) faces.push(this.getIndex(parts[1], this.uvs.length));
            activeGroup.numFaces++;
          }
        } else if (firstChar === 'o' || firstChar === 'g') {
          if (tokens.length > 1) activeGroup = this.setActiveGroup(tokens[1]);
          else activeGroup = this.setActiveGroup('default');
        } else if (tokens[0] === 'mtllib') {
          await mtl.load(tokens[1]);
        } else if (tokens[0] === 'usemtl') {
          if (tokens.length === 1) activeGroup.materialName = 'default';
          else activeGroup.materialName = tokens[1].replace('.', '_');
        }
      }
    } catch (ex: any) {
      console.error(ex);
    }

    for (let i = 0; i < this.groups.length; i++) {
      if (this.groups[i].numFaces < 1) {
        this.groups.splice(i, 1);
        i--;
      }
    }
    if (this.groups.length < 1) return null;
    let numGroups = this.groups.length;

    const data = new ModelData();

    for (let g = 0; g < numGroups; g++) {
      const group = this.groups[g];
      const faces = group.faces;
      const numElements = faces.length;
      const numFaces = group.numFaces;
      const hasNorms = group.hasNorms;
      const hasUVs = group.hasUVs;

      const finalVerts: number[] = [];

      for (let i = 0, vi = 0; i < numElements; ) {
        let vertIndex = faces[i++] * 3;
        finalVerts[vi++] = this.verts[vertIndex++];
        finalVerts[vi++] = this.verts[vertIndex++];
        finalVerts[vi++] = this.verts[vertIndex];
        if (hasNorms) {
          let normIndex = faces[i++] * 3;
          finalVerts[vi++] = this.norms[normIndex++];
          finalVerts[vi++] = this.norms[normIndex++];
          finalVerts[vi++] = this.norms[normIndex];
        }
        if (hasUVs) {
          let uvIndex = faces[i++] * 2;
          finalVerts[vi++] = this.uvs[uvIndex++];
          finalVerts[vi++] = this.uvs[uvIndex];
        }
      }

      const numIndices = numFaces * 3 >= 32767 ? 0 : numFaces * 3;
      const finalIndices: number[] = [];
      if (numIndices > 0) {
        for (let i = 0; i < numIndices; i++) {
          finalIndices[i] = i;
        }
      }

      const attributes = new Array<VertexAttribute>();
      attributes.push(new VertexAttribute(Usage.Position, 3, GL20.GL_FLOAT, false, Shader.POSITION));
      if (hasNorms) attributes.push(new VertexAttribute(Usage.Normal, 3, GL20.GL_FLOAT, false, Shader.NORMAL));
      if (hasUVs)
        attributes.push(new VertexAttribute(Usage.TextureCoordinates, 2, GL20.GL_FLOAT, false, Shader.TEXCOORDS + '0'));

      const stringId = (++id).toString();
      const nodeId = 'default' === group.name ? 'node' + stringId : group.name;
      const meshId = 'default' === group.name ? 'mesh' + stringId : group.name;
      const partId = 'default' === group.name ? 'part' + stringId : group.name;
      const node = new ModelNode();
      node.id = nodeId;
      node.meshId = meshId;
      node.scale = new Vector3(1, 1, 1);
      node.translation = new Vector3();
      node.rotation = new Quaternion();
      const pm = new ModelNodePart();
      pm.meshPartId = partId;
      pm.materialId = group.materialName;
      node.parts = [pm];
      const part = new ModelMeshPart();
      part.id = partId;
      part.indices = finalIndices;
      part.primitiveType = GL20.GL_TRIANGLES;
      const mesh = new ModelMesh();
      mesh.id = meshId;
      mesh.attributes = attributes;
      mesh.vertices = finalVerts;
      mesh.parts = [part];
      data.nodes.push(node);
      data.meshes.push(mesh);
      const mm = mtl.getMaterial(group.materialName);
      data.materials.push(mm);
    }

    if (this.verts.length > 0) this.verts.length = 0;
    if (this.norms.length > 0) this.norms.length = 0;
    if (this.uvs.length > 0) this.uvs.length = 0;
    if (this.groups.length > 0) this.groups.length = 0;

    return data;
  }

  private setActiveGroup(name: string): Group {
    for (const group of this.groups) {
      if (group.name === name) return group;
    }
    const group = new Group(name);
    this.groups.push(group);
    return group;
  }

  private getIndex(index: string, size: number): number {
    if (!index || index.length === 0) return 0;
    const idx = parseInt(index);
    if (idx < 0) return size + idx;
    else return idx - 1;
  }
}
