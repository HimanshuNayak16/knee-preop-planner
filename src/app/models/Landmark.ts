import {
  AxesHelper,
  ColorRepresentation,
  ConeGeometry,
  CylinderGeometry,
  EventDispatcher,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
} from 'three';

export class Landmark {
  private pointer: Vector2;
  public mesh: Group;
  constructor(position: Vector3 = new Vector3()) {
    this.mesh = this.createLandmarkMesh();
    this.pointer = new Vector2();
    this.mesh.position.copy(position);
  }

  createLandmarkMesh() {
    const group = new Group();
    const xAxisMesh = this.createArrowHelperMesh('red');
    xAxisMesh.rotateZ(-Math.PI / 2);
    const yAxisMesh = this.createArrowHelperMesh('blue');
    yAxisMesh.rotateX(Math.PI / 2);
    const zAxisMesh = this.createArrowHelperMesh('green');
    zAxisMesh.rotateX(Math.PI);
    group.add(xAxisMesh, yAxisMesh, zAxisMesh);
    return group;
  }

  removeObjWithChildren(obj: any) {
    if (obj?.children?.length > 0) {
      for (let x = obj.children.length - 1; x >= 0; x--) {
        this.removeObjWithChildren(obj.children[x]);
      }
    }
    if (obj?.isMesh) {
      obj.geometry.dispose();
      obj.material.dispose();
    }
    if (obj?.parent) {
      obj.parent.remove(obj);
    }
  }

  deleteLandmark() {
    this.removeObjWithChildren(this.mesh);
  }

  createArrowHelperMesh(color: ColorRepresentation) {
    const group = new Group();
    const thicknessArrowBody = 2;
    const heightArrowBody = 60;
    const radialDivisionsArrowBody = 6;
    const thicknessArrowSpear = 10;
    const heightArrowSpear = 10;
    const radialDivisionsArrowSpear = 12;
    const arrowBody = new Mesh(
      new CylinderGeometry(
        thicknessArrowBody / 2,
        thicknessArrowBody / 2,
        heightArrowBody,
        radialDivisionsArrowBody
      ),
      new MeshBasicMaterial({ color })
    );
    const arrowSpear = new Mesh(
      new ConeGeometry(
        thicknessArrowSpear / 2,
        heightArrowSpear,
        radialDivisionsArrowSpear
      ),
      new MeshBasicMaterial({ color })
    );
    arrowBody.position.y = heightArrowBody / 2;
    arrowSpear.position.y = heightArrowBody;
    group.add(arrowBody, arrowSpear);
    return group;
  }

  update(
    event: TouchEvent | MouseEvent,
    canvas: HTMLCanvasElement | null,
    scene: Scene,
    rayCaster: Raycaster,
    camera: PerspectiveCamera
  ) {
    if (!canvas) return;
    if (event instanceof MouseEvent) {
      this.pointer.x =
        ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
      this.pointer.y =
        -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;
    } else if (event instanceof TouchEvent) {
      this.pointer.x =
        ((event.changedTouches[0].clientX - canvas.offsetLeft) /
          canvas.clientWidth) *
          2 -
        1;
      this.pointer.y =
        -(
          (event.changedTouches[0].clientY - canvas.clientHeight) /
          canvas.clientHeight
        ) *
          2 +
        1;
    }
    console.log(this.pointer);
    rayCaster.setFromCamera(this.pointer, camera);
    const intersects = rayCaster.intersectObjects(scene.children, false);
    if (intersects?.[0]?.object) {
      const intersection = intersects[0].point;
      this.mesh.position.copy(intersection);
      return intersection;
    }
    return null;
  }
}
