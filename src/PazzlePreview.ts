import { Label } from "@akashic-extension/akashic-label";
import { resolvePlayerInfo } from "@akashic-extension/resolve-player-info";
import { JigsawGame } from "./JigsawGame";
import { MyPlayer } from "./MyPlayer";
import { PazzleAssets } from "./PazzleAsset";

/**
 * パズルのプレビュー用。  
 * グローバル。
 */
export class PazzlePreview {
  static this: PazzlePreview;

  /** フォント。 */
  font: g.Font;
  /** 全体としてのエンティティ。 */
  display: g.E;
  // 下の全てのエンティティの最終的な親は `display` 
  /** プレビューのエンティティ。 */
  preview: g.FilledRect;
  /** 選択中のパズルの情報。 */
  info: g.FilledRect;
  /** パズルのタイトル。 */
  title: Label;
  /** その他情報。 */
  other: Label;

  /** パズルのアセット。 */
  assets: PazzleAssets;
  /** 現在プレビュー中のパズル。 */
  previewId: number;
  /** 選択済みのパズルの番号の配列。 */
  sellectIds: number[];

  /**
   * コンストラクタ。
   * @param assets パズルアセット
   * @param liverId 生主のプレイヤーID
   */
  constructor(assets: PazzleAssets, liverId: string) {
    PazzlePreview.this = this;

    this.assets = assets;
    this.sellectIds = new Array();

    this.display = new g.E({
      scene: assets.scene
    });
    this.font = new g.DynamicFont({
      game: g.game,
      fontFamily: "sans-serif",
      size: 50,
    });
    this.preview = new g.FilledRect({
      scene: assets.scene,
      cssColor: "rgba(0,0,0,0.2)",
      width: 770, height: 460,
      x: 25, y: 35,
      parent: this.display,
    });
    this.info = new g.FilledRect({
      scene: assets.scene,
      cssColor: "rgpa(0,0,0,0.2)",
      width: 380, height: 460,
      x: 850, y: 35,
      parent: this.display,
    });
    this.title = new Label({
      scene: assets.scene,
      width: 360,
      height: 100,
      font: this.font,
      text: "たいとる",
      fontSize: 50,
      x: 20, y: 10,
      parent: this.info,
    });
    this.other = new Label({
      scene: assets.scene,
      font: this.font,
      width: 360,
      height: 300,
      text: "その他情報",
      fontSize: 30,
      x: 130, y: 100,
      parent: this.info,
    });
    // バージョン情報
    new Label({
      scene: assets.scene,
      font: this.font,
      width: 80,
      height: 30,
      text: "v0.5",
      fontSize: 30,
      x: 1150,
      y: 680,
      parent: this.display,
    })
    this.changePreview(0);

    this.gomi(liverId);
  }

