/**
 * GAS 資材・売上管理システム
 * 
 * セットアップ手順:
 * 1. sheets_structure.md の説明に従ってシートを作成してください。
 * 2. このコードを「Code.gs」として保存してください。
 * 3. 新しく「Dialog.html」というファイルを作成し、提供されたHTMLコードを貼り付けてください。
 * 4. スプレッドシートを再読み込みするとメニューが表示されます。
 */

// --- 設定 ---
const SHEET_NAMES = {
  MATERIALS: 'Materials',
  PRODUCTS: 'Products',
  BOM: 'BOM',
  MAT_ORDERS: 'Material_Orders',
  PROD_ORDERS: 'Product_Orders',
  SALES: 'Sales',
  MANUFACTURERS: 'Manufacturers'
};

// グローバル変数で一時的にモードを保存 (PropertiesServiceを使用)
const PROP_MODE = 'DIALOG_MODE';
const PROP_MANUFACTURE_ROW = 'MANUFACTURE_ROW';

// --- メニュー設定 ---
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('資材管理システム')
    .addItem('1. 資材を発注する (新規行)', 'openOrderMaterialDialog')
    .addItem('2. 資材を受け取る (選択行)', 'menuReceiveMaterial')
    .addSeparator()
    .addItem('3. 商品を受注する (新規行)', 'openProductOrderDialog')
    .addItem('4. 商品を製造する (選択行)', 'menuManufactureProduct')
    .addItem('5. 商品を納品する (選択行)', 'menuDeliverProduct')
    .addSeparator()
    .addItem('6. BOMを登録する', 'openBOMDialog')
    .addSeparator()
    .addItem('7. 納期回答書を作成する', 'openDeliveryResponseDialog')
    .addToUi();
}

// --- HTMLダイアログ関連 ---

function openOrderMaterialDialog() {
  PropertiesService.getScriptProperties().setProperty(PROP_MODE, 'ORDER_MATERIAL');
  showDialog('資材発注');
}

function openProductOrderDialog() {
  PropertiesService.getScriptProperties().setProperty(PROP_MODE, 'RECEIVE_PRODUCT');
  showDialog('商品受注');
}

function openBOMDialog() {
  PropertiesService.getScriptProperties().setProperty(PROP_MODE, 'REGISTER_BOM');
  showDialog('BOM登録');
}

function openDeliveryResponseDialog() {
  PropertiesService.getScriptProperties().setProperty(PROP_MODE, 'CREATE_DELIVERY_RESPONSE');
  showDialog('納期回答書作成');
}

function showDialog(title) {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(600)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, title);
}

/**
 * HTML側から呼ばれる関数
 * 現在のモードと、プルダウン用のリストデータを返す
 * @return {Object} モードとデータリストを含むオブジェクト
 */
function getDialogData() {
  const mode = PropertiesService.getScriptProperties().getProperty(PROP_MODE);
  let data = [];
  let data2 = [];
  
  try {
    if (mode === 'ORDER_MATERIAL') {
      data = getListFromSheet(SHEET_NAMES.MATERIALS);
    } else if (mode === 'RECEIVE_PRODUCT') {
      // 商品受注モードでは商品情報を取得（商品ID、商品名、商品番号を含む）
      data = getProductListForOrder();
    } else if (mode === 'MANUFACTURE_PRODUCT') {
      data = getListFromSheet(SHEET_NAMES.MANUFACTURERS);
    } else if (mode === 'REGISTER_BOM') {
      data = getListFromSheet(SHEET_NAMES.PRODUCTS);  // 商品リスト
      data2 = getListFromSheet(SHEET_NAMES.MATERIALS); // 資材リスト
    } else if (mode === 'CREATE_DELIVERY_RESPONSE') {
      // 納期回答書作成モードでは受注日のリストを取得
      data = getOrderDatesList();
    }
  } catch (error) {
    Logger.log(`getDialogData エラー: ${error.message}`);
    throw new Error(`データの取得に失敗しました: ${error.message}`);
  }
  
  return { mode: mode, data: data, data2: data2 };
}

/**
 * シートからIDと名前のリストを取得するヘルパー
 * @param {string} sheetName - シート名
 * @return {Array<Object>} IDと名前を含むオブジェクトの配列
 */
function getListFromSheet(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const values = sheet.getDataRange().getValues();
    const list = [];
    
    // 1行目はヘッダーなのでスキップ
    for (let i = 1; i < values.length; i++) {
      const id = values[i][0];
      const name = values[i][1];
      if (id && name) {
        list.push({ id: String(id).trim(), name: String(name).trim() });
      }
    }
    return list;
  } catch (error) {
    Logger.log(`getListFromSheet エラー (${sheetName}): ${error.message}`);
    return [];
  }
}

/**
 * 商品マスタから商品情報を取得する（商品受注用）
 * @return {Array<Object>} 商品ID、商品名、商品番号を含むオブジェクトの配列
 */
