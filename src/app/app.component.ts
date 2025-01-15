import { Component } from "@angular/core";
import { NurbsCurveComponent } from "./curve-drawing/nurbs-curve.component";

@Component({
  selector: 'app-root',
  template: `
    <nurbs-curve style="width: 800px; height: 600px;"></nurbs-curve>
  `,
  standalone: true,
  imports: [NurbsCurveComponent]
})
export class AppComponent {}