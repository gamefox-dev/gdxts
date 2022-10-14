import { Quaternion } from '../../../../../Quaternion';
import { Vector3 } from '../../../../../Vector3';
import { Animation3D, Node, NodeAnimation, NodeKeyframe } from '../../../../model';
import { GLTFAnimation } from '../../../data/animation/GLTFAnimation';
import { NodeAnimationHack } from '../../../scene3d/animation/NodeAnimationHack';
import { CubicQuaternion } from '../../../scene3d/model/CubicQuaternion';
import { CubicVector3 } from '../../../scene3d/model/CubicVector3';
import { CubicWeightVector } from '../../../scene3d/model/CubicWeightVector';
import { NodePlus } from '../../../scene3d/model/NodePlus';
import { WeightVector } from '../../../scene3d/model/WeightVector';
import { NodeResolver } from '../../scene/NodeResolver';
import { GLTFTypes } from '../GLTFTypes';
import { Interpolation } from './Interpolation';

export class AnimationLoader {
  public animations = new Array<Animation3D>();

  public loads(glAnimations: GLTFAnimation[], nodeResolver: NodeResolver, dataResolver: DataResolver) {
    if (!!glAnimations) {
      for (let i = 0; i < glAnimations.length; i++) {
        const glAnimation = glAnimations[i];

        const animation = this.load(glAnimation, nodeResolver, dataResolver);
        animation.id = !glAnimation.name ? 'animation' + i : glAnimation.name;

        this.animations.push(animation);
      }
    }
  }

