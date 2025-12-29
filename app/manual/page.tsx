'use client';

import { useRouter } from 'next/navigation';
import { Home, Map, Wand2, History, Sparkles, Plane, Settings, BookOpen } from 'lucide-react';

export default function ManualPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f5dc] pt-28">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-2xl font-bold">使用手冊</h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="pixel-button px-4 py-2 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回主選單
          </button>
        </div>

        <div className="pixel-card p-6 space-y-8">
          {/* 歡迎說明 */}
          <div>
            <h2 className="text-xl font-bold mb-4">歡迎使用 Olaf tourism planner</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              Olaf tourism planner 是一個結合 AI 智能排程、地圖整合與記帳管理的旅遊規劃工具。
              本手冊將幫助您了解每個功能的用途和使用方式。
            </p>
          </div>

          {/* 功能說明 */}
          <div className="space-y-6">
            {/* 1. 自行規劃行程 */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Map className="w-5 h-5" />
                <h3 className="text-lg font-bold">自行規劃行程</h3>
              </div>
              <div className="pl-7 space-y-2 text-sm">
                <p><strong>功能說明：</strong>讓您手動建立和編輯旅遊行程，完全掌控每個細節。</p>
                <p><strong>主要功能：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>新增和編輯每天的活動（時間、地點、描述、預估費用）</li>
                  <li>為每個活動設定類別（美食、交通、觀光、購物）</li>
                  <li>自動計算活動之間的距離和交通費用</li>
                  <li>設定行程名稱和出發日期</li>
                  <li>修改出發日期後，後續日期會自動調整</li>
                  <li>新增活動時，時間會自動遞增 1 小時</li>
                  <li>在活動之間添加交通費用欄位</li>
                  <li>查看每天的預算概況和實際花費</li>
                  <li>匯出整個行程為 PDF</li>
                </ul>
                <p><strong>使用方式：</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>點擊「自行規劃行程」進入規劃頁面</li>
                  <li>選擇「修改歷史行程」或「自行創建行程」</li>
                  <li>輸入行程名稱和出發日期</li>
                  <li>點擊「新增活動」為每一天添加行程</li>
                  <li>使用地點自動完成功能輸入地點（會顯示前 5 個最可能的結果）</li>
                  <li>填寫活動時間、描述、預估費用等資訊</li>
                  <li>在右側預算概況中輸入實際花費</li>
                  <li>點擊「儲存行程」保存您的規劃</li>
                </ol>
              </div>
            </div>

            {/* 2. AI推薦行程 */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-5 h-5" />
                <h3 className="text-lg font-bold">AI推薦行程</h3>
              </div>
              <div className="pl-7 space-y-2 text-sm">
                <p><strong>功能說明：</strong>使用 Google Gemini AI 根據您的需求自動生成完整的旅遊行程。</p>
                <p><strong>主要功能：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>輸入目的地、天數、預算，AI 自動生成行程</li>
                  <li>支援上傳圖片或圖片連結，AI 會分析並加入相關地點</li>
                  <li>可以指定排除的地點（這些地點不會出現在行程中）</li>
                  <li>AI 會確保總花費接近預算的 90%</li>
                  <li>自動生成 Google Maps 路線圖</li>
                  <li>每個活動都包含預估費用和類別</li>
                </ul>
                <p><strong>使用方式：</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>點擊「AI推薦行程」進入 AI 規劃頁面</li>
                  <li>輸入行程名稱、目的地、天數、預算、貨幣</li>
                  <li>（選填）上傳圖片或輸入圖片連結</li>
                  <li>（選填）輸入旅遊偏好和排除地點</li>
                  <li>點擊「生成行程」，等待 AI 處理</li>
                  <li>生成完成後，可以進入「自行規劃行程」頁面進行編輯</li>
                </ol>
                <p className="text-xs opacity-70 mt-2">
                  <strong>注意：</strong>使用此功能前，請先在「API 設定」頁面設定您的 Gemini API Key。
                </p>
              </div>
            </div>

            {/* 3. 查看歷史行程 */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-5 h-5" />
                <h3 className="text-lg font-bold">查看歷史行程</h3>
              </div>
              <div className="pl-7 space-y-2 text-sm">
                <p><strong>功能說明：</strong>查看和管理所有已保存的旅遊行程。</p>
                <p><strong>主要功能：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>查看所有已保存的行程列表</li>
                  <li>顯示每個行程的總花費和旅行距離</li>
                  <li>點擊行程可以載入並編輯</li>
                  <li>刪除不需要的行程</li>
                  <li>根據系統日期自動標示「當前行程」</li>
                </ul>
                <p><strong>使用方式：</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>點擊「查看歷史行程」進入歷史頁面</li>
                  <li>在左側列表查看所有行程</li>
                  <li>點擊行程名稱載入該行程</li>
                  <li>點擊「刪除」按鈕刪除行程</li>
                  <li>載入後可以進入「自行規劃行程」頁面進行編輯</li>
                </ol>
              </div>
            </div>

            {/* 4. 利用RAG技術編排行程 */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-bold">利用RAG技術編排行程</h3>
              </div>
              <div className="pl-7 space-y-2 text-sm">
                <p><strong>功能說明：</strong>上傳旅遊相關文件（PDF、圖片、文字檔），AI 會使用 RAG（檢索增強生成）技術從文件中提取資訊並生成行程。</p>
                <p><strong>主要功能：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>支援上傳 PDF、圖片（JPEG/PNG/WEBP）、文字檔（TXT/MD/JSON）</li>
                  <li>AI 自動解析文件內容（PDF 和圖片使用 OCR）</li>
                  <li>使用 RAG 技術檢索文件中與行程相關的資訊</li>
                  <li>優先使用文件中的地點、餐廳、景點等資訊</li>
                  <li>整合 Hugging Face embeddings 進行智能檢索（可選）</li>
                </ul>
                <p><strong>使用方式：</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>點擊「利用RAG技術編排行程」進入 RAG 規劃頁面</li>
                  <li>輸入行程基本資訊（名稱、目的地、天數、預算等）</li>
                  <li>選擇並上傳旅遊相關文件</li>
                  <li>點擊「上傳並解析」，等待 AI 處理文件</li>
                  <li>（選填）輸入旅遊偏好和排除地點</li>
                  <li>點擊「生成行程」，AI 會根據文件內容生成行程</li>
                </ol>
                <p className="text-xs opacity-70 mt-2">
                  <strong>注意：</strong>使用此功能前，請先在「API 設定」頁面設定您的 Gemini API Key。
                  如需更精確的檢索，可以設定 Hugging Face API Token（可選）。
                </p>
              </div>
            </div>

            {/* 5. 查詢航班信息 */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Plane className="w-5 h-5" />
                <h3 className="text-lg font-bold">查詢航班信息</h3>
              </div>
              <div className="pl-7 space-y-2 text-sm">
                <p><strong>功能說明：</strong>查詢航班的詳細資訊，包括出發/抵達時間、延誤狀態、登機門、行李轉盤等。</p>
                <p><strong>主要功能：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>輸入航班編號查詢航班資訊</li>
                  <li>選擇查詢日期（今天或未來日期）</li>
                  <li>顯示出發/抵達機場、城市、時間</li>
                  <li>顯示延誤狀態和實際時間</li>
                  <li>顯示航廈、登機門、報到櫃檯、行李轉盤</li>
                  <li>顯示機型、行李資訊、航班擴展資訊（Wi-Fi、腿部空間等）</li>
                  <li>顯示 Google Maps 機場路線圖</li>
                </ul>
                <p><strong>使用方式：</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>點擊「查詢航班信息」打開查詢視窗</li>
                  <li>輸入航班編號（例如：CI100、BR101、JX123）</li>
                  <li>選擇查詢日期（只能選擇今天或未來日期）</li>
                  <li>點擊「查詢航班資訊」</li>
                  <li>查看詳細的航班資訊和地圖</li>
                </ol>
                <p className="text-xs opacity-70 mt-2">
                  <strong>注意：</strong>建議在「API 設定」頁面設定 SerpAPI 和 AirLabs API Key 以獲取最完整的資訊。
                  SerpAPI 提供延誤狀態和地圖路線，AirLabs 提供實時航班狀態。
                </p>
              </div>
            </div>

            {/* 6. API設定 */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5" />
                <h3 className="text-lg font-bold">API設定</h3>
              </div>
              <div className="pl-7 space-y-2 text-sm">
                <p><strong>功能說明：</strong>設定各種 API 金鑰以啟用對應的功能。</p>
                <p><strong>可設定的 API Key：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Google Gemini API Key：</strong>用於 AI 行程生成、圖片翻譯、RAG 文件解析</li>
                  <li><strong>Google Maps API Key：</strong>用於地圖顯示、地點自動完成、路線規劃</li>
                  <li><strong>AirLabs API Key：</strong>用於查詢實時航班資訊（登機門、行李轉盤、延誤狀態）</li>
                  <li><strong>SerpAPI API Key：</strong>用於查詢航班延誤狀態和 Google Flights 數據</li>
                  <li><strong>Hugging Face API Token：</strong>用於 RAG 編排行程的文字向量檢索（可選）</li>
                </ul>
                <p><strong>使用方式：</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>點擊「API設定」進入設定頁面</li>
                  <li>在各個欄位輸入對應的 API Key</li>
                  <li>點擊「儲存設定」保存</li>
                  <li>API Key 僅儲存在您的瀏覽器中，不會上傳到伺服器</li>
                </ol>
                <p className="text-xs opacity-70 mt-2">
                  <strong>重要：</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>使用 AI 推薦功能前，必須設定 Gemini API Key</li>
                    <li>使用地圖和地點自動完成功能前，必須設定 Google Maps API Key</li>
                    <li>使用航班查詢功能前，建議設定 SerpAPI 或 AirLabs API Key</li>
                  </ul>
                </p>
              </div>
            </div>
          </div>

          {/* 其他功能 */}
          <div className="border-t-2 border-black pt-6">
            <h3 className="text-lg font-bold mb-3">其他功能</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-bold mb-2">📸 拍照翻譯</h4>
                <p className="opacity-80">
                  在手機版頂部狀態列中，點擊「翻譯」按鈕可以拍照或上傳圖片進行 AI 翻譯。
                  特別適合翻譯路標、餐廳菜單等旅遊相關內容。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">📋 當前行程</h4>
                <p className="opacity-80">
                  在手機版頂部狀態列中，點擊「當前行程」按鈕可以查看當前進行中的行程詳情。
                  系統會根據當前日期自動判斷哪個行程是「當前行程」。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">🌐 多語言支援</h4>
                <p className="opacity-80">
                  點擊右上角的語言選擇器可以切換介面語言，支援繁體中文、英文、日文、韓文。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">💾 資料同步</h4>
                <p className="opacity-80">
                  使用 Google 帳號登入後，您的行程會自動同步到雲端。
                  在不同裝置上登入同一個帳號，可以看到相同的行程資料。
                </p>
              </div>
            </div>
          </div>

          {/* 常見問題 */}
          <div className="border-t-2 border-black pt-6">
            <h3 className="text-lg font-bold mb-3">常見問題</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-bold mb-1">Q: 為什麼 AI 生成的行程天數不對？</h4>
                <p className="opacity-80 ml-4">
                  A: 如果 AI 返回的天數與請求不符，系統會自動補齊或截斷。如果仍有問題，請檢查您的 Gemini API Key 是否正確設定。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1">Q: 為什麼地圖沒有顯示路線？</h4>
                <p className="opacity-80 ml-4">
                  A: 請確認已設定 Google Maps API Key，並且已啟用 Places API、Directions API 和 Geocoding API。
                  某些地區（如中國、韓國）可能無法顯示路線，系統會自動顯示標記點作為替代。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1">Q: 為什麼航班查詢沒有結果？</h4>
                <p className="opacity-80 ml-4">
                  A: 請確認已設定 SerpAPI 或 AirLabs API Key。某些航班可能無法查詢到即時資訊，特別是已落地的航班或未來較遠日期的航班。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1">Q: PDF 上傳後無法解析？</h4>
                <p className="opacity-80 ml-4">
                  A: 請確認 PDF 包含可讀取的文字內容。掃描版的 PDF（只有圖片）可能需要先進行 OCR 處理。
                  建議使用包含文字的 PDF 文件，或將 PDF 轉換為圖片後上傳。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1">Q: 如何將網站加入手機主畫面？</h4>
                <p className="opacity-80 ml-4">
                  A: 在 iPhone Safari 中，點擊分享按鈕 →「加入主畫面」。
                  在 Android Chrome 中，點擊選單 →「加入主畫面」。
                  加入後可以像 App 一樣全螢幕使用。
                </p>
              </div>
            </div>
          </div>

          {/* 返回按鈕 */}
          <div className="border-t-2 border-black pt-6">
            <button
              onClick={() => router.push('/')}
              className="pixel-button w-full py-4 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              返回主選單
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

