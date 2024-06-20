import { Vector3 } from 'three';

export interface BoneCompartment {
  name: string;
  id: string;
  position?: Vector3;
}
