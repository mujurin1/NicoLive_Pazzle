import { GameMaster } from "./GameMaster";
import { MyPlayer } from "./MyPlayer";
import { PieceCut } from "./PieceCut";

interface RPGAtsumaruWindow { RPGAtsumaru?: any; }
declare const window: RPGAtsumaruWindow;

function main(param: g.GameMainParameterObject): void {
  // ======================= ゲームの初期設定 =======================
  // 生主のための罠
  g.game.onJoin.addOnce(ev => {
    MyPlayer.liverId = ev.player.id;
  });

  // シーンを作る
  let scene = new g.Scene({
    game: g.game,
    assetIds: ["joinBtn", "playBtn", "left", "right",
      "setting", "zoomIn", "zoomOut", "previewBtn", "titleBtn",
      "result", "resultBtn", "crown_0", "crown_1", "crown_2", "crown_3",
      "select_E", "select_N", "select_H", "sanka_nin", "title_back",
      "fit", "fit2"],
    assetPaths: ["/assets/**/*"],
  });
  g.game.pushScene(scene);

  scene.onLoad.add(_ => {
    // if (typeof window !== "undefined" && window.RPGAtsumaru) {
    //   console.log("アツマール");
    // } else {
    //   console.log("生ゲーム");
    // }
    GameMaster.createGame(scene);
  });
}

export = main;
