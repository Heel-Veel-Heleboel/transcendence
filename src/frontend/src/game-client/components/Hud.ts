import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import * as GUI from '@babylonjs/gui';
import { IHud } from '../types/Types';
import { Scene } from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';
import Errors from '../utils/Error';
import { createAdvancedDynamicTexture } from '../utils/Create';

/* v8 ignore start */
export class Hud implements IHud {
  public proHealthMeter!: Control;
  public antaHealthMeter!: Control;
  public proManaMeter!: Control;
  public antaManaMeter!: Control;
  private _texture!: AdvancedDynamicTexture;
  private _filePath!: string;

  constructor(filePath: string, scene: Scene) {
    this.filePath = filePath;

    this.texture = createAdvancedDynamicTexture(
      gameConfig.guiTextureName,
      true,
      scene
    );

    // INFO: ideal width/height is set to insure good initialization
    this.texture.idealWidth = gameConfig.guiTextureWidth;
    this.texture.idealHeight = gameConfig.guiTextureHeight;
  }

  async init() {
    try {
      const healthLeft = '25';
      const healthTop = '46.5';
      const healthColor = 'red';
      const healthWidth = 0.4;
      const healthHeight = 0.025;

      const manaLeft = '35';
      const manaTop = '46.5';
      const manaColor = 'red';
      const manaWidth = 0.25;
      const manaHeight = 0.025;

      const proHealthMeter = new GUI.Rectangle('proHealthMeter');
      proHealthMeter.left = `-${healthLeft}%`;
      proHealthMeter.top = `-${healthTop}%`;
      proHealthMeter.background = healthColor;
      proHealthMeter.width = healthWidth;
      proHealthMeter.height = healthHeight;
      this.texture.addControl(proHealthMeter);

      const proManaMeter = new GUI.Rectangle('proManaMeter');
      proManaMeter.left = `-${manaLeft}%`;
      proManaMeter.top = `${manaTop}%`;
      proManaMeter.width = manaWidth;
      proManaMeter.height = manaHeight;
      this.texture.addControl(proManaMeter);

      const antaHealthMeter = new GUI.Rectangle('antaHealthMeter');
      antaHealthMeter.left = `${healthLeft}%`;
      antaHealthMeter.top = `-${healthTop}%`;
      antaHealthMeter.background = healthColor;
      antaHealthMeter.width = healthWidth;
      antaHealthMeter.height = healthHeight;
      this.texture.addControl(antaHealthMeter);

      const antaManaMeter = new GUI.Rectangle('antaManaMeter');
      antaManaMeter.left = `${manaLeft}%`;
      antaManaMeter.top = `${manaTop}%`;
      antaManaMeter.width = manaWidth;
      antaManaMeter.height = manaHeight;
      this.texture.addControl(antaManaMeter);

      let width;
      const leftAntaManaBorder = Number(manaLeft) - (manaWidth * 100) / 2;
      const antaManaMeterPower1 = new GUI.Rectangle('antaManaMeterPower1');
      width = (manaWidth / 4) * 1;
      antaManaMeterPower1.left = `${String(leftAntaManaBorder + (width * 100) / 2)}%`;
      antaManaMeterPower1.top = `${manaTop}%`;
      antaManaMeterPower1.width = width;
      antaManaMeterPower1.height = manaHeight;
      this.texture.addControl(antaManaMeterPower1);

      const antaManaMeterPower2 = new GUI.Rectangle('antaManaMeterPower2');
      width = (manaWidth / 4) * 2;
      antaManaMeterPower2.left = `${String(leftAntaManaBorder + (width * 100) / 2)}%`;
      antaManaMeterPower2.top = `${manaTop}%`;
      antaManaMeterPower2.width = width;
      antaManaMeterPower2.height = manaHeight;
      this.texture.addControl(antaManaMeterPower2);

      const antaManaMeterPower3 = new GUI.Rectangle('antaManaMeterPower3');
      width = (manaWidth / 4) * 3;
      antaManaMeterPower3.left = `${String(leftAntaManaBorder + (width * 100) / 2)}%`;
      antaManaMeterPower3.top = `${manaTop}%`;
      antaManaMeterPower3.width = width;
      antaManaMeterPower3.height = manaHeight;
      this.texture.addControl(antaManaMeterPower3);

      // TODO: truncate proName is name of user is to long
      const proName = new GUI.TextBlock('proName');
      proName.text = 'protagonist'.toUpperCase();
      proName.fontSize = 6;
      proName.left = '-32%';
      proName.top = '-49%';
      proName.color = 'white';
      proName.outlineColor = 'black';
      proName.outlineWidth = 4;
      proName.textHorizontalAlignment = 0;
      proName.width = 0.25;
      proName.height = 0.025;
      this.texture.addControl(proName);

      // TODO: truncate proName is name of user is to long
      const antaName = new GUI.TextBlock('antaName');
      antaName.text = 'antagonist'.toUpperCase();
      antaName.fontSize = 6;
      antaName.left = '32%';
      antaName.top = '-49%';
      antaName.color = 'white';
      antaName.outlineColor = 'black';
      antaName.outlineWidth = 4;
      antaName.textHorizontalAlignment = 1;
      antaName.width = 0.25;
      antaName.height = 0.025;
      this.texture.addControl(antaName);
    } catch (e: any) {
      console.error(e);
      throw new Error(Errors.FAILED_HUD_IMPORT);
    }
    // this.initializeControls();
  }

  private initializeControls() {
    const proHealthMeter = this.texture.getControlByName('proHealthMeter');
    const proManaMeter = this.texture.getControlByName('proManaMeter');
    if (!proHealthMeter || !proManaMeter) {
      throw new Error(Errors.MISSING_HUD_CONTROL);
    }
    this.proHealthMeter = proHealthMeter;
    this.proManaMeter = proManaMeter;
  }

  changeHealth(n: number) {
    this.changeControl(this.proHealthMeter, n);
  }

  changeMana(n: number) {
    this.changeControl(this.proManaMeter, n);
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
