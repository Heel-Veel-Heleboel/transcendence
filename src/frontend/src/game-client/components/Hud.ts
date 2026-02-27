import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import { IHud } from '../types/Types';
import { Scene } from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';
import Errors from '../utils/Error';
import { createAdvancedDynamicTexture } from '../utils/Create';

/* v8 ignore start */
export class Hud implements IHud {
  public healthMeter!: Control;
  public manaMeter!: Control;
  private _texture!: AdvancedDynamicTexture;
  private _filePath!: string;

  constructor(filePath: string, scene: Scene) {
    this.filePath = filePath;

    this.texture = createAdvancedDynamicTexture(
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
      console.error(e);
      throw new Error(Errors.FAILED_HUD_IMPORT);
    }
    this.initializeControls();
  }

  private initializeControls() {
    const healthMeter = this.texture.getControlByName(
      gameConfig.guiHealtControlName
    );
    const manaMeter = this.texture.getControlByName(
      gameConfig.guiManaControlName
    );
    if (!healthMeter || !manaMeter) {
      throw new Error(Errors.MISSING_HUD_CONTROL);
    }
    this.healthMeter = healthMeter;
    this.manaMeter = manaMeter;
  }

  changeHealth(n: number) {
    this.changeControl(this.healthMeter, n);
  }

  changeMana(n: number) {
    this.changeControl(this.manaMeter, n);
  }

  private changeControl(control: Control, n: number) {
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

  private set texture(texture: AdvancedDynamicTexture) {
    this._texture = texture;
  }
  private get texture() {
    return this._texture;
  }
  private set filePath(filePath: string) {
    this._filePath = filePath;
  }
  private get filePath() {
    return this._filePath;
  }
}
/* v8 ignore stop */
