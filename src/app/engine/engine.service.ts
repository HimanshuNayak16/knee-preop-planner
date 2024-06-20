import {
  ElementRef,
  Injectable,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
// import * as THREE from 'three';
import {
  AmbientLight,
  DirectionalLight,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  MeshPhysicalMaterial,
  Vector3,
  GridHelper,
  AxesHelper,
  CameraHelper,
  Raycaster,
  Vector2,
  BufferGeometry,
  ColorRepresentation,
  Line3,
  Line,
  LineBasicMaterial,
  CylinderGeometry,
  Matrix4,
  Plane,
  PlaneGeometry,
  DoubleSide,
} from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { Landmark } from '../models/Landmark';
import { BoneCompartment } from '../interfaces/bone-compartment';

const modelsPath = 'assets/models';

@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement | null;
  private renderer: WebGLRenderer | null;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private abLight: AmbientLight;
  private dirLightF: DirectionalLight;
  private dirLightB: DirectionalLight;
  private transformControls: TransformControls;
  private orbitControls!: OrbitControls;
  private rayCaster: Raycaster;
  private landmark: Landmark;
  rightFemurMesh: Mesh;
  rightTibiaMesh: Mesh;
  private cube: Mesh;

  compartments: BoneCompartment[] = [
    { name: 'Femur Center', id: 'femur_center' },
    { name: 'Hip Center', id: 'hip_center' },
    { name: 'Femur Proximal Canal', id: 'femur_proximal_canal' },
    { name: 'Femur Distal Canal', id: 'femur_distal_canal' },
    { name: 'Medial Epicondyle', id: 'medial_epicondyle' },
    { name: 'Lateral Epicondyle', id: 'lateral_epicondyle' },
    { name: 'Distal Medial Pt', id: 'distal_medial_pt' },
    { name: 'Distal Lateral Pt', id: 'distal_lateral_pt' },
    { name: 'Posterior Medial Pt', id: 'posterior_medial_pt' },
    { name: 'Posterior Lateral Pt', id: 'posterior_lateral_pt' },
  ];

  position: Map<string, Vector3 | null> = new Map<string, Vector3 | null>([
    ['femur_center', null],
    ['hip_center', null],
    ['femur_proximal_canal', null],
    ['femur_distal_canal', null],
    ['medial_epicondyle', null],
    ['lateral_epicondyle', null],
    ['distal_medial_pt', null],
    ['distal_lateral_pt', null],
    ['posterior_medial_pt', null],
    ['posterior_lateral_pt', null],
  ]);
  selectedCompartment: BoneCompartment | null = null;

  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    // if (this.frameId != null) {
    //   cancelAnimationFrame(this.frameId);
    // }
    if (this.renderer != null) {
      this.renderer.dispose();
      this.renderer = null;
      this.canvas = null;
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true, // transparent background
      antialias: true, // smooth edges
    });
    this.renderer.setClearColor(0xf0f0f0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );

    this.scene.add(this.camera);

    // soft white light
    this.abLight = new AmbientLight(0x404040);
    this.abLight.position.z = 10;
    this.scene.add(this.abLight);

    this.dirLightF = new DirectionalLight(0xffffff);
    this.dirLightF.position.z = 500;
    this.scene.add(this.dirLightF);

    this.dirLightB = new DirectionalLight(0xffffff);
    this.dirLightB.position.z = -500;
    this.scene.add(this.dirLightB);

    const gridHelper = new GridHelper(1000, 10, 'green');
    this.scene.add(gridHelper);

    const axesHelper = new AxesHelper(100);
    // this.scene.add(axesHelper);

    this.rayCaster = new Raycaster();

    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControls.addEventListener('change', () => this.render());

    this.camera.position.set(
      -56.68428465150165,
      -729.6391668196158,
      722.3507449799332
    );
    this.orbitControls.target = new Vector3(
      -56.68428465150165,
      600.000722376394,
      722.3494152809426
    );
    this.orbitControls.update();

    const cameraHelper = new CameraHelper(this.camera);
    // this.scene.add(cameraHelper);

    // this.transformControls = new TransformControls(
    //   this.camera,
    //   this.renderer.domElement
    // );
    // this.transformControls.attach(this.cube);
    // this.scene.add(this.transformControls);

    this.loadModel('Right_Femur.stl', 0x21d1cb, this.rightFemurMesh);
    this.loadModel('Right_Tibia.stl', 0xc26d76, this.rightTibiaMesh);
  }

  activateLandmark() {
    if (this.landmark) this.landmark.deleteLandmark();
    const defaultPosition = this.selectedCompartment?.id
      ? this.position.get(this.selectedCompartment?.id)
      : null;
    this.landmark = new Landmark(
      defaultPosition ??
        new Vector3(-56.68428465150165, -120.000722376394, 722.3494152809426)
    );

    this.scene.add(this.landmark.mesh);
    this.render();
  }

  updateLandmark(event: MouseEvent | TouchEvent) {
    const intersection = this.landmark.update(
      event,
      this.canvas,
      this.scene,
      this.rayCaster,
      this.camera
    );
    this.render();
    if (intersection && this.selectedCompartment) {
      this.position.set(this.selectedCompartment.id, intersection);
      console.log(this.position);
    }
  }

  axisLineCreation() {
    const femurCenter = this.position.get('femur_center');
    const hipCenter = this.position.get('hip_center');
    if (femurCenter && hipCenter) {
      this.createAxisLine(femurCenter, hipCenter);
    }

    const femurProximalCanal = this.position.get('femur_proximal_canal');
    const femurDistalCanal = this.position.get('femur_distal_canal');
    if (femurProximalCanal && femurDistalCanal) {
      this.createAxisLine(femurProximalCanal, femurDistalCanal);
    }

    const medialEpicondyle = this.position.get('medial_epicondyle');
    const lateralEpicondyle = this.position.get('lateral_epicondyle');
    if (medialEpicondyle && lateralEpicondyle) {
      this.createAxisLine(medialEpicondyle, lateralEpicondyle);
    }

    const posteriorMedialPt = this.position.get('posterior_medial_pt');
    const posteriorLateralPt = this.position.get('posterior_lateral_pt');
    if (posteriorMedialPt && posteriorLateralPt) {
      this.createAxisLine(posteriorMedialPt, posteriorLateralPt);
    }

    if (femurCenter && hipCenter) {
      const planeGeometry = new PlaneGeometry(900, 900);
      const mechAxisPlane = new Mesh(
        planeGeometry,
        new MeshBasicMaterial({
          color: 'gray',
          side: DoubleSide,
          transparent: true,
          opacity: 0.7,
        })
      );
      mechAxisPlane.position.copy(hipCenter);
      mechAxisPlane.lookAt(femurCenter);
      this.scene.add(mechAxisPlane);
    }

    // if (femurProximalCanal && femurDistalCanal) {
    //   const planeGeometry = new PlaneGeometry(900, 900);
    //   const mechAxisPlane = new Mesh(
    //     planeGeometry,
    //     new MeshBasicMaterial({
    //       color: 'gray',
    //       side: DoubleSide,
    //       transparent: true,
    //       opacity: 0.7,
    //     })
    //   );
    //   mechAxisPlane.position.copy(hipCenter);
    //   mechAxisPlane.lookAt(femurCenter);
    //   this.scene.add(mechAxisPlane);
    // }
  }

  cylinderMesh(pointX: Vector3, pointY: Vector3) {
    // edge from X to Y
    const direction = new Vector3().subVectors(pointY, pointX);
    const material = new MeshBasicMaterial({ color: 0x000000 });
    // Make the geometry (of "direction" length)
    const geometry = new CylinderGeometry(4, 4, direction.length(), 6, 4);
    // shift it so one end rests on the origin
    geometry.applyMatrix4(
      new Matrix4().makeTranslation(0, direction.length() / 2, 0)
    );
    // rotate it the right way for lookAt to work
    geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));
    // Make a mesh with the geometry
    const mesh = new Mesh(geometry, material);
    // Position it where we want
    mesh.position.copy(pointX);
    // And make it point to where we want
    mesh.lookAt(pointY);

    return mesh;
  }

  createAxisLine(compartment1Position: Vector3, compartment2Position: Vector3) {
    const points = [];
    // points.push(compartment1Position);
    // points.push(compartment1Position);

    // const geometry = new BufferGeometry().setFromPoints(points);
    // const material = new LineBasicMaterial({
    //   color: 0x0000ff,
    // });
    // const line = new Line(geometry, material);

    const line = this.cylinderMesh(compartment1Position, compartment2Position);
    this.scene.add(line);
  }

  loadModel(model: string, color: ColorRepresentation, mesh: Mesh): void {
    const loader = new STLLoader();
    loader.load(
      modelsPath + '/' + model,
      (geometry: BufferGeometry) => {
        const mat = new MeshPhysicalMaterial({
          color,
          metalness: 0.25,
          roughness: 0.1,
          opacity: 1.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.25,
        });
        mesh = new Mesh(geometry, mat);
        this.scene.add(mesh);
        this.render();
      },
      (xhr: any) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      window.addEventListener('resize', () => {
        this.resize();
        this.render();
      });

      this.canvas?.addEventListener(
        'click',
        (event: MouseEvent | TouchEvent) => {
          this.updateLandmark(event);
        }
      );
    });
  }

  public render(): void {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    if (!this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
}