  private load(glAnimation: GLTFAnimation, nodeResolver: NodeResolver, dataResolver: DataResolver): Animation3D {
    const animMap = new Map<Node, NodeAnimation>();

    const animation = new Animation3D();

    for (const glChannel of glAnimation.channels) {
      const glSampler = glAnimation.samplers[glChannel.sampler];
      const node = nodeResolver.get(glChannel.target.node);

      let nodeAnimation = animMap.get(node);
      if (!nodeAnimation) {
        nodeAnimation = new NodeAnimationHack();
        nodeAnimation.node = node;
        animMap.set(node, nodeAnimation);
        animation.nodeAnimations.push(nodeAnimation);
      }

      const inputData = dataResolver.readBufferFloat(glSampler.input);
      const outputData = dataResolver.readBufferFloat(glSampler.output);

      const interpolation = GLTFTypes.mapInterpolation(glSampler.interpolation);

      // case of cubic spline, we skip anchor vectors if cubic is disabled.
      let dataOffset = 0;
      let dataStride = 1;
      if (interpolation == Interpolation.CUBICSPLINE) {
        dataOffset = 1;
        dataStride = 3;
      }

      const inputAccessor = dataResolver.getAccessor(glSampler.input);
      animation.duration = Math.max(animation.duration, inputAccessor.max[0]);

      const property = glChannel.target.path;
      if ('translation' === property) {
        (nodeAnimation as NodeAnimationHack).translationMode = interpolation;

        nodeAnimation.translation = new Array<NodeKeyframe<Vector3>>();
        if (interpolation == Interpolation.CUBICSPLINE) {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            nodeAnimation.translation.push(
              new NodeKeyframe<Vector3>(0, GLTFTypes.mapCubicVector3(new CubicVector3(), outputData, 0))
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            nodeAnimation.translation.push(
              new NodeKeyframe<Vector3>(
                inputData[k],
                GLTFTypes.mapCubicVector3(new CubicVector3(), outputData, k * dataStride * 3)
              )
            );
          }
        } else {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            nodeAnimation.translation.push(
              new NodeKeyframe<Vector3>(0, GLTFTypes.mapVector3(new Vector3(), outputData, dataOffset * 3))
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            nodeAnimation.translation.push(
              new NodeKeyframe<Vector3>(
                inputData[k],
                GLTFTypes.mapVector3(new Vector3(), outputData, (dataOffset + k * dataStride) * 3)
              )
            );
          }
        }
      } else if ('rotation' === property) {
        (nodeAnimation as NodeAnimationHack).rotationMode = interpolation;

        nodeAnimation.rotation = new Array<NodeKeyframe<Quaternion>>();
        if (interpolation == Interpolation.CUBICSPLINE) {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            nodeAnimation.rotation.push(
              new NodeKeyframe<Quaternion>(0, GLTFTypes.mapCubicQuaternion(new CubicQuaternion(), outputData, 0))
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            nodeAnimation.rotation.push(
              new NodeKeyframe<Quaternion>(
                inputData[k],
                GLTFTypes.mapCubicQuaternion(new CubicQuaternion(), outputData, k * dataStride * 4)
              )
            );
          }
        } else {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            nodeAnimation.rotation.push(
              new NodeKeyframe<Quaternion>(0, GLTFTypes.mapQuaternion(new Quaternion(), outputData, dataOffset * 4))
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            nodeAnimation.rotation.push(
              new NodeKeyframe<Quaternion>(
                inputData[k],
                GLTFTypes.mapQuaternion(new Quaternion(), outputData, (dataOffset + k * dataStride) * 4)
              )
            );
          }
        }
      } else if ('scale' === property) {
        (nodeAnimation as NodeAnimationHack).scalingMode = interpolation;

        nodeAnimation.scaling = new Array<NodeKeyframe<Vector3>>();
        if (interpolation == Interpolation.CUBICSPLINE) {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            nodeAnimation.scaling.push(
              new NodeKeyframe<Vector3>(0, GLTFTypes.mapCubicVector3(new CubicVector3(), outputData, 0))
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            nodeAnimation.scaling.push(
              new NodeKeyframe<Vector3>(
                inputData[k],
                GLTFTypes.mapCubicVector3(new CubicVector3(), outputData, k * dataStride * 3)
              )
            );
          }
        } else {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            nodeAnimation.scaling.push(
              new NodeKeyframe<Vector3>(0, GLTFTypes.mapVector3(new Vector3(), outputData, dataOffset * 3))
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            nodeAnimation.scaling.push(
              new NodeKeyframe<Vector3>(
                inputData[k],
                GLTFTypes.mapVector3(new Vector3(), outputData, (dataOffset + k * dataStride) * 3)
              )
            );
          }
        }
      } else if ('weights' === property) {
        (nodeAnimation as NodeAnimationHack).weightsMode = interpolation;

        const np = nodeAnimation as NodeAnimationHack;
        const nbWeights = (node as NodePlus).weights.count;
        np.weights = new Array<NodeKeyframe<WeightVector>>();
        if (interpolation == Interpolation.CUBICSPLINE) {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            np.weights.push(
              new NodeKeyframe<WeightVector>(0, GLTFTypes.map(new CubicWeightVector(nbWeights), outputData, 0))
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            np.weights.push(
              new NodeKeyframe<WeightVector>(
                inputData[k],
                GLTFTypes.map(new CubicWeightVector(nbWeights), outputData, k * dataStride * nbWeights)
              )
            );
          }
        } else {
          // copy first frame if not at zero time
          if (inputData[0] > 0) {
            np.weights.push(
              new NodeKeyframe<WeightVector>(
                0,
                GLTFTypes.mapWeightVector(new WeightVector(nbWeights), outputData, dataOffset * nbWeights)
              )
            );
          }
          for (let k = 0; k < inputData.length; k++) {
            np.weights.push(
              new NodeKeyframe<WeightVector>(
                inputData[k],
                GLTFTypes.mapWeightVector(
                  new WeightVector(nbWeights),
                  outputData,
                  (dataOffset + k * dataStride) * nbWeights
                )
              )
            );
          }
        }
      } else {
        throw new Error('unsupported ' + property);
      }
    }

    return animation;
  }
}
