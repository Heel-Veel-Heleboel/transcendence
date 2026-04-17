import { ILoadingScreen } from '@babylonjs/core';

export class LoadingScreen implements ILoadingScreen {
  public loadingUIBackgroundColor: string;
  public loadingUIText: string;
  private loadingScreenDiv: HTMLDivElement;

  constructor() {
    this.loadingUIBackgroundColor = '';
    this.loadingUIText = '';

    const element = window.document.getElementById(
      'game-loading-screen'
    ) as HTMLDivElement;

    if (!element) {
      throw new Error('failure get loading screen div');
    }

    this.loadingScreenDiv = element;
    this.loadingScreenDiv.style.display = 'none';
  }

  public displayLoadingUI() {
    this.loadingScreenDiv.style.display = 'flex';
  }

  public hideLoadingUI() {
    this.loadingScreenDiv.style.display = 'none';
  }
}
