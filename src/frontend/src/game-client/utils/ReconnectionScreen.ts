import { ILoadingScreen } from '@babylonjs/core';

export class ReconnectionScreen implements ILoadingScreen {
  public loadingUIBackgroundColor: string;
  public loadingUIText: string;
  private loadingScreenDiv: HTMLDivElement;

  constructor() {
    this.loadingUIBackgroundColor = '';
    this.loadingUIText = '';

    const element = window.document.getElementById(
      'game-reconnection-screen'
    ) as HTMLDivElement;

    if (!element) {
      throw new Error('failure get reconnection screen div');
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
