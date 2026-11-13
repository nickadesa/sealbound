import perksData from '../data/perks.json';

export class RoundEconomy {
  public currentRound: number = 1;
  public attackerScore: number = 0;
  public defenderScore: number = 0;
  public gold: number = 800; // Starting gold in Round 1
  public primaryWeaponUnlocked: boolean = false;
  public activePerks: Set<string> = new Set();
  public roundTimeRemaining: number = 100; // 100s combat phase
  public isBuyPhase: boolean = true;
  public buyPhaseTimeRemaining: number = 25; // 25s buy phase

  constructor() {
    // Round 1 begins with primary weapon locked
    this.primaryWeaponUnlocked = false;
  }

  public canBuyPrimary(): boolean {
    return this.currentRound > 1 && this.gold >= 2200 && !this.primaryWeaponUnlocked;
  }

  public buyPrimaryWeapon(): boolean {
    if (this.canBuyPrimary()) {
      this.gold -= 2200;
      this.primaryWeaponUnlocked = true;
      return true;
    }
    return false;
  }

  public buyPerk(perkId: string): boolean {
    const perk = perksData.find(p => p.id === perkId);
    if (!perk) return false;

    if (this.gold >= perk.cost && !this.activePerks.has(perkId)) {
      this.gold -= perk.cost;
      this.activePerks.add(perkId);
      return true;
    }
    return false;
  }

  public addKillReward() {
    this.gold += 200;
  }

  public addPlantBonus() {
    this.gold += 300;
  }

  public endRound(attackerWon: boolean) {
    if (attackerWon) {
      this.attackerScore++;
      this.gold += 3000;
    } else {
      this.defenderScore++;
      this.gold += 1900;
    }

    this.currentRound++;
    this.isBuyPhase = true;
    this.buyPhaseTimeRemaining = 25;
    this.roundTimeRemaining = 100;
  }

  public isMatchOver(): boolean {
    return this.attackerScore >= 5 || this.defenderScore >= 5;
  }

  public update(deltaTime: number) {
    if (this.isBuyPhase) {
      this.buyPhaseTimeRemaining -= deltaTime;
      if (this.buyPhaseTimeRemaining <= 0) {
        this.isBuyPhase = false;
        this.buyPhaseTimeRemaining = 0;
      }
    } else {
      this.roundTimeRemaining -= deltaTime;
      if (this.roundTimeRemaining <= 0) {
        this.roundTimeRemaining = 0;
      }
    }
  }
}