function getProductListForOrder() {
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTS);
    const values = sheet.getDataRange().getValues();
    const list = [];
    
    // 1行目はヘッダーなのでスキップ
    for (let i = 1; i < values.length; i++) {
      const productId = values[i][0];
      const productName = values[i][1];
      // 商品番号（E列）がある場合は使用、ない場合は商品IDを使用
      // Productsシート構造: A=ProductID, B=ProductName, C=SellingPrice, D=伝票単価, E=ProductNumber
      const productNumber = values[i][4] ? String(values[i][4]).trim() : String(productId).trim();
      
      if (productId && productName) {
        list.push({
          productId: String(productId).trim(),
          productName: String(productName).trim(),
          productNumber: productNumber
        });
      }
    }
    return list;
  } catch (error) {
    Logger.log(`getProductListForOrder エラー: ${error.message}`);
    return [];
  }
}

/**
 * HTMLフォームから送信されたデータを処理する関数
 * @param {Object} form - フォームデータ
 * @return {Object} 処理結果メッセージ
 */
function processForm(form) {
  if (!form || !form.mode) {
    throw new Error('フォームデータが不正です。');
  }

  if (form.mode === 'CREATE_DELIVERY_RESPONSE') {
    // 納期回答書作成の場合
    if (!form.orderDate) {
      throw new Error('受注日が選択されていません。');
    }
    const result = createDeliveryResponseDocument(form.orderDate);
    return { 
      message: `納期回答書を作成しました。\n受注件数: ${result.orderCount}件\n合計数量: ${result.totalQuantity.toLocaleString()}\n\n${result.documentUrl}` 
    };
  }

  if (form.mode === 'MANUFACTURE_PRODUCT') {
    // 製造業者選択の場合
    if (!form.itemId) {
      throw new Error('製造業者が選択されていません。');
    }
    return processManufacture(form.itemId);
  }

  if (form.mode === 'REGISTER_BOM') {
    // BOM登録の場合
    if (!form.productId) {
      throw new Error('商品が選択されていません。');
    }
    if (!form.materials) {
      throw new Error('資材データが送信されていません。');
    }
    if (!Array.isArray(form.materials)) {
      Logger.log('form.materials:', form.materials);
      throw new Error('資材データの形式が不正です。');
    }
    if (form.materials.length === 0) {
      throw new Error('少なくとも1つの資材を選択してください。');
    }
    return registerBOM(form.productId, form.materials);
  }

  if (form.mode === 'ORDER_MATERIAL') {
    if (!form.materialOrders || !Array.isArray(form.materialOrders) || form.materialOrders.length === 0) {
      throw new Error('資材が選択されていません。');
    }
    
    const sheet = getSheet(SHEET_NAMES.MAT_ORDERS);
    const date = new Date();
    // 受領予定日がある場合は取得、ない場合は空文字列
    const expectedReceiptDate = form.expectedReceiptDate || '';
    
    const orderIds = [];
    let successCount = 0;
    
    // 各資材を発注
    for (const materialOrder of form.materialOrders) {
      if (!materialOrder.materialId || !materialOrder.quantity) {
        continue;
      }
      
      const orderId = generateId('MO');
      const qty = parseInt(materialOrder.quantity);
      
      if (isNaN(qty) || qty <= 0) {
        continue;
      }
      
      // 資材名を取得
      const materialName = getMaterialName(materialOrder.materialId) || '';
      // Material_Ordersシートの構造: OrderID, Date, MaterialID, MaterialName, Quantity, Status, ExpectedReceiptDate
      sheet.appendRow([orderId, date, materialOrder.materialId, materialName, qty, 'Ordered', expectedReceiptDate]);
      orderIds.push(orderId);
      successCount++;
    }
    
    if (successCount === 0) {
      throw new Error('有効な資材発注がありませんでした。');
    }
    
    const receiptDateMsg = expectedReceiptDate ? `\n受領予定日: ${expectedReceiptDate}` : '';
    const orderIdsMsg = orderIds.length <= 3 
      ? orderIds.join(', ') 
      : `${orderIds.slice(0, 3).join(', ')} 他${orderIds.length - 3}件`;
    
    return { message: `発注完了: ${successCount}件\n発注ID: ${orderIdsMsg}${receiptDateMsg}` };
    
  } else if (form.mode === 'RECEIVE_PRODUCT') {
    // 新仕様: 相手先の発注番号、商品番号、商品名、数量、納期を受け取る
    if (!form.clientOrderNumber || !form.productNumber || !form.productName || !form.quantity || !form.deliveryDate) {
      throw new Error('必須項目が入力されていません。');
    }
    
    // バリデーション
    const clientOrderNumber = String(form.clientOrderNumber).trim();
    const productNumber = String(form.productNumber).trim();
    const productName = String(form.productName).trim();
    const qty = parseInt(form.quantity);
    const deliveryDate = form.deliveryDate;
    
    if (!/^[0-9]{7}$/.test(clientOrderNumber)) {
      throw new Error('相手先の発注番号は7桁の数字で入力してください。');
    }
    if (!/^[0-9]{6}$/.test(productNumber)) {
      throw new Error('商品番号は6桁の数字で入力してください。');
    }
    if (isNaN(qty) || qty <= 0) {
      throw new Error('数量が不正です。');
    }
    
    const sheet = getSheet(SHEET_NAMES.PROD_ORDERS);
    const orderId = generateId('PO');
    const date = new Date();
    
    // 商品番号から商品IDを取得（既存機能との互換性のため）
    const productId = getProductIdByNumber(productNumber);
    
    // 在庫チェック（商品IDが取得できた場合のみ）
    let isShortage = false;
    let shortageMsg = "";
    
    if (productId) {
      const bomData = getBOM(productId);
      
      if (bomData.length === 0) {
        // BOMがない場合は製造できないため、Shortageステータスにする
        isShortage = true;
        shortageMsg = `\n- 商品番号 "${productNumber}" のBOM(部品表)が登録されていません。製造前にBOMを登録してください。`;
        Logger.log(`商品受注: 商品番号 "${productNumber}" (商品ID: ${productId}) のBOMが見つかりませんでした。`);
      } else {
        // BOMがある場合、各資材の在庫を確認
        for (const item of bomData) {
          const needed = item.qty * qty;
          const currentStock = getStock(item.matId);
          if (currentStock < needed) {
            isShortage = true;
            shortageMsg += `\n- ${item.matId}: 必要 ${needed}, 在庫 ${currentStock}`;
          }
        }
      }
    } else {
      // 商品IDが取得できない場合は、BOMチェックができないためShortageにする
      isShortage = true;
      shortageMsg = `\n- 商品番号 "${productNumber}" に対応する商品IDが見つかりません。商品マスタを確認してください。`;
    }

    // 在庫が十分な場合は'Ordered'、不足している場合は'Shortage'を設定
    const status = isShortage ? 'Shortage' : 'Ordered';
    
    // Product_Ordersシートの構造: OrderID, Date, ClientOrderNumber, ProductNumber, ProductName, Quantity, DeliveryDate, Status, Manufacturer
    sheet.appendRow([orderId, date, clientOrderNumber, productNumber, productName, qty, deliveryDate, status, '']);

    if (isShortage) {
      return { message: `受注しましたが、製造できません (ステータス: Shortage)${shortageMsg}` };
    } else {
      return { message: `受注完了: ${orderId} (在庫確認済み、製造可能)` };
    }
  } else {
    throw new Error('不正なモードです。');
  }
}

