import * as THREE from 'three';
import { sound } from '../engine/AudioSystem';
import weaponsData from '../data/weapons.json';

export class WeaponSystem {
  public activeSlot: 'primary' | 'secondary' = 'primary';
  public isSwapping: boolean = false;
  public swapCooldown: number = 0;

  // 3D Meshes
  public greatswordMesh: THREE.Group;
  public daggerMesh: THREE.Group;

  // Sockets
  public rightHandSocket = new THREE.Group();
  public leftHandSocket = new THREE.Group();
  public backSheathSocket = new THREE.Group();

  constructor() {
    this.greatswordMesh = this.createGreatswordMesh();
    this.daggerMesh = this.createDaggerMesh();
    this.attachWeapons();
  }

  private createGreatswordMesh(): THREE.Group {
    const group = new THREE.Group();

    // Dark polished gunmetal steel blade
    const bladeGeo = new THREE.BoxGeometry(0.14, 1.45, 0.03);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x1e2124,
      metalness: 0.92,
      roughness: 0.22,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.85;
    blade.castShadow = true;
    group.add(blade);

    // Razor-sharp blade tip
    const tipGeo = new THREE.ConeGeometry(0.08, 0.28, 4);
    const tip = new THREE.Mesh(tipGeo, bladeMat);
    tip.position.y = 1.68;
    tip.rotation.y = Math.PI / 4;
    group.add(tip);

    // Glowing Crimson Energy Vein down central fuller
    const veinGeo = new THREE.BoxGeometry(0.025, 1.35, 0.038);
    const veinMat = new THREE.MeshBasicMaterial({
      color: 0xff1e38,
    });
    const vein = new THREE.Mesh(veinGeo, veinMat);
    vein.position.y = 0.82;
    group.add(vein);

    // Sharp Gothic Crossguard (Swept wings)
    const guardGeo = new THREE.BoxGeometry(0.42, 0.06, 0.08);
    const guardMat = new THREE.MeshStandardMaterial({
      color: 0x121416,
      metalness: 0.95,
      roughness: 0.18,
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.12;
    group.add(guard);

    // Ruby eye in crossguard center
    const rubyGeo = new THREE.OctahedronGeometry(0.035);
    const rubyMat = new THREE.MeshBasicMaterial({ color: 0xff002b });
    const ruby = new THREE.Mesh(rubyGeo, rubyMat);
    ruby.position.set(0, 0.12, 0.045);
    group.add(ruby);

    // Ergonomic grip wrapped in dark steel wire and crimson cord
    const gripGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.32, 8);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x3d0c14,
      roughness: 0.7,
      metalness: 0.3
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -0.06;
    group.add(grip);

    // Faceted sharp steel pommel
    const pommelGeo = new THREE.OctahedronGeometry(0.045);
    const pommel = new THREE.Mesh(pommelGeo, guardMat);
    pommel.position.y = -0.24;
    group.add(pommel);

    group.scale.set(1.1, 1.1, 1.1);
    return group;
  }

  private createDaggerMesh(): THREE.Group {
    const group = new THREE.Group();

    // Sharp steel dagger blade
    const bladeGeo = new THREE.BoxGeometry(0.06, 0.52, 0.018);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x22262a,
      metalness: 0.94,
      roughness: 0.2
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.32;
    group.add(blade);

    // Sharp tip
    const tipGeo = new THREE.ConeGeometry(0.038, 0.14, 4);
    const tip = new THREE.Mesh(tipGeo, bladeMat);
    tip.position.y = 0.63;
    tip.rotation.y = Math.PI / 4;
    group.add(tip);

    // Crimson line
    const veinGeo = new THREE.BoxGeometry(0.012, 0.45, 0.022);
    const veinMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
    const vein = new THREE.Mesh(veinGeo, veinMat);
    vein.position.y = 0.32;
    group.add(vein);

    // Miniature swept guard
    const guardGeo = new THREE.BoxGeometry(0.18, 0.035, 0.04);
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x121416, metalness: 0.9 });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.06;
    group.add(guard);

    // Grip & Pommel
    const gripGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x3d0c14, roughness: 0.6 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -0.04;
    group.add(grip);

    const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.025), guardMat);
    pommel.position.y = -0.13;
    group.add(pommel);

    return group;
  }

  public attachWeapons() {
    if (this.activeSlot === 'primary') {
      this.rightHandSocket.add(this.greatswordMesh);
      this.leftHandSocket.add(this.daggerMesh);
      this.greatswordMesh.position.set(0, 0, 0);
      this.greatswordMesh.rotation.set(0, 0, 0);
      this.daggerMesh.position.set(0, 0, 0);
      this.daggerMesh.rotation.set(0, 0, 0);
    } else {
      this.rightHandSocket.add(this.daggerMesh);
      this.backSheathSocket.add(this.greatswordMesh);
      this.greatswordMesh.position.set(0, 0, 0);
      this.greatswordMesh.rotation.set(0, 0, Math.PI * 0.75); // Slanted across back
    }
  }

  public swapWeapon(): boolean {
    if (this.swapCooldown > 0) return false;

    this.activeSlot = this.activeSlot === 'primary' ? 'secondary' : 'primary';
    this.swapCooldown = 0.25; // 250ms swap cooldown
    sound.playWeaponSwap();
    this.attachWeapons();
    return true;
  }

  public update(deltaTime: number) {
    if (this.swapCooldown > 0) {
      this.swapCooldown -= deltaTime;
    }
  }

  public getActiveWeaponData() {
    return this.activeSlot === 'primary' 
      ? weaponsData.crimson_vein_greatsword 
      : weaponsData.crimson_parrying_dagger;
  }
}
