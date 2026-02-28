# 🔐 2FA

基于 Cloudflare Workers 的两步验证密钥管理系统。免费部署、全球加速、支持 PWA 离线使用。

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange)

**主要特性：** TOTP/HOTP 验证码自动生成 · 二维码扫描/图片识别添加密钥 · AES-GCM 256 位加密存储 · 从 Google Authenticator、Aegis、2FAS、Bitwarden 等应用批量导入 · 多格式导出（TXT/JSON/CSV/HTML/Google 迁移二维码） · 自动备份与还原 · 深色/浅色主题 · 响应式设计适配手机/平板/桌面

## 📸 截图预览

|                    桌面端                     |                    平板端                    |                    手机端                    |
| :-------------------------------------------: | :------------------------------------------: | :------------------------------------------: |
| ![桌面端](docs/images/screenshot-desktop.png) | ![平板端](docs/images/screenshot-tablet.png) | ![手机端](docs/images/screenshot-mobile.png) |

## 🚀 快速部署

### 在线体验

访问演示站点（密码 `2fa-Demo.`）：**[https://2fa-dev.wzf.workers.dev](https://2fa-dev.wzf.workers.dev)**

### 一键部署（推荐）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wuzf/2fa)

1. 点击上方按钮，使用 GitHub 登录并授权
2. 登录 Cloudflare 账户，点击 **Deploy** 等待部署完成（KV 存储自动创建）
3. 打开 Cloudflare 给你的 Workers 链接，**设置管理密码**即可开始使用

#### 推荐：启用数据加密

部署后，在 **Cloudflare Dashboard → Worker → Settings → Variables** 中添加 Secret `ENCRYPTION_KEY`：

```bash
# 生成加密密钥（任选一种）
openssl rand -base64 32
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> 不配置也可正常使用，但建议配置以加密保护 2FA 密钥数据。

## 📖 使用指南

### 添加密钥

点击右下角 **➕** 悬浮按钮：

- **扫二维码** — 摄像头扫描 2FA 二维码，自动填入
- **选择图片** — 上传二维码截图，自动识别
- **手动添加** — 输入服务名称和 Base32 密钥（可展开高级设置调整位数/周期/算法）

### 日常使用

- **复制验证码**：直接点击验证码数字
- **管理密钥**：点击卡片右上角 **⋯** → 编辑 / 删除 / 查看二维码
- **搜索**：顶部搜索框按服务名或账户名实时搜索
- **排序**：按添加时间或名称排序
- **主题**：右下角 🌓 切换浅色/深色/跟随系统

### 批量导入

点击悬浮按钮 → **📥 批量导入**，支持文件导入或文本粘贴。

**兼容格式：**

| 来源                   | 格式                                    |
| ---------------------- | --------------------------------------- |
| 通用                   | `otpauth://` URI 文本（TXT）、CSV、HTML |
| Google Authenticator   | 迁移二维码（`otpauth-migration://`）    |
| Aegis                  | JSON 导出文件                           |
| 2FAS                   | `.2fas` 导出文件                        |
| Bitwarden              | JSON 导出文件                           |
| LastPass Authenticator | JSON 导出文件                           |
| andOTP                 | JSON 导出文件                           |
| Ente Auth              | 导出文件                                |

### 批量导出

点击悬浮按钮 → **📤 批量导出**，支持 TXT、JSON、CSV、HTML 格式，以及生成 **Google Authenticator 迁移二维码**（可直接扫码导入）。

### 备份与还原

系统自动备份（数据变化后自动触发 + 每天定时检查），保留最近 100 个备份。

点击悬浮按钮 → **🔄 还原配置** 查看备份列表、预览内容、还原或导出。

### GitHub Actions 备份配置

为了让 GitHub Actions 备份工作流正常运行，请在你的 GitHub 仓库设置中配置以下 Secrets：

| Secret 名称 | 说明 | 是否必填 |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | 具有 KV 读取权限的 API 令牌 | **必填** |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare 账户Account Details ID（32位） | **必填** |
| `KV_NAMESPACE_ID` | 你的 KV 命名空间 ID (例如：`863764*c***41f6b*b03*5*0d8d97341`) | **必填** |
| `BACKUP_ENCRYPTION_KEY` | 用于备份文件加密的密码（不填则不加密） | 可选 |
| `S3_ACCESS_KEY_ID` | S3 凭证 | 可选 |
| `S3_SECRET_ACCESS_KEY` | S3 凭证 | 可选 |
| `S3_BUCKET` | S3 配置 | 可选 |
| `S3_REGION` | S3 配置 | 可选 |
| `S3_ENDPOINT` | S3 配置 | 可选 |
| `WEBDAV_URL` | WebDAV 连接信息 | 可选 |
| `WEBDAV_USER` | WebDAV 连接信息 | 可选 |
| `WEBDAV_PASSWORD` | WebDAV 连接信息 | 可选 |
| `GH_BACKUP_TOKEN` | 具有备份仓库写入权限的 PAT (Token) | 可选 |
| `GH_BACKUP_USER` | GitHub 备份用户名 | 可选 |
| `GH_BACKUP_REPO` | GitHub 备份仓库名 | 可选 |

**如何创建 CLOUDFLARE_API_TOKEN 并配置权限：**

1.  登录到你的 Cloudflare Dashboard。
2.  点击右上角的个人图标，选择 **"My Profile"** (我的个人资料)。
3.  在左侧导航栏中，选择 **"API Tokens"** (API 令牌)。
4.  点击 **"Create Token"** (创建令牌)。
5.  选择 **"Create Custom Token"** (创建自定义令牌)。
6.  **令牌名称 (Token Name)**：输入一个易于识别的名称，例如 `2FA-Backup-Action`。
7.  **权限 (Permissions)**：配置以下权限：
    *   **Account (账户)**:
        *   **Workers KV Storage**: `Edit` (或至少 `Read`)
    *   **Zone (区域)**:
        *   **Workers Routes**: `Read`
        *   **Workers Scripts**: `Read`
8.  **客户端 IP 地址过滤 (Client IP Address Filtering)**：保持默认或根据需要配置。
9.  **TTL (Time to Live)**：保持默认或根据需要配置。
10. 点击 **"Continue to summary"** (继续到摘要)。
11. 确认权限无误后，点击 **"Create Token"** (创建令牌)。
12. **复制生成的 API Token**。这个 Token 只会显示一次，请务必妥善保存。
13. 将此 Token 添加到你的 GitHub 仓库 Secrets 中，名称为 `CLOUDFLARE_API_TOKEN`。

---

| **S3 备份相关** | | |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | S3 凭证 | 可选 |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` | S3 配置 | 可选 |

**如何配置 S3 备份：**

1.  **创建 S3 兼容存储**：在 AWS S3、Cloudflare R2、MinIO 等服务中创建一个存储桶。
2.  **获取凭证**：
    *   **`S3_ACCESS_KEY_ID`** 和 **`S3_SECRET_ACCESS_KEY`**：这是你的存储服务的访问密钥和秘密访问密钥。
    *   **`S3_BUCKET`**：你创建的存储桶的名称。
    *   **`S3_REGION`**：存储桶所在的区域（例如 `us-east-1`）。对于 R2，通常是 `auto`。
    *   **`S3_ENDPOINT`**：如果使用 S3 兼容服务（如 R2），需要提供其 API 端点（例如 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`）。AWS S3 通常不需要此项。
3.  将这些凭证和配置作为 GitHub Secrets 添加到你的仓库中。

---

| **WebDAV 备份相关** | | |
| `WEBDAV_URL`, `WEBDAV_USER`, `WEBDAV_PASSWORD` | WebDAV 连接信息 | 可选 |

**如何配置 WebDAV 备份：**

1.  **准备 WebDAV 服务**：你需要一个可用的 WebDAV 服务器，例如自建的 Nextcloud、AList，或者一些支持 WebDAV 的云存储服务。
2.  **获取连接信息**：
    *   **`WEBDAV_URL`**：WebDAV 服务器的完整 URL，例如 `https://dav.example.com/remote.php/webdav/`。
    *   **`WEBDAV_USER`** 和 **`WEBDAV_PASSWORD`**：用于登录 WebDAV 服务器的用户名和密码。
3.  将这些连接信息作为 GitHub Secrets 添加到你的仓库中。

---

| **GitHub 备份相关** | | |
| `GH_BACKUP_TOKEN` | 具有备份仓库写入权限的 PAT (Token) | 可选 |
| `GH_BACKUP_USER`, `GH_BACKUP_REPO` | 备份目标用户名和仓库名 | 可选 |

**如何配置 GitHub 备份：**

1.  **创建备份仓库**：创建一个新的 GitHub 私有仓库，用于存储备份文件。
2.  **生成 Personal Access Token (PAT)**：
    *   前往 GitHub **Settings** (设置) → **Developer settings** (开发者设置) → **Personal access tokens** (个人访问令牌) → **Tokens (classic)**。
    *   点击 **"Generate new token"** (生成新令牌)。
    *   **Note** (备注)：输入一个描述性名称，例如 `2FA-Backup-PAT`。
    *   **Expiration** (有效期)：选择一个合适的有效期。
    *   **Select scopes** (选择范围)：勾选 **`repo`** 权限（这将允许访问私有仓库）。
    *   点击 **"Generate token"** (生成令牌)。
    *   **复制生成的 PAT**。这个 Token 只会显示一次，请务必妥善保存。
3.  **配置 GitHub Secrets**：
    *   **`GH_BACKUP_TOKEN`**：将你生成的 PAT 添加到 GitHub Secrets。
    *   **`GH_BACKUP_USER`**：你的 GitHub 用户名。
    *   **`GH_BACKUP_REPO`**：你创建的备份仓库的名称。
    *   **`GH_BACKUP_DIR`** (可选)：备份文件在仓库中存储的目录，默认为 `2fa-backups`。
4.  将这些信息作为 GitHub Secrets 添加到你的仓库中。

---

### 如何解密并提取备份文件

如果当天存在多份备份，系统会自动将它们打包成一个 `.tar.gz` 文件（如果配置了 `BACKUP_ENCRYPTION_KEY`，则后缀为 `.tar.gz.enc`）。

1.  **解密文件** (仅限已加密的情况)：
    ```bash
    # 将 <encrypted_bundle> 替换为你的备份文件名 (如 2fa_backups_2026-02-28.tar.gz.enc)
    # 将 <password> 替换为你的 BACKUP_ENCRYPTION_KEY 值
    openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 -in <encrypted_bundle> -out backup_bundle.tar.gz -pass pass:<password>
    ```

2.  **解压打包文件**：
    ```bash
    # 解压后你会得到当天所有的 .json 原始备份文件
    tar -xzf backup_bundle.tar.gz
    ```

---

### 安装为手机应用（PWA）

- **iOS**：Safari 打开 → 分享按钮 → 添加到主屏幕
- **Android**：Chrome 打开 → 菜单（⋮）→ 添加到主屏幕

安装后可像原生应用一样全屏使用，支持离线访问。

## 🔒 安全

- **密码**：PBKDF2-SHA256（100,000 次迭代）加盐哈希，JWT 存储在 HttpOnly + Secure + SameSite=Strict Cookie 中
- **数据加密**：配置 `ENCRYPTION_KEY` 后所有密钥和备份使用 AES-GCM 256 位加密
- **传输**：全程 HTTPS，TLS 1.2+
- **隐私**：OTP 在客户端生成，不收集使用数据，完全开源
- **登录有效期**：30 天，活跃使用自动续期（剩余 < 7 天时自动延长 30 天）

## 🔗 公开 OTP API

无需登录，通过 URL 直接生成验证码：

```
https://your-worker.workers.dev/otp/YOUR_SECRET_KEY
https://your-worker.workers.dev/otp/YOUR_SECRET_KEY?digits=8&period=60
https://your-worker.workers.dev/otp/YOUR_SECRET_KEY?type=hotp&counter=5
```

参数：`type`（totp/hotp）、`digits`（6/8）、`period`（30/60/120）、`algorithm`（sha1/sha256/sha512）、`counter`（HOTP 用）

## 📚 更多文档

| 文档                              | 说明                            |
| --------------------------------- | ------------------------------- |
| [部署指南](docs/DEPLOYMENT.md)    | 手动部署、KV 配置、Secrets 管理 |
| [API 参考](docs/API_REFERENCE.md) | 完整 API 端点文档               |
| [架构设计](docs/ARCHITECTURE.md)  | 系统架构与技术实现              |
| [开发指南](docs/DEVELOPMENT.md)   | 本地开发、测试、代码规范        |
| [PWA 指南](docs/PWA_GUIDE.md)     | PWA 安装与离线功能              |

## 🤝 参与贡献

欢迎提交 [Issue](https://github.com/wuzf/2fa/issues) 和 [Pull Request](https://github.com/wuzf/2fa/pulls)。开发相关请参考 [开发指南](docs/DEVELOPMENT.md)。

## 📄 许可证

[MIT License](LICENSE)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=wuzf/2fa&type=date&legend=top-left)](https://www.star-history.com/#wuzf/2fa&type=date&legend=top-left)

---

<div align="center">

**如果这个项目对您有帮助，请给一个 ⭐**

Made with ❤️ by [wuzf](https://github.com/wuzf)

</div>
