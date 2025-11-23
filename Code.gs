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

function showDialog(title) {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(400)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, title);
}

/**
 * HTML側から呼ばれる関数。
 * 現在のモードと、プルダウン用のリストデータを返します。
 */
function getDialogData() {
  const mode = PropertiesService.getScriptProperties().getProperty(PROP_MODE);
  let data = [];
  let data2 = [];
  
  if (mode === 'ORDER_MATERIAL') {
    data = getListFromSheet(SHEET_NAMES.MATERIALS);
  } else if (mode === 'RECEIVE_PRODUCT') {
    data = getListFromSheet(SHEET_NAMES.PRODUCTS);
  } else if (mode === 'MANUFACTURE_PRODUCT') {
    data = getListFromSheet(SHEET_NAMES.MANUFACTURERS);
  } else if (mode === 'REGISTER_BOM') {
    data = getListFromSheet(SHEET_NAMES.PRODUCTS);  // 商品リスト
    data2 = getListFromSheet(SHEET_NAMES.MATERIALS); // 資材リスト
  }
  
  return { mode: mode, data: data, data2: data2 };
}

/**
 * シートからIDと名前のリストを取得するヘルパー
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
        list.push({ id: id, name: name });
      }
    }
    return list;
  } catch (error) {
    Logger.log(`getListFromSheet エラー: ${error.message}`);
    return [];
  }
}

/**
 * HTMLフォームから送信されたデータを処理する関数
 */
function processForm(form) {
  if (!form) {
    throw new Error('フォームデータが不正です。');
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

  if (!form.quantity) {
    throw new Error('数量が指定されていません。');
  }
  
  const qty = parseInt(form.quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('数量が不正です。');
  }

  if (form.mode === 'ORDER_MATERIAL') {
    if (!form.itemId) {
      throw new Error('資材が選択されていません。');
    }
    const sheet = getSheet(SHEET_NAMES.MAT_ORDERS);
    const orderId = generateId('MO');
    const date = new Date();
    sheet.appendRow([orderId, date, form.itemId, qty, 'Ordered']);
    return { message: `発注完了: ${orderId}` };
    
  } else if (form.mode === 'RECEIVE_PRODUCT') {
    if (!form.itemId) {
      throw new Error('商品が選択されていません。');
    }
    const sheet = getSheet(SHEET_NAMES.PROD_ORDERS);
    const orderId = generateId('PO');
    const date = new Date();
    
    // 在庫チェック
    const bomData = getBOM(form.itemId);
    let isShortage = false;
    let shortageMsg = "";

    if (bomData.length === 0) {
      // BOMがない場合は製造できないため、Shortageステータスにする
      isShortage = true;
      shortageMsg = `\n- 商品ID "${form.itemId}" のBOM(部品表)が登録されていません。製造前にBOMを登録してください。`;
      Logger.log(`商品受注: 商品ID "${form.itemId}" のBOMが見つかりませんでした。`);
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

    // 在庫が十分な場合は'Ordered'、不足している場合は'Shortage'を設定
    // 顧客名は空文字列として記録
    const status = isShortage ? 'Shortage' : 'Ordered';
    sheet.appendRow([orderId, date, '', form.itemId, qty, status]);

    if (isShortage) {
      return { message: `受注しましたが、製造できません (ステータス: Shortage)${shortageMsg}` };
    } else {
      return { message: `受注完了: ${orderId} (在庫確認済み、製造可能)` };
    }
  } else {
    throw new Error('不正なモードです。');
  }
}

// --- 既存のロジック関数 (変更なし) ---

function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`シート "${name}" が見つかりません。シートが正しく作成されているか確認してください。`);
  }
  return sheet;
}

