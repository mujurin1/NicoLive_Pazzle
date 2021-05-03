import { Label } from "@akashic-extension/akashic-label";
import { Font } from "@akashic/akashic-engine";
import { GameMaster } from "./GameMaster";
import { JigsawPazzle } from "./JigsawPazzle";
import { MyPlayer } from "./MyPlayer";
import { NameScore } from "./Tuples";

/**
 * 経過時間やスコア等表示するレイヤー。
 */
export class PlayingInfo {
  static this: PlayingInfo;

  get scene(): g.Scene {
    return GameMaster.this.scene;
  }

  /** 情報を表示するレイヤー。 */
  display: g.E;
  /** 表示中のパズル。 */
  get infoPazzle(): JigsawPazzle | undefined {
    return GameMaster.this.playingPzl;
  }

  // =============================== タイトル ===============================
  private _titleFont: Font;
  private _titleLabel: Label;
  private _titleChange: (t: string) => void;
  // =============================== ピース完成率 ===============================
  private _pieceFont: Font;
  private _pieceLabel: Label;
  private _pieceChange: (t: string) => void;
  // =============================== 経過時間 ===============================
  private _timeFont: Font;
  private _timeLabel: Label;
  private _timeChange: (t: string) => void;
  // =============================== スコアボード ===============================
  /** 表示するスコアボードの人数。 */
  private _scoreLength = 5;
  /** スコアボードの１人分の高さ。 */
  private _scoreHeight = 40;
  /** スコア用レイヤー。 */
  private _scoreFont: Font;
  private _nameLabels: Label[];
  private _scoreChanges: ((ns: NameScore) => void)[];
  // 自分のスコア
  private _myFont: Font;
  private _myLabel: Label;
  private _myChange: (ns: NameScore) => void;





  private constructor() {
    PlayingInfo.this = this;

    this.display = new g.FilledRect({
      scene: this.scene,
      cssColor: "rgba(255,255,255,0.5)",
      width: 300,
      height: 410,
      local: true,
      x: 950,
      y: 10,
    });

    // ================================== タイトル ==================================
    this._titleFont = newFont("sans-serif", 40);
    this._titleLabel = new Label({
      scene: this.scene,
      font: this._titleFont,
      text: "タイトル",
      widthAutoAdjust: true,
      lineBreak: false,
      width: 280, height: 40,
      // x: 10, y: 10,
      x: 150, y: 30,
      anchorX: 0.5,
      anchorY: 0.5,
      parent: this.display,
    });
    this._titleChange = t => {
      this._titleLabel.text = t;
      this._titleLabel.scale(1);
      labelAutoReSizeW(this._titleLabel, 270);
    }
    // ================================== ピース ==================================
    this._pieceFont = newFont("sans-serif", 30);
    this._pieceLabel = new Label({
      scene: this.scene,
      font: this._pieceFont,
      text: "クリア率　ピース数",
      textAlign: "right",
      width: 290, height: 40,
      x: 0, y: 80,
      parent: this.display,
    });
    this._pieceChange = t => {
      this._pieceLabel.text = t;
      this._pieceLabel.invalidate();
    }
    // ================================== 経過時間 ==================================
    this._timeFont = newFont("sans-serif", 30);
    this._timeLabel = new Label({
      scene: this.scene,
      font: this._timeFont,
      text: "経過時間",
      textAlign: "right",
      width: 270, height: 40,
      x: 10, y: 120,
      parent: this.display,
    });
    this._timeChange = t => {
      this._timeLabel.text = t;
      this._timeLabel.invalidate();
    }
    // ================================== スコア ==================================
    this._nameLabels = new Array(this._scoreLength);
    this._scoreChanges = new Array(this._scoreLength);
    this._scoreLength = 5;
    this._scoreFont = newFont("sans-serif", 30);
    for(let i=0; i<this._scoreLength; i++) {
      let nl = new Label({
        scene: this.scene,
        font: this._scoreFont,
        text: "",
        width: 200, height: 170,
        x: 10, y: 160 + i*this._scoreHeight,
        parent: this.display,
      });
      this._nameLabels[i] = nl;
      /** スコアの方。 */
      let sl = new Label({
        scene: this.scene,
        font: this._scoreFont,
        text: "",
        textAlign: "right",
        width: 60, height: 170,
        x: 210, y: this._nameLabels[i].y,
        parent: this.display,
      });
      this._scoreChanges[i] = ns => {
        nl.text = ns.name;
        nl.scale(1);
        labelAutoReSizeH(nl, 200, this._scoreHeight);
        sl.text = ns.score+"";
        sl.invalidate();
      }
    }
    // 自分の名前
    this._myFont = newFont("sans-serif", 30, "#7345ff");
    this._myLabel = new Label({
      scene: this.scene,
      font: this._myFont,
      text: "あなた",
      width: 200,
      x: 10, y: this._nameLabels[this._scoreLength-1].y + this._scoreHeight,
      parent: this.display,
    });
    /** 自分のスコア */
    let mySLavel = new Label({
      scene: this.scene,
      font: this._myFont,
      text: "000",
      textAlign: "right",
      width: 60,
      x: 210, y: this._nameLabels[this._scoreLength-1].y + this._scoreHeight,
      parent: this.display,
    });
    this._myChange = ns => {
      if(ns.name != this._myLabel.text) {
        this._myLabel.text = ns.name;
        this._myLabel.scale(1);
        labelAutoReSizeH(this._myLabel, 200, this._scoreHeight);
      }
      mySLavel.text = ns.score+"";
      mySLavel.invalidate();
    }
  }

