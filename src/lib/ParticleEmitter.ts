import { Sprite } from "./Sprite";
import { MathUtils } from "./Utils";

export class ParticleEmitter {
  
}

export class Particle extends Sprite {
  public life = 0;
  public currentLife = 0;
  public xScale = 0;
  public xScaleDiff = 0;
  public yScale = 0
  public yScaleDiff = 0;
  public rotation = 0
  public rotationDiff = 0;
  public velocity = 0
  public velocityDiff = 0;
  public angle = 0
  public angleDiff = 0
  public angleCos = 0
  public angleSin = 0;
  public transparency = 0
  public transparencyDiff = 0
  public wind = 0
  public windDiff = 0;
  public gravity = 0
  public gravityDiff = 0;
  public tint: number[] = [];
  public frame = 0;

  constructor(sprite: Sprite) {
    super(sprite.region);
    this.set(sprite);
  }
}

export class ParticleValue {
  active: boolean =false;
  alwaysActive: boolean = false;

  public setAlwaysActive(alwaysActive: boolean) {
    this.alwaysActive = alwaysActive;
}

public isAlwaysActive(): boolean {
    return this.alwaysActive;
}

public isActive(): boolean {
    return this.alwaysActive || this.active;
}

public setActive(active: boolean) {
    this.active = active;
}

public load(value: ParticleValue) {
    this.active = value.active;
    this.alwaysActive = value.alwaysActive;
}
}

export class NumericValue extends ParticleValue {
  private value: number;

  public getValue(): number {
      return this.value;
  }

  public setValue(value: number) {
      this.value = value;
  }

  public load(value: NumericValue) {
      super.load(value);
      this.value = value.value;
  }

}

export class RangedNumericValue extends ParticleValue {
  private lowMin = 0;
  private lowMax = 0;

  public newLowValue () {
    return this.lowMin + (this.lowMax - this.lowMin) * Math.random();
  }

  public setLow (min: number, max = min) {
    this.lowMin = min;
    this.lowMax = max;
  }

  public getLowMin () {
    return this.lowMin;
  }

  public setLowMin (lowMin: number) {
    this.lowMin = lowMin;
  }

  public getLowMax () {
    return this.lowMax;
  }

  public setLowMax (lowMax: number) {
    this.lowMax = lowMax;
  }

  /** permanently scales the range by a scalar. */
  public scale (scale: number) {
    this.lowMin *= scale;
    this.lowMax *= scale;
  }

  public set (value:RangedNumericValue ) {
    this.lowMin = value.lowMin;
    this.lowMax = value.lowMax;
  }

  public  load ( value:RangedNumericValue) {
    super.load(value);
    this.lowMax = value.lowMax;
    this.lowMin = value.lowMin;
  }
}

static public class ScaledNumericValue extends RangedNumericValue {
  private float[] scaling = {1};
  float[] timeline = {0};
  private float highMin, highMax;
  private boolean relative;

  public float newHighValue () {
    return highMin + (highMax - highMin) * MathUtils.random();
  }

  public void setHigh (float value) {
    highMin = value;
    highMax = value;
  }

  public void setHigh (float min, float max) {
    highMin = min;
    highMax = max;
  }

  public float getHighMin () {
    return highMin;
  }

  public void setHighMin (float highMin) {
    this.highMin = highMin;
  }

  public float getHighMax () {
    return highMax;
  }

  public void setHighMax (float highMax) {
    this.highMax = highMax;
  }

  public void scale (float scale) {
    super.scale(scale);
    highMin *= scale;
    highMax *= scale;
  }

  public void set (RangedNumericValue value) {
    if (value instanceof ScaledNumericValue)
      set((ScaledNumericValue)value);
    else
      super.set(value);
  }

  public void set (ScaledNumericValue value) {
    super.set(value);
    this.highMin = value.highMin;
    this.highMax = value.highMax;
    if (scaling.length != value.scaling.length)
      scaling = Arrays.copyOf(value.scaling, value.scaling.length);
    else
      System.arraycopy(value.scaling, 0, scaling, 0, scaling.length);
    if (timeline.length != value.timeline.length)
      timeline = Arrays.copyOf(value.timeline, value.timeline.length);
    else
      System.arraycopy(value.timeline, 0, timeline, 0, timeline.length);
    this.relative = value.relative;
  }

  public float[] getScaling () {
    return scaling;
  }