// --- ヘルパー関数 ---

/**
 * シートを取得する
 * @param {string} name - シート名
 * @return {Sheet} シートオブジェクト
 * @throws {Error} シートが見つからない場合
 */
function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`シート "${name}" が見つかりません。シートが正しく作成されているか確認してください。`);
  }
  return sheet;
}

/**
 * 一意のIDを生成する
 * @param {string} prefix - IDのプレフィックス（例: 'MO', 'PO'）
 * @return {string} 生成されたID
 */
function generateId(prefix) {
  return prefix + '-' + new Date().getTime().toString().slice(-6);
}

/**
 * アラートを表示する
 * @param {string} message - 表示するメッセージ
 */
function showAlert(message) {
  SpreadsheetApp.getUi().alert(message);
}

// --- 以下、既存の処理関数 ---

/**
 * 2. 資材を受け取る
 */
function menuReceiveMaterial() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== SHEET_NAMES.MAT_ORDERS) {
    showAlert(SHEET_NAMES.MAT_ORDERS + ' シートの行を選択してください。');
    return;
  }

  const activeRange = sheet.getActiveRange();
  if (!activeRange) {
    showAlert('行を選択してください。');
    return;
  }

  const row = activeRange.getRow();
  if (row < 2) {
    showAlert('データ行を選択してください。');
    return;
  }

  // Material_Ordersシートの構造: OrderID, Date, MaterialID, MaterialName, Quantity, Status, ExpectedReceiptDate
  const status = sheet.getRange(row, 6).getValue(); // F列（Status）
  if (status === 'Received') {
    showAlert('この発注は既に受領済みです。');
    return;
  }

  const matId = sheet.getRange(row, 3).getValue(); // C列（MaterialID）
  if (!matId) {
    showAlert('資材IDが取得できませんでした。');
    return;
  }

  const qty = Number(sheet.getRange(row, 5).getValue()); // E列（Quantity）
  
  if (isNaN(qty) || qty <= 0) {
    showAlert('数量が不正です。');
    return;
  }

  updateStock(matId, qty);

  sheet.getRange(row, 6).setValue('Received'); // F列（Status）
  
  // Shortage状態の受注をチェックして、在庫が十分になったらOrderedに戻す
  const resolvedOrders = checkAndResolveShortageOrders();
  
  let message = `資材を受領しました。${matId} の在庫を更新しました。`;
  if (resolvedOrders.length > 0) {
    message += `\n\n以下の受注の在庫不足が解決され、ステータスを「Ordered」に更新しました:\n`;
    resolvedOrders.forEach(orderId => {
      message += `- ${orderId}\n`;
    });
  }
  
  showAlert(message);
}

