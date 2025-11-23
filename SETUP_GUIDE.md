# 開発環境セットアップガイド

このガイドは、新しい開発者がこのプロジェクトをセットアップする際の手順書です。

## 📋 前提条件

- Googleアカウントを持っていること
- GoogleスプレッドシートとApps Scriptの基本的な使い方を理解していること
- コードエディタ（任意、推奨: Visual Studio Code, Cursor等）

## 🚀 セットアップ手順

### ステップ1: プロジェクトファイルの取得

1. このプロジェクトのファイルをダウンロードまたはクローン
2. 以下のファイルが含まれていることを確認：
   - `Code.gs`
   - `Dialog.html`
   - `sheets_structure.md`
   - `USER_MANUAL.md`
   - `DEVELOPMENT_LOG.md`
   - `README.md`
   - `SETUP_GUIDE.md`（このファイル）

### ステップ2: Googleスプレッドシートの作成

1. [Googleスプレッドシート](https://sheets.google.com)にアクセス
2. 「空白」を選択して新しいスプレッドシートを作成
3. スプレッドシートの名前を適切に変更（例: "資材管理システム"）

### ステップ3: シートの作成

`sheets_structure.md`を参照して、以下の7つのシートを作成してください：

#### 3-1. Materials シート
1. シート名を「Materials」に変更
2. 1行目にヘッダーを入力：
   - A1: `MaterialID`
   - B1: `MaterialName`
   - C1: `Unit`
   - D1: `CurrentStock`
3. 2行目以降にサンプルデータを入力（任意）

#### 3-2. Products シート
1. 新しいシートを追加し、「Products」に名前変更
2. 1行目にヘッダーを入力：
   - A1: `ProductID`
   - B1: `ProductName`
   - C1: `SellingPrice`
3. 2行目以降にサンプルデータを入力（任意）

#### 3-3. BOM シート
1. 新しいシートを追加し、「BOM」に名前変更
2. 1行目にヘッダーを入力：
   - A1: `ProductID`
   - B1: `MaterialID`
   - C1: `QuantityRequired`
3. 2行目以降にサンプルデータを入力（任意）

#### 3-4. Material_Orders シート
1. 新しいシートを追加し、「Material_Orders」に名前変更
2. 1行目にヘッダーを入力：
   - A1: `OrderID`
   - B1: `Date`
   - C1: `MaterialID`
   - D1: `Quantity`
   - E1: `Status`

#### 3-5. Product_Orders シート
1. 新しいシートを追加し、「Product_Orders」に名前変更
2. 1行目にヘッダーを入力：
   - A1: `OrderID`
   - B1: `Date`
   - C1: `ClientName`
   - D1: `ProductID`
   - E1: `Quantity`
   - F1: `Status`
   - G1: `Manufacturer`（重要: G列を追加）

#### 3-6. Sales シート
1. 新しいシートを追加し、「Sales」に名前変更
2. 1行目にヘッダーを入力：
   - A1: `OrderID`
   - B1: `Date`
   - C1: `ClientName`
   - D1: `ProductID`
   - E1: `Quantity`
   - F1: `UnitPrice`
   - G1: `TotalAmount`
   - H1: `Manufacturer`（重要: H列を追加）

#### 3-7. Manufacturers シート
1. 新しいシートを追加し、「Manufacturers」に名前変更
2. 1行目にヘッダーを入力：
   - A1: `ManufacturerID`
   - B1: `ManufacturerName`
3. 2行目以降にサンプルデータを入力（任意）

### ステップ4: Apps Scriptプロジェクトの設定

1. スプレッドシートのメニューから「拡張機能」→「Apps Script」を選択
2. 新しいタブでApps Scriptエディタが開きます
3. デフォルトの`Code.gs`ファイルを開く

### ステップ5: コードファイルの追加

#### 5-1. Code.gs の設定
1. Apps Scriptエディタで、既存の`Code.gs`の内容をすべて削除
2. プロジェクトの`Code.gs`ファイルの内容をコピー
3. Apps Scriptエディタに貼り付け
4. 保存（Ctrl+S または Cmd+S）

#### 5-2. Dialog.html の追加
1. Apps Scriptエディタで「+」ボタンをクリック
2. 「HTML」を選択
3. ファイル名を「Dialog」に設定
4. プロジェクトの`Dialog.html`ファイルを開く
5. **重要**: Apps Scriptでは、HTMLファイルの`<!DOCTYPE html>`と`<html>`タグは自動的に追加されます
6. `Dialog.html`の内容をコピーする際は、**全体をそのままコピー**してください
7. Apps Scriptエディタに貼り付け
8. 保存（Ctrl+S または Cmd+S）

**注意**: 
- Apps Scriptエディタでは、HTMLファイルの最初と最後に`<!DOCTYPE html>`と`<html>`タグが自動的に追加されます
- そのため、`Dialog.html`の内容をそのまま貼り付けて問題ありません
- ただし、既に`<!DOCTYPE html>`や`<html>`タグが含まれている場合は、重複しないように注意してください

### ステップ6: 初期データの登録

各マスタシートに初期データを登録してください：

#### Materials シート
```
MaterialID | MaterialName | Unit | CurrentStock
M001       | 木材         | kg   | 0
M002       | 鉄           | kg   | 0
```

#### Products シート
```
ProductID | ProductName | SellingPrice
P001      | 椅子        | 5000
P002      | テーブル    | 12000
```

#### Manufacturers シート
```
ManufacturerID | ManufacturerName
MFG001         | 製造業者A
MFG002         | 製造業者B
```

#### BOM シート（例）
```
ProductID | MaterialID | QuantityRequired
P001      | M001       | 2
P001      | M002       | 1
```

### ステップ7: 動作確認

1. Apps Scriptエディタで保存を確認
2. スプレッドシートのタブに戻る
3. ページを再読み込み（F5キー）
4. メニューバーに「資材管理システム」が表示されることを確認
5. メニューから各機能を試して動作を確認

### ステップ8: 権限の設定（初回実行時）

1. メニューから任意の機能を実行
2. 「承認が必要です」というダイアログが表示される
3. 「権限を確認」をクリック
4. Googleアカウントを選択
5. 「詳細」→「（プロジェクト名）に移動」をクリック
6. 「許可」をクリック

## 🔍 セットアップの確認チェックリスト

- [ ] 7つのシートがすべて作成されている
- [ ] 各シートのヘッダーが正しく設定されている
- [ ] Product_OrdersシートにG列（Manufacturer）が追加されている
- [ ] SalesシートにH列（Manufacturer）が追加されている
- [ ] Code.gsが正しく保存されている
- [ ] Dialog.htmlが正しく保存されている
- [ ] メニューが表示される
- [ ] 各機能が正常に動作する
- [ ] 初期データが登録されている

## 🐛 よくある問題と解決方法

### 問題1: メニューが表示されない
**解決方法**:
1. スプレッドシートを再読み込み
2. Apps Scriptでコードが保存されているか確認
3. ブラウザのキャッシュをクリア

### 問題2: エラー「シート "xxx" が見つかりません」
**解決方法**:
1. シート名が正確に一致しているか確認（大文字小文字も含む）
2. `sheets_structure.md`と照合

### 問題3: ダイアログが表示されない
**解決方法**:
1. Dialog.htmlが正しく保存されているか確認
2. Apps Scriptの実行ログでエラーを確認
3. ブラウザの開発者ツール（F12）でコンソールエラーを確認

### 問題4: リストボックスに項目が表示されない
**解決方法**:
1. マスタシートにデータが登録されているか確認
2. データの形式が正しいか確認（IDと名前が必須）
3. ブラウザの開発者ツール（F12）のコンソールでエラーを確認

## 📝 次のステップ

セットアップが完了したら：

1. `USER_MANUAL.md`を読んで、システムの使い方を理解する
2. テストデータで各機能を試す
3. `DEVELOPMENT_LOG.md`を読んで、システムの技術的な詳細を理解する

## 🔗 関連ドキュメント

- **`README.md`**: プロジェクトの概要
- **`USER_MANUAL.md`**: ユーザー向け操作マニュアル
- **`DEVELOPMENT_LOG.md`**: 開発履歴と技術的な詳細
- **`sheets_structure.md`**: シート構造の詳細

---

**セットアップで問題が発生した場合**: `DEVELOPMENT_LOG.md`のトラブルシューティングセクションを参照してください。

