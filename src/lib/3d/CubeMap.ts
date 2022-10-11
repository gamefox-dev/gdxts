import { GLTexture } from '../GLTexture';
import { Vector3 } from '../Vector3';
import { GL20 } from './GL20';

export class CubemapSide {
  /** The positive X and first side of the cubemap */
  static PositiveX = new CubemapSide(0, GL20.GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, -1, 0, 1, 0, 0);
  /** The negative X and second side of the cubemap */
  static NegativeX = new CubemapSide(1, GL20.GL_TEXTURE_CUBE_MAP_NEGATIVE_X, 0, -1, 0, -1, 0, 0);
  /** The positive Y and third side of the cubemap */
  static PositiveY = new CubemapSide(2, GL20.GL_TEXTURE_CUBE_MAP_POSITIVE_Y, 0, 0, 1, 0, 1, 0);
  /** The negative Y and fourth side of the cubemap */
  static NegativeY = new CubemapSide(3, GL20.GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, 0, -1, 0, -1, 0);
  /** The positive Z and fifth side of the cubemap */
  static PositiveZ = new CubemapSide(4, GL20.GL_TEXTURE_CUBE_MAP_POSITIVE_Z, 0, -1, 0, 0, 0, 1);
  /** The negative Z and sixth side of the cubemap */
  static NegativeZ = new CubemapSide(5, GL20.GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, -1, 0, 0, 0, -1);

  /** The zero based index of the side in the cubemap */
  public index: number;
  /** The OpenGL target (used for glTexImage2D) of the side. */
  public glEnum: number;
  /** The up vector to target the side. */
  public up: Vector3;
  /** The direction vector to target the side. */
  public direction: Vector3;

  constructor(
    index: number,
    glEnum: number,
    upX: number,
    upY: number,
    upZ: number,
    directionX: number,
    directionY: number,
    directionZ: number
  ) {
    this.index = index;
    this.glEnum = glEnum;
    this.up = new Vector3(upX, upY, upZ);
    this.direction = new Vector3(directionX, directionY, directionZ);
  }

  /** @return The OpenGL target (used for glTexImage2D) of the side. */
  public getGLEnum(): number {
    return this.glEnum;
  }

  /** @return The up vector of the side. */
  public getUp(out: Vector3): Vector3 {
    return out.setFrom(this.up);
  }

  /** @return The direction vector of the side. */
  public getDirection(out: Vector3): Vector3 {
    return out.setFrom(this.direction);
  }
}