function generateId(prefix) {
  return prefix + '-' + new Date().getTime().toString().slice(-6);
}

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

  const status = sheet.getRange(row, 5).getValue();
  if (status === 'Received') {
    showAlert('この発注は既に受領済みです。');
    return;
  }

  const matId = sheet.getRange(row, 3).getValue();
  if (!matId) {
    showAlert('資材IDが取得できませんでした。');
    return;
  }

  const qty = Number(sheet.getRange(row, 4).getValue());
  
  if (isNaN(qty) || qty <= 0) {
    showAlert('数量が不正です。');
    return;
  }

  updateStock(matId, qty);

  sheet.getRange(row, 5).setValue('Received');
  
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
    for (let i = 1; i < data.length; i++) {
      const status = data[i][5]; // F列（Status）
      
      // Shortage状態の受注のみチェック
      if (status === 'Shortage') {
        const orderId = data[i][0];
        const prodId = data[i][3]; // D列（ProductID）
        const orderQty = Number(data[i][4]) || 0; // E列（Quantity）
        
        if (!prodId || orderQty <= 0) {
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
          prodOrdersSheet.getRange(i + 1, 6).setValue('Ordered'); // F列（Status）
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

  const status = sheet.getRange(row, 6).getValue();
  
  // Shortageの場合も、在庫が補充されていれば製造可能にするか、
  // あるいは一度Orderedに戻す必要があるか。
  // ここでは「Ordered」または「Shortage」でも、その瞬間に在庫があれば製造OKとする柔軟な仕様にします。
  if (status !== 'Ordered' && status !== 'Shortage') {
    showAlert('製造するにはステータスが "Ordered" または "Shortage" である必要があります。');
    return;
  }

  const prodId = sheet.getRange(row, 4).getValue();
  if (!prodId) {
    showAlert('商品IDが取得できませんでした。');
    return;
  }

  const orderQty = Number(sheet.getRange(row, 5).getValue());
  
  if (isNaN(orderQty) || orderQty <= 0) {
    showAlert('数量が不正です。');
    return;
  }

  const bomData = getBOM(prodId);
  if (bomData.length === 0) {
    showAlert(prodId + ' のBOM(部品表)が見つかりません。');
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
  sheet.getRange(row, 6).setValue('Manufactured');
  sheet.getRange(row, 7).setValue(manufacturerId); // G列に製造業者IDを記録

  const manufacturerDisplay = manufacturerName ? `${manufacturerName} (${manufacturerId})` : manufacturerId;
  return { message: `製造完了。資材在庫を引き落としました。製造業者: ${manufacturerDisplay}` };
}

/**
 * 製造業者名を取得する
 */
function getManufacturerName(manufacturerId) {
  if (!manufacturerId) {
    return null;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.MANUFACTURERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === manufacturerId) {
        return data[i][1] || null;
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

  const status = sheet.getRange(row, 6).getValue();
  if (status !== 'Manufactured') {
    showAlert('納品するにはステータスが "Manufactured" (製造済) である必要があります。');
    return;
  }

  // 受注情報を取得
  const orderId = sheet.getRange(row, 1).getValue();
  const orderDate = sheet.getRange(row, 2).getValue();
  const clientName = sheet.getRange(row, 3).getValue() || ''; // 顧客名は空でも可
  const prodId = sheet.getRange(row, 4).getValue();
  const quantity = Number(sheet.getRange(row, 5).getValue());
  const manufacturerId = sheet.getRange(row, 7).getValue() || ''; // G列から製造業者IDを取得

  if (!orderId || !prodId || isNaN(quantity) || quantity <= 0) {
    showAlert('受注情報が不正です。');
    return;
  }

  // 商品の販売価格を取得
  const unitPrice = getProductPrice(prodId);
  if (unitPrice === null) {
    showAlert(`商品ID ${prodId} の価格情報が見つかりません。`);
    return;
  }

  // 売上金額を計算
  const totalAmount = unitPrice * quantity;

  // 売上を記録
  try {
    const salesSheet = getSheet(SHEET_NAMES.SALES);
    const deliveryDate = new Date();
    // H列に製造業者IDを記録
    salesSheet.appendRow([orderId, deliveryDate, clientName, prodId, quantity, unitPrice, totalAmount, manufacturerId]);
    
    // ステータスを更新
    sheet.getRange(row, 6).setValue('Delivered');
    
    // 製造業者名を取得してメッセージに含める
    const manufacturerName = manufacturerId ? getManufacturerName(manufacturerId) : null;
    const manufacturerDisplay = manufacturerId ? (manufacturerName ? `${manufacturerName} (${manufacturerId})` : manufacturerId) : '未設定';
    showAlert(`納品完了。売上 ${totalAmount.toLocaleString()}円 として記録されました。製造業者: ${manufacturerDisplay}`);
  } catch (error) {
    showAlert(`売上記録エラー: ${error.message}`);
  }
}

// --- データ操作ヘルパー ---

function updateStock(matId, changeQty) {
  if (!matId) {
    showAlert('資材IDが指定されていません。');
    return;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.MATERIALS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === matId) {
        const current = Number(data[i][3]) || 0;
        const changeQtyNum = Number(changeQty) || 0;
        const newStock = current + changeQtyNum;
        sheet.getRange(i + 1, 4).setValue(newStock);
        return;
      }
    }
    showAlert(`資材ID ${matId} が Materials シートに見つかりません。`);
  } catch (error) {
    showAlert(`在庫更新エラー: ${error.message}`);
  }
}

function getStock(matId) {
  const sheet = getSheet(SHEET_NAMES.MATERIALS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === matId) {
      return Number(data[i][3]) || 0;
    }
  }
  return 0;
}

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
    
    // デバッグ用ログ（BOMが見つからない場合）
    if (bom.length === 0) {
      Logger.log(`getBOM: 商品ID "${normalizedProdId}" のBOMが見つかりませんでした。`);
      Logger.log(`BOMシートのデータ行数: ${data.length - 1}`);
    }
    
    return bom;
  } catch (error) {
    Logger.log(`getBOM エラー: ${error.message}`);
    return [];
  }
}

/**
 * 商品の販売価格を取得する
 */
function getProductPrice(prodId) {
  if (!prodId) {
    return null;
  }
  
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === prodId) {
        return Number(data[i][2]) || null;
      }
    }
    return null;
  } catch (error) {
    Logger.log(`getProductPrice エラー: ${error.message}`);
    return null;
  }
}

/**
 * BOMを登録する（複数の資材を一度に登録可能）
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
        Logger.log('無効な資材データ:', material);
        continue;
      }
      
      const materialId = material.materialId ? String(material.materialId).trim() : '';
      const quantity = material.quantity ? Number(material.quantity) : 0;
      
      if (!materialId || isNaN(quantity) || quantity <= 0) {
        Logger.log('無効な資材IDまたは数量:', { materialId, quantity });
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