/**
 * Shortage状態の受注をチェックし、在庫が十分になったらOrderedに戻す
 * @return {Array<string>} 解決された受注IDのリスト
 */
function checkAndResolveShortageOrders() {
  const resolvedOrders = [];
  
  try {
    const prodOrdersSheet = getSheet(SHEET_NAMES.PROD_ORDERS);
    const data = prodOrdersSheet.getDataRange().getValues();
    
    // 2行目以降をチェック（1行目はヘッダー）
    // 新しい構造: A=OrderID, B=Date, C=ClientOrderNumber, D=ProductNumber, E=ProductName, F=Quantity, G=DeliveryDate, H=Status, I=Manufacturer
    for (let i = 1; i < data.length; i++) {
      const status = data[i][7]; // H列（Status）
      
      // Shortage状態の受注のみチェック
      if (status === 'Shortage') {
        const orderId = data[i][0];
        const productNumber = data[i][3]; // D列（ProductNumber）
        const orderQty = Number(data[i][5]) || 0; // F列（Quantity）
        
        if (!productNumber || orderQty <= 0) {
          continue;
        }
        
        // 商品番号から商品IDを取得
        const prodId = getProductIdByNumber(productNumber);
        if (!prodId) {
          continue;
        }
        
        // BOMを取得
        const bomData = getBOM(prodId);
        if (bomData.length === 0) {
          // BOMがない場合は解決できない
          continue;
        }
        
        // 在庫が十分かチェック
        let isShortage = false;
        for (const item of bomData) {
          const needed = item.qty * orderQty;
          const currentStock = getStock(item.matId);
          if (currentStock < needed) {
            isShortage = true;
            break;
          }
        }
        
        // 在庫が十分になったらOrderedに戻す
        if (!isShortage) {
          prodOrdersSheet.getRange(i + 1, 8).setValue('Ordered'); // H列（Status）
          resolvedOrders.push(orderId);
        }
      }
    }
  } catch (error) {
    Logger.log(`checkAndResolveShortageOrders エラー: ${error.message}`);
  }
  
  return resolvedOrders;
}

/**
 * 4. 商品を製造する
 */
function menuManufactureProduct() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== SHEET_NAMES.PROD_ORDERS) {
    showAlert(SHEET_NAMES.PROD_ORDERS + ' シートの行を選択してください。');
    return;
  }

  const activeRange = sheet.getActiveRange();
  if (!activeRange) {
    showAlert('行を選択してください。');
    return;
  }

  const row = activeRange.getRow();
  if (row < 2) {
    showAlert('データ行を選択してください。');
    return;
  }

  // 新しい構造: A=OrderID, B=Date, C=ClientOrderNumber, D=ProductNumber, E=ProductName, F=Quantity, G=DeliveryDate, H=Status, I=Manufacturer
  const status = sheet.getRange(row, 8).getValue(); // H列（Status）
  
  // Shortageの場合も、在庫が補充されていれば製造可能にするか、
  // あるいは一度Orderedに戻す必要があるか。
  // ここでは「Ordered」または「Shortage」でも、その瞬間に在庫があれば製造OKとする柔軟な仕様にします。
  if (status !== 'Ordered' && status !== 'Shortage') {
    showAlert('製造するにはステータスが "Ordered" または "Shortage" である必要があります。');
    return;
  }

  const productNumber = sheet.getRange(row, 4).getValue(); // D列（ProductNumber）
  if (!productNumber) {
    showAlert('商品番号が取得できませんでした。');
    return;
  }

  // 商品番号から商品IDを取得
  const prodId = getProductIdByNumber(productNumber);
  if (!prodId) {
    showAlert(`商品番号 "${productNumber}" に対応する商品IDが見つかりません。`);
    return;
  }

  const orderQty = Number(sheet.getRange(row, 6).getValue()); // F列（Quantity）
  
  if (isNaN(orderQty) || orderQty <= 0) {
    showAlert('数量が不正です。');
    return;
  }

  const bomData = getBOM(prodId);
  if (bomData.length === 0) {
    showAlert(`商品番号 "${productNumber}" のBOM(部品表)が見つかりません。`);
    return;
  }

  // 在庫チェック
  for (const item of bomData) {
    const needed = item.qty * orderQty;
    const currentStock = getStock(item.matId);
    if (currentStock < needed) {
      showAlert(`${item.matId} の在庫が不足しています。必要数: ${needed}, 現在庫: ${currentStock}`);
      return;
    }
  }

  // 製造業者選択ダイアログを表示
  PropertiesService.getScriptProperties().setProperty(PROP_MANUFACTURE_ROW, row);
  PropertiesService.getScriptProperties().setProperty(PROP_MODE, 'MANUFACTURE_PRODUCT');
  showDialog('製造業者選択');
}

