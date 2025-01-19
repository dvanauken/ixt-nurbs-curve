
// src/app/model/CurveState.interface.ts
import { ControlPoint } from './ConrolPoint.interface';
import { Point } from './Point.interface';

export interface CurveState {
  controlPoints: ControlPoint[];
  previewPoint: Point | null;
  isNearStart: boolean;
  closed: boolean;
}

