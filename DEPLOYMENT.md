# RoomVibe｜我的 AI 居家設計室 - GitHub Pages 免費部署手冊

本專案已完成相容性最佳化，可直接免費用 GitHub Pages 部署上線，提供全世界使用者體驗 3D 日系北歐室內空間設計。

---

## 一、特色與架構說明

1. **純前端無伺服器運行**：
   - 使用 Vite + React + TypeScript + Three.js 構建。
   - 採用相對路徑基底（`base: './'`），在任何 GitHub 網址子路徑（如 `https://<帳號>.github.io/<專案名>/`）皆能正常載入，圖片與 3D 材質零 404 破圖。
2. **免資料庫存檔（LocalStorage + JSON 匯出匯入）**：
   - 瀏覽器自動儲存目前設計。
   - 支援匯出 `.roomvibe.json` 專案檔案，方便跨裝置備份與分享。
3. **無金鑰外洩風險**：
   - 絕不在 GitHub 原始碼或前端環境變數暴露任何 Gemini API Key。
   - 預設提供完整可操作的「日系北歐手動 3D 空間建模模式」。
   - 可選配 Cloudflare Workers（免費額度每天 10 萬次請求）作為安全中繼器。

---

## 二、部署至 GitHub Pages（三步驟完成）

### 步驟 1：建立 GitHub 儲存庫並推送程式碼
在您的本機或 GitHub 上建立一個新的公開（Public）或私有（Private）Repository（例如名為 `roomvibe`），並將專案檔案推送至 `main` 分支：

```bash
git init
git add .
git commit -m "feat: initial RoomVibe 3D app"
git branch -M main
git remote add origin https://github.com/<您的GitHub帳號>/roomvibe.git
git push -u origin main
```

### 步驟 2：開啟 GitHub Pages 的 Actions 部署模式
1. 進入您的 GitHub Repository 頁面。
2. 點擊頂部 **Settings**（設定）分頁。
3. 在左側選單點選 **Pages**。
4. 在 **Build and deployment** > **Source** 下拉選單中：
   - 將原本的 `Deploy from a branch` 切換為 **`GitHub Actions`**。

### 步驟 3：自動建置與發布
- 當您推送代碼至 `main` 分支時，內建的 `.github/workflows/deploy.yml` 將會自動觸發並完成構建。
- 約 1-2 分鐘後，即可在 **Settings > Pages** 看到您的專屬網址：
  👉 `https://<您的GitHub帳號>.github.io/roomvibe/`

---

## 三、設定免費 Cloudflare Worker 啟用 AI 分析（可選）

若希望在 GitHub Pages 上使用 Gemini 圖像分析功能，可透過 Cloudflare Workers 免費代理（免費版每日可處理 100,000 次請求）：

### 步驟 1：部署 Worker
1. 註冊並登入 [Cloudflare 官網](https://dash.cloudflare.com/)。
2. 進入 **Workers & Pages** -> 點擊 **Create Application** -> **Create Worker**。
3. 命名為 `roomvibe-ai-proxy`，點擊 **Deploy**。
4. 點擊 **Edit code**，將本專案目錄下 `cloudflare-worker/worker.js` 的完整內容貼入並儲存（Save and Deploy）。

### 步驟 2：設定 Gemini API Key 密鑰
1. 在該 Worker 頁面進入 **Settings** -> **Variables and Secrets**。
2. 點擊 **Add secret**：
   - Name（變數名稱）：`GEMINI_API_KEY`
   - Value（變數數值）：輸入您的 Google Gemini API Key。
3. 點擊 Save。

### 步驟 3：在 RoomVibe 網站中綁定 Worker
1. 打開您的 GitHub Pages 網站。
2. 點擊右上角「**照片辨識**」按鈕開啟視窗。
3. 點擊右上角的「**API 設定**」，輸入您的 Cloudflare Worker 網址（例如 `https://roomvibe-ai-proxy.<帳號>.workers.dev`）並點擊儲存。
4. 網站將儲存此網址於瀏覽器，即可隨時啟用雲端 AI 辨識分析！

---

## 四、本地開發與測試

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 測試打包構建
npm run build
```
