import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import { IHud } from '../types/types';
import { Scene } from '@babylonjs/core';

/* v8 ignore start */
export class Hud implements IHud {
  public texture: AdvancedDynamicTexture;
  public filePath: string;
  public healthMeter!: Control;
  public manaMeter!: Control;

  constructor(filePath: string, scene: Scene) {
    this.filePath = filePath;

    this.texture = AdvancedDynamicTexture.CreateFullscreenUI(
      'GUI',
      true,
      scene
    );
    this.texture.idealWidth = 600;
    this.texture.idealWidth = 440;
  }

  async init() {
    console.log(this.filePath);
    try {
      await this.texture.parseFromURLAsync(this.filePath);
    } catch (e: any) {
      console.error('failed to import hud');
    }
    const healthMeter = this.texture.getControlByName('healthMeter');
    if (healthMeter) {
      this.healthMeter = healthMeter;
    }
    const manaMeter = this.texture.getControlByName('manaMeter');
    if (manaMeter) {
      this.manaMeter = manaMeter;
    }
  }

  changeHealth(n: number) {
    this.changeControl(this.healthMeter, n);
  }

  changeMana(n: number) {
    this.changeControl(this.manaMeter, n);
  }

  changeControl(control: Control, n: number) {
    if (typeof control.width === 'string') {
      const value = parseFloat(control.width);
      const newValue = this.checkEdges(value + n);
      control.width = newValue + '%';
    } else if (typeof control.width === 'number') {
      const newValue = this.checkEdges(control.width + n);
      control.width = newValue;
    }
  }

  checkEdges(value: number) {
    let newValue = Math.min(100, value);
    newValue = Math.max(0, newValue);
    return newValue;
  }
}
/* v8 ignore stop */
