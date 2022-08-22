/* eslint-disable no-fallthrough */
import Yoga from 'yoga-layout-prebuilt';
import { Color } from '../Utils';

export interface ActorStyle {
  display?: 'none' | 'flex';

  color?: Color;
  backgroundColor?: Color;
  fontScale?: number;
  verticalAlign?: 'top' | 'bottom' | 'center';

  flex?: number;
  flexBasis?: number | string;
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexGrow?: number;
  flexShrink?: number;
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';

  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  aspectRatio?: number;

  position?: 'absolute' | 'relative';
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  inset?: number | string;

  margin?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;

  padding?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;

  borderWidth?: number;
  borderTopWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderRightWidth?: number;

  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
}

const extractPercentage = (value: string | number): number | undefined => {
  if (typeof value === 'string' && value.endsWith('%')) return parseFloat(value.substring(0, value.length - 1));
  return undefined;
};

const flexDirectionMapping = {
  row: Yoga.FLEX_DIRECTION_ROW,
  'row-reverse': Yoga.FLEX_DIRECTION_ROW_REVERSE,
  column: Yoga.FLEX_DIRECTION_COLUMN,
  'column-reverse': Yoga.FLEX_DIRECTION_COLUMN_REVERSE
};

const flexWrapMapping = {
  wrap: Yoga.WRAP_WRAP,
  nowrap: Yoga.WRAP_NO_WRAP,
  'wrap-reverse': Yoga.WRAP_WRAP_REVERSE
};

const edgeMapping = {
  '': Yoga.EDGE_ALL,
  inset: Yoga.EDGE_ALL,
  top: Yoga.EDGE_TOP,
  bottom: Yoga.EDGE_BOTTOM,
  left: Yoga.EDGE_LEFT,
  right: Yoga.EDGE_RIGHT
};

const justifyContentMapping = {
  'flex-start': Yoga.JUSTIFY_FLEX_START,
  'flex-end': Yoga.JUSTIFY_FLEX_END,
  center: Yoga.JUSTIFY_CENTER,
  'space-between': Yoga.JUSTIFY_SPACE_BETWEEN,
  'space-around': Yoga.JUSTIFY_SPACE_AROUND,
  'space-evenly': Yoga.JUSTIFY_SPACE_EVENLY
};

const alignMapping = {
  'flex-start': Yoga.ALIGN_FLEX_START,
  'flex-end': Yoga.ALIGN_FLEX_END,
  center: Yoga.ALIGN_CENTER,
  stretch: Yoga.ALIGN_STRETCH,
  baseline: Yoga.ALIGN_BASELINE,
  'space-between': Yoga.ALIGN_SPACE_BETWEEN,
  'space-around': Yoga.ALIGN_SPACE_AROUND,
  auto: Yoga.ALIGN_AUTO
};

export const applyStyleToNode = (yogaNode: Yoga.YogaNode, propName: keyof ActorStyle, propValue: any): void => {
  let percentage: number | undefined;
  switch (propName) {
    case 'display':
      yogaNode.setDisplay(propValue === 'none' ? Yoga.DISPLAY_NONE : Yoga.DISPLAY_FLEX);
      break;
    case 'flex':
      yogaNode.setFlex(propValue);
      break;
    case 'flexBasis':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setFlexBasisPercent(percentage);
      else yogaNode.setFlexBasis(propValue);
      break;
    // flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    case 'flexDirection':
      yogaNode.setFlexDirection(flexDirectionMapping[propValue]);
      break;
    // flexGrowth?: number;
    case 'flexGrow':
      yogaNode.setFlexGrow(propValue);
      break;
    // flexShrink?: number;
    case 'flexShrink':
      yogaNode.setFlexShrink(propValue);
      break;
    // flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    case 'flexWrap':
      yogaNode.setFlexWrap(flexWrapMapping[propValue]);
      break;
    // width?: number | string;
    case 'width':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setWidthPercent(percentage);
      else yogaNode.setWidth(propValue);
      break;
    // height?: number | string;
    case 'height':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setHeightPercent(percentage);
      else yogaNode.setHeight(propValue);
      break;
    // maxWidth?: number | string;
    case 'maxWidth':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setMaxWidthPercent(percentage);
      else yogaNode.setMaxWidth(propValue);
      break;
    // maxHeight?: number | string;
    case 'maxHeight':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setMaxHeightPercent(percentage);
      else yogaNode.setMaxHeight(propValue);
      break;
    // minWidth?: number | string;
    case 'minWidth':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setMinWidthPercent(percentage);
      else yogaNode.setMinWidth(propValue);
      break;
    // minHeight?: number | string;
    case 'minHeight':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setMinHeightPercent(percentage);
      else yogaNode.setMinHeight(propValue);
      break;
    // aspectRatio?: number;
    case 'aspectRatio':
      yogaNode.setAspectRatio(propValue);
      break;
    // position?: 'absolute' | 'relative';
    case 'position':
      yogaNode.setPositionType(propValue === 'absolute' ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE);
      break;
    // top?: number | string;
    case 'top':
    // bottom?: number | string;
    case 'bottom':
    // left?: number | string;
    case 'left':
    // right?: number | string;
    case 'right':
    // inset?: number | string;
    case 'inset':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined) yogaNode.setPositionPercent(edgeMapping[propName], percentage);
      else yogaNode.setPosition(edgeMapping[propName], propValue);
      break;

    // margin?: number | string;
    case 'margin':
    // marginTop?: number | string;
    case 'marginTop':
    // marginBottom?: number | string;
    case 'marginBottom':
    // marginLeft?: number | string;
    case 'marginLeft':
    // marginRight?: number | string;
    case 'marginRight':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined)
        yogaNode.setMarginPercent(edgeMapping[propName.substring(6, propName.length).toLowerCase()], percentage);
      else yogaNode.setMargin(edgeMapping[propName.toLowerCase().substring(6, propName.length)], propValue);
      break;

    // padding?: number | string;
    case 'padding':
    // paddingTop?: number | string;
    case 'paddingTop':
    // paddingBottom?: number | string;
    case 'paddingBottom':
    // paddingLeft?: number | string;
    case 'paddingLeft':
    // paddingRight?: number | string;
    case 'paddingRight':
      percentage = extractPercentage(propValue);
      if (percentage !== undefined)
        yogaNode.setPaddingPercent(edgeMapping[propName.substring(7, propName.length).toLowerCase()], percentage);
      else yogaNode.setPadding(edgeMapping[propName.toLowerCase().substring(7, propName.length)], propValue);
      break;

    // borderWidth?: number | string;
    case 'borderWidth':
    // borderTopWidth?: number | string;
    case 'borderTopWidth':
    // borderBottomWidth?: number | string;
    case 'borderBottomWidth':
    // borderLeftWidth?: number | string;
    case 'borderLeftWidth':
    // borderRightWidth?: number | string;
    case 'borderRightWidth':
      yogaNode.setBorder(edgeMapping[propName.substring(6, propName.length - 5).toLowerCase()], percentage);
      break;

    // justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    case 'justifyContent':
      yogaNode.setJustifyContent(justifyContentMapping[propValue]);
      break;
    // alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    case 'alignItems':
      yogaNode.setAlignItems(alignMapping[propValue]);
      break;
    // alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
    case 'alignContent':
      yogaNode.setAlignContent(alignMapping[propValue]);
      break;
    // alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    case 'alignSelf':
      yogaNode.setAlignSelf(alignMapping[propValue]);
      break;
    default:
  }
};
