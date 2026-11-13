import * as THREE from 'three';

export interface EditorProp {
  id: number;
  type: 'wall' | 'pillar' | 'crate';
  mesh: THREE.Mesh;
}

export class LevelEditor {
  public isActive: boolean = false;
  public flycamPosition = new THREE.Vector3(0, 15, 25);
  public flycamYaw: number = 0;
  public flycamPitch: number = -0.5;
  private scene: THREE.Scene;
  public props: EditorProp[] = [];
  private nextPropId = 1;
  public selectedProp: EditorProp | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public toggle(): boolean {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  public spawnProp(type: 'wall' | 'pillar' | 'crate', position: THREE.Vector3): EditorProp {
    let geo: THREE.BufferGeometry;
    let color = 0x5a626a;

    if (type === 'pillar') {
      geo = new THREE.CylinderGeometry(0.7, 0.7, 4, 12);
      color = 0x6e7882;
    } else if (type === 'wall') {
      geo = new THREE.BoxGeometry(4, 3, 0.8);
      color = 0x485058;
    } else {
      geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      color = 0x8a6d4b;
    }

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.2
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const prop: EditorProp = {
      id: this.nextPropId++,
      type,
      mesh
    };

    this.props.push(prop);
    this.selectedProp = prop;
    return prop;
  }

  public updateFlycam(
    moveInput: { x: number; z: number },
    pointerDelta: { x: number; y: number },
    deltaTime: number
  ) {
    if (!this.isActive) return;

    this.flycamYaw -= pointerDelta.x * 0.0025;
    this.flycamPitch -= pointerDelta.y * 0.0025;
    this.flycamPitch = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.flycamPitch));

    const flySpeed = 16.0;
    const forward = new THREE.Vector3(
      Math.sin(this.flycamYaw) * Math.cos(this.flycamPitch),
      Math.sin(this.flycamPitch),
      Math.cos(this.flycamYaw) * Math.cos(this.flycamPitch)
    );
    const right = new THREE.Vector3(Math.cos(this.flycamYaw), 0, -Math.sin(this.flycamYaw));

    this.flycamPosition.addScaledVector(forward, moveInput.z * flySpeed * deltaTime);
    this.flycamPosition.addScaledVector(right, moveInput.x * flySpeed * deltaTime);
  }

  public exportMapJSON(): string {
    const data = {
      name: "Custom Created Map",
      createdAt: new Date().toISOString(),
      props: this.props.map(p => ({
        type: p.type,
        position: { x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z },
        rotation: { x: p.mesh.rotation.x, y: p.mesh.rotation.y, z: p.mesh.rotation.z }
      }))
    };
    return JSON.stringify(data, null, 2);
  }
}
