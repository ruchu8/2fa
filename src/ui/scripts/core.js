/**
 * Core 核心业务逻辑模块
 * 包含密钥管理、OTP生成、二维码、备份等所有核心功能
 */

import { SERVICE_LOGOS } from '../config/serviceLogos.js';

/**
 * 获取 Core 相关代码
 * @returns {string} Core JavaScript 代码
 */
export function getCoreCode() {
	// 将 SERVICE_LOGOS 配置序列化为客户端代码
	const serviceLogosJSON = JSON.stringify(SERVICE_LOGOS, null, 2);

	return `    // ========== Service Logos 配置 ==========
    // 服务名称到域名的映射数据（从 serviceLogos.js 导入）
    const SERVICE_LOGOS = ${serviceLogosJSON};

    // ========== Service Logo 处理逻辑（唯一实现） ==========
    // 注意：逻辑只在客户端实现，服务器端的 serviceLogos.js 只是纯数据配置

    /**
     * 将服务名拆分为单词数组（处理空格、连字符、点号等分隔符）
     * @param {string} text - 文本
     * @returns {string[]} 单词数组
     */
    function splitWords(text) {
      // 将连字符放在字符类最后，避免被解析为范围运算符
      return text.toLowerCase().trim().split(/[\\\\s._-]+/).filter(Boolean);
    }

    /**
     * 检查 keyWords 是否是 serviceWords 的连续子序列
     * 例如：['google', 'drive'] 匹配 ['google', 'drive', 'backup']
     * @param {string[]} serviceWords - 服务名单词数组
     * @param {string[]} keyWords - 键名单词数组
     * @returns {boolean} 是否匹配
     */
    function isWordSequenceMatch(serviceWords, keyWords) {
      if (keyWords.length > serviceWords.length) return false;

      for (let i = 0; i <= serviceWords.length - keyWords.length; i++) {
        let match = true;
        for (let j = 0; j < keyWords.length; j++) {
          if (serviceWords[i + j] !== keyWords[j]) {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
      return false;
    }

    /**
     * 根据服务名称获取对应的 logo URL
     * @param {string} serviceName - 服务名称
     * @returns {string|null} Logo URL 或 null
     */
    function getServiceLogo(serviceName) {
      if (!serviceName) return null;

      const normalizedName = serviceName.toLowerCase().trim();

      // 1. 精确匹配（最快）
      if (SERVICE_LOGOS[normalizedName]) {
        return \`/api/favicon/\${SERVICE_LOGOS[normalizedName]}\`;
      }

      // 2. 单词序列匹配（处理 "Google Drive Backup" 匹配 "google drive" 等场景）
      const serviceWords = splitWords(serviceName);

      for (const [key, domain] of Object.entries(SERVICE_LOGOS)) {
        const keyWords = splitWords(key);

        // 检查 key 的单词是否作为连续子序列出现在服务名中
        if (isWordSequenceMatch(serviceWords, keyWords)) {
          return \`/api/favicon/\${domain}\`;
        }
      }

      // 3. 未找到匹配，返回 null（将显示首字母图标）
      return null;
    }

    // ========== 原有函数 ==========

    // 客户端验证Base32密钥格式
    function validateBase32(secret) {
      const base32Regex = /^[A-Z2-7]+=*$/;
      return base32Regex.test(secret.toUpperCase()) && secret.length >= 8;
    }

    // 页面加载时获取密钥列表
    document.addEventListener('DOMContentLoaded', function() {
        // 先检查认证状态
        if (checkAuth()) {
          loadSecrets();
          // Cookie 过期由浏览器自动管理，无需定时检查
        }
        initTheme();
        
        // 恢复用户的排序选择
        restoreSortPreference();

        // 页面加载后立即刷新所有OTP，确保时间同步
        setTimeout(() => {
          if (secrets && secrets.length > 0) {
            console.log('页面加载完成，立即刷新所有OTP');
            secrets.forEach(secret => {
              updateOTP(secret.id);
            });
          }
        }, 500);
      });

    // 加载密钥列表
    async function loadSecrets() {
      const CACHE_KEY = '2fa-secrets-cache';
      try {
        const response = await authenticatedFetch('/api/secrets');

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error('加载失败: ' + response.statusText);
        }

        secrets = await response.json();

        // 成功获取数据后，保存到 localStorage 作为缓存
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: secrets,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('缓存数据失败:', e);
        }

        await renderSecrets();
      } catch (error) {
        console.error('加载密钥失败:', error);

        // 尝试从缓存中读取数据
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            secrets = data;

            // 显示缓存数据
            await renderSecrets();

            // 提示用户正在使用缓存数据
            const cacheTime = new Date(timestamp).toLocaleString('zh-CN');
            showCenterToast('💾', '网络异常，显示缓存数据（' + cacheTime + '）');

            console.log('使用缓存数据，缓存时间:', cacheTime);
            return;
          }
        } catch (e) {
          console.warn('读取缓存失败:', e);
        }

        // 既没有网络数据也没有缓存数据，显示空状态
        document.getElementById('loading').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
      }
    }

    // 渲染密钥列表
    async function renderSecrets() {
      filteredSecrets = [...secrets];
      const searchInput = document.getElementById('searchInput');
      if (searchInput && searchInput.value.trim()) {
        filterSecrets(searchInput.value);
      } else {
        await renderFilteredSecrets();
      }
    }

    // 获取服务商颜色
    function getServiceColor(serviceName) {
      const colors = [
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
        '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d',
        '#343a40', '#007bff', '#28a745', '#dc3545', '#ffc107'
      ];
      
      let hash = 0;
      for (let i = 0; i < serviceName.length; i++) {
        hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      return colors[Math.abs(hash) % colors.length];
    }

    // 创建密钥卡片
    function createSecretCard(secret) {
      const logoUrl = getServiceLogo(secret.name);
      const isHOTP = secret.type && secret.type.toUpperCase() === 'HOTP';

      return '<div class="secret-card" onclick="copyOTPFromCard(event, &quot;' + secret.id + '&quot;)" title="点击卡片复制验证码">' +
        // TOTP 显示进度条，HOTP 不显示
        (isHOTP ? '' :
          '<div class="progress-top">' +
            '<div class="progress-top-fill" id="progress-' + secret.id + '"></div>' +
          '</div>'
        ) +
        '<div class="card-header">' +
          '<div class="secret-info">' +
            '<div class="service-icon">' +
              (logoUrl ?
                '<img src="' + logoUrl + '" alt="' + secret.name + '" style="width: 30px; height: 30px; object-fit: contain; border-radius: 6px;" onerror="this.style.display=&quot;none&quot;; this.nextElementSibling.style.display=&quot;block&quot;;">' +
                '<span style="display: none;">' + secret.name.charAt(0).toUpperCase() + '</span>' :
                '<span>' + secret.name.charAt(0).toUpperCase() + '</span>'
              ) +
            '</div>' +
            '<div class="secret-text">' +
            '<h3>' + secret.name + (isHOTP ? ' <span style="font-size: 11px; color: var(--text-tertiary); font-weight: 500;">[HOTP]</span>' : '') + '</h3>' +
            (secret.account ? '<p>' + secret.account + '</p>' : '') +
            (isHOTP ? '<p style="font-size: 11px; color: var(--text-tertiary); margin-top: 2px;">计数器: ' + (secret.counter || 0) + '</p>' : '') +
            '</div>' +
          '</div>' +
          '<div class="card-menu" onclick="event.stopPropagation(); toggleCardMenu(&quot;' + secret.id + '&quot;)">' +
            '<div class="menu-dots">⋮</div>' +
            '<div class="card-menu-dropdown" id="menu-' + secret.id + '">' +
              '<div class="menu-item" onclick="event.stopPropagation(); showQRCode(&quot;' + secret.id + '&quot;); closeAllCardMenus();">二维码</div>' +
              '<div class="menu-item" onclick="event.stopPropagation(); copyOTPAuthURL(&quot;' + secret.id + '&quot;); closeAllCardMenus();">复制链接</div>' +
              '<div class="menu-item" onclick="event.stopPropagation(); editSecret(&quot;' + secret.id + '&quot;); closeAllCardMenus();">编辑</div>' +
              '<div class="menu-item menu-item-danger" onclick="event.stopPropagation(); deleteSecret(&quot;' + secret.id + '&quot;); closeAllCardMenus();">删除</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="otp-preview">' +
          '<div class="otp-main">' +
            '<div class="otp-code-container">' +
              '<div class="otp-code" id="otp-' + secret.id + '" onclick="event.stopPropagation(); copyOTP(&quot;' + secret.id + '&quot;)" title="点击复制验证码">------</div>' +
            '</div>' +
            // HOTP 不显示"下一个"验证码（因为不是时间基准）
            (isHOTP ? '' :
              '<div class="otp-next-container" onclick="event.stopPropagation(); copyNextOTP(&quot;' + secret.id + '&quot;)" title="点击复制下一个验证码">' +
                '<div class="otp-next-label">下一个</div>' +
                '<div class="otp-next-code" id="next-otp-' + secret.id + '">------</div>' +
              '</div>'
            ) +
          '</div>' +
        '</div>' +
      '</div>';
    }

    // 渲染过滤后的密钥列表
    async function renderFilteredSecrets() {
      const loading = document.getElementById('loading');
      const secretsList = document.getElementById('secretsList');
      const emptyState = document.getElementById('emptyState');

      loading.style.display = 'none';

      if (currentSearchQuery && filteredSecrets.length === 0) {
        secretsList.style.display = 'none';
        emptyState.innerHTML =
          '<div class="icon">🔍</div>' +
          '<h3>未找到匹配的密钥</h3>' +
          '<p>尝试使用不同的关键字搜索</p>' +
          '<button style="margin-top: 15px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;" onclick="clearSearch()">清除搜索</button>';
        emptyState.style.display = 'block';
        return;
      }

      if (secrets.length === 0) {
        secretsList.style.display = 'none';
        emptyState.innerHTML =
          '<div class="icon">🔑</div>' +
          '<h3>还没有密钥</h3>' +
          '<p>点击上方按钮添加您的第一个2FA密钥</p>' +
          '<div style="margin-top: 20px; font-size: 12px; color: #95a5a6;">' +
          '快捷键：Ctrl+D 调试模式 | Ctrl+R 刷新验证码<br>' +
          '数据存储：Cloudflare Workers KV' +
          '</div>';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      secretsList.style.display = 'grid';

      // 应用排序
      const sortedSecrets = sortSecrets(filteredSecrets, currentSortType);

      secretsList.innerHTML = sortedSecrets.map(secret => createSecretCard(secret)).join('');

      // 🚀 性能优化：并发计算所有OTP
      const perfStart = performance.now();

      // 并发计算所有密钥的OTP（等待全部完成）
      await Promise.all(
        sortedSecrets.map(secret => updateOTP(secret.id))
      );

      // 性能监控日志
      const perfEnd = performance.now();
      const duration = (perfEnd - perfStart).toFixed(2);
      console.log('[性能优化] ' + sortedSecrets.length + '个密钥的OTP并发计算完成，耗时: ' + duration + 'ms');

      // OTP计算完成后再启动定时器
      sortedSecrets.forEach(secret => {
        startOTPInterval(secret.id);
      });

      Object.keys(otpIntervals).forEach(secretId => {
        if (!filteredSecrets.find(s => s.id === secretId)) {
          if (otpIntervals[secretId]) {
            clearInterval(otpIntervals[secretId]);
            delete otpIntervals[secretId];
          }
        }
      });
    }

    // 从卡片点击复制OTP验证码
    async function copyOTPFromCard(event, secretId) {
      // 检查点击的目标元素，避免在点击交互元素时触发
      const target = event.target;
      const isInteractiveElement = target.closest('.card-menu') || 
                                   target.closest('.otp-code') || 
                                   target.closest('.otp-next-container') ||
                                   target.closest('.secret-actions') ||
                                   target.closest('.action-btn');
      
      // 如果点击的是交互元素，不执行复制
      if (isInteractiveElement) {
        return;
      }
      
      // 执行复制操作
      await copyOTP(secretId);
    }

    // 复制OTP验证码
    async function copyOTP(secretId) {
      // 关闭所有打开的卡片菜单
      closeAllCardMenus();

      const otpElement = document.getElementById('otp-' + secretId);
      if (!otpElement) return;

      const otpText = otpElement.textContent;
      if (otpText === '------') return;

      try {
        await navigator.clipboard.writeText(otpText);
        showOTPCopyFeedback(secretId);
      } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = otpText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showOTPCopyFeedback(secretId);
      }
    }

    function showOTPCopyFeedback(secretId) {
      const secret = secrets.find(s => s.id === secretId);
      const serviceName = secret ? secret.name : '验证码';
      
      showCenterToast('✅', serviceName + ' 验证码已复制到剪贴板');
    }

    async function copyNextOTP(secretId) {
      // 关闭所有打开的卡片菜单
      closeAllCardMenus();

      const nextOtpElement = document.getElementById('next-otp-' + secretId);
      if (!nextOtpElement) return;

      const nextOtpText = nextOtpElement.textContent;
      if (nextOtpText === '------') return;

      try {
        await navigator.clipboard.writeText(nextOtpText);
        showNextOTPCopyFeedback(secretId);
      } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = nextOtpText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNextOTPCopyFeedback(secretId);
      }
    }

    function showNextOTPCopyFeedback(secretId) {
      const secret = secrets.find(s => s.id === secretId);
      const serviceName = secret ? secret.name : '验证码';

      showCenterToast('⏭️', serviceName + ' 下一个验证码已复制到剪贴板');
    }

    // 复制OTP链接（otpauth://格式）
    async function copyOTPAuthURL(secretId) {
      const secret = secrets.find(s => s.id === secretId);
      if (!secret) {
        showCenterToast('❌', '未找到密钥');
        return;
      }

      try {
        // 构建标签
        const serviceName = secret.name.trim();
        const accountName = secret.account ? secret.account.trim() : '';
        let label;
        if (accountName) {
          label = encodeURIComponent(serviceName) + ':' + encodeURIComponent(accountName);
        } else {
          label = encodeURIComponent(serviceName);
        }

        // 根据类型构建不同的参数
        const type = secret.type || 'TOTP';
        let params;

        switch (type.toUpperCase()) {
          case 'HOTP':
            params = new URLSearchParams({
              secret: secret.secret.toUpperCase(),
              issuer: serviceName,
              algorithm: secret.algorithm || 'SHA1',
              digits: (secret.digits || 6).toString(),
              counter: (secret.counter || 0).toString()
            });
            break;
          case 'TOTP':
          default:
            params = new URLSearchParams({
              secret: secret.secret.toUpperCase(),
              issuer: serviceName,
              algorithm: secret.algorithm || 'SHA1',
              digits: (secret.digits || 6).toString(),
              period: (secret.period || 30).toString()
            });
            break;
        }

        // 根据类型选择正确的scheme
        const scheme = type.toUpperCase() === 'HOTP' ? 'hotp' : 'totp';
        const otpauthURL = 'otpauth://' + scheme + '/' + label + '?' + params.toString();

        // 复制到剪贴板
        await navigator.clipboard.writeText(otpauthURL);
        showCenterToast('🔗', secret.name + ' 链接已复制到剪贴板');
      } catch (err) {
        console.error('复制链接失败:', err);
        showCenterToast('❌', '复制链接失败: ' + err.message);
      }
    }

    // 切换卡片菜单
    function toggleCardMenu(secretId) {
      const dropdown = document.getElementById('menu-' + secretId);
      if (!dropdown) return;
      
      document.querySelectorAll('.card-menu-dropdown').forEach(menu => {
        if (menu.id !== 'menu-' + secretId) {
          menu.classList.remove('show');
        }
      });
      
      dropdown.classList.toggle('show');
    }
    
    function closeAllCardMenus() {
      document.querySelectorAll('.card-menu-dropdown').forEach(menu => {
        menu.classList.remove('show');
      });
    }

    document.addEventListener('click', function(event) {
      if (!event.target.closest('.card-menu')) {
        document.querySelectorAll('.card-menu-dropdown').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });


    // 编辑密钥
    function editSecret(id) {
      const secret = secrets.find(s => s.id === id);
      if (!secret) return;
      
      editingId = id;
      document.getElementById('modalTitle').textContent = '编辑密钥';
      document.getElementById('submitBtn').textContent = '更新';
      document.getElementById('secretId').value = id;
      document.getElementById('secretName').value = secret.name;
      document.getElementById('secretService').value = secret.account || '';
      document.getElementById('secretKey').value = secret.secret;
      
      // 填充高级参数
      document.getElementById('secretType').value = secret.type || 'TOTP';
      document.getElementById('secretDigits').value = secret.digits || 6;
      document.getElementById('secretPeriod').value = secret.period || 30;
      document.getElementById('secretAlgorithm').value = secret.algorithm || 'SHA1';
      document.getElementById('secretCounter').value = secret.counter || 0;
      
      // 如果有非默认的高级参数，显示高级选项
      const hasAdvancedOptions = (secret.type && secret.type !== 'TOTP') ||
                                (secret.digits && secret.digits !== 6) || 
                                (secret.period && secret.period !== 30) || 
                                (secret.algorithm && secret.algorithm !== 'SHA1') ||
                                (secret.counter && secret.counter !== 0);
      
      const checkbox = document.getElementById('showAdvanced');
      if (hasAdvancedOptions) {
        checkbox.checked = true;
        toggleAdvancedOptions();
      } else {
        checkbox.checked = false;
        toggleAdvancedOptions();
      }
      
      const modal = document.getElementById('secretModal');
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('show'), 10);
      disableBodyScroll();
    }
    
    async function deleteSecret(id) {
      const secret = secrets.find(s => s.id === id);
      if (!secret) return;

      if (!confirm('确定要删除 "' + secret.name + '" 吗？')) {
        return;
      }

      // 🔒 删除操作也使用队列，避免与编辑操作产生竞态条件
      saveQueue = saveQueue.then(async () => {
        try {
          console.log('🗑️ [保存队列] 提交删除请求:', secret.name);

          const response = await authenticatedFetch('/api/secrets/' + id, {
            method: 'DELETE'
          });

          if (response.ok) {
            const result = await response.json();

            // 检查是否为离线排队响应
            if (result.queued && result.offline) {
              console.log('📥 [离线模式] 删除操作已排队，等待同步:', result.operationId);
              showCenterToast('📥', result.message || '操作已保存，网络恢复后自动同步');

              // 离线模式下，暂时不更新本地状态，等待同步完成后由 PWA 模块刷新
              return;
            }

            // 正常在线响应，立即删除本地数据
            secrets = secrets.filter(s => s.id !== id);
            await renderSecrets();

            if (otpIntervals[id]) {
              clearInterval(otpIntervals[id]);
              delete otpIntervals[id];
            }

            console.log('✅ [保存队列] 删除成功:', secret.name);
          } else {
            showCenterToast('❌', '删除失败，请重试');
          }
        } catch (error) {
          console.error('❌ [保存队列] 删除失败:', error);
          showCenterToast('❌', '删除失败：' + error.message);
        }
      }).catch(err => {
        console.error('❌ [保存队列] 队列执行错误:', err);
      });
    }
    
    // 二维码解析工具
    function showQRScanAndDecode() {
      hideToolsModal();
      showQRDecodeModal();
    }
    
    // 二维码生成工具
    function showQRGenerateTool() {
      hideToolsModal();
      showQRGenerateModal();
    }
    
    // Base32编解码工具
    function showBase32Tool() {
      hideToolsModal();
      showBase32Modal();
    }
    
    // 时间戳工具
    function showTimestampTool() {
      hideToolsModal();
      showTimestampModal();
    }
    
    // 密钥检查器
    function showKeyCheckTool() {
      hideToolsModal();
      showKeyCheckModal();
    }
    
    // 密钥生成器
    function showKeyGeneratorTool() {
      hideToolsModal();
      showKeyGeneratorModal();
    }
    
    async function handleSubmit(event) {
      event.preventDefault();

      const name = document.getElementById('secretName').value.trim();
      const account = document.getElementById('secretService').value.trim();
      const secret = document.getElementById('secretKey').value.trim().toUpperCase();

      // 获取高级参数
      const type = document.getElementById('secretType').value || 'TOTP';
      const digits = parseInt(document.getElementById('secretDigits').value) || 6;
      const period = parseInt(document.getElementById('secretPeriod').value) || 30;
      const algorithm = document.getElementById('secretAlgorithm').value || 'SHA1';
      const counter = parseInt(document.getElementById('secretCounter').value) || 0;

      if (!name || !secret) {
        showCenterToast('❌', '请填写服务名称和密钥');
        return;
      }

      const submitBtn = document.getElementById('submitBtn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '保存中...';
      submitBtn.disabled = true;

      // 🔒 关键修复：使用队列确保保存操作串行执行，避免并发覆盖
      // 当快速连续编辑多个密钥时，后端的读-修改-写操作会产生race condition
      // 通过Promise链式调用，确保前一个保存完成后再执行下一个
      saveQueue = saveQueue.then(async () => {
        try {
          let response;
          const data = {
            name,
            account: account,
            secret,
            type,
            digits,
            period,
            algorithm,
            counter
          };

          const action = editingId ? '更新' : '新增';
          console.log('🔄 [保存队列] 提交保存请求:', action, name, { period, digits, algorithm });

          if (editingId) {
            response = await authenticatedFetch('/api/secrets/' + editingId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
          } else {
            response = await authenticatedFetch('/api/secrets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
          }

          if (response.ok) {
            const result = await response.json();

            // 检查是否为离线排队响应
            if (result.queued && result.offline) {
              console.log('📥 [离线模式] 操作已排队，等待同步:', result.operationId);
              showCenterToast('📥', result.message || '操作已保存，网络恢复后自动同步');

              // 离线模式下，暂时不更新本地状态，等待同步完成后由 PWA 模块刷新
              hideSecretModal();
              return;
            }

            // 正常在线响应，更新本地状态
            console.log('✅ [保存队列] 保存成功:', result.data ? result.data.secret.name : result.name, '- period:', result.data ? result.data.secret.period : result.period);

            if (editingId) {
              const index = secrets.findIndex(s => s.id === editingId);
              if (index !== -1) {
                secrets[index] = result.data ? result.data.secret : result;
                console.log('✅ [本地更新] 密钥已更新:', secrets[index].name, '- period:', secrets[index].period);
              }
            } else {
              secrets.push(result.data ? result.data.secret : result);
            }

            await renderSecrets();
            hideSecretModal();
          } else {
            const error = await response.json();
            const errorMessage = error.message || error.error || '保存失败，请重试';
            showCenterToast('❌', errorMessage);
          }
        } catch (error) {
          console.error('❌ [保存队列] 保存失败:', error);
          showCenterToast('❌', '保存失败：' + error.message);
        } finally {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }).catch(err => {
        // 队列执行失败的最终兜底
        console.error('❌ [保存队列] 队列执行错误:', err);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
    }


    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideSecretModal();
        hideQRModal();
        hideQRScanner();
        hideImportModal();
      }
      
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        debugMode = !debugMode;
        console.log('Debug mode ' + (debugMode ? 'enabled' : 'disabled'));
        
        const debugInfo = document.createElement('div');
        debugInfo.style.cssText = 
          'position: fixed;' +
          'top: 20px;' +
          'right: 20px;' +
          'background: ' + (debugMode ? '#27ae60' : '#e74c3c') + ';' +
          'color: white;' +
          'padding: 10px 15px;' +
          'border-radius: 6px;' +
          'z-index: 9999;' +
          'font-size: 14px;';
        debugInfo.textContent = '调试模式: ' + (debugMode ? '开启' : '关闭');
        document.body.appendChild(debugInfo);
        
        setTimeout(() => {
          if (debugInfo.parentNode) {
            debugInfo.parentNode.removeChild(debugInfo);
          }
        }, 2000);
      }
      
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        console.log('Manually refreshing all OTP codes');
        secrets.forEach(secret => {
          updateOTP(secret.id);
        });
        
        const refreshInfo = document.createElement('div');
        refreshInfo.style.cssText = 
          'position: fixed;' +
          'top: 20px;' +
          'right: 20px;' +
          'background: #3498db;' +
          'color: white;' +
          'padding: 10px 15px;' +
          'border-radius: 6px;' +
          'z-index: 9999;' +
          'font-size: 14px;';
        refreshInfo.textContent = '已手动刷新所有验证码';
        document.body.appendChild(refreshInfo);
        
        setTimeout(() => {
          if (refreshInfo.parentNode) {
            refreshInfo.parentNode.removeChild(refreshInfo);
          }
        }, 2000);
      }
    });

    // 模态框外部点击关闭

    




    // 页面卸载时清理定时器
    window.addEventListener('beforeunload', function() {
      Object.values(otpIntervals).forEach(interval => {
        clearInterval(interval);
      });
    });

    // 🛡️ 安全机制：定期检查所有验证码是否需要更新
    // 防止定时器失效导致验证码过期
    // 每5秒检查一次（不会影响性能）
    setInterval(() => {
      if (document.hidden) {
        // 如果页面在后台，跳过检查（节省资源）
        return;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      
      secrets.forEach(secret => {
        // 只检查TOTP类型
        if (secret.type && secret.type.toUpperCase() === 'HOTP') {
          return;
        }

        const otpElement = document.getElementById('otp-' + secret.id);
        if (!otpElement) return;

        // 检查验证码是否为默认值（未初始化或更新失败）
        if (otpElement.textContent === '------') {
          console.warn('⚠️  [安全检查] 发现未初始化的验证码:', secret.name);
          updateOTP(secret.id);
          return;
        }

        // 检查当前时间窗口，判断验证码是否应该更新
        const timeStep = secret.period || 30;
        const currentWindow = Math.floor(currentTime / timeStep);
        
        // 在时间窗口刚切换时（前3秒），强制刷新验证码
        const secondsInWindow = currentTime % timeStep;
        if (secondsInWindow <= 2) {
          // 避免重复刷新：检查上次刷新时间
          const lastRefreshKey = 'lastRefresh-' + secret.id;
          const lastRefreshWindow = window[lastRefreshKey];
          
          if (lastRefreshWindow !== currentWindow) {
            console.log('🔄 [安全检查] 时间窗口已切换，刷新验证码:', secret.name, '窗口:', currentWindow);
            updateOTP(secret.id);
            window[lastRefreshKey] = currentWindow;
          }
        }
      });
    }, 5000); // 每5秒检查一次
`;
}
