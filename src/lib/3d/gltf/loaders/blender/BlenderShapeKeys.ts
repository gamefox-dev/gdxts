import { GLTFMesh } from '../../data/geometry/GLTFMesh';

export class BlenderShapeKeys {
  /** Blender store shape key names in mesh extras.
	 * <pre>
	 *  "meshes" : [
          {
            "name" : "Plane",
            "extras" : {
                "targetNames" : [
                    "Water",
                    "Mountains"
                ]
            },
            "primitives" : ...,
            "weights" : [0.6, 0.3]
          }
        ]
        </pre>
	 */
  public static parse(glMesh: GLTFMesh): string[] {
    if (glMesh.extras == null) return null;
    const targetNames = glMesh.extras.value['targetNames'];
    if (targetNames != undefined && Array.isArray(targetNames)) {
      return targetNames;
    }
    return null;
  }
}