/**
 * 製造業者を選択した後の処理
 * @param {string} manufacturerId - 製造業者ID
 * @return {Object} 処理結果メッセージ
 */
function processManufacture(manufacturerId) {
  const row = parseInt(PropertiesService.getScriptProperties().getProperty(PROP_MANUFACTURE_ROW));
  if (!row || row < 2) {
    throw new Error('行情報が不正です。');
  }

  const sheet = getSheet(SHEET_NAMES.PROD_ORDERS);
  const prodId = sheet.getRange(row, 4).getValue();
  const orderQty = Number(sheet.getRange(row, 5).getValue());

  // 在庫を引き落とす
  const bomData = getBOM(prodId);
  for (const item of bomData) {
    const needed = item.qty * orderQty;
    updateStock(item.matId, -needed);
  }

  // 製造業者名を取得
  const manufacturerName = getManufacturerName(manufacturerId);

  // ステータスと製造業者を更新
  // 新しい構造: A=OrderID, B=Date, C=ClientOrderNumber, D=ProductNumber, E=ProductName, F=Quantity, G=DeliveryDate, H=Status, I=Manufacturer
  sheet.getRange(row, 8).setValue('Manufactured'); // H列（Status）
  sheet.getRange(row, 9).setValue(manufacturerId); // I列（Manufacturer）に製造業者IDを記録

  const manufacturerDisplay = manufacturerName ? `${manufacturerName} (${manufacturerId})` : manufacturerId;
  return { message: `製造完了。資材在庫を引き落としました。製造業者: ${manufacturerDisplay}` };
}

/**
 * 製造業者名を取得する
 * @param {string} manufacturerId - 製造業者ID
 * @return {string|null} 製造業者名、見つからない場合はnull
 */
function getManufacturerName(manufacturerId) {
  if (!manufacturerId) {
    return null;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.MANUFACTURERS);
    const data = sheet.getDataRange().getValues();
    const normalizedId = String(manufacturerId).trim();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === normalizedId) {
        return data[i][1] ? String(data[i][1]).trim() : null;
      }
    }
    return null;
  } catch (error) {
    Logger.log(`getManufacturerName エラー: ${error.message}`);
    return null;
  }
}

/**
 * 5. 商品を納品する
 */
function menuDeliverProduct() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== SHEET_NAMES.PROD_ORDERS) {
    showAlert(SHEET_NAMES.PROD_ORDERS + ' シートの行を選択してください。');
    return;
  }

  const activeRange = sheet.getActiveRange();
  if (!activeRange) {
    showAlert('行を選択してください。');
    return;
  }

  const row = activeRange.getRow();
  if (row < 2) {
    showAlert('データ行を選択してください。');
    return;
  }

  // 新しい構造: A=OrderID, B=Date, C=ClientOrderNumber, D=ProductNumber, E=ProductName, F=Quantity, G=DeliveryDate, H=Status, I=Manufacturer
  const status = sheet.getRange(row, 8).getValue(); // H列（Status）
  if (status !== 'Manufactured') {
    showAlert('納品するにはステータスが "Manufactured" (製造済) である必要があります。');
    return;
  }

  // 受注情報を取得
  const orderId = sheet.getRange(row, 1).getValue();
  const orderDate = sheet.getRange(row, 2).getValue();
  const clientOrderNumber = sheet.getRange(row, 3).getValue() || ''; // C列（相手先の発注番号）
  const productNumber = sheet.getRange(row, 4).getValue(); // D列（商品番号）
  const productName = sheet.getRange(row, 5).getValue() || ''; // E列（商品名）
  const quantity = Number(sheet.getRange(row, 6).getValue()); // F列（Quantity）
  const manufacturerId = sheet.getRange(row, 9).getValue() || ''; // I列（Manufacturer）から製造業者IDを取得

  if (!orderId || !productNumber || isNaN(quantity) || quantity <= 0) {
    showAlert('受注情報が不正です。');
    return;
  }

  // 商品番号から商品IDを取得
  const prodId = getProductIdByNumber(productNumber);
  if (!prodId) {
    showAlert(`商品番号 "${productNumber}" に対応する商品IDが見つかりません。`);
    return;
  }

  // 商品の販売価格を取得
  const unitPrice = getProductPrice(prodId);
  if (unitPrice === null) {
    showAlert(`商品番号 "${productNumber}" の価格情報が見つかりません。`);
    return;
  }

  // 売上金額を計算
  const totalAmount = unitPrice * quantity;

  // 売上を記録
  try {
    const salesSheet = getSheet(SHEET_NAMES.SALES);
    const deliveryDate = new Date();
    // Salesシート: OrderID, Date, ClientName, ProductID, Quantity, UnitPrice, TotalAmount, Manufacturer
    // ClientNameには相手先の発注番号を記録（または商品名を使用）
    const clientName = clientOrderNumber || productName || '';
    salesSheet.appendRow([orderId, deliveryDate, clientName, prodId, quantity, unitPrice, totalAmount, manufacturerId]);
    
    // ステータスを更新
    sheet.getRange(row, 8).setValue('Delivered'); // H列（Status）
    
    // 製造業者名を取得してメッセージに含める
    const manufacturerName = manufacturerId ? getManufacturerName(manufacturerId) : null;
    const manufacturerDisplay = manufacturerId ? (manufacturerName ? `${manufacturerName} (${manufacturerId})` : manufacturerId) : '未設定';
    showAlert(`納品完了。売上 ${totalAmount.toLocaleString()}円 として記録されました。製造業者: ${manufacturerDisplay}`);
  } catch (error) {
    showAlert(`売上記録エラー: ${error.message}`);
  }
}

