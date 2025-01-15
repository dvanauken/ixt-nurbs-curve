import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

interface Point { x: number; y: number; }

@Component({
  selector: 'nurbs-curve',
  standalone: true,
  template: `
    <canvas #canvas
      (mousedown)="handleMouseDown($event)"
      (mousemove)="handleMouseMove($event)"
      (mouseup)="handleMouseUp()"
      (mouseleave)="handleMouseLeave()"
    ></canvas>
  `,
  styles: [`canvas { border: 1px solid #ccc; cursor: crosshair; }`]
})
export class NurbsCurveComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private points: Point[] = [];
  private isDragging = false;
  private dragPointIndex = -1;
  private readonly POINT_RADIUS = 5;
  private readonly CLOSE_THRESHOLD = 20;
  private readonly NURBS_SEGMENTS = 100;
  private isClosed = false;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 600;
  }

  public handleMouseDown(event: MouseEvent) {
    console.log('DOWN');
    const point = this.getMousePosition(event);
    const clickedPointIndex = this.points.findIndex(p => 
      Math.hypot(p.x - point.x, p.y - point.y) < this.POINT_RADIUS * 2
    );

    // If clicking near first point and we have enough points for a curve
    if (!this.isClosed && this.points.length >= 3 && 
        Math.hypot(point.x - this.points[0].x, point.y - this.points[0].y) < this.CLOSE_THRESHOLD) {
      console.log('Closing curve');
      this.isClosed = true;
    } else if (clickedPointIndex !== -1) {
      this.isDragging = true;
      this.dragPointIndex = clickedPointIndex;
    } else if (!this.isClosed) {
      this.points.push(point);
    }
    
    this.draw();
  }

  public handleMouseMove(event: MouseEvent) {
    const point = this.getMousePosition(event);
    
    // Check proximity to first point if not closed
    const distance = this.points.length > 0 && !this.isClosed ? 
      Math.hypot(point.x - this.points[0].x, point.y - this.points[0].y) : Infinity;
    const isNearStart = distance < this.CLOSE_THRESHOLD;

    if (this.isDragging && this.dragPointIndex !== -1) {
      this.points[this.dragPointIndex] = point;
    }

    this.draw(isNearStart);
  }

  public handleMouseUp() {
    console.log('UP');
    this.isDragging = false;
    this.dragPointIndex = -1;
  }

  public handleMouseLeave() {
    console.log('LEAVE');
    this.handleMouseUp();
    this.draw(false);
  }

  private getMousePosition(event: MouseEvent): Point {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private draw(isNearFirstPoint: boolean = false) {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.points.length < 2) {
      this.drawControlPoints(isNearFirstPoint);
      return;
    }

    // Only draw straight line when we have exactly 2 points and not closed
    if (this.points.length === 2 && !this.isClosed) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(this.points[0].x, this.points[0].y);
      this.ctx.lineTo(this.points[1].x, this.points[1].y);
      this.ctx.stroke();
    } 
    // Draw NURBS curve once we have 3 or more points
    else if (this.points.length >= 3) {
      this.drawNurbsCurve();
    }

    this.drawControlPoints(isNearFirstPoint && !this.isClosed);
  }

  private drawControlPoints(isNearFirstPoint: boolean = false) {
    this.points.forEach((point, index) => {
      this.ctx.beginPath();
      this.ctx.fillStyle = (index === 0 && isNearFirstPoint) ? 'green' : 'red';
      this.ctx.arc(point.x, point.y, this.POINT_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private drawNurbsCurve() {
    const degree = Math.min(3, this.points.length - 1);
    const points = this.isClosed ? 
      [...this.points, ...this.points.slice(0, degree)] : // Repeat first points for closure
      this.points;
      
    const knots = this.createKnotVector(points.length, degree);
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'blue';
    this.ctx.lineWidth = 2;

    const first = this.evaluateNurbs(0, degree, knots, points);
    this.ctx.moveTo(first.x, first.y);

    for (let i = 1; i <= this.NURBS_SEGMENTS; i++) {
      const t = i / this.NURBS_SEGMENTS;
      const point = this.evaluateNurbs(t, degree, knots, points);
      this.ctx.lineTo(point.x, point.y);
    }

    this.ctx.stroke();
  }

  private createKnotVector(numPoints: number, degree: number): number[] {
    if (this.isClosed) {
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

  private evaluateNurbs(t: number, degree: number, knots: number[], points: Point[]): Point {
    // Scale t to the knot vector range
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