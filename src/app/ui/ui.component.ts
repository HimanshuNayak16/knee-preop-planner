import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { BoneCompartment } from '../interfaces/bone-compartment';
import { EngineService } from '../engine/engine.service';
import { Vector3 } from 'three';

@Component({
  selector: 'app-ui',
  templateUrl: './ui.component.html',
  styleUrls: ['./ui.component.css'],
  standalone: true,
  imports: [MatRadioModule, FormsModule],
})
export class UiComponent implements OnInit, OnDestroy {
  private engineService = inject(EngineService);
  compartments: BoneCompartment[] = this.engineService.compartments;

  position: Map<string, Vector3 | null> = this.engineService.position;
  selectedCompartment: BoneCompartment | null =
    this.engineService.selectedCompartment;
  landmarksRemaining =
    Array.from(this.engineService.position.values()).length -
    Array.from(this.engineService.position.values()).filter((val) => val)
      .length;

  @ViewChildren('radioDiv') radioDiv: QueryList<ElementRef>;

  public constructor() {}

  public ngOnInit(): void {}

  public ngOnDestroy(): void {}

  radioChange(event: MatRadioChange) {
    console.log(event);
    console.log(Array.from(this.engineService.position.values()));
    this.engineService.selectedCompartment = event.value;
    this.engineService.activateLandmark();
    this.landmarksRemaining =
      Array.from(this.engineService.position.values()).length -
      Array.from(this.engineService.position.values()).filter((val) => val)
        .length;

    const values = Array.from(this.engineService.position.values());
    console.log(values);

    this.radioDiv.toArray().forEach((el, index) => {
      console.log(this.engineService.position.get(event.value.id));
      if (values[index]) {
        el.nativeElement.classList.add('selected');
      }
    });
  }

  axisLineCreation() {
    this.engineService.axisLineCreation();
  }
}
