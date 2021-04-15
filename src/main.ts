import { JigsawGame } from "./JigsawGame";
import { PazzleAssets } from "./PazzleAsset";
import { PazzlePreview } from "./PazzlePreview";
import { MyPlayer } from "./MyPlayer";

function main(param: g.GameMainParameterObject): void {
  var scene = new g.Scene({
    game: g.game,
    assetIds: ["joinBtn", "playBtn", "setting", "zoomIn", "zoomOut", "previewBtn", "titleBtn"],
    assetPaths: ["/assets/**/*"],
  });

  /** 生主のID。 */
  var liverId: string;
  /** パズルのアセット。 */
  var assets: PazzleAssets;
  /** パズルゲーム本体。 */
  var pzlGame: JigsawGame;
  /** パズルプレビュー。 */
  var pazzlePre: PazzlePreview;
  /** 参加していない人用の画面。 */
  var guard: g.FilledRect;

  var hostBtn = new g.FilledRect({
    scene,
    width: g.game.width,
    height: g.game.height,
    cssColor: "rgba(0,0,0,0)",
    parent: scene,
    touchable: true,
  });
  hostBtn.onPointDown.addOnce(ev => {
    if(!ev.player || !ev.player.id) return;
    if(liverId != null) return;
    scene.onUpdate.remove(wait);
    liverId = ev.player.id;
    pazzlePre = new PazzlePreview(assets, liverId);
    scene.append(pazzlePre.display);
  });
  hostBtn.onPointDown.add(_ => hostBtn.destroy());

  // 生主のIDを取得するための罠
  g.game.onJoin.addOnce(ev => {
    if (!ev.player || !ev.player.id) return;
    if (liverId != undefined) return;
    hostBtn.destroy();
    liverId = ev.player.id;
  });

  // グローバルメッセージ
  var msg = () => scene.onMessage.add(ev => {
    switch (ev.data.message) {
      case "PG":      // ============== ゲーム開始 ==============
        // もしパズルを選択せずにゲーム開始したら現在表示中のパズルを
        if (pazzlePre.sellectIds.length == 0)
          pazzlePre.sellectIds.push(pazzlePre.previewId);
        // 選択したパズルをゲームに追加
        for (var pId of pazzlePre.sellectIds)
          pzlGame.addPazzle(pId);

        pazzlePre.display.hide();   // プレビュー画面を非表示
        pzlGame.gameStart();

        // このプレイヤーがゲームに参加していれば
        if (pzlGame.searchPlayer(g.game.selfId) != undefined) {
          // とくになし
        } else {        // 参加していなければ
          if (guard == undefined) {
            // 参加してないプレイヤー用の画面
            guard = guardScene(scene, pazzlePre.font);
          } else {
            guard.onPointMove.removeAll();
            guard.onPointMove.add(pzlGame.moveCamera, pzlGame);
          }
        }
        break;
      case "GT":      // ============== タイトルに戻る ==============
        // レイヤーを非表示にする
        pzlGame.playing = false;
        pzlGame.uiLayer.hide();
        pzlGame.pazzleLayer.hide();
        // イベントを削除する
        scene.onPointMoveCapture.removeAll();
        scene.onMessage.removeAll();
        // カメラを外す
        g.game.focusingCamera = undefined;
        g.game.modified();
        // パズルを除去する
        pazzlePre.sellectIds = new Array();
        pzlGame.removePazzle();
        // 色々再設定する
        pazzlePre.setOnMessage(scene);
        pazzlePre.display.show();
        msg();
        break;
    }
  });
  msg();

  // このゲーム上のプレイヤーの参加イベント
  g.game.onPlayerInfo.add(ev => {
    var p = ev.player;
    if (p.id == undefined || p.name == undefined) return;

    // すでに参加しているプレイヤーだったら
    var oldP = pzlGame.searchPlayer(p.id);
    if (oldP) {
      oldP.updateInfo(p.name);
      return;
    }
    var player = new MyPlayer(p.id, p.name, p.id == liverId);
    pzlGame.join(player);
  });

  // 生主が入るかシーンの読み込み終了まで待機する
  var wait = () => {
    
    if (liverId == null) return;
    pazzlePre = new PazzlePreview(assets, liverId);
    scene.append(pazzlePre.display);
    scene.onUpdate.remove(wait);
  }
  scene.onUpdate.add(wait);

  scene.onLoad.add(() => {
    assets = new PazzleAssets(scene);
    pzlGame = JigsawGame.create(assets);
  });
  g.game.pushScene(scene);
}

/**
 * 参加してないプレイヤーに表示する。
 */
function guardScene(scene: g.Scene, font: g.Font): g.FilledRect {
  var pzlGame = JigsawGame.this;
  var guard = new g.FilledRect({
    scene,
    width: g.game.width,
    height: g.game.height,
    cssColor: "rgba(0,0,0,0.1)",
    local: true,
    touchable: true,
  });
  // 参加ボタン
  var joinBtn = new g.Sprite({
    scene,
    src: scene.asset.getImageById("joinBtn"),
    x: 50, y: 560,
    opacity: 0.9,
    parent: guard,
    local: true,
    touchable: true,
  });
  // メッセージ
  var msg = new g.Label({
    scene,
    font: font,
    fontSize: 50,
    text: "観戦中",
    parent: guard,
  });
  joinBtn.onPointDown.addOnce(ev => {
    PazzlePreview.onJoinBtnDown(ev);
    guard.destroy();
  });
  guard.onPointMove.add(pzlGame.moveCamera, pzlGame);
  if (pzlGame.uiLayer.children)
    pzlGame.uiLayer.insertBefore(guard, pzlGame.uiLayer.children[0]);
  else
    pzlGame.uiLayer.append(guard);
  return guard;
}

export = main;