  /**
   * ごみ
   * @param liverId 生主のプレイヤーID
   */
  gomi(liverId: string) {
    var scene = this.display.scene;
    // 参加ボタン
    var joinBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("joinBtn"),
      x: 1020, y: 560,
      opacity: 0.9,
      parent: this.display,
      local: true,
      touchable: true,
    });

    this.setOnMessage(scene);

    if(g.game.selfId == liverId) {
      // ====================== 生主だけの処理 ======================
      // プレビューの切り替えボタン =================================
      var back = new g.FilledRect({
        scene,
        width: 180, height: 90,
        x: 85, y: 570,
        cssColor: "green",
        parent: this.display,
        local: true,
        touchable: true,
      });
      back.onPointDown.add(ev => {
        g.game.raiseEvent(new g.MessageEvent({
          type: "CP",
          id: this.previewId-1,
        }));
      });
      var next = new g.FilledRect({
        scene,
        width: 180, height: 90,
        x: 350, y: 570,
        cssColor: "green",
        parent: this.display,
        local: true,
        touchable: true,
      });
      next.onPointDown.add(ev => {
        g.game.raiseEvent(new g.MessageEvent({
          type: "CP",
          id: this.previewId+1,
        }));
      });
      // 開始ボタン ================================================
      var playBtn = new g.Sprite({
        scene,
        src: scene.asset.getImageById("playBtn"),
        x: 1020, y:560,
        opacity: 0.9,
        local: true,
        touchable: true,
      });
      playBtn.onPointDown.add(_ => {
        g.game.raiseEvent(new g.MessageEvent({ message: "PG" }));
      });
      joinBtn.onPointDown.add(ev => {
        PazzlePreview.onJoinBtnDown(ev);
        this.display.append(playBtn);
        joinBtn.destroy();
      });
    } else {
      // ====================== リスナーだけの処理 ======================
      joinBtn.onPointDown.add(ev => {
        PazzlePreview.onJoinBtnDown(ev);
        joinBtn.destroy();
      });
    }
  }

  /**
   * プレビュー画面で使うグローバルなシーンメッセージ
   */
  setOnMessage(scene: g.Scene) {
    // ============== このシーン中のグローバルなイベント ==============
    scene.onMessage.add(ev => {
      switch(ev.data.type){
        case "CP":   // プレビューの変更イベント
        this.changePreview(ev.data.id);
          break;
      }
    });
  }

  /**
   * 参加ボタンを押した時の処理。  
   * この関数がグローバルな参加イベントを引き起こすので、  
   * ローカルに呼び出されなければいけない。
   */
  static onJoinBtnDown(ev: g.PointDownEvent) {
    if(!ev.player || !ev.player.id) return;

    /* プレイヤーのニコニコアカウント名を取得する。
    * https://akashic-games.github.io/shin-ichiba/player-info.html
    * 
    * resolvePlayerInfo(opts:{raises?, limitSeconds?}, callback?);
    * `raises: true` の場合 `g.game.onPlayerInfo` が呼ばれる。
    */
    resolvePlayerInfo({limitSeconds: 30}, (err, pi) => {
      if(!pi) return;
      if(!ev.player || !ev.player.id) return;
      if(!pi.name) return;

      // // ユーザー名が自動所得だった場合に名前を決める。
      // if(!pi.userData.accepted) {
      //   pi.name = `Auto ${Math.floor(Math.random()*100)}`;
      // }

      var player = new MyPlayer(ev.player.id, pi.name);

      // ゲームが始まってなければインフォのユーザー名を変更。
      if(!JigsawGame.this.playing) {
        var pre = PazzlePreview.this;
        pre.other.text = `ピース ${pre.assets.pazzles[pre.previewId].setting[1]} 枚！\r\nなまえ ${player.name}`;
        pre.other.invalidate();
      }

      // グローバルなプレイヤー参加イベントを呼び出す。
      g.game.raiseEvent(new g.PlayerInfoEvent(player));
    });
  }

  /**
   * プレビューするパズルを変える。
   * 
   * 範囲外の値を選択するとループする。
   * @param idx プレビューするパズルのID
   */
  changePreview(idx: number): void {
    // 範囲外のインデックスを範囲外に戻す。
    this.previewId = (idx + this.assets.count) % this.assets.count;
    /** プレビューするパズル。 */
    var pzl = this.assets.pazzles[this.previewId];

    // プレビューを更新する
    // 上下左右をはみ出ない最大サイズにスケールを変更し、
    // 真ん中になるように位置を調整する。
    /** プレビューするパズル */
    var pre = new g.Sprite({
      scene: this.display.scene,
      src: pzl.preview,
    });
    spriteSet(pre, this.preview.width, this.preview.height);

    if(this.preview.children)
      this.preview.remove(this.preview.children[0]);
    this.preview.append(pre);
    // ===================== パズルの情報更新 =====================
    // タイトル更新
    this.title.text = pzl.setting[0];
    this.title.invalidate();

    var time = 0;

    // その他情報
    this.other.text = `ピース ${pzl.setting[1]} 枚！\r\nなまえ ${JigsawGame.getName()}`;
    this.other.invalidate();
  }
}

/**
 * `g.Sprite` エンティティを調整する。
 * @param wid 調整する基準の幅
 * @param hei 調整する基準の高さ
 */
export function spriteSet(spr: g.Sprite, wid: number, hei: number) {
  var widPer = wid / spr.width;
  var heiPer = hei / spr.height;
  // 比率が `widPer == heiPer == 1.0` の場合無駄な処理になるけどまず無いしいいや
  if(widPer > heiPer) {         // プレビューエリアに対してパズルが横長
    // より小さい方に合わせて伸縮させる
    spr.scale(heiPer);
    // 小さい方は下が余ってるので真ん中に動かす
    spr.x = (wid - spr.width * spr.scaleX) / 2;
    spr.modified();
  } else {                      // プレビューエリアに対してパズルが縦長
    spr.scale(widPer);
    spr.y = (hei - spr.height * spr.scaleY) / 2;
    spr.modified();
  }
}