  public void setScaling (float[] values) {
    this.scaling = values;
  }

  public float[] getTimeline () {
    return timeline;
  }

  public void setTimeline (float[] timeline) {
    this.timeline = timeline;
  }

  public boolean isRelative () {
    return relative;
  }

  public void setRelative (boolean relative) {
    this.relative = relative;
  }

  public float getScale (float percent) {
    int endIndex = -1;
    float[] timeline = this.timeline;
    int n = timeline.length;
    for (int i = 1; i < n; i++) {
      float t = timeline[i];
      if (t > percent) {
        endIndex = i;
        break;
      }
    }
    if (endIndex == -1) return scaling[n - 1];
    float[] scaling = this.scaling;
    int startIndex = endIndex - 1;
    float startValue = scaling[startIndex];
    float startTime = timeline[startIndex];
    return startValue + (scaling[endIndex] - startValue) * ((percent - startTime) / (timeline[endIndex] - startTime));
  }

  public void save (Writer output) throws IOException {
    super.save(output);
    if (!active) return;
    output.write("highMin: " + highMin + "\n");
    output.write("highMax: " + highMax + "\n");
    output.write("relative: " + relative + "\n");
    output.write("scalingCount: " + scaling.length + "\n");
    for (int i = 0; i < scaling.length; i++)
      output.write("scaling" + i + ": " + scaling[i] + "\n");
    output.write("timelineCount: " + timeline.length + "\n");
    for (int i = 0; i < timeline.length; i++)
      output.write("timeline" + i + ": " + timeline[i] + "\n");
  }

  public void load (BufferedReader reader) throws IOException {
    super.load(reader);
    if (!active) return;
    highMin = readFloat(reader, "highMin");
    highMax = readFloat(reader, "highMax");
    relative = readBoolean(reader, "relative");
    scaling = new float[readInt(reader, "scalingCount")];
    for (int i = 0; i < scaling.length; i++)
      scaling[i] = readFloat(reader, "scaling" + i);
    timeline = new float[readInt(reader, "timelineCount")];
    for (int i = 0; i < timeline.length; i++)
      timeline[i] = readFloat(reader, "timeline" + i);
  }

  public void load (ScaledNumericValue value) {
    super.load(value);
    highMax = value.highMax;
    highMin = value.highMin;
    scaling = new float[value.scaling.length];
    System.arraycopy(value.scaling, 0, scaling, 0, scaling.length);
    timeline = new float[value.timeline.length];
    System.arraycopy(value.timeline, 0, timeline, 0, timeline.length);
    relative = value.relative;
  }
}

static public class IndependentScaledNumericValue extends ScaledNumericValue {
  boolean independent;

  public boolean isIndependent () {
    return independent;
  }

  public void setIndependent (boolean independent) {
    this.independent = independent;
  }

  public void set (RangedNumericValue value) {
    if (value instanceof IndependentScaledNumericValue)
      set((IndependentScaledNumericValue)value);
    else
      super.set(value);
  }

  public void set (ScaledNumericValue value) {
    if (value instanceof IndependentScaledNumericValue)
      set((IndependentScaledNumericValue)value);
    else
      super.set(value);
  }

  public void set (IndependentScaledNumericValue value) {
    super.set(value);
    independent = value.independent;
  }

  public void save (Writer output) throws IOException {
    super.save(output);
    output.write("independent: " + independent + "\n");
  }

  public void load (BufferedReader reader) throws IOException {
    super.load(reader);
    // For backwards compatibility, independent property may not be defined
    if (reader.markSupported()) reader.mark(100);
    String line = reader.readLine();
    if (line == null) throw new IOException("Missing value: independent");
    if (line.contains("independent"))
      independent = Boolean.parseBoolean(readString(line));
    else if (reader.markSupported())
      reader.reset();
    else {
      // @see java.io.BufferedReader#markSupported may return false in some platforms (such as GWT),
      // in that case backwards commpatibility is not possible
      String errorMessage = "The loaded particle effect descriptor file uses an old invalid format. "
        + "Please download the latest version of the Particle Editor tool and recreate the file by"
        + " loading and saving it again.";
      Gdx.app.error("ParticleEmitter", errorMessage);
      throw new IOException(errorMessage);
    }
  }

  public void load (IndependentScaledNumericValue value) {
    super.load(value);
    independent = value.independent;
  }
}

