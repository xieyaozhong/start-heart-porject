# NOCTUA 暗夜天體觀測台

NOCTUA 是可獨立運作的候選星系推演、發布與私人紀念登錄平台。網站不會呼叫 GPT、OpenAI API 或其他生成式 AI 服務，也不需要 ChatGPT 帳號。

## 公開前台

- 太陽系尺度的互動式星系視野
- 依軌道週期與參考曆元計算的即時行星位置
- 可點選行星查看類型、成分、大氣、環境狀態及生物條件預測
- 最新發布候選星系列表
- 動態命名方案與登錄申請
- 已確認持有者可用專屬編號開啟個人化恆星體系動畫

## 管理後台

- 獨立管理密碼及 8 小時安全工作階段
- 手動執行候選星系推算
- 審核、發布或撤下候選星系
- 設定每日、每週或每月排程，以及是否自動發布
- 建立、啟用或停用命名方案
- 確認訂單並核發唯一登錄編號

## 排程

`.github/workflows/scheduled-inference.yml` 會每日呼叫受 `CRON_SECRET` 保護的排程端點。後台設定仍會判斷實際推算頻率，避免在尚未到期時重複執行。

GitHub 儲存庫需要設定 `NOCTUA_CRON_SECRET`，部署環境需要設定相同的 `CRON_SECRET`，並另外設定：

- `ADMIN_PASSWORD_HASH`：管理密碼的 SHA-256 十六進位摘要
- `SESSION_SECRET`：工作階段 HMAC 密鑰

## 資料與部署

星系、行星、推算紀錄、命名方案、訂單與登錄資料均儲存在 Cloudflare D1。資料表位於 `db/schema.ts`，遷移檔位於 `drizzle/`。

```bash
npm install
npm run dev
npm test
npm run db:generate
```

專案使用 vinext，輸出 Cloudflare Workers 相容的 ESM。自訂網域可指向正式部署站點，不影響前後台或排程功能。

> 所有天體資料都是依合成訊號與物理近似式產生的模型候選體，不等同正式天文發現。私人紀念命名不是國際天文聯合會（IAU）的官方命名。
