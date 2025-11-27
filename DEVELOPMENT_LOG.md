# GAS 資材・売上管理システム 開発ログ

## プロジェクト概要
Google Apps Script (GAS) を使用した資材・売上管理システムの開発ログです。

## 開発履歴

### 2024年 - 初期開発・機能追加

#### 1. 数値計算エラーの修正
**日付**: 初期開発時  
**問題**: 商品を製造する処理で、在庫の数量を減らす際にNumエラーが発生  
**原因**: スプレッドシートから取得した値が文字列のまま計算に使用されていた  
**修正内容**:
- `menuManufactureProduct`: `orderQty`を`Number()`で変換し、バリデーションを追加
- `getBOM`: `qty`を`Number()`で変換（変換できない場合は0）
- `updateStock`: `current`と`changeQty`を`Number()`で変換
- `getStock`: 在庫値を`Number()`で変換（変換できない場合は0）
- `menuReceiveMaterial`: `qty`を`Number()`で変換し、バリデーションを追加

**影響範囲**: `Code.gs` - 数値計算を行うすべての関数

---

#### 2. エラーハンドリングの強化
**日付**: 初期開発時  
**目的**: 予期しないエラーを防止し、適切なエラーメッセージを表示  
**追加内容**:
- `getSheet`: シートが見つからない場合にエラーをスロー
- `getListFromSheet`: try-catchでエラーハンドリングを追加
- `updateStock`: try-catchと`matId`のnullチェックを追加
- `getBOM`: try-catchと`prodId`のnullチェックを追加
- `menuReceiveMaterial`, `menuManufactureProduct`, `menuDeliverProduct`: `getActiveRange()`のnullチェックを追加
- `processForm`: 必須項目の存在チェックを追加

**影響範囲**: `Code.gs` - すべての主要な関数

---

#### 3. 商品受注時の在庫確認機能の改善
**日付**: 初期開発時  
**目的**: 商品受注時に在庫を確認し、製造可否を適切に判断  
**変更内容**:
- BOMがない場合も`Shortage`ステータスを設定し、警告メッセージを表示
- 在庫が十分な場合は「在庫確認済み、製造可能」と表示
- 在庫不足の場合は不足資材の詳細を表示

**影響範囲**: `Code.gs` - `processForm`関数（`RECEIVE_PRODUCT`モード）

---

#### 4. 売上記録機能の追加
**日付**: 初期開発時  
**目的**: 商品納品時に売上を記録  
**追加内容**:
- 新しいシート「Sales」を追加（`sheets_structure.md`に記載）
- `SHEET_NAMES`に`SALES`を追加
- `menuDeliverProduct`: 納品時に売上を記録する処理を追加
- `getProductPrice`: 商品の販売価格を取得する関数を追加
- Salesシートの構造: OrderID, Date, ClientName, ProductID, Quantity, UnitPrice, TotalAmount

**影響範囲**: 
- `Code.gs` - `menuDeliverProduct`, `getProductPrice`関数
- `sheets_structure.md` - Salesシートの説明を追加

---

#### 5. 顧客名入力欄の削除
**日付**: 初期開発時  
**目的**: 商品受注時に顧客名の入力を不要にする  
**変更内容**:
- `Dialog.html`: 顧客名の入力欄を削除
- `Code.gs`: `processForm`で顧客名の必須チェックを削除、空文字列として記録
- `menuDeliverProduct`: 顧客名の必須チェックを削除（既存データとの互換性のため）

**影響範囲**: 
- `Dialog.html` - フォーム構造の変更
- `Code.gs` - `processForm`, `menuDeliverProduct`関数

---

#### 6. 製造業者選択機能の追加
**日付**: 初期開発時  
**目的**: 商品を製造する際に製造業者を選択できるようにする  
**追加内容**:
- 新しいシート「Manufacturers」を追加（`sheets_structure.md`に記載）
- `SHEET_NAMES`に`MANUFACTURERS`を追加
- `Product_Orders`シートにG列（Manufacturer）を追加
- `menuManufactureProduct`: 製造業者選択ダイアログを表示するように変更
- `processManufacture`: 製造業者選択後の処理を実行する関数を追加
- `getManufacturerName`: 製造業者IDから製造業者名を取得する関数を追加
- `getDialogData`: 製造業者選択モード（`MANUFACTURE_PRODUCT`）に対応
- `Dialog.html`: 製造業者選択モードに対応（数量選択を非表示）

**影響範囲**: 
- `Code.gs` - 複数の関数を追加・修正
- `Dialog.html` - モード別の表示制御を追加
- `sheets_structure.md` - ManufacturersシートとProduct_Ordersシートの説明を追加

