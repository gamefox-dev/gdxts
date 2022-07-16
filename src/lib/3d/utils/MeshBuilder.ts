import { Matrix4 } from "../../Matrix4";
import { ShaderProgram } from "../../ShaderProgram";
import { TextureRegion } from "../../TextureRegion";
import { Color } from "../../Utils";
import { Vector3 } from "../../Vector3";
import { BoundingBox } from "../BoundingBox";
import { GL20 } from "../GL20";
import { Matrix3 } from "../Matrix3";
import { Mesh } from "../Mesh";
import { MeshPart } from "../model/MeshPart";
import { Usage, VertexAttribute } from "../VertexAttribute";
import { VertexAttributes } from "../VertexAttributes";

 export class MeshBuilder {
   public static MAX_VERTICES = 1 << 16;
   public static MAX_INDEX = MeshBuilder.MAX_VERTICES - 1;
 
   private static tmpIndices = new Uint16Array();
   private static tmpVertices = new Float32Array();
 
   private tempC1: Color = new Color();
   private attributes: VertexAttributes;
   private vertices = new Float32Array();
   private indices = new Uint16Array();
   private stride: number;
   private vindex: number;
   private istart: number;
   private posOffset: number;
   private posSize: number;
   private norOffset: number;
   private biNorOffset: number;
   private tangentOffset: number;
   private colOffset: number;
   private colSize: number;
   private cpOffset: number;
   private uvOffset: number;
   private meshPart: MeshPart;
   private parts: MeshPart[] = [];
   private color: Color = Color.WHITE;
   private hasColor = false;
   private primitiveType: number;

   private uOffset = 0;
   private uScale = 1;
   private vOffset = 0;
   private vScale = 1;
   private hasUVTransform = false;
   private vertex: number[];
 
   private vertexTransformationEnabled = false;
   private positionTransform: Matrix4 = new Matrix4();
   private normalTransform: Matrix3 = new Matrix3();
   private bounds: BoundingBox = new BoundingBox();

   constructor(private gl: WebGLRenderingContext)
   {

   }
   
   public static public createAttributes (usage: number): VertexAttributes {
		const attrs = new Array<VertexAttribute>();

		if ((usage & Usage.Position) == Usage.Position)
			attrs.push(new VertexAttribute(Usage.Position, 3, GL20.GL_FLOAT, false, ShaderProgram.POSITION));
		if ((usage & Usage.ColorUnpacked) == Usage.ColorUnpacked)
			attrs.push(new VertexAttribute(Usage.ColorUnpacked, 4, GL20.GL_FLOAT, false, ShaderProgram.COLOR));
		if ((usage & Usage.ColorPacked) == Usage.ColorPacked)
			attrs.push(new VertexAttribute(Usage.ColorPacked, 4, GL20.GL_UNSIGNED_INT, true,  ShaderProgram.COLOR));
		if ((usage & Usage.Normal) == Usage.Normal) attrs.push(new VertexAttribute(Usage.Normal, 3, GL20.GL_FLOAT, false, ShaderProgram.NORMAL));
		if ((usage & Usage.TextureCoordinates) == Usage.TextureCoordinates)
			attrs.push(new VertexAttribute(Usage.TextureCoordinates, 2, GL20.GL_FLOAT, false , ShaderProgram.TEXCOORDS + "0"));
		const attributes = new Array<VertexAttribute>(attrs.length);
		for (let i = 0; i < attributes.length; i++)
			attributes[i] = attrs[i];
		return new VertexAttributes(attributes);
	}

	public begin (attributes: VertexAttributes, primitiveType: number = -1) {
		if (this.attributes != null) throw new Error("Call end() first");
		this.attributes = attributes;
		this.vertices = new Float32Array();
		this.indices = new Uint16Array();
		this.parts.length = 0;
		this.vindex = 0;
		this.lastIndex = -1;
		this.istart = 0;
		this.part = null;
		this.stride = attributes.vertexSize / 4;
		if (this.vertex == null || this.vertex.length < this.stride) this.vertex = new Array<number>(this.stride);
		let a = attributes.findByUsage(Usage.Position);
		if (a == null) throw new Error("Cannot build mesh without position attribute");
		this.posOffset = a.offset / 4;
		this.posSize = a.numComponents;
		a = attributes.findByUsage(Usage.Normal);
		this.norOffset = a == null ? -1 : a.offset / 4;
		a = attributes.findByUsage(Usage.BiNormal);
		this.biNorOffset = a == null ? -1 : a.offset / 4;
		a = attributes.findByUsage(Usage.Tangent);
		this.tangentOffset = a == null ? -1 : a.offset / 4;
		a = attributes.findByUsage(Usage.ColorUnpacked);
		this.colOffset = a == null ? -1 : a.offset / 4;
		this.colSize = a == null ? 0 : a.numComponents;
		a = attributes.findByUsage(Usage.ColorPacked);
		this.cpOffset = a == null ? -1 : a.offset / 4;
		a = attributes.findByUsage(Usage.TextureCoordinates);
		this.uvOffset = a == null ? -1 : a.offset / 4;
		this.setColor(null);
		this.setVertexTransform(null);
		this.setUVRangeByRegion(null);
		this.primitiveType = primitiveType;
		this.bounds.inf();
	}

  public setColor (color: Color) {
    const newColor = (this.hasColor = (color != null)) ? Color.WHITE : color;
		this.color.set(newColor.r, newColor.g, newColor.b, newColor.a);
	}

	private endpart () {
		if (this.meshPart != null) {
			this.bounds.getCenter(this.meshPart.center);
			this.bounds.getDimensions(this.meshPart.halfExtents).scale(0.5);
			this.meshPart.radius = this.meshPart.halfExtents.length();
			this.bounds.inf();
			this.meshPart.offset = this.istart;
			this.meshPart.size = this.indices.length - this.istart;
			this.istart = this.indices.length;
			this.meshPart = null;
		}
	}

	public part (id: string, primitiveType: number, meshPart: MeshPart = null): MeshPart {
		if (this.attributes == null) throw new Error("Call begin() first");

    if(meshPart === null) meshPart = new MeshPart();
		this.endpart();

		this.meshPart = meshPart;
		this.meshPart.id = id;
		this.primitiveType = this.meshPart.primitiveType = primitiveType;
		this.parts.push(this.meshPart);

		this.setColor(null);
		this.setVertexTransform(null);
		this.setUVRangeByRegion(null);

		return this.meshPart;
	}

	public end (mesh: Mesh = null): Mesh {
    if(mesh === null)
    {
      mesh = new Mesh(this.gl, true, true, Math.min(this.vertices.length / this.stride, MeshBuilder.MAX_VERTICES), this.indices.length, this.attributes);
    }
		this.endpart();

		if (this.attributes == null) throw new Error("Call begin() first");
		if (!this.attributes.equals(mesh.getVertexAttributes())) throw new Error("Mesh attributes don't match");
		if ((mesh.getMaxVertices() * this.stride) < this.vertices.length) throw new Error(
			"Mesh can't hold enough vertices: " + mesh.getMaxVertices() + " * " + this.stride + " < " + this.vertices.length);
		if (mesh.getMaxIndices() < this.vertices.length)
			throw new Error("Mesh can't hold enough indices: " + mesh.getMaxIndices() + " < " + this.vertices.length);

		mesh.setVertices(this.vertices.items, 0, this.vertices.length);
		mesh.setIndices(indices.items, 0, this.vertices.length);

		for (const p of this.parts)
			p.mesh = mesh;
		this.parts.length = 0;

		this.attributes = null;
		this.vertices = new Float32Array();
		this.indices = new Uint16Array();

		return mesh;
	}

	public clear () {
		this.vertices.clear();
		this.indices.clear();
		this.parts.clear();
		this.vindex = 0;
		this.lastIndex = -1;
		this.istart = 0;
		this.part = null;
	}

	public getFloatsPerVertex (): number {
		return stride;
	}

	public setUVRange ( u1: number, v1: number, u2: number, v2: number) {
		uOffset = u1;
		vOffset = v1;
		uScale = u2 - u1;
		vScale = v2 - v1;
		hasUVTransform = !(MathUtils.isZero(u1) && MathUtils.isZero(v1) && MathUtils.isEqual(u2, 1) && MathUtils.isEqual(v2, 1));
	}

	public setUVRangeByRegion (region: TextureRegion) {
		if (region == null) {
			hasUVTransform = false;
			uOffset = vOffset = 0;
			uScale = vScale = 1;
		} else {
			hasUVTransform = true;
			setUVRange(region.getU(), region.getV(), region.getU2(), region.getV2());
		}
	}

	public setVertexTransform (transform: Matrix4) {
		vertexTransformationEnabled = transform != null;
		if (vertexTransformationEnabled) {
			positionTransform.set(transform);
			normalTransform.set(transform).inv().transpose();
		} else {
			positionTransform.idt();
			normalTransform.idt();
		}
	}

	public  ensureVertices (numVertices: number) {
		vertices.ensureCapacity(stride * numVertices);
	}

	public ensureIndices (numIndices: number) {
		indices.ensureCapacity(numIndices);
	}
	public ensureTriangleIndices (numTriangles: number) {
		if (primitiveType == GL20.GL_LINES)
			ensureIndices(6 * numTriangles);
		else if (primitiveType == GL20.GL_TRIANGLES || primitiveType == GL20.GL_POINTS)
			ensureIndices(3 * numTriangles);
		else
			throw new Error("Incorrect primtive type");
	}

	public ensureRectangleIndices ( numRectangles: number) {
		if (primitiveType == GL20.GL_POINTS)
			ensureIndices(4 * numRectangles);
		else if (primitiveType == GL20.GL_LINES)
			ensureIndices(8 * numRectangles);
		else
			// GL_TRIANGLES
			ensureIndices(6 * numRectangles);
	}

	private lastIndex = -1;
	private static vTmp: Vector3 = new Vector3();

	private static transformPosition (values: number[], offset: number, size: number, transform: Matrix4) {
		if (size > 2) {
			vTmp.set(values[offset], values[offset + 1], values[offset + 2]).mul(transform);
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
			values[offset + 2] = vTmp.z;
		} else if (size > 1) {
			vTmp.set(values[offset], values[offset + 1], 0).mul(transform);
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
		} else
			values[offset] = vTmp.set(values[offset], 0, 0).mul(transform).x;
	}

	private static transformNormal (values: number[], offset: number, size: number, transform: Matrix3) {
		if (size > 2) {
			vTmp.set(values[offset], values[offset + 1], values[offset + 2]).mul(transform).nor();
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
			values[offset + 2] = vTmp.z;
		} else if (size > 1) {
			vTmp.set(values[offset], values[offset + 1], 0).mul(transform).nor();
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
		} else
			values[offset] = vTmp.set(values[offset], 0, 0).mul(transform).nor().x;
	}

	private addVertex (values: number[], offset: number) {
		const o = vertices.size;
		vertices.addAll(values, offset, stride);
		lastIndex = vindex++;

		if (vertexTransformationEnabled) {
			transformPosition(vertices.items, o + posOffset, posSize, positionTransform);
			if (norOffset >= 0) transformNormal(vertices.items, o + norOffset, 3, normalTransform);
			if (biNorOffset >= 0) transformNormal(vertices.items, o + biNorOffset, 3, normalTransform);
			if (tangentOffset >= 0) transformNormal(vertices.items, o + tangentOffset, 3, normalTransform);
		}

		const x = vertices.items[o + posOffset];
		const y = (posSize > 1) ? vertices.items[o + posOffset + 1] : 0;
		const z = (posSize > 2) ? vertices.items[o + posOffset + 2] : 0;
		bounds.ext(x, y, z);

		if (hasColor) {
			if (colOffset >= 0) {
				vertices.items[o + colOffset] *= color.r;
				vertices.items[o + colOffset + 1] *= color.g;
				vertices.items[o + colOffset + 2] *= color.b;
				if (colSize > 3) vertices.items[o + colOffset + 3] *= color.a;
			} else if (cpOffset >= 0) {
				Color.abgr8888ToColor(tempC1, vertices.items[o + cpOffset]);
				vertices.items[o + cpOffset] = tempC1.mul(color).toFloatBits();
			}
		}

		if (hasUVTransform && uvOffset >= 0) {
			vertices.items[o + uvOffset] = uOffset + uScale * vertices.items[o + uvOffset];
			vertices.items[o + uvOffset + 1] = vOffset + vScale * vertices.items[o + uvOffset + 1];
		}
	}

	public addMeshByMestPart (meshpart: MeshPart) {
		addMesh(meshpart.mesh, meshpart.offset, meshpart.size);
	}

	public addMeshByMesh (mesh: Mesh, indexOffset: number = 0, numIndices: number = mesh.getNumIndices()) {
		if (!attributes.equals(mesh.getVertexAttributes())) throw new Error("Vertex attributes do not match");
		if (numIndices <= 0) return;
		const numFloats = mesh.getNumVertices() * stride;
		tmpVertices.clear();
		tmpVertices.ensureCapacity(numFloats);
		tmpVertices.size = numFloats;
		mesh.getVertices(tmpVertices.items);

		tmpIndices.clear();
		tmpIndices.ensureCapacity(numIndices);
		tmpIndices.size = numIndices;
		mesh.getIndices(indexOffset, numIndices, tmpIndices.items, 0);

		addMesh(tmpVertices.items, tmpIndices.items, 0, numIndices);
	}

	private static indicesMap: Map<number, number> = null;

	public addMeshByData (vertices: number[], indices: number[], indexOffset: number, numIndices: number) {
		if (indicesMap == null)
			indicesMap = new IntIntMap(numIndices);
		else {
			indicesMap.clear();
			indicesMap.ensureCapacity(numIndices);
		}
		ensureIndices(numIndices);
		const numVertices = vertices.length / stride;
		ensureVertices(numVertices < numIndices ? numVertices : numIndices);
		for (let i = 0; i < numIndices; i++) {
			const sidx = indices[indexOffset + i] & 0xFFFF;
			const didx = indicesMap.get(sidx, -1);
			if (didx < 0) {
				addVertex(vertices, sidx * stride);
				indicesMap.put(sidx, didx = lastIndex);
			}
			index(didx);
		}
	}

	public getFloatsPerVertex () {
		return stride;
	}

	public setUVRange (u1: number, v1: number, u2: number, v2: number) {
		uOffset = u1;
		vOffset = v1;
		uScale = u2 - u1;
		vScale = v2 - v1;
		hasUVTransform = !(MathUtils.isZero(u1) && MathUtils.isZero(v1) && MathUtils.isEqual(u2, 1) && MathUtils.isEqual(v2, 1));
	}

	public setUVRange (region: TextureRegion) {
		if (region == null) {
			hasUVTransform = false;
			uOffset = vOffset = 0;
			uScale = vScale = 1;
		} else {
			hasUVTransform = true;
			setUVRange(region.getU(), region.getV(), region.getU2(), region.getV2());
		}
	}
	public getVertexTransform (out :Matrix4): Matrix4 {
		return out.set(positionTransform);
	}

	public setVertexTransform (transform: Matrix4): Matrix4 {
		vertexTransformationEnabled = transform != null;
		if (vertexTransformationEnabled) {
			positionTransform.set(transform);
			normalTransform.set(transform).inv().transpose();
		} else {
			positionTransform.idt();
			normalTransform.idt();
		}
	}

	public ensureIndices ( numIndices: number) {
		indices.ensureCapacity(numIndices);
	}

	public ensureTriangleIndices (numTriangles: number) {
		if (primitiveType == GL20.GL_LINES)
			ensureIndices(6 * numTriangles);
		else if (primitiveType == GL20.GL_TRIANGLES || primitiveType == GL20.GL_POINTS)
			ensureIndices(3 * numTriangles);
		else
			throw new GdxRuntimeException("Incorrect primtive type");
	}

	public ensureRectangleIndices (numRectangles: number) {
		if (primitiveType == GL20.GL_POINTS)
			ensureIndices(4 * numRectangles);
		else if (primitiveType == GL20.GL_LINES)
			ensureIndices(8 * numRectangles);
		else
			// GL_TRIANGLES
			ensureIndices(6 * numRectangles);
	}

	public ensureRectangles (numVertices: number, numRectangles: number) {
		ensureVertices(numVertices);
		ensureRectangleIndices(numRectangles);
	}

	private lastIndex = -1;
	private static vTmp: Vector3 = new Vector3();

	private static transformPosition (values: number[], offset: number, size: number, transform: Matrix4) {
		if (size > 2) {
			vTmp.set(values[offset], values[offset + 1], values[offset + 2]).mul(transform);
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
			values[offset + 2] = vTmp.z;
		} else if (size > 1) {
			vTmp.set(values[offset], values[offset + 1], 0).mul(transform);
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
		} else
			values[offset] = vTmp.set(values[offset], 0, 0).mul(transform).x;
	}

	private static transformNormal (values: number[], offset: number, size: number, transform: Matrix3) {
		if (size > 2) {
			vTmp.set(values[offset], values[offset + 1], values[offset + 2]).mul(transform).nor();
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
			values[offset + 2] = vTmp.z;
		} else if (size > 1) {
			vTmp.set(values[offset], values[offset + 1], 0).mul(transform).nor();
			values[offset] = vTmp.x;
			values[offset + 1] = vTmp.y;
		} else
			values[offset] = vTmp.set(values[offset], 0, 0).mul(transform).nor().x;
	}

	private addVertex (values: number[], offset: number) {
		const o = vertices.size;
		vertices.addAll(values, offset, stride);
		lastIndex = vindex++;

		if (vertexTransformationEnabled) {
			transformPosition(vertices.items, o + posOffset, posSize, positionTransform);
			if (norOffset >= 0) transformNormal(vertices.items, o + norOffset, 3, normalTransform);
			if (biNorOffset >= 0) transformNormal(vertices.items, o + biNorOffset, 3, normalTransform);
			if (tangentOffset >= 0) transformNormal(vertices.items, o + tangentOffset, 3, normalTransform);
		}

		const x = vertices.items[o + posOffset];
		const y = (posSize > 1) ? vertices.items[o + posOffset + 1] : 0f;
		const z = (posSize > 2) ? vertices.items[o + posOffset + 2] : 0f;
		bounds.ext(x, y, z);

		if (hasColor) {
			if (colOffset >= 0) {
				vertices.items[o + colOffset] *= color.r;
				vertices.items[o + colOffset + 1] *= color.g;
				vertices.items[o + colOffset + 2] *= color.b;
				if (colSize > 3) vertices.items[o + colOffset + 3] *= color.a;
			} else if (cpOffset >= 0) {
				Color.abgr8888ToColor(tempC1, vertices.items[o + cpOffset]);
				vertices.items[o + cpOffset] = tempC1.mul(color).toFloatBits();
			}
		}

		if (hasUVTransform && uvOffset >= 0) {
			vertices.items[o + uvOffset] = uOffset + uScale * vertices.items[o + uvOffset];
			vertices.items[o + uvOffset + 1] = vOffset + vScale * vertices.items[o + uvOffset + 1];
		}
	}
 }
 