// --- データ操作ヘルパー ---

/**
 * 資材の在庫を更新する
 * @param {string} matId - 資材ID
 * @param {number} changeQty - 変更数量（正の値で増加、負の値で減少）
 */
function updateStock(matId, changeQty) {
  if (!matId) {
    showAlert('資材IDが指定されていません。');
    return;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.MATERIALS);
    const data = sheet.getDataRange().getValues();
    const normalizedMatId = String(matId).trim();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === normalizedMatId) {
        const current = Number(data[i][3]) || 0;
        const changeQtyNum = Number(changeQty) || 0;
        const newStock = current + changeQtyNum;
        sheet.getRange(i + 1, 4).setValue(newStock);
        return;
      }
    }
    showAlert(`資材ID ${matId} が Materials シートに見つかりません。`);
  } catch (error) {
    Logger.log(`updateStock エラー: ${error.message}`);
    showAlert(`在庫更新エラー: ${error.message}`);
  }
}

/**
 * 資材の在庫数を取得する
 * @param {string} matId - 資材ID
 * @return {number} 在庫数（見つからない場合は0）
 */
function getStock(matId) {
  if (!matId) {
    return 0;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.MATERIALS);
    const data = sheet.getDataRange().getValues();
    const normalizedMatId = String(matId).trim();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === normalizedMatId) {
        return Number(data[i][3]) || 0;
      }
    }
    return 0;
  } catch (error) {
    Logger.log(`getStock エラー: ${error.message}`);
    return 0;
  }
}

/**
 * 商品のBOM（部品表）を取得する
 * @param {string} prodId - 商品ID
 * @return {Array<Object>} BOMデータの配列（matId, qtyを含む）
 */
function getBOM(prodId) {
  if (!prodId) {
    return [];
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.BOM);
    const data = sheet.getDataRange().getValues();
    const bom = [];
    
    // 商品IDを文字列に正規化（空白を削除、文字列に変換）
    const normalizedProdId = String(prodId).trim();
    
    for (let i = 1; i < data.length; i++) {
      // BOMシートの商品IDも正規化して比較
      const bomProdId = data[i][0];
      if (bomProdId && String(bomProdId).trim() === normalizedProdId) {
        const matId = data[i][1];
        const qty = Number(data[i][2]) || 0;
        
        // 資材IDと数量が有効な場合のみ追加
        if (matId && qty > 0) {
          bom.push({
            matId: String(matId).trim(),
            qty: qty
          });
        }
      }
    }
    
    return bom;
  } catch (error) {
    Logger.log(`getBOM エラー: ${error.message}`);
    return [];
  }
}

/**
 * 商品番号から商品IDを取得する
 * @param {string} productNumber - 商品番号（6桁の数字）
 * @return {string|null} 商品ID、見つからない場合はnull
 */
function getProductIdByNumber(productNumber) {
  if (!productNumber) {
    return null;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTS);
    const data = sheet.getDataRange().getValues();
    const normalizedProductNumber = String(productNumber).trim();
    
    // 商品マスタに商品番号の列がある場合（E列を想定）
    // Productsシート構造: A=ProductID, B=ProductName, C=SellingPrice, D=伝票単価, E=ProductNumber
    // もし商品番号の列がない場合は、商品IDを商品番号として扱う
    for (let i = 1; i < data.length; i++) {
      const productId = String(data[i][0]).trim();
      // 商品番号の列がある場合（E列）
      if (data[i][4] && String(data[i][4]).trim() === normalizedProductNumber) {
        return productId;
      }
      // 商品IDが商品番号と一致する場合（後方互換性のため）
      if (productId === normalizedProductNumber) {
        return productId;
      }
    }
    return null;
  } catch (error) {
    Logger.log(`getProductIdByNumber エラー: ${error.message}`);
    return null;
  }
}

/**
 * 資材名を取得する
 * @param {string} matId - 資材ID
 * @return {string|null} 資材名、見つからない場合はnull
 */
