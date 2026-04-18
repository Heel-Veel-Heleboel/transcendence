import { ILoadingScreen } from '@babylonjs/core';

export class WinnerScreen implements ILoadingScreen {
  public loadingUIBackgroundColor: string;
  public loadingUIText: string;
  private loadingScreenDiv: HTMLDivElement;
  private loadingScreenTextDiv: HTMLDivElement;

  constructor() {
    this.loadingUIBackgroundColor = '';
    this.loadingUIText = '';

    const element = window.document.getElementById(
      'game-winner-screen'
    ) as HTMLDivElement;

    if (!element) {
      throw new Error('failure get loading screen div');
    }

    const textDiv = window.document.getElementById(
      'game-winner-text'
    ) as HTMLDivElement;

    if (!textDiv) {
      throw new Error('failure get loading screen div');
    }

    this.loadingScreenDiv = element;
    this.loadingScreenDiv.style.display = 'none';
    this.loadingScreenTextDiv = textDiv;
  }

  public displayLoadingUI() {
    this.loadingScreenDiv.style.display = 'flex';
  }

  public hideLoadingUI() {
    this.loadingScreenDiv.style.display = 'none';
  }

  public setText(text: string) {
    this.loadingScreenTextDiv.innerHTML += text;
  }
}
