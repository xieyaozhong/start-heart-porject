# NOCTUA 暗夜天體觀測台

NOCTUA 是可獨立運作的候選天體推演網站。它依使用者輸入的徑向速度、凌日深度、母恆星質量與軌道參數，估算未被直接觀測天體的最低質量、半徑、半長軸、平衡溫度、類型機率與可能天球位置。

網站不會呼叫 GPT、OpenAI API 或其他生成式 AI 服務，也不需要 ChatGPT 帳號。所有推算公式都在瀏覽器內執行；候選紀錄與測試命名訂單則儲存在 Cloudflare D1。

## 功能

- 徑向速度、凌日及聯合擬合三種推演模式
- 候選天體質量、半徑、軌道與溫度估算
- 星體類型機率與模型信心
- Canvas 預測星圖與縮放控制
- D1 候選紀錄庫
- 私人紀念命名方案、測試訂單與登錄證書
- 桌面及行動裝置響應式介面

> 科學推演結果不等同正式天文發現；紀念命名不是國際天文聯合會（IAU）的官方命名。

## 本機執行

需要 Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
```

## 驗證

```bash
npm test
```

## 資料庫

資料表定義位於 `db/schema.ts`，遷移檔位於 `drizzle/`。修改結構後執行：

```bash
npm run db:generate
```

## 部署

專案採用 vinext 與 Cloudflare Workers 相容的 ESM 輸出。部署環境需要將 `.openai/hosting.json` 內的邏輯 `DB` 綁定對應到 D1 資料庫。