  /**
   * 表示するパズルを変更する。
   */
  changePzl() {
    this._titleChange(this.infoPazzle.asset.title);
    this.update();
  }

  /**
   * 表示を更新する。
   */
  update() {
    let pzl = this.infoPazzle;
    if(pzl == undefined) return;

    // パズルの完成率と ハマったピース数／全ピース数
    let fit = pzl.fittedPieceCount;
    let max = pzl.pieceCount;
    let per = Math.floor(fit / max *100);
    let sw = pzl.stopWatch;

    this._pieceChange(`${per}％　${`000${fit}`.slice(-(max+"").length)}/${max}`);
    // this._timeChange(`${sw.time} 秒`);
    if(sw.time < 3600) {
      this._timeChange(`${sw.time_m}分${sw.time_s}秒`);
    } else {
      this._timeChange(`${sw.time_h}時${sw.time_m}分${sw.time_s}秒`);
    }
    // スコアボード
    for(let i=0; i<this._scoreLength; i++) {
      let p = MyPlayer.players[i];
      if(p == undefined) break;
      this._scoreChanges[i]({name: p.name, score: p.score});
    }
    // 自分
    let mine = MyPlayer.self();
    if(mine != undefined)
      this._myChange({name: mine.name, score: mine.score});
  }

  static create(): void {
    if(this.this != undefined) return;
    new PlayingInfo();
  }
}

/**
 * `Label` のサイズを横幅に合わせる。
 * `label` の `widthAutoAdjust` が `true` でないといけない。  
 * `label` の `lineBreak` が `false` でないといけない。
 * @param label ラベル
 * @param width 合わせる横幅
 */
export function labelAutoReSizeW(label: Label, width: number) {
  label.invalidate();

  let sx = width / label.width;
  if(sx < 1) {
    label.scale(sx);
    label.modified();
    label.invalidate();
  }
}

/**
 * `Label` のサイズを縦幅に合わせる。
 * `label` の `widthAutoAdjust` が `false` でないといけない。  
 * `label` の `lineBreak` が `true` でないといけない。
 * @param label ラベル
 * @param width 合わせる縦幅
 * @param height 合わせる縦幅
 */
export function labelAutoReSizeH(label: Label, width: number, height: number) {
  label.invalidate();

  label.width = width;
  label.modified();
  label.invalidate()
  while(height < label.height) {
    label.width *= 2;
    height *= 2;
    label.scale(label.scaleX/2);
    label.modified();
    label.invalidate()
  }
}

export function newFont(fontFamily: string, size: number, fontColor?: string): g.DynamicFont {
  fontColor = fontColor == undefined? "brack" : fontColor;
  return new g.DynamicFont({
    game: g.game,
    fontFamily,
    size,
    fontColor,
  });
}