export abstract class Cubemap extends GLTexture {
  // private static AssetManager assetManager;
  // static managedCubemaps = new Array<Cubemap>();
  // protected data: CubemapData;
  // /** Construct a Cubemap based on the given CubemapData. */
  // constructor (protected gl: WebGLRenderingContext, data: CubemapData,) {
  // 	super(gl, GL20.GL_TEXTURE_CUBE_MAP);
  // 	this.data = data;
  // 	this.load(data);
  // 	if (data.isManaged()) Cubemap.addManagedCubemap(this);
  // }
  // /** Construct a Cubemap with the specified texture files for the sides, does not generate mipmaps. */
  // public Cubemap (FileHandle positiveX, FileHandle negativeX, FileHandle positiveY, FileHandle negativeY, FileHandle positiveZ,
  // 	FileHandle negativeZ) {
  // 	this(positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ, false);
  // }
  // /** Construct a Cubemap with the specified texture files for the sides, optionally generating mipmaps. */
  // public Cubemap (FileHandle positiveX, FileHandle negativeX, FileHandle positiveY, FileHandle negativeY, FileHandle positiveZ,
  // 	FileHandle negativeZ, boolean useMipMaps) {
  // 	this(TextureData.Factory.loadFromFile(positiveX, useMipMaps), TextureData.Factory.loadFromFile(negativeX, useMipMaps),
  // 		TextureData.Factory.loadFromFile(positiveY, useMipMaps), TextureData.Factory.loadFromFile(negativeY, useMipMaps),
  // 		TextureData.Factory.loadFromFile(positiveZ, useMipMaps), TextureData.Factory.loadFromFile(negativeZ, useMipMaps));
  // }
  // /** Construct a Cubemap with the specified {@link Pixmap}s for the sides, does not generate mipmaps. */
  // public Cubemap (Pixmap positiveX, Pixmap negativeX, Pixmap positiveY, Pixmap negativeY, Pixmap positiveZ, Pixmap negativeZ) {
  // 	this(positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ, false);
  // }
  // /** Construct a Cubemap with the specified {@link Pixmap}s for the sides, optionally generating mipmaps. */
  // public Cubemap (Pixmap positiveX, Pixmap negativeX, Pixmap positiveY, Pixmap negativeY, Pixmap positiveZ, Pixmap negativeZ,
  // 	boolean useMipMaps) {
  // 	this(positiveX == null ? null : new PixmapTextureData(positiveX, null, useMipMaps, false),
  // 		negativeX == null ? null : new PixmapTextureData(negativeX, null, useMipMaps, false),
  // 		positiveY == null ? null : new PixmapTextureData(positiveY, null, useMipMaps, false),
  // 		negativeY == null ? null : new PixmapTextureData(negativeY, null, useMipMaps, false),
  // 		positiveZ == null ? null : new PixmapTextureData(positiveZ, null, useMipMaps, false),
  // 		negativeZ == null ? null : new PixmapTextureData(negativeZ, null, useMipMaps, false));
  // }
  // /** Construct a Cubemap with {@link Pixmap}s for each side of the specified size. */
  // public Cubemap (int width, int height, int depth, Format format) {
  // 	this(new PixmapTextureData(new Pixmap(depth, height, format), null, false, true),
  // 		new PixmapTextureData(new Pixmap(depth, height, format), null, false, true),
  // 		new PixmapTextureData(new Pixmap(width, depth, format), null, false, true),
  // 		new PixmapTextureData(new Pixmap(width, depth, format), null, false, true),
  // 		new PixmapTextureData(new Pixmap(width, height, format), null, false, true),
  // 		new PixmapTextureData(new Pixmap(width, height, format), null, false, true));
  // }
  // /** Construct a Cubemap with the specified {@link TextureData}'s for the sides */
  // public Cubemap (TextureData positiveX, TextureData negativeX, TextureData positiveY, TextureData negativeY,
  // 	TextureData positiveZ, TextureData negativeZ) {
  // 	this(new FacedCubemapData(positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ));
  // }
  // /** Sets the sides of this cubemap to the specified {@link CubemapData}. */
  // public load (data: CubemapData) {
  // 	if (!data.isPrepared()) data.prepare();
  // 	this.bind();
  // 	this.unsafeSetFilter(this.minFilter, this.magFilter, true);
  // 	this.unsafeSetWrap(this.uWrap, this.vWrap, true);
  // 	this.unsafeSetAnisotropicFilter(this.anisotropicFilterLevel, true);
  // 	data.consumeCubemapData();
  // 	this.gl.bindTexture(this.glTarget, null); //?
  // }
  // public getCubemapData (): CubemapData {
  // 	return this.data;
  // }
  // public isManaged (): boolean {
  // 	return this.data.isManaged();
  // }
  // protected reload () {
  // 	if (!this.isManaged()) throw new Error("Tried to reload an unmanaged Cubemap");
  // 	this.glHandle = this.gl.createTexture();
  // 	this.load(this.data);
  // }
  // public getWidth (): number {
  // 	return this.data.getWidth();
  // }
  // public getHeight (): number {
  // 	return this.data.getHeight();
  // }
  // public getDepth (): number {
  // 	return 0;
  // }
  // public dispose () {
  // 	// this is a hack. reason: we have to set the glHandle to 0 for textures that are
  // 	// reloaded through the asset manager as we first remove (and thus dispose) the texture
  // 	// and then reload it. the glHandle is set to 0 in invalidateAllTextures prior to
  // 	// removal from the asset manager.
  // 	if (this.glHandle == 0) return;
  // 	this.delete();
  // 	if (this.data.isManaged())
  // 	{
  // 		const index = Cubemap.managedCubemaps.indexOf(this);
  // 		if(index >= 0)
  // 		{
  // 			Cubemap.managedCubemaps.splice(index, 1);
  // 		}
  // 	}
  // }
  // private static addManagedCubemap (cubemap: Cubemap) {
  // 	Cubemap.managedCubemaps.push(cubemap);
  // }
  // /** Clears all managed cubemaps. This is an internal method. Do not use it! */
  // public static clearAllCubemaps () {
  // 	Cubemap.managedCubemaps.length = 0;
  // }
  // /** Invalidate all managed cubemaps. This is an internal method. Do not use it! */
  // public static invalidateAllCubemaps () {
  // 	Array<Cubemap> managedCubemapArray = managedCubemaps.get(app);
  // 	if (managedCubemapArray == null) return;
  // 	if (assetManager == null) {
  // 		for (int i = 0; i < managedCubemapArray.size; i++) {
  // 			Cubemap cubemap = managedCubemapArray.get(i);
  // 			cubemap.reload();
  // 		}
  // 	} else {
  // 		// first we have to make sure the AssetManager isn't loading anything anymore,
  // 		// otherwise the ref counting trick below wouldn't work (when a cubemap is
  // 		// currently on the task stack of the manager.)
  // 		assetManager.finishLoading();
  // 		// next we go through each cubemap and reload either directly or via the
  // 		// asset manager.
  // 		Array<Cubemap> cubemaps = new Array<Cubemap>(managedCubemapArray);
  // 		for (Cubemap cubemap : cubemaps) {
  // 			String fileName = assetManager.getAssetFileName(cubemap);
  // 			if (fileName == null) {
  // 				cubemap.reload();
  // 			} else {
  // 				// get the ref count of the cubemap, then set it to 0 so we
  // 				// can actually remove it from the assetmanager. Also set the
  // 				// handle to zero, otherwise we might accidentially dispose
  // 				// already reloaded cubemaps.
  // 				final int refCount = assetManager.getReferenceCount(fileName);
  // 				assetManager.setReferenceCount(fileName, 0);
  // 				cubemap.glHandle = 0;
  // 				// create the parameters, passing the reference to the cubemap as
  // 				// well as a callback that sets the ref count.
  // 				CubemapParameter params = new CubemapParameter();
  // 				params.cubemapData = cubemap.getCubemapData();
  // 				params.minFilter = cubemap.getMinFilter();
  // 				params.magFilter = cubemap.getMagFilter();
  // 				params.wrapU = cubemap.getUWrap();
  // 				params.wrapV = cubemap.getVWrap();
  // 				params.cubemap = cubemap; // special parameter which will ensure that the references stay the same.
  // 				params.loadedCallback = new LoadedCallback() {
  // 					@Override
  // 					public void finishedLoading (AssetManager assetManager, String fileName, Class type) {
  // 						assetManager.setReferenceCount(fileName, refCount);
  // 					}
  // 				};
  // 				// unload the c, create a new gl handle then reload it.
  // 				assetManager.unload(fileName);
  // 				cubemap.glHandle = Gdx.gl.glGenTexture();
  // 				assetManager.load(fileName, Cubemap.class, params);
  // 			}
  // 		}
  // 		managedCubemapArray.clear();
  // 		managedCubemapArray.addAll(cubemaps);
  // 	}
  // }
  // /** Sets the {@link AssetManager}. When the context is lost, cubemaps managed by the asset manager are reloaded by the manager
  //  * on a separate thread (provided that a suitable {@link AssetLoader} is registered with the manager). Cubemaps not managed by
  //  * the AssetManager are reloaded via the usual means on the rendering thread.
  //  * @param manager the asset manager. */
  // public static setAssetManager (AssetManager manager) {
  // 	Cubemap.assetManager = manager;
  // }
  // public static getManagedStatus (): string {
  // 	return `"Managed cubemap/app: {${Cubemap.managedCubemaps.length}}`;
  // }
  // /** @return the number of managed cubemaps currently loaded */
  // public static getNumManagedCubemaps () {
  // 	return Cubemap.managedCubemaps.length;
  // }
}
