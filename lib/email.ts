// Email 發送功能
// 使用 Resend 服務發送郵件

interface SendWelcomeEmailParams {
  email: string;
  name?: string | null;
}

// 發送歡迎郵件
export async function sendWelcomeEmail({ email, name }: SendWelcomeEmailParams) {
  // 檢查是否配置了 Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('[sendWelcomeEmail] RESEND_API_KEY 未設置，跳過發送郵件');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  // 檢查是否配置了發送者 email
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  try {
    // 動態導入 Resend（避免在沒有配置時報錯）
    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    const userName = name || '用戶';
    const appName = 'Olaf Tourism Planner';
    const appUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

    // 創建 HTML 郵件內容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>歡迎使用 ${appName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f5f5dc; border: 2px solid #000; padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000; margin: 0; font-size: 24px;">🎉 歡迎使用 ${appName}！</h1>
            </div>
            
            <div style="background-color: #fff; border: 2px solid #000; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0;">親愛的 ${userName}，</p>
              
              <p style="margin: 0 0 15px 0;">
                感謝您註冊使用 ${appName}！我們很高興您加入我們的旅遊規劃社群。
              </p>
              
              <p style="margin: 0 0 15px 0;">
                <strong>${appName}</strong> 是一個強大的旅遊行程規劃工具，幫助您：
              </p>
              
              <ul style="margin: 0 0 15px 0; padding-left: 20px;">
                <li>📝 自行規劃詳細的旅遊行程</li>
                <li>🤖 使用 AI 智能推薦行程</li>
                <li>📊 追蹤和管理旅遊預算</li>
                <li>🗺️ 查看行程路線地圖</li>
                <li>📤 分享行程給同行友人</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}" 
                   style="display: inline-block; background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border: 2px solid #000; font-weight: bold;">
                  開始規劃您的旅程
                </a>
              </div>
              
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
                如果您有任何問題或建議，歡迎隨時聯繫我們。
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #000;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                此郵件由 ${appName} 自動發送，請勿回覆。
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // 發送郵件
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `歡迎使用 ${appName}！`,
      html: htmlContent,
    });

    if (error) {
      console.error('[sendWelcomeEmail] 發送郵件失敗:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }

    console.log('[sendWelcomeEmail] 郵件發送成功:', { email, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('[sendWelcomeEmail] 發送郵件時發生錯誤:', error?.message || error);
    if (error?.stack) {
      console.error('[sendWelcomeEmail] 錯誤堆棧:', error.stack);
    }
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

