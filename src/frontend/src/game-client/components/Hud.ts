import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import { IHud } from '../types/Types';
import { Scene } from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';
import Errors from '../utils/Error';

/* v8 ignore start */
export class Hud implements IHud {
  public healthMeter!: Control;
  public manaMeter!: Control;
  private _texture!: AdvancedDynamicTexture;
  private _filePath!: string;

  constructor(filePath: string, scene: Scene) {
    this.filePath = filePath;

    this.texture = AdvancedDynamicTexture.CreateFullscreenUI(
      gameConfig.guiTextureName,
      true,
      scene
    );
    // NOTE: ideal width/height is set to insure good initialization
    this.texture.idealWidth = gameConfig.guiTextureWidth;
    this.texture.idealHeight = gameConfig.guiTextureHeight;
  }

  async init() {
    try {
      await this.texture.parseFromURLAsync(this.filePath);
    } catch (e: any) {
      console.error(Errors.FAILED_HUD_IMPORT);
      console.error(e);
    }
    this.initializeControls();
  }

  private initializeControls() {
    const healthMeter = this.texture.getControlByName(
      gameConfig.guiHealtControlName
    );
    if (healthMeter) {
      this.healthMeter = healthMeter;
    }
    const manaMeter = this.texture.getControlByName(
      gameConfig.guiManaControlName
    );
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

  private checkEdges(value: number) {
    let newValue = Math.min(100, value);
    newValue = Math.max(0, newValue);
    return newValue;
  }

  set texture(texture: AdvancedDynamicTexture) {
    this._texture = texture;
  }
  get texture() {
    return this._texture;
  }
  set filePath(filePath: string) {
    this._filePath = filePath;
  }
  get filePath() {
    return this._filePath;
  }
}
/* v8 ignore stop */
