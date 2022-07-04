export interface Screen {
  init?(game: Game): void;
  update?(delta: number, game: Game): void;
  dispose?(): void;
}

export class Game {
  currentScreen: Screen;

  static shared = new Game();

  setScreen(screen: Screen) {
    if (this.currentScreen && this.currentScreen.dispose) {
      this.currentScreen.dispose();
    }
    this.currentScreen = screen;
    if (this.currentScreen && this.currentScreen.init) {
      this.currentScreen.init(this);
    }
  }
  update(delta: number) {
    if (this.currentScreen && this.currentScreen.update) {
      this.currentScreen.update(delta, this);
    }
  }
}
