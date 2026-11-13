import * as THREE from 'three';
import { Character } from './Character';
import { TestDummy } from '../creator/TestDummy';
import { sound } from '../engine/AudioSystem';

export interface FloatingDamage {
  id: number;
  text: string;
  isHeadshot: boolean;
  position: THREE.Vector3;
  life: number;
}

export class CombatManager {
  public floatingDamages: FloatingDamage[] = [];
  private nextDamageId: number = 1;

  public processAttack(
    attacker: Character,
    targets: TestDummy[],
    camera: THREE.Camera
  ) {
    sound.playSwordSwing();

    const weaponData = attacker.weaponSystem.getActiveWeaponData();
    const attackerPos = attacker.mesh.position;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), attacker.mesh.rotation.y);

    let hitCount = 0;

    for (const dummy of targets) {
      const dummyPos = dummy.mesh.position;
      const toDummy = dummyPos.clone().sub(attackerPos);
      const dist = toDummy.length();

      // Check distance within weapon range
      if (dist <= weaponData.range) {
        toDummy.normalize();
        const dot = forward.dot(toDummy);

        // Within 120-degree frontal swing arc
        if (dot > 0.3) {
          hitCount++;
          sound.playHitImpact();

          // Check if attack was aimed high (headshot check)
          const isHeadshot = Math.random() < 0.35; // 35% headshot chance in close melee
          const damageDealt = dummy.takeDamage(weaponData.damage, isHeadshot);

          this.spawnFloatingDamage(
            damageDealt.toString(),
            isHeadshot,
            dummyPos.clone().add(new THREE.Vector3(0, 1.8, 0))
          );
        }
      }
    }

    return hitCount > 0;
  }

  public spawnFloatingDamage(text: string, isHeadshot: boolean, worldPos: THREE.Vector3) {
    this.floatingDamages.push({
      id: this.nextDamageId++,
      text,
      isHeadshot,
      position: worldPos.clone(),
      life: 0.85 // 850ms lifetime
    });
  }

  public update(deltaTime: number) {
    for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
      const dmg = this.floatingDamages[i];
      dmg.life -= deltaTime;
      dmg.position.y += deltaTime * 0.9; // float upward

      if (dmg.life <= 0) {
        this.floatingDamages.splice(i, 1);
      }
    }
  }
}
