'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';
import BudgetHeader from '@/components/BudgetHeader';
import DaySection from '@/components/DaySection';
import { Plus, Home, Save, FileDown, History, Share2 } from 'lucide-react';
import { Activity, DayItinerary } from '@/types';

export default function PlanPage() {
  const router = useRouter();
  const { itinerary, tripSettings, getTodaySpent, setItinerary, setTripSettings, addDay, updateActivity, setExtraExpenses, getTotalSpent } = useTravelStore();
  const { updateCurrentTrip, saveCurrentTrip, savedTrips, loadTrip, clearCurrentTrip } = useStorageStore();
  const [selectedDayForMap, setSelectedDayForMap] = useState<number | null>(null);
  const [showTripSelection, setShowTripSelection] = useState(false);
  
  // 初始設定表單狀態
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(50000);
  const [currency, setCurrency] = useState('TWD');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditingName, setIsEditingName] = useState(false);
  
  // AI 規劃相關狀態
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [days, setDays] = useState(3);
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const hasSettings = !!tripSettings;
  const hasItinerary = itinerary.length > 0;

  // 自動儲存（包含名稱）
  useEffect(() => {
    if (tripSettings && itinerary.length > 0) {
      updateCurrentTrip(tripSettings, itinerary);
      // 同時更新 currentTrip 的名稱（優先使用 tripName，然後是 currentTrip.name，最後才是默認值）
      const currentTrip = useStorageStore.getState().currentTrip;
      const name = tripName.trim() || currentTrip?.name || tripSettings.destination || '我的行程';
      if (currentTrip && currentTrip.name !== name) {
        useStorageStore.setState({
          currentTrip: {
            ...currentTrip,
            name,
          },
        });
      }
    }
  }, [tripSettings, itinerary, tripName, updateCurrentTrip]);
  
  // 載入行程時同步名稱
  useEffect(() => {
    const currentTrip = useStorageStore.getState().currentTrip;
    if (currentTrip?.name && !tripName) {
      setTripName(currentTrip.name);
    }
  }, [tripName]);

  // 同步 tripSettings.startDate 到 startDate state
  useEffect(() => {
    if (tripSettings?.startDate) {
      setStartDate(tripSettings.startDate);
    }
  }, [tripSettings?.startDate]);

  const handleSaveSettings = () => {
    if (!tripName.trim()) {
      alert('請輸入行程名稱');
      return;
    }
    if (!destination.trim()) {
      alert('請輸入目的地');
      return;
    }
    if (!startDate) {
      alert('請選擇旅遊開始日期');
      return;
    }
    const settings = {
      totalBudget: budget,
      destination,
      currency,
      startDate,
    };
    setTripSettings(settings);
    // 更新行程日期和 dayId（重新編號，確保連續）
    const updatedItinerary = itinerary.map((day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + index);
      return {
        ...day,
        dayId: index + 1, // 重新編號，確保連續
        date: dayDate.toISOString().split('T')[0],
      };
    });
    setItinerary(updatedItinerary);
    updateCurrentTrip(settings, updatedItinerary);
    // 更新 currentTrip 的名稱
    const name = tripName.trim() || `行程 ${new Date().toLocaleDateString('zh-TW')}`;
    const currentTrip = useStorageStore.getState().currentTrip;
    if (currentTrip) {
      useStorageStore.setState({
        currentTrip: {
          ...currentTrip,
          name,
        },
      });
    }
  };

  const handleAddDay = () => {
    const newDayId = itinerary.length > 0 ? Math.max(...itinerary.map(d => d.dayId)) + 1 : 1;
    // 使用設定的開始日期，如果沒有則使用今天
    const baseDate = tripSettings?.startDate || new Date().toISOString().split('T')[0];
    const baseDateObj = new Date(baseDate);
    const newDay: DayItinerary = {
      dayId: newDayId,
      date: new Date(baseDateObj.getTime() + (newDayId - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activities: [],
    };
    addDay(newDay);
  };

  const handleSave = () => {
    if (tripSettings && itinerary.length > 0) {
      const name = tripName.trim() || `行程 ${new Date().toLocaleDateString('zh-TW')}`;
      saveCurrentTrip(name, tripSettings, itinerary);
      alert('行程已儲存！');
    }
  };

  const handleLoadHistoryTrip = (tripId: string) => {
    loadTrip(tripId);
    const trip = savedTrips.find(t => t.id === tripId);
    if (trip) {
      setTripSettings(trip.settings);
      setItinerary(trip.itinerary);
      // 載入行程名稱
      if (trip.name) {
        setTripName(trip.name);
      }
      // 載入開始日期
      if (trip.settings.startDate) {
        setStartDate(trip.settings.startDate);
      }
      setShowTripSelection(false);
    }
  };

  const handleCreateNewTrip = async () => {
    // 如果有當前行程且未保存，先自動保存（強制生成新 ID，避免覆蓋舊行程）
    if (tripSettings && itinerary.length > 0) {
      try {
        // 檢查當前行程是否已經在 savedTrips 中
        const { savedTrips, currentTrip } = useStorageStore.getState();
        const isAlreadySaved = currentTrip?.id && savedTrips.some(t => t.id === currentTrip.id);
        
        const name = tripName.trim() || useStorageStore.getState().currentTrip?.name || `行程 ${new Date().toLocaleDateString('zh-TW')}`;
        if (!isAlreadySaved) {
          // 如果還沒保存過，強制生成新 ID 保存，避免覆蓋
          await saveCurrentTrip(name, tripSettings, itinerary, true);
          console.log('已自動保存舊行程（新 ID）');
        } else {
          // 如果已經保存過，更新現有行程
          await saveCurrentTrip(name, tripSettings, itinerary, false);
          console.log('已更新舊行程');
        }
      } catch (error) {
        console.error('自動保存舊行程失敗:', error);
      }
    }
    
    // 清除當前行程狀態（但保留已保存的行程列表）
    clearCurrentTrip();
    setItinerary([]);
    setTripSettings(null);
    setShowTripSelection(false);
    // 重置表單狀態
    setTripName('');
    setDestination('');
    setBudget(50000);
    setCurrency('TWD');
    setStartDate(new Date().toISOString().split('T')[0]);
    // 確保可以重新創建行程
    setShowTripSelection(false);
  };

  const handleClearCurrentTrip = () => {
    if (confirm('確定要清除當前行程並返回選擇畫面嗎？')) {
      clearCurrentTrip();
      setItinerary([]);
      setTripSettings(null);
      setShowTripSelection(false);
      // 重置表單狀態
      setDestination('');
      setBudget(50000);
      setCurrency('TWD');
    }
  };

  const handleShareTrip = async () => {
    if (!tripSettings || itinerary.length === 0) {
      alert('沒有行程可以分享');
      return;
    }

    setIsGeneratingShare(true);
    try {
      const currentTrip = useStorageStore.getState().currentTrip;
      const tripNameValue = tripName.trim() || currentTrip?.name || tripSettings.destination || '我的行程';
      
      const response = await fetch('/api/share-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip?.id,
          name: tripNameValue,
          settings: tripSettings,
          itinerary,
        }),
      });

      if (!response.ok) {
        throw new Error('生成分享連結失敗');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      
      // 複製到剪貼板
      await navigator.clipboard.writeText(data.shareUrl);
      alert('分享連結已複製到剪貼板！');
    } catch (error) {
      console.error('Error sharing trip:', error);
      alert('生成分享連結失敗，請重試');
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleExportPDF = async () => {
    if (!tripSettings || itinerary.length === 0) {
      alert('沒有行程可以匯出');
      return;
    }

    try {
      // 動態導入 jspdf 和 html2canvas
      // @ts-ignore - 動態導入，可能未安裝
      const jsPDF = (await import('jspdf')).default;
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default;

      // 創建一個臨時的 HTML 元素來生成 PDF 內容
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 寬度
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = '#f5f5dc';
      tempDiv.style.fontFamily = "'Press Start 2P', 'Courier New', monospace";
      tempDiv.style.fontSize = '12px';
      tempDiv.style.color = '#000000';
      document.body.appendChild(tempDiv);

      // 構建 HTML 內容
      const totalSpent = getTotalSpent();
      let htmlContent = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <img src="/logo.png" alt="Logo" style="width: 48px; height: 48px; margin-right: 10px; border: 2px solid #000;" onerror="this.style.display='none'" />
            <h1 style="margin: 0; font-size: 18px; font-weight: bold;">Olaf tourism planner</h1>
          </div>
          <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>目的地:</strong> ${tripSettings.destination}</p>
            <p style="margin: 5px 0;"><strong>總預算:</strong> ${tripSettings.currency} ${tripSettings.totalBudget.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>已花費:</strong> ${tripSettings.currency} ${totalSpent.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>剩餘預算:</strong> ${tripSettings.currency} ${(tripSettings.totalBudget - totalSpent).toLocaleString()}</p>
          </div>
        </div>
      `;

      // 每一天的行程
      itinerary.forEach((day) => {
        htmlContent += `
          <div style="margin-bottom: 20px; border-top: 2px solid #000; padding-top: 15px;">
            <h2 style="margin: 0 0 10px 0; font-size: 14px;">第 ${day.dayId} 天</h2>
            ${day.date ? `<p style="margin: 5px 0; font-size: 10px;">日期: ${new Date(day.date).toLocaleDateString('zh-TW')}</p>` : ''}
        `;

        if (day.activities.length > 0) {
          day.activities.forEach((activity) => {
            htmlContent += `
              <div style="margin: 10px 0; padding-left: 10px;">
                <p style="margin: 5px 0; font-weight: bold;">${activity.time} - ${activity.locationName}</p>
                ${activity.description ? `<p style="margin: 5px 0; font-size: 10px;">${activity.description}</p>` : ''}
                <p style="margin: 5px 0; font-size: 10px;">花費: ${tripSettings.currency} ${activity.actualCost.toLocaleString()}</p>
              </div>
            `;
          });
        } else {
          htmlContent += `<p style="margin: 5px 0; font-size: 10px; padding-left: 10px;">尚無行程</p>`;
        }

        if (day.extraExpenses && day.extraExpenses > 0) {
          htmlContent += `
            <div style="margin: 10px 0; padding-left: 10px; border-top: 1px solid #000; padding-top: 10px;">
              <p style="margin: 5px 0; font-weight: bold;">額外消費: ${tripSettings.currency} ${day.extraExpenses.toLocaleString()}</p>
            </div>
          `;
        }

        htmlContent += `</div>`;
      });

      tempDiv.innerHTML = htmlContent;

      // 等待圖片載入
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 使用 html2canvas 將 HTML 轉換為圖片
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#f5f5dc',
        useCORS: true,
        logging: false,
      });

      // 清理臨時元素
      document.body.removeChild(tempDiv);

      // 創建 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 寬度 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // A4 高度 (mm)
      let heightLeft = imgHeight;
      let position = 0;

      // 添加第一頁
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果內容超過一頁，添加更多頁面
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 儲存 PDF
      const fileName = `${tripSettings.destination}_行程_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('匯出 PDF 時發生錯誤，請確認已安裝必要的套件 (jspdf, html2canvas)');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      <BudgetHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: '120px' }}>
        {!hasSettings ? (
          <div className="max-w-2xl mx-auto">
            {showTripSelection ? (
              <div className="pixel-card p-6">
                <h1 className="text-xl mb-6">選擇行程</h1>
                <div className="space-y-4">
                  {savedTrips.length > 0 ? (
                    <>
                      {savedTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="pixel-card p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleLoadHistoryTrip(trip.id)}
                        >
                          <h3 className="text-sm font-bold mb-2">{trip.name}</h3>
                          <p className="text-xs opacity-70">
                            目的地: {trip.settings.destination} | 
                            預算: {trip.settings.currency} {trip.settings.totalBudget.toLocaleString()} | 
                            {trip.itinerary.length} 天
                          </p>
                          <p className="text-xs opacity-70 mt-1">
                            更新時間: {new Date(trip.updatedAt).toLocaleString('zh-TW')}
                          </p>
                        </div>
                      ))}
                      <button
                        onClick={handleCreateNewTrip}
                        className="pixel-button w-full py-3 text-sm"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        創建新行程
                      </button>
                      <button
                        onClick={() => setShowTripSelection(false)}
                        className="pixel-button w-full py-3 text-sm"
                      >
                        返回
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs mb-4">還沒有儲存的行程</p>
                      <button
                        onClick={() => setShowTripSelection(false)}
                        className="pixel-button px-6 py-3 text-sm"
                      >
                        創建新行程
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="pixel-card p-6">
                <h1 className="text-xl mb-6">開始規劃您的旅程</h1>
                
                <div className="space-y-4 mb-6">
                  <button
                    onClick={() => setShowTripSelection(true)}
                    className="pixel-button w-full py-4 text-sm"
                  >
                    <History className="w-4 h-4 inline mr-2" />
                    修改歷史行程
                  </button>
                  
                  <button
                    onClick={handleCreateNewTrip}
                    className="pixel-button w-full py-4 text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    自行創建行程
                  </button>
                </div>

                <div className="space-y-4">
                <div>
                  <label className="block text-xs mb-2">行程名稱 *</label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="例如：2024 東京之旅"
                    className="pixel-input w-full px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-2">目的地 *</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="例如：東京、台北、首爾"
                    className="pixel-input w-full px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-2">旅遊開始日期 *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pixel-input w-full px-4 py-2"
                    // 移除 min 限制，允許選擇過去的日期
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-2">總預算 *</label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                      min="0"
                      className="pixel-input w-full px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-2">貨幣</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="pixel-input w-full px-4 py-2"
                    >
                      <option value="TWD">TWD</option>
                      <option value="USD">USD</option>
                      <option value="JPY">JPY</option>
                      <option value="KRW">KRW</option>
                      <option value="CNY">CNY</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                  <button
                    onClick={handleSaveSettings}
                    className="pixel-button w-full py-3 text-sm"
                  >
                    開始規劃
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tripName || useStorageStore.getState().currentTrip?.name || ''}
                      onChange={(e) => {
                        setTripName(e.target.value);
                        // 同時更新 currentTrip 的名稱
                        const currentTrip = useStorageStore.getState().currentTrip;
                        if (currentTrip) {
                          useStorageStore.setState({
                            currentTrip: {
                              ...currentTrip,
                              name: e.target.value,
                            },
                          });
                        }
                      }}
                      onBlur={() => {
                        setIsEditingName(false);
                        // 保存名稱變更
                        if (tripSettings && itinerary.length > 0) {
                          const name = tripName.trim() || useStorageStore.getState().currentTrip?.name || `行程 ${new Date().toLocaleDateString('zh-TW')}`;
                          updateCurrentTrip(tripSettings, itinerary);
                          // 如果已保存，更新 savedTrips
                          const currentTrip = useStorageStore.getState().currentTrip;
                          if (currentTrip?.id) {
                            const savedTrips = useStorageStore.getState().savedTrips;
                            const tripIndex = savedTrips.findIndex(t => t.id === currentTrip.id);
                            if (tripIndex >= 0) {
                              const updatedTrips = [...savedTrips];
                              updatedTrips[tripIndex] = { ...updatedTrips[tripIndex], name };
                              useStorageStore.setState({ savedTrips: updatedTrips });
                            }
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="pixel-input text-2xl font-bold px-2 py-1"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 
                      className="text-2xl cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={() => setIsEditingName(true)}
                      title="點擊編輯名稱"
                    >
                      {tripName || useStorageStore.getState().currentTrip?.name || tripSettings?.destination || '我的行程'}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="pixel-button px-2 py-1 text-xs"
                      title="編輯名稱"
                    >
                      編輯
                    </button>
                    {hasSettings && hasItinerary && (
                      <>
                        <button
                          onClick={() => router.push('/')}
                          className="pixel-button px-3 py-1.5 text-xs"
                        >
                          <Home className="w-3 h-3 inline mr-1" />
                          主選單
                        </button>
                        <button
                          onClick={handleSave}
                          className="pixel-button px-3 py-1.5 text-xs"
                        >
                          <Save className="w-3 h-3 inline mr-1" />
                          儲存
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="pixel-button px-3 py-1.5 text-xs"
                        >
                          <FileDown className="w-3 h-3 inline mr-1" />
                          匯出 PDF
                        </button>
                        <button
                          onClick={handleShareTrip}
                          disabled={isGeneratingShare}
                          className="pixel-button px-3 py-1.5 text-xs disabled:opacity-50"
                          title="生成分享連結"
                        >
                          <Share2 className="w-3 h-3 inline mr-1" />
                          {isGeneratingShare ? '生成中...' : '分享連結'}
                        </button>
                        <button
                          onClick={handleClearCurrentTrip}
                          className="pixel-button px-3 py-1.5 text-xs"
                          title="清除當前行程並返回選擇畫面"
                        >
                          <History className="w-3 h-3 inline mr-1" />
                          重新選擇
                        </button>
                      </>
                    )}
                  </div>
                )}
                <p className="text-xs mt-1">
                  {itinerary.length > 0 ? `${itinerary.length} 天行程規劃` : '開始新增您的行程'}
                </p>
              </div>
              {/* 日期修改功能 - 移到標題區域外，避免重疊 */}
              {tripSettings?.startDate && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs whitespace-nowrap">開始日期：</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        setStartDate(newStartDate);
                        // 更新 tripSettings 中的 startDate
                        const updatedSettings = {
                          ...tripSettings,
                          startDate: newStartDate,
                        };
                        setTripSettings(updatedSettings);
                        // 更新所有行程的日期和 dayId（重新編號）
                        const updatedItinerary = itinerary.map((day, index) => {
                          const dayDate = new Date(newStartDate);
                          dayDate.setDate(dayDate.getDate() + index);
                          return {
                            ...day,
                            dayId: index + 1, // 重新編號，確保連續
                            date: dayDate.toISOString().split('T')[0],
                          };
                        });
                        setItinerary(updatedItinerary);
                        // 自動保存
                        updateCurrentTrip(updatedSettings, updatedItinerary);
                      }}
                      className="pixel-input px-2 py-1 text-xs"
                      // 移除 min 限制，允許選擇過去的日期
                    />
                </div>
              )}
              <div className="flex gap-3">
                {!hasItinerary && (
                  <button
                    onClick={handleAddDay}
                    className="pixel-button px-4 py-2 text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    新增第一天
                  </button>
                )}
              </div>
            </div>

            {/* 天數選擇器 */}
            {hasItinerary && itinerary.length > 1 && (
              <div className="pixel-card p-4 mb-4">
                <div className="flex gap-2 flex-wrap">
                  {itinerary.map((day) => (
                    <button
                      key={day.dayId}
                      onClick={() => {
                        const element = document.getElementById(`day-${day.dayId}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="pixel-button px-4 py-2 text-sm"
                    >
                      第 {day.dayId} 天
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {hasItinerary ? (
                  <>
                    {itinerary.map((day) => (
                      <div key={day.dayId} id={`day-${day.dayId}`}>
                        <DaySection day={day} />
                      </div>
                    ))}
                    <button
                      onClick={handleAddDay}
                      className="pixel-button w-full py-4 text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      新增一天
                    </button>
                  </>
                ) : (
                  <div className="pixel-card p-8 text-center">
                    <p className="text-xs mb-4">還沒有行程，開始新增吧！</p>
                    <button
                      onClick={handleAddDay}
                      className="pixel-button px-6 py-3 text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      新增第一天行程
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <div className="pixel-card p-4">
                    <h3 className="text-sm mb-4">地圖預覽</h3>
                    <div className="space-y-2">
                      {itinerary.map((day) => (
                        <button
                          key={day.dayId}
                          onClick={() => setSelectedDayForMap(day.dayId === selectedDayForMap ? null : day.dayId)}
                          className={`w-full text-left px-3 py-2 text-xs border-2 ${
                            selectedDayForMap === day.dayId
                              ? 'bg-black border-black'
                              : 'bg-white border-black'
                          }`}
                        >
                          第 {day.dayId} 天 ({day.activities.length} 個行程)
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pixel-card p-4">
                    <h3 className="text-sm mb-4">預算概況</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {itinerary.map((day) => {
                        const daySpent = getTodaySpent(day.dayId);
                        const extraExpenses = day.extraExpenses || 0;

                        return (
                          <div key={day.dayId} className="space-y-3 border-b-2 border-black pb-3 last:border-b-0">
                            <div className="flex justify-between items-center text-sm font-bold">
                              <span>第 {day.dayId} 天</span>
                              <span>
                                {tripSettings?.currency || 'TWD'} {daySpent.toLocaleString()}
                              </span>
                            </div>
                            
                            {/* 行程列表 */}
                            <div className="space-y-2">
                              {day.activities.length > 0 ? (
                                day.activities.map((activity) => (
                                  <div key={activity.id} className="space-y-1">
                                    <div className="text-xs font-bold truncate">
                                      {activity.time} - {activity.locationName}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="text-[10px] whitespace-nowrap">實際花費:</label>
                                      <input
                                        type="number"
                                        value={activity.actualCost || ''}
                                        onChange={(e) => {
                                          const cost = parseFloat(e.target.value) || 0;
                                          updateActivity(day.dayId, activity.id, { actualCost: cost });
                                        }}
                                        placeholder="0"
                                        className="pixel-input flex-1 px-2 py-1 text-[10px]"
                                        min="0"
                                      />
                                      <span className="text-[10px] whitespace-nowrap">
                                        {tripSettings?.currency || 'TWD'}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs opacity-70">尚無行程</div>
                              )}
                            </div>

                            {/* 額外消費 */}
                            <div className="space-y-1 border-t-2 border-black pt-2">
                              <div className="text-xs font-bold">額外消費</div>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] whitespace-nowrap">金額:</label>
                                <input
                                  type="number"
                                  value={extraExpenses || ''}
                                  onChange={(e) => {
                                    const amount = parseFloat(e.target.value) || 0;
                                    setExtraExpenses(day.dayId, amount);
                                  }}
                                  placeholder="0"
                                  className="pixel-input flex-1 px-2 py-1 text-[10px]"
                                  min="0"
                                />
                                <span className="text-[10px] whitespace-nowrap">
                                  {tripSettings?.currency || 'TWD'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