function getMaterialName(matId) {
  if (!matId) {
    return null;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.MATERIALS);
    const data = sheet.getDataRange().getValues();
    const normalizedMatId = String(matId).trim();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === normalizedMatId) {
        return data[i][1] ? String(data[i][1]).trim() : null;
      }
    }
    return null;
  } catch (error) {
    Logger.log(`getMaterialName エラー: ${error.message}`);
    return null;
  }
}

/**
 * 商品の販売価格を取得する
 * @param {string} prodId - 商品ID
 * @return {number|null} 商品の販売価格、見つからない場合はnull
 */
function getProductPrice(prodId) {
  if (!prodId) {
    return null;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTS);
    const data = sheet.getDataRange().getValues();
    const normalizedProdId = String(prodId).trim();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === normalizedProdId) {
        const price = Number(data[i][2]);
        return isNaN(price) ? null : price;
      }
    }
    return null;
  } catch (error) {
    Logger.log(`getProductPrice エラー: ${error.message}`);
    return null;
  }
}

/**
 * 納期回答書を作成する（複数受注を集計、A4横）
 * @param {string} orderDate - 受注日（YYYY-MM-DD形式）
 * @return {Object} 作成結果（documentUrlを含む）
 */
function createDeliveryResponseDocument(orderDate) {
  // 指定した受注日の受注データを取得
  const orders = getOrdersByDate(orderDate);
  
  if (orders.length === 0) {
    throw new Error('選択した受注日に受注データが見つかりませんでした。');
  }
  
  // ドライブのルートフォルダに納期回答書フォルダを作成（既に存在する場合は取得）
  const folderName = '納期回答書';
  let folder;
  try {
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
  } catch (error) {
    Logger.log(`フォルダ作成エラー: ${error.message}`);
    folder = DriveApp.getRootFolder();
  }
  
  // 日付フォーマット
  const orderDateObj = new Date(orderDate);
  const orderDateStr = Utilities.formatDate(orderDateObj, Session.getScriptTimeZone(), 'yyyy年MM月dd日');
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy年MM月dd日');
  
  // ドキュメント名を生成
  const docName = `納期回答書_${orderDate}`;
  
  // 新しいGoogle Docsドキュメントを作成
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();
  
  // A4横の設定
  const pageWidth = 11.69; // インチ（A4横）
  const pageHeight = 8.27; // インチ（A4縦）
  body.setPageWidth(pageWidth * 72); // ポイントに変換
  body.setPageHeight(pageHeight * 72);
  
  // 既存のテキストをクリア
  body.clear();
  
  // 納期回答書の内容を作成
  const title = body.appendParagraph('納期回答書');
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  title.setSpacingAfter(20);
  
  // 基本情報
  body.appendParagraph(`回答日: ${todayStr}`).setSpacingAfter(5);
  body.appendParagraph(`受注日: ${orderDateStr}`).setSpacingAfter(20);
  
  // 受注一覧のテーブル
  body.appendParagraph('受注一覧').setHeading(DocumentApp.ParagraphHeading.HEADING2).setSpacingAfter(10);
  
  // テーブルのヘッダー行を作成
  const tableData = [['発注番号', '商品番号', '商品名', '数量', '納期']];
  
  // 受注データをテーブルに追加
  orders.forEach(order => {
    const deliveryDateObj = order.deliveryDate ? new Date(order.deliveryDate) : null;
    const deliveryDateStr = deliveryDateObj ? 
      Utilities.formatDate(deliveryDateObj, Session.getScriptTimeZone(), 'yyyy年MM月dd日') : '';
    
    tableData.push([
      order.clientOrderNumber || '',
      order.productNumber || '',
      order.productName || '',
      order.quantity.toString(),
      deliveryDateStr
    ]);
  });
  
  const table = body.appendTable(tableData);
  
  // テーブルのスタイル設定（A4横に合わせて幅を調整）
  table.setBorderWidth(1);
  const numColumns = table.getNumColumns();
  const columnWidth = (pageWidth * 72 - 100) / numColumns; // ページ幅から余白を引いて列数で割る
  for (let i = 0; i < numColumns; i++) {
    table.setColumnWidth(i, columnWidth);
  }
  
  // ヘッダー行のスタイル
  const headerRow = table.getRow(0);
  headerRow.setBackgroundColor('#e0e0e0');
  for (let i = 0; i < numColumns; i++) {
    headerRow.getCell(i).editAsText().setBold(true);
  }
  
  body.appendParagraph('').setSpacingAfter(20);
  
  // 集計情報
  const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
  body.appendParagraph(`合計数量: ${totalQuantity.toLocaleString()}`).setSpacingAfter(10);
  body.appendParagraph(`受注件数: ${orders.length}件`).setSpacingAfter(20);
  
  // 備考
  body.appendParagraph('備考').setHeading(DocumentApp.ParagraphHeading.HEADING2).setSpacingAfter(10);
  body.appendParagraph('上記の通り、納期をご回答いたします。').setSpacingAfter(20);
  
  // 署名欄
  body.appendParagraph('').setSpacingAfter(10);
  body.appendParagraph('以上').setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  
  // ドキュメントをフォルダに移動
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  
  // ドキュメントを保存
  doc.saveAndClose();
  
  return {
    documentUrl: doc.getUrl(),
    orderCount: orders.length,
    totalQuantity: totalQuantity
  };
}

