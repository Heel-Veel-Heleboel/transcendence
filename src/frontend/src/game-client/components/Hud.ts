import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import * as GUI from '@babylonjs/gui';
import { IHud } from '../types/Types';
import { Scene } from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';
import Errors from '../utils/Error';
import { createAdvancedDynamicTexture } from '../utils/Create';

/* v8 ignore start */
export class Hud implements IHud {
  public proScore!: Control;
  public antaScore!: Control;
  public proHealthMeter!: Control;
  public antaHealthMeter!: Control;
  public proManaMeter!: Control;
  public antaManaMeter!: Control;
  private _manaWidth!: number;
  private _texture!: AdvancedDynamicTexture;
  private _gameMode!: string;

  constructor(gameMode: string, scene: Scene) {
    this._gameMode = gameMode;
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
      if (this._gameMode === 'powerup') {
        this.initPowerup();
        this.initializePowerUpControls();
      } else if (this._gameMode === 'classic') {
        this.initClassic();
        this.initializeClassicControls();
      }
    } catch (e: any) {
      console.error(e);
      throw new Error(Errors.FAILED_HUD_IMPORT);
    }
  }

  private initClassic() {
    const proScore = new GUI.TextBlock('proScore', '0');
    proScore.left = '-5%';
    proScore.top = '-45%';
    proScore.fontSize = 12;
    proScore.color = 'white';
    proScore.width = 0.05;
    proScore.height = 0.05;
    this.texture.addControl(proScore);

    const antaScore = new GUI.TextBlock('antaScore', '0');
    antaScore.left = '5%';
    antaScore.top = '-45%';
    antaScore.fontSize = 12;
    antaScore.color = 'white';
    antaScore.width = 0.05;
    antaScore.height = 0.05;
    this.texture.addControl(antaScore);

    // TODO: truncate proName is name of user is to long
    const proName = new GUI.TextBlock('proName');
    proName.text = 'protagonist'.toUpperCase();
    proName.fontSize = 6;
    proName.left = '-5%';
    proName.top = '-49%';
    proName.color = 'white';
    proName.outlineColor = 'black';
    proName.outlineWidth = 4;
    proName.width = 0.25;
    proName.height = 0.025;
    this.texture.addControl(proName);

    // TODO: truncate proName is name of user is to long
    const antaName = new GUI.TextBlock('antaName');
    antaName.text = 'antagonist'.toUpperCase();
    antaName.fontSize = 6;
    antaName.left = '5%';
    antaName.top = '-49%';
    antaName.color = 'white';
    antaName.outlineColor = 'black';
    antaName.outlineWidth = 4;
    antaName.width = 0.25;
    antaName.height = 0.025;
    this.texture.addControl(antaName);

    const logo = new GUI.Image('logo', '/classic.png');
    logo.left = '0';
    logo.top = '-45%';
    logo.width = 0.05;
    logo.height = 0.05;
    logo.stretch = GUI.Image.STRETCH_UNIFORM;
    this.texture.addControl(logo);
  }

  private initPowerup() {
    const healthLeft = '25';
    const healthTop = '46.5';
    const healthContainerColor = 'red';
    const healthColor = 'yellow';
    const healthWidth = 0.4;
    const healthHeight = 0.025;

    const manaLeft = '35';
    const manaTop = '46.5';
    const manaContainerColor = 'lightblue';
    const manaColor = 'blue';
    const manaWidth = 0.25;
    this._manaWidth = manaWidth * 100;
    const manaHeight = 0.025;
    let width;

    const proHealthContainer = new GUI.Rectangle('proHealthContainer');
    proHealthContainer.left = `-${healthLeft}%`;
    proHealthContainer.top = `-${healthTop}%`;
    proHealthContainer.background = healthContainerColor;
    proHealthContainer.width = healthWidth;
    proHealthContainer.height = healthHeight;
    this.texture.addControl(proHealthContainer);

    const proHealthMeter = new GUI.Rectangle('proHealthMeter');
    proHealthMeter.left = `${String(50 - Number(healthLeft) - (healthWidth * 100) / 2)}%`;
    proHealthMeter.top = `-${healthTop}%`;
    proHealthMeter.horizontalAlignment = 0;
    proHealthMeter.background = healthColor;
    proHealthMeter.width = healthWidth;
    proHealthMeter.height = healthHeight;
    this.texture.addControl(proHealthMeter);

    const proManaContainer = new GUI.Rectangle('proManaContainer');
    proManaContainer.left = `-${manaLeft}%`;
    proManaContainer.top = `${manaTop}%`;
    proManaContainer.width = manaWidth;
    proManaContainer.background = manaContainerColor;
    proManaContainer.height = manaHeight;
    this.texture.addControl(proManaContainer);

    const proManaMeter = new GUI.Rectangle('proManaMeter');
    proManaMeter.left = `${String(50 - Number(manaLeft) - (manaWidth * 100) / 2)}%`;
    proManaMeter.top = `${manaTop}%`;
    proManaMeter.horizontalAlignment = 0;
    proManaMeter.width = 0;
    proManaMeter.background = manaColor;
    proManaMeter.height = manaHeight;
    this.texture.addControl(proManaMeter);

    const leftProManaBorder = -Number(manaLeft) - (manaWidth * 100) / 2;
    const proManaMeterPower1 = new GUI.Rectangle('proManaMeterPower1');
    width = (manaWidth / 4) * 1;
    proManaMeterPower1.left = `${String(leftProManaBorder + (width * 100) / 2)}%`;
    proManaMeterPower1.top = `${manaTop}%`;
    proManaMeterPower1.width = width;
    proManaMeterPower1.height = manaHeight;
    this.texture.addControl(proManaMeterPower1);

    const proManaMeterPower2 = new GUI.Rectangle('proManaMeterPower2');
    width = (manaWidth / 4) * 2;
    proManaMeterPower2.left = `${String(leftProManaBorder + (width * 100) / 2)}%`;
    proManaMeterPower2.top = `${manaTop}%`;
    proManaMeterPower2.width = width;
    proManaMeterPower2.height = manaHeight;
    this.texture.addControl(proManaMeterPower2);

    const proManaMeterPower3 = new GUI.Rectangle('proManaMeterPower3');
    width = (manaWidth / 4) * 3;
    proManaMeterPower3.left = `${String(leftProManaBorder + (width * 100) / 2)}%`;
    proManaMeterPower3.top = `${manaTop}%`;
    proManaMeterPower3.width = width;
    proManaMeterPower3.height = manaHeight;
    this.texture.addControl(proManaMeterPower3);

    const antaHealthContainer = new GUI.Rectangle('antaHealthContainer');
    antaHealthContainer.left = `${healthLeft}%`;
    antaHealthContainer.top = `-${healthTop}%`;
    antaHealthContainer.background = healthContainerColor;
    antaHealthContainer.width = healthWidth;
    antaHealthContainer.height = healthHeight;
    this.texture.addControl(antaHealthContainer);

    const antaHealthMeter = new GUI.Rectangle('antaHealthMeter');
    antaHealthMeter.left = `-${String(50 - Number(healthLeft) - (healthWidth * 100) / 2)}%`;
    antaHealthMeter.top = `-${healthTop}%`;
    antaHealthMeter.horizontalAlignment = 1;
    antaHealthMeter.background = healthColor;
    antaHealthMeter.width = healthWidth;
    antaHealthMeter.height = healthHeight;
    this.texture.addControl(antaHealthMeter);

    const antaManaContainer = new GUI.Rectangle('antaManaContainer');
    antaManaContainer.left = `${manaLeft}%`;
    antaManaContainer.top = `${manaTop}%`;
    antaManaContainer.width = manaWidth;
    antaManaContainer.background = manaContainerColor;
    antaManaContainer.height = manaHeight;
    this.texture.addControl(antaManaContainer);

    const antaManaMeter = new GUI.Rectangle('antaManaMeter');
    antaManaMeter.left = `-${String(50 - Number(manaLeft) - (manaWidth * 100) / 2)}%`;
    antaManaMeter.top = `${manaTop}%`;
    antaManaMeter.horizontalAlignment = 1;
    antaManaMeter.width = 0;
    antaManaMeter.background = manaColor;
    antaManaMeter.height = manaHeight;
    this.texture.addControl(antaManaMeter);

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

    const logo = new GUI.Image('logo', '/powerup.png');
    logo.left = '0';
    logo.top = '-46.5%';
    logo.width = 0.05;
    logo.height = 0.05;
    logo.stretch = GUI.Image.STRETCH_UNIFORM;
    this.texture.addControl(logo);
  }

  private initializePowerUpControls() {
    const proHealthMeter = this.texture.getControlByName('proHealthMeter');
    const proManaMeter = this.texture.getControlByName('proManaMeter');
    const antaHealthMeter = this.texture.getControlByName('antaHealthMeter');
    const antaManaMeter = this.texture.getControlByName('antaManaMeter');
    if (
      !proHealthMeter ||
      !proManaMeter ||
      !antaHealthMeter ||
      !antaManaMeter
    ) {
      throw new Error(Errors.MISSING_HUD_CONTROL);
    }
    this.proHealthMeter = proHealthMeter;
    this.proManaMeter = proManaMeter;
    this.antaHealthMeter = antaHealthMeter;
    this.antaManaMeter = antaManaMeter;
  }

  private initializeClassicControls() {
    const proScore = this.texture.getControlByName('proScore');
    const antaScore = this.texture.getControlByName('antaScore');
    if (!proScore || !antaScore) {
      throw new Error(Errors.MISSING_HUD_CONTROL);
    }
    this.proScore = proScore;
    this.antaScore = antaScore;
  }

  changeHealth(n: number) {
    this.changeControl(this.proHealthMeter, n);
  }

  changeMana(n: number) {
    this.changeControl(this.proManaMeter, n);
    this.changeControl(this.antaManaMeter, n);
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
    let newValue = Math.min(this._manaWidth, value);
    newValue = Math.max(0, newValue);
    return newValue;
  }

  private set texture(texture: AdvancedDynamicTexture) {
    this._texture = texture;
  }
  private get texture() {
    return this._texture;
  }
}
/* v8 ignore stop */
