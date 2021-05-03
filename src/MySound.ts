import { GameMaster } from "./GameMaster";


export class MySound {
  static this: MySound;

  static get scene() {
    return GameMaster.this.scene;
  }

  static pieceFit: g.AudioAsset;
  static pieceFit2: g.AudioAsset;

  static create() {
    this.pieceFit = this.scene.asset.getAudioById("fit");
    this.pieceFit2 = this.scene.asset.getAudioById("fit2");
  }
}