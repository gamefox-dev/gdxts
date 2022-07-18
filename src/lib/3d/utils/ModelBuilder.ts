import { Model } from "../model/Model";
import { Node } from "../model/Node";
import { MeshBuilder } from "./MeshBuilder";
import { Material } from "../Material";
import { Matrix4 } from "../../Matrix4";
import { VertexAttributes } from "../VertexAttributes";
import { Disposable } from "../../Utils";
import { MeshPart } from "../model/MeshPart";
import { NodePart } from "../model/NodePart";
import { GL20 } from "../GL20";

const SHORT_MAX_VALUE = 32767;

export class ModelBuilder {
  private model: Model;
  private node: Node;
  private builders: MeshBuilder[] = [];
  private tmpTransform: Matrix4 = new Matrix4();

  constructor(private gl: WebGLRenderingContext) {}

  private getBuilder(attributes: VertexAttributes): MeshBuilder {
    for (const mb of this.builders)
      if (
        mb.getAttributes().equals(attributes) &&
        mb.getLastIndex() < SHORT_MAX_VALUE / 2
      )
        return mb;
    const result = new MeshBuilder(this.gl);
    result.begin(attributes);
    this.builders.push(result);
    return result;
  }

  public begin() {
    if (this.model != null) throw new Error("Call end() first");
    this.node = null;
    this.model = new Model(this.gl);
    this.builders.length = 0;
  }

  public end(): Model {
    if (this.model == null) throw new Error("Call begin() first");
    const result = this.model;
    this.endnode();
    this.model = null;

    for (const mb of this.builders) mb.end();
    this.builders.length = 0;

    ModelBuilder.rebuildReferencesWithModel(result);
    return result;
  }

  public createNode(): Node {
    const node = new Node();
    this.addNode(node);
    node.id = "node" + this.model.nodes.length;
    return node;
  }

  protected addNode(node: Node): Node {
    if (this.model == null) throw new Error("Call begin() first");

    this.endnode();

    this.model.nodes.push(node);
    this.node = node;

    return node;
  }

  private endnode() {
    if (this.node != null) {
      this.node = null;
    }
  }

  public manage(disposable: Disposable) {
    if (this.model == null) throw new Error("Call begin() first");
    this.model.manageDisposable(disposable);
  }

  public partByMeshPart(meshpart: MeshPart, material: Material) {
    if (this.node == null) this.createNode();
    this.node.parts.push(new NodePart(meshpart, material));
  }

  public createBox(
    width: number,
    height: number,
    depth: number,
    material: Material,
    attributes: number
  ) {
    this.begin();
    this.part("box", GL20.GL_TRIANGLES, attributes, material).box(
      width,
      height,
      depth
    );
    return this.end();
  }

  public part(
    id: string,
    primitiveType: number,
    attributes: number,
    material: Material
  ): MeshBuilder {
    const builder = this.getBuilder(MeshBuilder.createAttributes(attributes));
    if (this.node == null) this.createNode();
    this.node.parts.push(
      new NodePart(builder.part(id, primitiveType), material)
    );
    return builder;
  }

  public static rebuildReferencesWithModel(model: Model) {
    model.materials.length = 0;
    model.meshes.length = 0;
    model.meshParts.length = 0;
    for (const node of model.nodes) ModelBuilder.rebuildReferences(model, node);
  }

  private static rebuildReferences(model: Model, node: Node) {
    for (const mpm of node.parts) {
      if (!model.materials.includes(mpm.material))
        model.materials.push(mpm.material);
      if (!model.meshParts.includes(mpm.meshPart)) {
        model.meshParts.push(mpm.meshPart);
        if (!model.meshes.includes(mpm.meshPart.mesh))
          model.meshes.push(mpm.meshPart.mesh);
        model.manageDisposable(mpm.meshPart.mesh);
      }
    }
    for (const child of node.getChildren())
      this.rebuildReferences(model, child);
  }
}
