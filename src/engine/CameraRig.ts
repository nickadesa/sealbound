import * as THREE from 'three';

export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0;
  public pitch: number = 0;
  public shoulderSide: number = 1; // 1 = right, -1 = left
  public isAimingDownSights: boolean = false;

  private currentPosition = new THREE.Vector3();
  private targetPosition = new THREE.Vector3();
  private baseOffset = new THREE.Vector3(0.65, 1.6, -2.5); // Right shoulder
  private adsOffset = new THREE.Vector3(0.4, 1.5, -1.6);
  private raycaster = new THREE.Raycaster();

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 2, -3);
  }

  public update(
    targetPoint: THREE.Vector3,
    pointerDelta: { x: number; y: number },
    obstacles: THREE.Object3D[],
    deltaTime: number
  ) {
    // Mouse sensitivity
    const sensitivity = 0.0022;
    this.yaw -= pointerDelta.x * sensitivity;
    this.pitch -= pointerDelta.y * sensitivity;

    // Clamp vertical pitch (-65 to +75 degrees)
    this.pitch = Math.max(-Math.PI * 0.36, Math.min(Math.PI * 0.42, this.pitch));

    // Choose target offset based on ADS
    const activeOffset = this.isAimingDownSights ? this.adsOffset : this.baseOffset;
    const localOffset = new THREE.Vector3(
      activeOffset.x * this.shoulderSide,
      activeOffset.y,
      activeOffset.z
    );

    // Rotate offset by camera yaw & pitch
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(this.yaw);

    const pitchMatrix = new THREE.Matrix4();
    pitchMatrix.makeRotationX(this.pitch);

    const combinedMatrix = new THREE.Matrix4().multiplyMatrices(rotationMatrix, pitchMatrix);
    const rotatedOffset = localOffset.clone().applyMatrix4(combinedMatrix);

    // Focus center on character upper spine/chest
    const focusPoint = targetPoint.clone().add(new THREE.Vector3(0, 1.45, 0));
    this.targetPosition.copy(focusPoint).add(rotatedOffset);

    // SpringArm Obstacle Collision: Cast ray from focusPoint to targetPosition
    const rayDir = this.targetPosition.clone().sub(focusPoint);
    const maxDist = rayDir.length();
    rayDir.normalize();

    this.raycaster.set(focusPoint, rayDir);
    this.raycaster.far = maxDist;
    const hits = this.raycaster.intersectObjects(obstacles, false);

    if (hits.length > 0) {
      const hitDist = Math.max(0.6, hits[0].distance - 0.25);
      this.targetPosition.copy(focusPoint).add(rayDir.multiplyScalar(hitDist));
    }

    // Smooth camera lag interpolation
    const lerpSpeed = this.isAimingDownSights ? 18 : 12;
    this.currentPosition.lerp(this.targetPosition, Math.min(1, deltaTime * lerpSpeed));
    this.camera.position.copy(this.currentPosition);

    // Look slightly ahead of character along view direction
    const lookAtTarget = focusPoint.clone().add(
      new THREE.Vector3(0, 0, 10).applyMatrix4(combinedMatrix)
    );
    this.camera.lookAt(lookAtTarget);

    // Smooth FOV transition
    const targetFov = this.isAimingDownSights ? 54 : 70;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, deltaTime * 14);
    this.camera.updateProjectionMatrix();
  }

  public toggleShoulder() {
    this.shoulderSide *= -1;
  }

  public handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