static public class GradientColorValue extends ParticleValue {
  static private float[] temp = new float[4];

  private float[] colors = {1, 1, 1};
  float[] timeline = {0};

  public GradientColorValue () {
    alwaysActive = true;
  }

  public float[] getTimeline () {
    return timeline;
  }

  public void setTimeline (float[] timeline) {
    this.timeline = timeline;
  }

  /** @return the r, g and b values for every timeline position */
  public float[] getColors () {
    return colors;
  }

  /** @param colors the r, g and b values for every timeline position */
  public void setColors (float[] colors) {
    this.colors = colors;
  }

  public float[] getColor (float percent) {
    int startIndex = 0, endIndex = -1;
    float[] timeline = this.timeline;
    int n = timeline.length;
    for (int i = 1; i < n; i++) {
      float t = timeline[i];
      if (t > percent) {
        endIndex = i;
        break;
      }
      startIndex = i;
    }
    float startTime = timeline[startIndex];
    startIndex *= 3;
    float r1 = colors[startIndex];
    float g1 = colors[startIndex + 1];
    float b1 = colors[startIndex + 2];
    if (endIndex == -1) {
      temp[0] = r1;
      temp[1] = g1;
      temp[2] = b1;
      return temp;
    }
    float factor = (percent - startTime) / (timeline[endIndex] - startTime);
    endIndex *= 3;
    temp[0] = r1 + (colors[endIndex] - r1) * factor;
    temp[1] = g1 + (colors[endIndex + 1] - g1) * factor;
    temp[2] = b1 + (colors[endIndex + 2] - b1) * factor;
    return temp;
  }

  public void save (Writer output) throws IOException {
    super.save(output);
    if (!active) return;
    output.write("colorsCount: " + colors.length + "\n");
    for (int i = 0; i < colors.length; i++)
      output.write("colors" + i + ": " + colors[i] + "\n");
    output.write("timelineCount: " + timeline.length + "\n");
    for (int i = 0; i < timeline.length; i++)
      output.write("timeline" + i + ": " + timeline[i] + "\n");
  }

  public void load (BufferedReader reader) throws IOException {
    super.load(reader);
    if (!active) return;
    colors = new float[readInt(reader, "colorsCount")];
    for (int i = 0; i < colors.length; i++)
      colors[i] = readFloat(reader, "colors" + i);
    timeline = new float[readInt(reader, "timelineCount")];
    for (int i = 0; i < timeline.length; i++)
      timeline[i] = readFloat(reader, "timeline" + i);
  }

  public void load (GradientColorValue value) {
    super.load(value);
    colors = new float[value.colors.length];
    System.arraycopy(value.colors, 0, colors, 0, colors.length);
    timeline = new float[value.timeline.length];
    System.arraycopy(value.timeline, 0, timeline, 0, timeline.length);
  }
}

static public class SpawnShapeValue extends ParticleValue {
  SpawnShape shape = SpawnShape.point;
  boolean edges;
  SpawnEllipseSide side = SpawnEllipseSide.both;

  public SpawnShape getShape () {
    return shape;
  }

  public void setShape (SpawnShape shape) {
    this.shape = shape;
  }

  public boolean isEdges () {
    return edges;
  }

  public void setEdges (boolean edges) {
    this.edges = edges;
  }

  public SpawnEllipseSide getSide () {
    return side;
  }

  public void setSide (SpawnEllipseSide side) {
    this.side = side;
  }

  public void save (Writer output) throws IOException {
    super.save(output);
    if (!active) return;
    output.write("shape: " + shape + "\n");
    if (shape == SpawnShape.ellipse) {
      output.write("edges: " + edges + "\n");
      output.write("side: " + side + "\n");
    }
  }

  public void load (BufferedReader reader) throws IOException {
    super.load(reader);
    if (!active) return;
    shape = SpawnShape.valueOf(readString(reader, "shape"));
    if (shape == SpawnShape.ellipse) {
      edges = readBoolean(reader, "edges");
      side = SpawnEllipseSide.valueOf(readString(reader, "side"));
    }
  }

  public void load (SpawnShapeValue value) {
    super.load(value);
    shape = value.shape;
    edges = value.edges;
    side = value.side;
  }
}

static public enum SpawnShape {
  point, line, square, ellipse
}

static public enum SpawnEllipseSide {
  both, top, bottom
}

static public enum SpriteMode {
  single, random, animated
}
