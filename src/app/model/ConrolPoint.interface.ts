// src/app/model/ControlPoint.interface.ts
import { Point } from './Point.interface';

export interface ControlPoint extends Point {
  isClamped: boolean;
  weight: number;
}