---

#### 7. Salesシートに製造業者を記録する機能の追加
**日付**: 初期開発時  
**目的**: 納品時に売上に関与した製造業者を記録  
**追加内容**:
- `sheets_structure.md`: SalesシートにH列（Manufacturer）を追加
- `menuDeliverProduct`: Product_OrdersシートのG列から製造業者IDを取得し、Salesシートに記録
- 完了メッセージに製造業者名を表示

**影響範囲**: 
- `Code.gs` - `menuDeliverProduct`関数
- `sheets_structure.md` - Salesシートの構造を更新

---

#### 8. Shortage状態の自動解決機能の追加
**日付**: 初期開発時  
**目的**: 資材を受け取った時点で、Shortage状態の受注が製造可能になったら自動的にOrderedに戻す  
**追加内容**:
- `checkAndResolveShortageOrders`: Shortage状態の受注をチェックし、在庫が十分になったらOrderedに戻す関数を追加
- `menuReceiveMaterial`: 資材受け取り後に`checkAndResolveShortageOrders`を呼び出し
- 解決された受注IDをメッセージに表示

**影響範囲**: `Code.gs` - `menuReceiveMaterial`, `checkAndResolveShortageOrders`関数

---

#### 9. BOM登録フォームの追加
**日付**: 初期開発時  
**目的**: BOMを簡単に登録できるフォームを追加  
**追加内容**:
- メニューに「6. BOMを登録する」を追加
- `openBOMDialog`: BOM登録ダイアログを表示する関数を追加
- `registerBOM`: BOMを登録する関数を追加（複数の資材を一度に登録可能、重複チェック機能付き）
- `getDialogData`: BOM登録モード（`REGISTER_BOM`）に対応
- `Dialog.html`: BOM登録フォームを追加
  - 商品選択（リストボックス）
  - 資材選択（リストボックス、最大8点まで追加可能）
  - 必要数入力（数値入力）
  - 資材追加ボタン（動的にフィールドを追加）
  - 各資材フィールドに削除ボタン

**機能詳細**:
- 1つの商品に対して最大8点まで資材を登録可能
- 既に同じ商品IDと資材IDの組み合わせが存在する場合は更新、存在しない場合は新規登録
- 登録結果をメッセージで表示（新規登録件数、更新件数、各資材の詳細）

**影響範囲**: 
- `Code.gs` - 複数の関数を追加・修正
- `Dialog.html` - BOM登録フォームとJavaScript関数を追加
- `sheets_structure.md` - Manufacturersシートの説明を追加

---

#### 10. BOM検索機能の改善
**日付**: 初期開発時  
**問題**: BOMが登録されているのに「BOMが登録されていません」というエラーが発生  
**原因**: 商品IDの比較で空白文字や型の違いによる不一致  
**修正内容**:
- `getBOM`: 商品IDを文字列に正規化（空白を削除、文字列に変換）して比較
- BOMシートの商品IDも正規化して比較
- 資材IDと数量の検証を追加
- デバッグ用ログを追加

**影響範囲**: `Code.gs` - `getBOM`関数

---

#### 11. リストボックスの修正
**日付**: 初期開発時  
**問題**: 各モードでリストボックスに項目が表示されない  
**原因**: 
- BOM登録モードで商品選択リストが設定されていない
- 商品受注モードで商品リストが設定されていない
- 資材発注モードで資材リストが設定されていない（処理が重複していた）
- 製造業者選択モードで製造業者リストが設定されていない

**修正内容**:
- 各モードでリストボックスを正しく設定するように修正
- `ORDER_MATERIAL`: 資材リストを設定
- `RECEIVE_PRODUCT`: 商品リストを設定
- `MANUFACTURE_PRODUCT`: 製造業者リストを設定
- `REGISTER_BOM`: 商品リストを設定（setTimeoutでDOM更新を待つ）
- 重複していた処理を削除
- デバッグ用の確認処理を追加

**影響範囲**: `Dialog.html` - `init`関数

---

#### 12. BOM登録フォームのUI改善
**日付**: 初期開発時  
**目的**: BOM登録フォームの使いやすさを向上  
**変更内容**:
- 資材選択のリストボックスを大きく（flex: 3）
- 削除ボタンを小さく（padding: 6px 10px, width: 60px）
- レイアウトの比率を調整（資材選択:必要数:削除ボタン = 3:1:固定幅）

**影響範囲**: `Dialog.html` - `addBomMaterialField`関数内のHTML

---

## 技術的な詳細

### 使用している技術
- Google Apps Script (GAS)
- HTML/CSS/JavaScript
- Google Sheets API

