import { Component } from "@angular/core";
import { NurbsComponent } from "./component/nurbs.component";

@Component({
  selector: 'app-root',
  template: `
    <nurbs-curve style="width: 800px; height: 600px;"></nurbs-curve>
  `,
  standalone: true,
  imports: [NurbsComponent]
})
export class AppComponent {}