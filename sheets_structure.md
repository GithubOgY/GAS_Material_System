# Google スプレッドシート構成設定

新しいスプレッドシートを作成し、以下の7つのシート（タブ）を、指定された名前と列で作成してください。

## 1. シート名: `Materials` (資材マスタ)
原材料のマスターリストです。

| A列 | B列 | C列 | D列 |
| :--- | :--- | :--- | :--- |
| **MaterialID** | **MaterialName** | **Unit** | **CurrentStock** |
| (資材ID) | (資材名) | (単位) | (現在在庫) |
| M001 | 木材 | kg | 0 |
| M002 | 鉄 | kg | 0 |

## 2. シート名: `Products` (商品マスタ)
販売する商品のマスターリストです。

| A列 | B列 | C列 | D列（オプション） |
| :--- | :--- | :--- | :--- |
| **ProductID** | **ProductName** | **SellingPrice** | **ProductNumber** |
| (商品ID) | (商品名) | (販売価格) | (商品番号、6桁の数字) |
| P001 | 椅子 | 5000 | 012345 |
| P002 | テーブル | 12000 | 123456 |

**注意**: D列（ProductNumber）はオプションです。商品番号を管理する場合は追加してください。D列がない場合、商品IDを商品番号として扱います。

## 3. シート名: `BOM` (部品表)
各商品に必要な資材を定義します。

| A列 | B列 | C列 |
| :--- | :--- | :--- |
| **ProductID** | **MaterialID** | **QuantityRequired** |
| (商品ID) | (資材ID) | (必要数) |
| P001 | M001 | 2 |
| P001 | M002 | 1 |
| P002 | M001 | 5 |

## 4. シート名: `Material_Orders` (資材発注ログ)
資材の発注と受領の記録です。

| A列 | B列 | C列 | D列 | E列 |
| :--- | :--- | :--- | :--- | :--- |
| **OrderID** | **Date** | **MaterialID** | **Quantity** | **Status** |
| (発注ID) | (日付) | (資材ID) | (数量) | (状態) |
| MO-1001 | 2023-11-01 | M001 | 10 | Received |

*   **Status (状態)** の値: `Ordered` (発注済), `Received` (受領済)

## 5. シート名: `Product_Orders` (商品受注ログ)
顧客からの注文記録です。

| A列 | B列 | C列 | D列 | E列 | F列 | G列 | H列 | I列 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OrderID** | **Date** | **ClientOrderNumber** | **ProductNumber** | **ProductName** | **Quantity** | **DeliveryDate** | **Status** | **Manufacturer** |
| (受注ID) | (受注日) | (相手先の発注番号、6桁) | (商品番号、6桁) | (商品名) | (数量) | (納期) | (状態) | (製造業者ID) |
| PO-2001 | 2023-11-05 | 123456 | 012345 | 椅子 | 1 | 2023-11-20 | Delivered | MFG001 |

*   **Status (状態)** の値: `Ordered` (受注), `Shortage` (資材不足), `Manufactured` (製造済), `Delivered` (納品済)
*   **ClientOrderNumber**: お客様から提供される発注番号（6桁の数字）
*   **ProductNumber**: お客様から提供される商品番号（6桁の数字、一桁目が0になることがある）
*   **ProductName**: お客様から提供される商品名
*   **DeliveryDate**: お客様から提供される納期
*   **Manufacturer**: 製造業者ID（製造時に自動記録）

## 6. シート名: `Sales` (売上ログ)
商品納品時の売上記録です。

| A列 | B列 | C列 | D列 | E列 | F列 | G列 | H列 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OrderID** | **Date** | **ClientName** | **ProductID** | **Quantity** | **UnitPrice** | **TotalAmount** | **Manufacturer** |
| (受注ID) | (納品日) | (顧客名) | (商品ID) | (数量) | (単価) | (合計金額) | (製造業者ID) |
| PO-2001 | 2023-11-05 | Client A | P001 | 1 | 5000 | 5000 | MFG001 |

## 7. シート名: `Manufacturers` (製造業者マスタ)
製造業者のマスターリストです。

| A列 | B列 |
| :--- | :--- |
| **ManufacturerID** | **ManufacturerName** |
| (製造業者ID) | (製造業者名) |
| MFG001 | 製造業者A |
| MFG002 | 製造業者B |