### 主要な設計パターン
- PropertiesServiceを使用したモード管理
- ダイアログベースのUI
- エラーハンドリングとバリデーション

### データフロー
1. メニューから機能を選択
2. ダイアログを表示（モードに応じて異なるフォーム）
3. ユーザーが入力
4. GAS側でデータを処理
5. スプレッドシートに記録
6. 結果をメッセージで表示

### シート構造
- Materials: 資材マスタ
- Products: 商品マスタ
- BOM: 部品表
- Material_Orders: 資材発注ログ
- Product_Orders: 商品受注ログ（G列にManufacturerを追加）
- Sales: 売上ログ（H列にManufacturerを追加）
- Manufacturers: 製造業者マスタ

---

#### 13. 納期回答書作成機能の実装（手動メニュー方式）
**日付**: 2024年  
**目的**: 商品受注時に納期回答書を手動で作成できる機能を追加  
**追加内容**:
- メニューに「7. 納期回答書を作成する」を追加
- 納期回答書作成用のダイアログを追加（受注日選択）
- `getOrderDatesList()`: Product_Ordersシートから受注日のリストを取得（重複なし、降順）
- `getOrdersByDate()`: 指定した受注日の受注データを取得
- `createDeliveryResponseDocument()`: 複数受注を集計して納期回答書を作成（A4横フォーマット）
- 商品受注時の自動生成処理を削除（手動作成方式に変更）

**機能詳細**:
- 受注日を選択すると、その日のすべての受注を集計
- A4横（11.69インチ × 8.27インチ）で納期回答書を作成
- 納期回答書の内容:
  - 回答日、受注日
  - 受注一覧テーブル（発注番号、商品番号、商品名、数量、納期）
  - 合計数量、受注件数
  - 備考
- ドライブの「納期回答書」フォルダに自動保存

**影響範囲**: 
- `Code.gs` - メニュー追加、納期回答書作成関数の実装
- `Dialog.html` - 納期回答書作成用ダイアログの追加

---

#### 14. 発注番号の桁数変更（6桁→7桁）
**日付**: 2024年  
**目的**: 相手先の発注番号を6桁から7桁に変更  
**変更内容**:
- `Code.gs`: `processForm`関数内のバリデーションを`^[0-9]{6}$`から`^[0-9]{7}$`に変更
- `Dialog.html`: 発注番号入力欄の`pattern`属性と`maxlength`属性を7桁に変更
- `Dialog.html`: JavaScriptのバリデーションとエラーメッセージを7桁に更新
- `sheets_structure.md`: ドキュメントを7桁に更新

**影響範囲**: 
- `Code.gs` - `processForm`関数
- `Dialog.html` - 商品受注フォーム
- `sheets_structure.md` - ドキュメント更新

---

#### 15. 商品番号入力時の自動補完機能の改善
**日付**: 2024年  
**目的**: 商品番号を入力した際に商品名が自動選択されない問題を修正  
**変更内容**:
- `Dialog.html`: `onProductNumberInput`関数を改善
  - 商品番号を6桁にパディング（先頭0を保持）
  - 商品番号の比較時に両方を6桁にパディングして比較
  - 商品名リストボックスの選択処理を改善
- `Dialog.html`: フォーム送信時に商品名が空の場合、商品番号から商品名を自動取得する処理を追加

**影響範囲**: 
- `Dialog.html` - 商品受注フォームの自動補完機能

---

#### 16. Productsシート構造の変更対応
**日付**: 2024年  
**目的**: Productsシートに伝票単価列（D列）を追加し、商品番号をE列に移動  
**変更内容**:
- `Code.gs`: `getProductListForOrder`関数で商品番号の取得を`values[i][3]`（D列）から`values[i][4]`（E列）に変更
- `Code.gs`: `getProductIdByNumber`関数で商品番号の検索を`data[i][3]`（D列）から`data[i][4]`（E列）に変更
- `sheets_structure.md`: Productsシートの構造を更新
  - A列: ProductID
  - B列: ProductName
  - C列: SellingPrice
  - D列: 伝票単価（新規追加）
  - E列: ProductNumber

**影響範囲**: 
- `Code.gs` - 商品番号を参照する関数
- `sheets_structure.md` - ドキュメント更新

---

#### 17. 資材発注時に受領予定日を入力できる機能の追加
**日付**: 2024年  
**目的**: 資材発注時に受領予定日を入力できるようにする  
**追加内容**:
- `Dialog.html`: 資材発注フォームに「受領予定日」の日付入力欄を追加
- `Dialog.html`: 資材発注モードでのみ受領予定日フィールドを表示
- `Code.gs`: `processForm`関数で受領予定日を受け取り、Material_OrdersシートのF列（後にG列に変更）に記録
- `sheets_structure.md`: Material_Ordersシートの構造を更新（F列にExpectedReceiptDateを追加）

