// src/app/model/KnotVector.interface.ts
import { Knot } from './Knot.interface';

export interface KnotVector {
  knots: Knot[];
  degree: number;
}

