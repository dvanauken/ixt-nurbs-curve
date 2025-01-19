import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Point } from '../model/Point.interface';
import { NurbsService } from '../service/nurbs.service';

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
export class NurbsComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private points: Point[] = [];
  private isDragging = false;
  private dragPointIndex = -1;
  private readonly POINT_RADIUS = 5;
  private readonly CLOSE_THRESHOLD = 20;
  private readonly NURBS_SEGMENTS = 100;
  private isClosed = false;

  constructor(private nurbsService: NurbsService) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 600;
  }

  private getMousePosition(event: MouseEvent): Point {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  public handleMouseDown(event: MouseEvent) {
    const point = this.getMousePosition(event);
    const clickedPointIndex = this.points.findIndex(p => 
      Math.hypot(p.x - point.x, p.y - point.y) < this.POINT_RADIUS * 2
    );

    if (!this.isClosed && this.points.length >= 3 && 
        Math.hypot(point.x - this.points[0].x, point.y - this.points[0].y) < this.CLOSE_THRESHOLD) {
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
    const distance = this.points.length > 0 && !this.isClosed ? 
      Math.hypot(point.x - this.points[0].x, point.y - this.points[0].y) : Infinity;
    const isNearStart = distance < this.CLOSE_THRESHOLD;

    if (this.isDragging && this.dragPointIndex !== -1) {
      this.points[this.dragPointIndex] = point;
    }

    this.draw(isNearStart);
  }

  public handleMouseUp() {
    this.isDragging = false;
    this.dragPointIndex = -1;
  }

  public handleMouseLeave() {
    this.handleMouseUp();
    this.draw(false);
  }

  private draw(isNearFirstPoint: boolean = false) {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.points.length < 2) {
      this.drawControlPoints(isNearFirstPoint);
      return;
    }

    if (this.points.length === 2 && !this.isClosed) {
      this.drawStraightLine();
    } 
    else if (this.points.length >= 3) {
      this.drawNurbsCurve();
    }

    this.drawControlPoints(isNearFirstPoint && !this.isClosed);
  }

  private drawStraightLine() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(this.points[0].x, this.points[0].y);
    this.ctx.lineTo(this.points[1].x, this.points[1].y);
    this.ctx.stroke();
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
    const curvePoints = this.nurbsService.calculateCurvePoints(
      this.points,
      this.NURBS_SEGMENTS,
      this.isClosed
    );

    this.ctx.beginPath();
    this.ctx.strokeStyle = 'blue';
    this.ctx.lineWidth = 2;

    this.ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
    for (let i = 1; i < curvePoints.length; i++) {
      this.ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
    
    this.ctx.stroke();
  }
}