import * as THREE from 'three';
import { WeaponSystem } from './WeaponSystem';

export type CharacterAction = 
  | 'idle' 
  | 'walk' 
  | 'sprint' 
  | 'attack' 
  | 'parry' 
  | 'skill1' 
  | 'skill2' 
  | 'ultimate' 
  | 'channeling';

export class Character {
  public mesh: THREE.Group;
  public weaponSystem: WeaponSystem;
  public currentAction: CharacterAction = 'idle';
  public actionTimer: number = 0;
  public hp: number = 100;
  public shield: number = 50;

  // Body parts for procedural animation
  private body: THREE.Group;
  private head: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private cape: THREE.Mesh;
  private aegisBarrier: THREE.Mesh;

  // Velocity & physics state
  public velocity = new THREE.Vector3();
  public isGrounded: boolean = true;
  private walkCycle: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.body = new THREE.Group();
    this.head = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();

    this.weaponSystem = new WeaponSystem();
    this.aegisBarrier = this.createAegisBarrierMesh();
    this.cape = this.createCapeMesh();

    this.buildGothicKnightMesh();
    this.mesh.add(this.body);
    this.mesh.add(this.aegisBarrier);
  }

  private buildGothicKnightMesh() {
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x42494f,
      metalness: 0.9,
      roughness: 0.25,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x181a1c,
      metalness: 0.85,
      roughness: 0.35,
    });

    const crimsonAccentMat = new THREE.MeshStandardMaterial({
      color: 0x850d1a,
      roughness: 0.4,
      metalness: 0.5
    });

    // 1. Torso / Cuirass (Sharp gothic steel chestplate)
    const chestGeo = new THREE.BoxGeometry(0.55, 0.65, 0.32);
    const chest = new THREE.Mesh(chestGeo, steelMat);
    chest.position.y = 1.25;
    chest.castShadow = true;
    this.body.add(chest);

    // Crimson chestplate center line
    const chestTrimGeo = new THREE.BoxGeometry(0.08, 0.66, 0.34);
    const chestTrim = new THREE.Mesh(chestTrimGeo, crimsonAccentMat);
    chestTrim.position.y = 1.25;
    this.body.add(chestTrim);

    // 2. Head & Crown & White Hair
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.75, 0);

    const faceGeo = new THREE.BoxGeometry(0.24, 0.28, 0.26);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xe0c8b2, roughness: 0.8 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    headGroup.add(face);

    // Silver-white flowing layered hair
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.6 });
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.3), hairMat);
    hairTop.position.set(0, 0.12, -0.02);
    headGroup.add(hairTop);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.12), hairMat);
    hairBack.position.set(0, -0.12, -0.14);
    headGroup.add(hairBack);

    // Spiked Metallic Gothic Crown
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x151618, metalness: 0.95 });
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8), crownMat);
    crownBase.position.set(0, 0.16, 0);
    headGroup.add(crownBase);

    // Crown Spikes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 4 - 0.5) * Math.PI * 0.7;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), crownMat);
      spike.position.set(Math.sin(angle) * 0.15, 0.23, Math.cos(angle) * 0.15);
      headGroup.add(spike);
    }

    this.head = headGroup;
    this.body.add(this.head);

    // 3. Spiky Pauldrons (Shoulders) & Arms
    // Right Arm
    const rArmGroup = new THREE.Group();
    rArmGroup.position.set(0.38, 1.45, 0);

    const rPauldronGeo = new THREE.ConeGeometry(0.18, 0.28, 4);
    const rPauldron = new THREE.Mesh(rPauldronGeo, steelMat);
    rPauldron.rotation.z = -Math.PI * 0.35;
    rPauldron.position.set(0.04, 0.08, 0);
    rArmGroup.add(rPauldron);

    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.16), darkTrimMat);
    rArm.position.y = -0.28;
    rArm.castShadow = true;
    rArmGroup.add(rArm);

    // Right Hand Socket (holds greatsword)
    this.weaponSystem.rightHandSocket.position.set(0, -0.58, 0.1);
    rArmGroup.add(this.weaponSystem.rightHandSocket);
    this.rightArm = rArmGroup;
    this.body.add(this.rightArm);

    // Left Arm
    const lArmGroup = new THREE.Group();
    lArmGroup.position.set(-0.38, 1.45, 0);

    const lPauldron = new THREE.Mesh(rPauldronGeo, steelMat);
    lPauldron.rotation.z = Math.PI * 0.35;
    lPauldron.position.set(-0.04, 0.08, 0);
    lArmGroup.add(lPauldron);

    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.16), darkTrimMat);
    lArm.position.y = -0.28;
    lArm.castShadow = true;
    lArmGroup.add(lArm);

    // Left Hand Socket (holds dagger)
    this.weaponSystem.leftHandSocket.position.set(0, -0.58, 0.1);
    lArmGroup.add(this.weaponSystem.leftHandSocket);
    this.leftArm = lArmGroup;
    this.body.add(this.leftArm);

    // 4. Back Sheath Socket (when greatsword is unequipped)
    this.weaponSystem.backSheathSocket.position.set(0, 1.3, -0.2);
    this.body.add(this.weaponSystem.backSheathSocket);

    // 5. Flowing Cape attached to shoulders
    this.cape.position.set(0, 1.45, -0.18);
    this.body.add(this.cape);

    // 6. Legs (Greaves)
    const legGeo = new THREE.BoxGeometry(0.18, 0.75, 0.2);
    const rLeg = new THREE.Mesh(legGeo, steelMat);
    rLeg.position.set(0.16, 0.4, 0);
    rLeg.castShadow = true;
    this.rightLeg.add(rLeg);
    this.body.add(this.rightLeg);

    const lLeg = new THREE.Mesh(legGeo, steelMat);
    lLeg.position.set(-0.16, 0.4, 0);
    lLeg.castShadow = true;
    this.leftLeg.add(lLeg);
    this.body.add(this.leftLeg);
  }

  private createCapeMesh(): THREE.Mesh {
    const capeGeo = new THREE.PlaneGeometry(0.65, 1.1, 4, 6);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x121416,
      roughness: 0.85,
      side: THREE.DoubleSide
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.castShadow = true;
    return cape;
  }

  private createAegisBarrierMesh(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(1.6, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff1e38,
      transparent: true,
      opacity: 0,
      wireframe: true,
      side: THREE.DoubleSide
    });
    const barrier = new THREE.Mesh(geo, mat);
    barrier.position.set(0, 1.2, 0.4);
    barrier.rotation.x = Math.PI * 0.5;
    return barrier;
  }

  public update(deltaTime: number, moveInput: { x: number; z: number; sprint: boolean }, cameraYaw: number) {
    this.weaponSystem.update(deltaTime);

    const isMoving = Math.abs(moveInput.x) > 0.05 || Math.abs(moveInput.z) > 0.05;
    const baseSpeed = moveInput.sprint ? 8.2 : 5.4;

    if (this.currentAction === 'idle' || this.currentAction === 'walk' || this.currentAction === 'sprint') {
      if (isMoving) {
        this.currentAction = moveInput.sprint ? 'sprint' : 'walk';

        // Rotate character towards camera movement direction
        const inputAngle = Math.atan2(moveInput.x, moveInput.z);
        const targetAngle = cameraYaw + inputAngle;

        // Smooth rotation
        const currentRot = this.mesh.rotation.y;
        let diff = targetAngle - currentRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1, deltaTime * 14);

        // Locomotion velocity
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
        this.mesh.position.addScaledVector(forward, baseSpeed * deltaTime);

        // Walk cycle animation
        this.walkCycle += deltaTime * (moveInput.sprint ? 14 : 9);
        const swing = Math.sin(this.walkCycle) * 0.6;
        this.leftLeg.rotation.x = swing;
        this.rightLeg.rotation.x = -swing;

        this.leftArm.rotation.x = -swing * 0.5;
        this.rightArm.rotation.x = swing * 0.5;

        // Cape trailing physics
        this.cape.rotation.x = 0.2 + (moveInput.sprint ? 0.45 : 0.25) + Math.sin(this.walkCycle * 2) * 0.08;
      } else {
        this.currentAction = 'idle';
        this.leftLeg.rotation.x *= 0.85;
        this.rightLeg.rotation.x *= 0.85;
        this.leftArm.rotation.x *= 0.85;
        this.rightArm.rotation.x *= 0.85;
        this.cape.rotation.x = 0.15 + Math.sin(Date.now() * 0.002) * 0.04;
      }
    }

    // Action timer countdown
    if (this.actionTimer > 0) {
      this.actionTimer -= deltaTime;

      if (this.currentAction === 'attack') {
        const progress = 1 - (this.actionTimer / 0.45);
        this.rightArm.rotation.x = -Math.PI * 0.7 + progress * Math.PI * 1.1; // Forward heavy slash
        this.rightArm.rotation.z = Math.sin(progress * Math.PI) * 0.3;
      } else if (this.currentAction === 'parry') {
        this.rightArm.rotation.x = -Math.PI * 0.5;
        this.rightArm.rotation.z = -0.3;
        this.leftArm.rotation.x = -Math.PI * 0.5;
        this.leftArm.rotation.z = 0.3;
      } else if (this.currentAction === 'skill2') {
        // Barrier active
        const mat = this.aegisBarrier.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.65;
        this.aegisBarrier.rotation.z += deltaTime * 2;
      }

      if (this.actionTimer <= 0) {
        // Return to idle
        this.currentAction = 'idle';
        const mat = this.aegisBarrier.material as THREE.MeshBasicMaterial;
        mat.opacity = 0;
      }
    }
  }

  public triggerAttack(): boolean {
    if (this.actionTimer > 0 && this.currentAction === 'attack') return false;

    this.currentAction = 'attack';
    this.actionTimer = 0.45;
    return true;
  }

  public triggerParry(): boolean {
    if (this.actionTimer > 0) return false;

    this.currentAction = 'parry';
    this.actionTimer = 0.4;
    return true;
  }

  public triggerSkill1(): boolean {
    this.currentAction = 'attack';
    this.actionTimer = 0.6; // Leap Cleave
    return true;
  }

  public triggerSkill2(): boolean {
    this.currentAction = 'skill2';
    this.actionTimer = 3.0; // Aegis Barrier
    return true;
  }
}