/**
 * BOMを登録する（複数の資材を一度に登録可能）
 * @param {string} productId - 商品ID
 * @param {Array<Object>} materials - 資材データの配列（materialId, quantityを含む）
 * @return {Object} 登録結果メッセージ
 */
function registerBOM(productId, materials) {
  if (!productId || !materials || !Array.isArray(materials) || materials.length === 0) {
    throw new Error('BOM登録情報が不正です。');
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.BOM);
    const normalizedProdId = String(productId).trim();
    let registeredCount = 0;
    let updatedCount = 0;
    const messages = [];
    
    // 既存のBOMデータを取得
    const data = sheet.getDataRange().getValues();
    
    // 各資材を登録
    for (const material of materials) {
      if (!material || typeof material !== 'object') {
        continue;
      }
      
      const materialId = material.materialId ? String(material.materialId).trim() : '';
      const quantity = material.quantity ? Number(material.quantity) : 0;
      
      if (!materialId || isNaN(quantity) || quantity <= 0) {
        continue;
      }
      
      // 既に同じ商品IDと資材IDの組み合わせが存在するかチェック
      let found = false;
      for (let i = 1; i < data.length; i++) {
        const existingProdId = String(data[i][0]).trim();
        const existingMatId = String(data[i][1]).trim();
        if (existingProdId === normalizedProdId && existingMatId === materialId) {
          // 既存のレコードを更新
          sheet.getRange(i + 1, 3).setValue(quantity);
          updatedCount++;
          messages.push(`更新: ${materialId} (必要数: ${quantity})`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        // 新規登録
        sheet.appendRow([productId, materialId, quantity]);
        registeredCount++;
        messages.push(`登録: ${materialId} (必要数: ${quantity})`);
      }
    }
    
    if (registeredCount === 0 && updatedCount === 0) {
      throw new Error('有効な資材がありませんでした。');
    }
    
    const summary = `商品: ${productId}\n新規登録: ${registeredCount}件, 更新: ${updatedCount}件\n\n${messages.join('\n')}`;
    return { message: `BOMを登録しました。\n\n${summary}` };
  } catch (error) {
    Logger.log(`registerBOM エラー: ${error.message}`);
    throw new Error(`BOM登録エラー: ${error.message}`);
  }
}

/**
 * 受注日のリストを取得する（納期回答書作成用）
 * @return {Array<Object>} 受注日のリスト（id, nameを含む）
 */
function getOrderDatesList() {
  try {
    const sheet = getSheet(SHEET_NAMES.PROD_ORDERS);
    const data = sheet.getDataRange().getValues();
    const dates = new Set();
    
    // 2行目以降をチェック（1行目はヘッダー）
    for (let i = 1; i < data.length; i++) {
      const date = data[i][1]; // B列（Date）
      if (date) {
        // 日付をYYYY-MM-DD形式に変換
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          const dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          dates.add(dateStr);
        }
      }
    }
    
    // 日付を降順でソート
    const sortedDates = Array.from(dates).sort().reverse();
    
    return sortedDates.map(date => ({
      id: date,
      name: date
    }));
  } catch (error) {
    Logger.log(`getOrderDatesList エラー: ${error.message}`);
    return [];
  }
}

/**
 * 指定した受注日の受注データを取得する（納期回答書作成用）
 * @param {string} orderDate - 受注日（YYYY-MM-DD形式）
 * @return {Array<Object>} 受注データの配列
 */
function getOrdersByDate(orderDate) {
  try {
    const sheet = getSheet(SHEET_NAMES.PROD_ORDERS);
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    // 2行目以降をチェック（1行目はヘッダー）
    // 新しい構造: A=OrderID, B=Date, C=ClientOrderNumber, D=ProductNumber, E=ProductName, F=Quantity, G=DeliveryDate, H=Status, I=Manufacturer
    for (let i = 1; i < data.length; i++) {
      const date = data[i][1]; // B列（Date）
      if (date) {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          const dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          if (dateStr === orderDate) {
            orders.push({
              orderId: data[i][0] || '',
              clientOrderNumber: data[i][2] || '',
              productNumber: data[i][3] || '',
              productName: data[i][4] || '',
              quantity: Number(data[i][5]) || 0,
              deliveryDate: data[i][6] || ''
            });
          }
        }
      }
    }
    
    return orders;
  } catch (error) {
    Logger.log(`getOrdersByDate エラー: ${error.message}`);
    return [];
  }
}