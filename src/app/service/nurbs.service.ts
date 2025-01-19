// nurbs.service.ts
import { Injectable } from '@angular/core';
import { Point } from '../model/Point.interface';

@Injectable({
  providedIn: 'root'
})
export class NurbsService {
  private isClosed = false;  // Add this back

  private createKnotVector(numPoints: number, degree: number): number[] {
    if (this.isClosed) {  // Use the service's isClosed property
      // Uniform knot vector for periodic curve
      return Array.from({ length: numPoints + degree + 1 }, (_, i) => i);
    } else {
      // Clamped knot vector for open curve
      const knots: number[] = [];
      
      // Start with degree + 1 zeros
      for (let i = 0; i <= degree; i++) knots.push(0);
      
      // Middle knots
      for (let i = 1; i < numPoints - degree; i++) knots.push(i);
      
      // End with degree + 1 copies of the max knot
      const maxKnot = Math.max(1, numPoints - degree);
      for (let i = 0; i <= degree; i++) knots.push(maxKnot);
      
      return knots;
    }
  }

  calculateCurvePoints(points: Point[], segments: number, isClosed: boolean): Point[] {
    this.isClosed = isClosed;  // Set the service's isClosed property
    
    const degree = Math.min(3, points.length - 1);
    const evaluationPoints = this.isClosed ? 
      [...points, ...points.slice(0, degree)] : 
      points;
      
    const knots = this.createKnotVector(evaluationPoints.length, degree);
    const curvePoints: Point[] = [];

    const first = this.evaluateNurbs(0, degree, knots, evaluationPoints);
    curvePoints.push(first);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      curvePoints.push(this.evaluateNurbs(t, degree, knots, evaluationPoints));
    }

    return curvePoints;
  }

  private evaluateNurbs(t: number, degree: number, knots: number[], points: Point[]): Point {
    const u = t * (knots[knots.length - degree - 1] - knots[degree]) + knots[degree];
    
    let xNum = 0, yNum = 0, den = 0;
    const weights = new Array(points.length).fill(1);

    for (let i = 0; i < points.length; i++) {
      const basis = this.basisFunction(i, degree, u, knots);
      const weight = weights[i];
      xNum += basis * weight * points[i].x;
      yNum += basis * weight * points[i].y;
      den += basis * weight;
    }

    return {
      x: xNum / den,
      y: yNum / den
    };
  }

  private basisFunction(i: number, degree: number, u: number, knots: number[]): number {
    if (degree === 0) {
      return (u >= knots[i] && u < knots[i + 1]) || 
             (u === knots[knots.length - 1] && u === knots[i + 1]) ? 1 : 0;
    }

    let basis = 0;
    
    const leftDenom = knots[i + degree] - knots[i];
    if (leftDenom !== 0) {
      const leftTerm = (u - knots[i]) / leftDenom;
      basis += leftTerm * this.basisFunction(i, degree - 1, u, knots);
    }
    
    const rightDenom = knots[i + degree + 1] - knots[i + 1];
    if (rightDenom !== 0) {
      const rightTerm = (knots[i + degree + 1] - u) / rightDenom;
      basis += rightTerm * this.basisFunction(i + 1, degree - 1, u, knots);
    }
    
    return basis;
  }
}