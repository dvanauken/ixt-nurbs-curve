// src/app/curve-drawing/types.ts

export interface Point2D {
  x: number;
  y: number;
}


export interface KnotVector {
  knots: number[];
  degree: number;
}

export interface ControlPoint extends Point2D {
  isClamped: boolean;
  weight: number;  // Adding weight for better control
}

export type CurveState = {
  controlPoints: ControlPoint[];
  previewPoint: Point2D | null;
  isNearStart: boolean;
  closed: boolean;
}