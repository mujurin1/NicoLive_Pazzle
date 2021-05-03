import { ClearData } from "./Tuples";

// ================================= イベントデータ基本型 =================================
/**
 * `MessageData.data` の基本型。
 */
export interface MEDataBase {
  /** イベントのID。それぞれのイベントで固定値にする。 */
  id: number;
}
/**
 * ピースの更新イベントデータ基本型。
 */
export interface MEDataPiece extends MEDataBase {
  /** プレイヤーID。 */
  playerId: number;
  /** ピースID。 */
  pieceId: number;
}


// ================================= イベントデータ =================================
/**
 * プレイヤー参加イベントデータ型。
 */
export class JoinEventData implements MEDataBase {
  /** イベントのID。`this.id` と一致する。 */
  static ID: 0 = 0;

  /** イベントのID。 */
  id: 0;
  /** ニコニコユーザーID。 */
  nicoId: string | undefined;
  /** プレイヤー名。 */
  name: string;
}

/**
 * ピースをクリックした時のイベントデータ型。
 */
export class PieceDownEventData implements MEDataPiece {
  /** イベントのID。`this.id` と一致する。 */
  static ID: 1 = 1;

  /** イベントのID。 */
  id: 1;
  /** プレイヤーID。 */
  playerId: number;
  /** ピースID。 */
  pieceId: number;
}
/**
 * ピースを動かした時のイベントデータの型。
 */
 export class PieceMoveEventData implements MEDataBase, MEDataPiece {
  /** イベントのID。`this.id` と一致する。 */
  static ID: 2 = 2;

  /** イベントのID。 */
  id: 2;
  /** プレイヤーID。 */
  playerId: number;
  /** ピースID。 */
  pieceId: number;
  /** 移動先。 */
  pos: { x:number, y:number };
}
/**
 * ピースを離した時のイベントデータの型。
 */
export class PieceUpEventData implements MEDataBase, MEDataPiece {
  /** イベントのID。`this.id` と一致する。 */
  static ID: 3 = 3;

  /** イベントのID。 */
  id: 3;
  /** プレイヤーID。 */
  playerId: number;
  /** ピースID。 */
  pieceId: number;
  /** 移動先。 */
  pos: { x:number, y:number };
}
/**
 * ピースとピースが繋がった時のイベントデータの型。
 */
export class ConnectPieceEventData implements MEDataBase {
  static ID: 4 = 4;

  /** イベントのID。 */
  id: 4;
  /** 繋げたピース（オーナー）のID。 */
  ownerPieceId: number;
  /** 繋がったピース（子）のID。 */
  childPieceId: number;
  /** つなげたプレイヤーID。 */
  playerId: number;
}
/**
 * ピースが盤面にハマった時のイベントデータの型。
 */
export class FitPieceEventData implements MEDataBase {
  static ID: 5 = 5;

  /** イベントのID。 */
  id: 5;
  /** ハマったピースのID。 */
  pieceId: number;
  /** ハメたプレイヤーID。 */
  playerId: number;
}
/**
 * クリアした時のイベントデータの型。
 */
export class ClearEventData implements MEDataBase {
  /** イベントのID。`this.id` と一致する。 */
  static ID: 6 = 6;

  /** イベントのID。 */
  id: 6;
  /** プレイヤー全員のスコア。 */
  players: ClearData[];
  /** 最後のピースをはめたプレイヤーID。 */
  lastPlayerId: number;
}
