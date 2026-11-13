import * as THREE from 'three';

export class TestDummy {
  public mesh: THREE.Group;
  public hp: number = 200;
  public maxHp: number = 200;
  public mode: 'standing' | 'moving' | 'combat' = 'standing';
  private originalMat: THREE.MeshStandardMaterial;
  private flashMat: THREE.MeshBasicMaterial;
  private flashTimer: number = 0;
  private meshes: THREE.Mesh[] = [];

  constructor(x: number, z: number) {
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);

    this.originalMat = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      metalness: 0.6,
      roughness: 0.4
    });

    this.flashMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });

    this.buildDummy();
  }

  private buildDummy() {
    // Base pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.2, 12), this.originalMat);
    base.position.y = 0.1;
    this.mesh.add(base);

    // Torso (Hurtbox Chest)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), this.originalMat);
    torso.position.y = 1.15;
    torso.userData = { hitZone: 'chest' };
    torso.castShadow = true;
    this.mesh.add(torso);
    this.meshes.push(torso);

    // Head (Hurtbox Head)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), this.originalMat);
    head.position.y = 1.72;
    head.userData = { hitZone: 'head' };
    head.castShadow = true;
    this.mesh.add(head);
    this.meshes.push(head);

    // Cross target mark on chest
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.12, 16),
      new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide })
    );
    targetRing.position.set(0, 1.18, 0.16);
    this.mesh.add(targetRing);
  }

  public takeDamage(amount: number, isHeadshot: boolean): number {
    const finalDamage = Math.round(isHeadshot ? amount * 1.75 : amount);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.flashTimer = 0.12;

    for (const m of this.meshes) {
      m.material = this.flashMat;
    }

    if (this.hp <= 0) {
      setTimeout(() => {
        this.hp = this.maxHp;
      }, 1500);
    }

    return finalDamage;
  }

  public update(deltaTime: number) {
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        for (const m of this.meshes) {
          m.material = this.originalMat;
        }
      }
    }

    if (this.mode === 'moving') {
      this.mesh.position.x += Math.sin(Date.now() * 0.003) * 0.05;
    }
  }
}