**影響範囲**: 
- `Code.gs` - `processForm`関数
- `Dialog.html` - 資材発注フォーム
- `sheets_structure.md` - ドキュメント更新

---

#### 18. 資材発注時に資材名を記録する機能の追加
**日付**: 2024年  
**目的**: 資材発注時に資材IDの隣に資材名を記録する  
**追加内容**:
- `Code.gs`: `getMaterialName`関数を追加（資材IDから資材名を取得）
- `Code.gs`: `processForm`関数で資材発注時に資材名を取得し、Material_OrdersシートのD列に記録
- `Code.gs`: `menuReceiveMaterial`関数の列番号を修正
  - Status: E列（5列目）→ F列（6列目）
  - Quantity: D列（4列目）→ E列（5列目）
- `sheets_structure.md`: Material_Ordersシートの構造を更新
  - D列にMaterialName（資材名）を追加
  - 以降の列が1列ずつシフト

**影響範囲**: 
- `Code.gs` - `processForm`関数、`menuReceiveMaterial`関数、`getMaterialName`関数追加
- `sheets_structure.md` - ドキュメント更新

---

## 今後の改善案

1. 在庫アラート機能（在庫が一定数以下になったら通知）
2. レポート機能（売上集計、在庫状況など）
3. データエクスポート機能
4. バックアップ・復元機能
5. ユーザー権限管理

---

## 注意事項

- すべてのシートが正しく作成されている必要があります（`sheets_structure.md`を参照）
- 数値データは文字列として取得される可能性があるため、常に`Number()`で変換しています
- エラーハンドリングを追加しているため、予期しないエラーが発生した場合も適切に処理されます
- 納期回答書作成にはGoogle Drive APIの権限が必要です

---

## バージョン情報

- **バージョン**: 1.2
- **最終更新日**: 2024年
- **主要機能**: 資材管理、商品管理、BOM管理、売上管理、製造業者管理、納期回答書作成

### バージョン1.2の主な変更点
1. 資材発注機能を複数品目対応に拡張（最大10品目）
2. 資材発注機能のバグ修正（数量チェック、変数重複宣言）

### バージョン1.1の主な変更点
1. 発注番号を6桁から7桁に変更
2. 商品番号入力時の自動補完機能を改善
3. Productsシート構造の変更に対応（伝票単価列の追加）
4. 資材発注時に受領予定日を入力可能に
5. 資材発注時に資材名を自動記録

---

#### 19. 資材発注機能の拡張（複数品目対応）
**日付**: 2024年  
**目的**: 資材発注を1品目から最大10品目まで一度に発注できるようにする  
**追加内容**:
- `Dialog.html`: 資材発注フォームを複数品目対応に変更
  - 資材選択と数量入力のフィールドを動的に追加可能（最大10品目）
  - 各品目に削除ボタンを追加
  - 「資材を追加 (+)」ボタンで品目を追加
  - `addMaterialOrderField()`関数を追加
  - `updateMaterialOrderFieldNumbers()`関数を追加
  - `updateMaterialOrderAddButton()`関数を追加
- `Code.gs`: `processForm`関数で複数の資材発注データを受け取る処理に変更
  - 各資材ごとに個別の発注IDを生成
  - 各資材をMaterial_Ordersシートに記録
  - 発注完了メッセージに発注件数と発注IDを表示
- 数量チェックの処理順序を修正（資材発注モードでは`form.materialOrders`配列を使用）

**機能詳細**:
- 1回の操作で最大10品目の資材を発注可能
- 各資材ごとに個別の発注IDが生成される
- 受領予定日は全品目で共通
- BOM登録フォームと同様のUIデザイン

**影響範囲**: 
- `Code.gs` - `processForm`関数
- `Dialog.html` - 資材発注フォーム、JavaScript関数追加

---

#### 20. 資材発注機能のバグ修正
**日付**: 2024年  
**問題**: 
- 資材発注時に「数量が指定されていません」というエラーが発生
- 商品受注モードで`qty`変数が重複宣言される構文エラーが発生

**原因**: 
- 資材発注モードでも全モード共通の数量チェックが実行されていた
- 商品受注モードの処理で`qty`変数が2回宣言されていた

**修正内容**:
- `Code.gs`: 資材発注モードの処理を数量チェックの前に移動
- `Code.gs`: 商品受注モードの重複した数量チェックを削除
- 数量チェックは商品受注モードでのみ実行するように変更

**影響範囲**: 
- `Code.gs` - `processForm`関数
