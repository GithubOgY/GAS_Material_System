# プロジェクト構造

このドキュメントは、プロジェクトのファイル構成と各ファイルの役割を説明します。

## 📁 ファイル構成

```
GAS_Material_System/
│
├── Code.gs                    # メインのGASコード
├── Dialog.html                # ユーザーインターフェース（HTML/JavaScript）
│
├── sheets_structure.md        # シート構造の詳細説明
├── USER_MANUAL.md             # ユーザー向け取り扱い説明書
├── DEVELOPMENT_LOG.md         # 開発履歴と技術的な詳細
├── SETUP_GUIDE.md             # 開発環境セットアップガイド
├── PROJECT_STRUCTURE.md       # このファイル（プロジェクト構造の説明）
├── README.md                  # プロジェクトの概要
│
└── .gitignore                 # Gitで管理しないファイルのリスト
```

## 📄 各ファイルの説明

### Code.gs
**役割**: メインのビジネスロジック  
**内容**:
- メニューの作成
- シート操作
- データ処理
- 在庫管理
- 売上記録
- エラーハンドリング

**主要な関数**:
- `onOpen()`: メニュー作成
- `processForm()`: フォーム処理
- `menuReceiveMaterial()`: 資材受領
- `menuManufactureProduct()`: 商品製造
- `menuDeliverProduct()`: 商品納品
- `registerBOM()`: BOM登録
- `checkAndResolveShortageOrders()`: Shortage自動解決

**定数**:
- `SHEET_NAMES`: シート名の定義
- `PROP_MODE`: ダイアログモードの保存用
- `PROP_MANUFACTURE_ROW`: 製造処理用の行番号保存

### Dialog.html
**役割**: ユーザーインターフェース  
**内容**:
- HTMLフォーム
- CSSスタイル
- JavaScript（フォーム制御、バリデーション）

**主要な関数**:
- `init()`: フォーム初期化
- `addBomMaterialField()`: BOM資材フィールド追加
- `handleSubmit()`: フォーム送信
- `toggleCustomQty()`: 数量入力の切り替え

**対応モード**:
- `ORDER_MATERIAL`: 資材発注
- `RECEIVE_PRODUCT`: 商品受注
- `MANUFACTURE_PRODUCT`: 製造業者選択
- `REGISTER_BOM`: BOM登録

### sheets_structure.md
**役割**: シート構造の詳細説明  
**内容**:
- 各シートの列構成
- データの例
- ステータスの説明

**対象読者**: セットアップを行う人、データ構造を理解したい人

### USER_MANUAL.md
**役割**: ユーザー向け操作マニュアル  
**内容**:
- システムの使い方
- 各機能の詳細な手順
- よくある質問
- トラブルシューティング

**対象読者**: システムを使用するエンドユーザー

### DEVELOPMENT_LOG.md
**役割**: 開発履歴と技術的な詳細  
**内容**:
- 開発履歴（時系列）
- 各機能追加・修正の詳細
- 技術的な設計パターン
- データフロー

**対象読者**: 開発者、保守担当者

### SETUP_GUIDE.md
**役割**: 開発環境セットアップガイド  
**内容**:
- セットアップ手順（詳細）
- チェックリスト
- よくある問題と解決方法

**対象読者**: 新しい開発者、セットアップを行う人

### README.md
**役割**: プロジェクトの概要  
**内容**:
- プロジェクトの説明
- 機能概要
- クイックスタートガイド
- ファイル構成

**対象読者**: すべて（最初に読むべきファイル）

### PROJECT_STRUCTURE.md
**役割**: プロジェクト構造の説明（このファイル）  
**内容**:
- ファイル構成
- 各ファイルの役割
- コードの構造

**対象読者**: 開発者

### .gitignore
**役割**: Gitで管理しないファイルのリスト  
**内容**:
- システムファイル
- 一時ファイル
- 個人設定ファイル

## 🔧 コードの構造

### Code.gs の構造

```
設定
├── SHEET_NAMES (シート名の定義)
├── PROP_MODE (ダイアログモード)
└── PROP_MANUFACTURE_ROW (製造処理用)

メニュー設定
└── onOpen()

HTMLダイアログ関連
├── openOrderMaterialDialog()
├── openProductOrderDialog()
├── openBOMDialog()
├── showDialog()
├── getDialogData()
└── processForm()

処理関数
├── menuReceiveMaterial()
├── menuManufactureProduct()
└── menuDeliverProduct()

データ操作ヘルパー
├── getSheet()
├── updateStock()
├── getStock()
├── getBOM()
├── getProductPrice()
├── getManufacturerName()
├── registerBOM()
└── checkAndResolveShortageOrders()
```

### Dialog.html の構造

```
HTML構造
├── <head> (スタイル定義)
├── <body>
│   ├── ローディングメッセージ
│   └── メインフォーム
│       ├── 項目選択（共通）
│       ├── BOM登録フィールド（BOM登録時のみ）
│       ├── 数量選択（一部モードのみ）
│       └── 送信ボタン

JavaScript
├── init() (フォーム初期化)
├── addBomMaterialField() (BOM資材フィールド追加)
├── updateMaterialFieldNumbers() (フィールド番号更新)
├── updateAddButton() (追加ボタン状態更新)
├── toggleCustomQty() (数量入力切り替え)
├── handleSubmit() (フォーム送信)
├── onSuccess() (成功処理)
├── showError() (エラー処理)
└── setupAddMaterialButton() (ボタン設定)
```

## 📊 データフロー

### 資材の流れ
```
Material_Orders (発注)
    ↓
Materials (在庫増加)
    ↓
Product_Orders (製造時に在庫減少)
```

### 商品の流れ
```
Products (商品マスタ)
    ↓
BOM (部品表)
    ↓
Product_Orders (受注)
    ↓
Product_Orders (製造)
    ↓
Sales (売上記録)
```

## 🔄 開発時のワークフロー

1. **機能追加・修正**
   - `Code.gs`または`Dialog.html`を編集
   - Apps Scriptエディタで保存
   - スプレッドシートで動作確認

2. **ドキュメント更新**
   - 機能追加時は`DEVELOPMENT_LOG.md`を更新
   - ユーザー向け機能追加時は`USER_MANUAL.md`を更新

3. **テスト**
   - 各機能を個別にテスト
   - エッジケースをテスト
   - エラーハンドリングを確認

## 📝 命名規則

### 関数名
- メニュー関数: `menu` + 機能名（例: `menuReceiveMaterial`）
- ダイアログ関数: `open` + 機能名 + `Dialog`（例: `openOrderMaterialDialog`）
- 処理関数: 動詞 + 名詞（例: `processForm`, `registerBOM`）
- ヘルパー関数: `get` + 名詞（例: `getStock`, `getBOM`）

### 定数
- シート名: `SHEET_NAMES`オブジェクト内（例: `SHEET_NAMES.MATERIALS`）
- プロパティキー: `PROP_` + 用途（例: `PROP_MODE`）

### 変数
- キャメルケース（例: `orderQty`, `bomData`）
- 意味のある名前を使用

## 🔍 デバッグ方法

1. **Logger.log()を使用**
   ```javascript
   Logger.log('デバッグメッセージ: ' + variable);
   ```
   Apps Scriptエディタで「表示」→「ログ」で確認

2. **ブラウザの開発者ツール**
   - F12キーで開く
   - コンソールタブでエラーを確認
   - `console.log()`でデバッグ情報を出力

3. **実行ログ**
   - Apps Scriptエディタで「表示」→「実行ログ」
   - エラーの詳細を確認

---

**更新履歴**: プロジェクト構造が変更された場合は、このファイルを更新してください。

