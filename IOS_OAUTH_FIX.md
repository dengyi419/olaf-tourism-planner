# iOS App OAuth 登录回调修复指南

## 问题描述

在 iOS app 中点击登录后，会先跳到浏览器（Safari），登录完成后不会自动跳回 app。

## 解决方案

### 1. ✅ 已完成：在 Info.plist 中添加 URL Scheme

已在 `ios/App/App/Info.plist` 中添加了 URL Scheme 配置：
- URL Scheme: `olafplanner://`

### 2. ✅ 已完成：修改登录页面

已修改 `app/auth/signin/page.tsx`，添加了：
- 检测是否在 Capacitor iOS 环境中的函数
- 如果在 iOS app 中，使用特殊的 callback URL：`/auth/callback?redirect=...`

### 3. ✅ 已完成：创建回调处理页面

已创建 `app/auth/callback/page.tsx`，用于：
- 处理 OAuth 回调
- 检测登录状态
- 在 iOS app 中自动重定向到目标页面

### 4. ⚠️ 需要手动配置：Google OAuth 回调 URI

**重要：** 需要在 Google Cloud Console 中添加回调 URI。

#### 步骤：

1. **前往 Google Cloud Console**
   - 网址：https://console.cloud.google.com/
   - 使用您的 Google 账号登录

2. **选择项目**
   - 点击顶部的项目选择器
   - 选择您的项目（用于 OAuth 的项目）

3. **进入凭据页面**
   - 左侧菜单：**「API 和服务」** → **「凭据」**

4. **编辑 OAuth 2.0 客户端 ID**
   - 找到您的 OAuth 2.0 客户端 ID
   - 点击该凭据的名称或右侧的编辑图标（铅笔图标）

5. **添加授权的重定向 URI**
   
   在 **「授权的重定向 URI」** 区块中，点击 **「+ 新增 URI」**，然后添加：

   ```
   https://www.ihaveatree.shop/auth/callback
   ```

   或者如果您的域名没有 www：

   ```
   https://ihaveatree.shop/auth/callback
   ```

   **建议同时添加两个（以防万一）：**
   ```
   https://www.ihaveatree.shop/auth/callback
   https://ihaveatree.shop/auth/callback
   ```

6. **保存更改**
   - 点击底部的 **「储存」** 按钮
   - 等待几秒钟让更改生效

### 5. 测试步骤

1. **同步 Capacitor 配置**
   ```bash
   cd /Users/dengyi/travelgenie
   npx cap sync ios
   ```
   这会同步最新的配置到 iOS 项目

2. **在 Xcode 中重新构建并运行 app**
   - 打开 Xcode
   - 选择你的 iPhone 作为运行目标
   - 点击运行按钮（`Cmd + R`）

3. **测试登录流程**
   - 在 app 中点击登录按钮
   - 应该会打开 Safari 浏览器
   - 完成 Google 登录
   - 登录完成后，Safari 会尝试使用 URL Scheme (`olafplanner://`) 跳回 app
   - App 应该会自动打开并显示主页面

### 6. 如果仍然无法跳回 app

如果登录完成后仍然停留在浏览器中，可能需要：

1. **检查 URL Scheme 是否正确配置**
   - 在 Xcode 中打开项目
   - 选择项目 → TARGETS → App → Info 标签
   - 确认 "URL Types" 中有 `olafplanner` scheme

2. **检查 Capacitor 配置**
   - 确认 `capacitor.config.ts` 中的 `appId` 是 `com.dengyi.olafplanner`
   - 确认 `server.url` 指向正确的网站

3. **手动测试 URL Scheme**
   - 在 Safari 中打开：`olafplanner://test`
   - 如果 app 能够打开，说明 URL Scheme 配置正确

4. **查看控制台日志**
   - 在 Xcode 中查看控制台输出
   - 检查是否有错误信息

## 技术说明

### URL Scheme 工作原理

1. 当用户在 iOS app 中点击登录时，会打开 Safari 浏览器
2. 用户在 Safari 中完成 Google OAuth 登录
3. Google 重定向到 `/auth/callback` 页面
4. 回调页面检测到登录成功后，在 Capacitor WebView 中会自动返回到 app
5. 由于 app 使用的是线上网站（`server.url`），WebView 会直接显示回调页面，然后重定向到目标页面

### 为什么不需要手动处理 URL Scheme 跳转？

由于 Capacitor 配置中使用了 `server.url: 'https://www.ihaveatree.shop'`，app 实际上是在 WebView 中加载线上网站。当 OAuth 回调完成后，WebView 会自动显示回调页面，然后通过 JavaScript 重定向到目标页面，整个过程都在同一个 WebView 中完成，不需要手动跳转。

## 注意事项

- 确保 Google OAuth 回调 URI 配置正确
- 确保网站可以正常访问（`https://www.ihaveatree.shop`）
- 如果修改了 `appId`，需要同步更新 `Info.plist` 中的 URL Scheme

