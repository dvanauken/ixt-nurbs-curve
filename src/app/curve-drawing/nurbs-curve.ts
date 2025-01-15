import { ControlPoint, Point2D } from "./types";

// src/app/curve-drawing/nurbs-curve.ts
export class NurbsCurve {
  private degree = 3;  // Cubic NURBS
  private knots: number[] = [];
  
  constructor(
    private points: ControlPoint[],
    private previewPoint: Point2D | null,
    private closed: boolean
  ) {
    this.generateKnots();
  }

  private generateKnots() {
    const n = this.points.length - 1;
    
    if (this.closed) {
      // For closed curves, we need a periodic knot vector
      const numKnots = n + 2 * this.degree + 1;
      this.knots = new Array(numKnots);
      
      // Create uniform knot spacing for periodic curve
      for (let i = 0; i < numKnots; i++) {
        this.knots[i] = i;
      }
    } else {
      // For open curves, we need a clamped knot vector
      const numKnots = n + this.degree + 2;
      this.knots = new Array(numKnots);
      
      // Clamp the start
      for (let i = 0; i <= this.degree; i++) {
        this.knots[i] = 0;
      }
      
      // Interior knots
      for (let i = this.degree + 1; i < numKnots - this.degree - 1; i++) {
        this.knots[i] = i - this.degree;
      }
      
      // Clamp the end
      const end = n - this.degree + 1;
      for (let i = numKnots - this.degree - 1; i < numKnots; i++) {
        this.knots[i] = end;
      }
    }
  }

  private basisFunctions(u: number, span: number): number[] {
    const left = new Array(this.degree + 1);
    const right = new Array(this.degree + 1);
    const N = new Array(this.degree + 1);
    
    N[0] = 1.0;
    
    for (let j = 1; j <= this.degree; j++) {
      left[j] = u - this.knots[span + 1 - j];
      right[j] = this.knots[span + j] - u;
      let saved = 0.0;
      
      for (let r = 0; r < j; r++) {
        const temp = N[r] / (right[r + 1] + left[j - r]);
        N[r] = saved + right[r + 1] * temp;
        saved = left[j - r] * temp;
      }
      
      N[j] = saved;
    }
    
    return N;
  }

  private findSpan(u: number): number {
    const n = this.points.length - 1;
    
    if (u >= this.knots[n + 1]) return n;
    if (u <= this.knots[this.degree]) return this.degree;
    
    let low = this.degree;
    let high = n + 1;
    let mid = Math.floor((low + high) / 2);
    
    while (u < this.knots[mid] || u >= this.knots[mid + 1]) {
      if (u < this.knots[mid]) {
        high = mid;
      } else {
        low = mid;
      }
      mid = Math.floor((low + high) / 2);
    }
    
    return mid;
  }

  private evaluateCurvePoint(u: number): Point2D {
    const span = this.findSpan(u);
    const N = this.basisFunctions(u, span);
    
    let x = 0, y = 0;
    
    for (let i = 0; i <= this.degree; i++) {
      const point = this.points[span - this.degree + i];
      const weight = point.isClamped ? 1.5 : 1.0;
      x += point.x * N[i] * weight;
      y += point.y * N[i] * weight;
    }
    
    return { x, y };
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    const allPoints = [...this.points];
    if (this.previewPoint && !this.closed) {
      allPoints.push({ ...this.previewPoint, isClamped: true, weight: 1.0 });
    }

    // Calculate parameter range
    const startU = this.knots[this.degree];
    const endU = this.knots[this.knots.length - this.degree - 1];
    const numPoints = Math.max(200, allPoints.length * 50);
    
    ctx.beginPath();
    
    // Draw curve
    for (let i = 0; i <= numPoints; i++) {
      const u = startU + (i / numPoints) * (endU - startU);
      const point = this.evaluateCurvePoint(u);
      
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    
    // Draw control points
    allPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.isClamped ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = point.isClamped ? '#000' : '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });
  }
}