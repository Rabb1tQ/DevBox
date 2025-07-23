<template>
  <a-card>
    <a-form layout="vertical">
      <a-radio-group v-model:value="mode" button-style="solid" class="mb-4">
        <a-radio-button value="decode">解码 JWT</a-radio-button>
        <a-radio-button value="encode">生成 JWT</a-radio-button>
      </a-radio-group>

      <!-- 解码模式 -->
      <template v-if="mode === 'decode'">
        <a-form-item label="JWT Token">
          <a-textarea
            v-model:value="token"
            :rows="4"
            placeholder="请输入 JWT token"
            @input="decodeToken"
          />
        </a-form-item>

        <template v-if="decodedToken">
          <a-divider>解码结果</a-divider>
          
          <a-tabs>
            <a-tab-pane key="header" tab="Header">
              <pre class="json-view">{{ formatJson(decodedToken.header) }}</pre>
            </a-tab-pane>
            
            <a-tab-pane key="payload" tab="Payload">
              <pre class="json-view">{{ formatJson(decodedToken.payload) }}</pre>
            </a-tab-pane>

            <a-tab-pane key="signature" tab="Signature">
              <div class="signature">{{ decodedToken.signature }}</div>
            </a-tab-pane>
          </a-tabs>

          <template v-if="decodedToken.payload.exp">
            <a-divider>Token 状态</a-divider>
            <a-alert
              :message="tokenStatus.message"
              :description="tokenStatus.description"
              :type="tokenStatus.type"
              show-icon
            />
          </template>
        </template>
      </template>

      <!-- 加密模式 -->
      <template v-if="mode === 'encode'">
        <a-form-item label="Header">
          <a-textarea
            v-model:value="headerInput"
            :rows="4"
            placeholder="请输入 Header JSON"
            @input="validateHeaderJson"
          />
          <template v-if="headerError">
            <div class="error-text">{{ headerError }}</div>
          </template>
        </a-form-item>

        <a-form-item label="Payload">
          <a-textarea
            v-model:value="payloadInput"
            :rows="4"
            placeholder="请输入 Payload JSON"
            @input="validatePayloadJson"
          />
          <template v-if="payloadError">
            <div class="error-text">{{ payloadError }}</div>
          </template>
        </a-form-item>

        <a-form-item label="签名密钥">
          <a-input-password
            v-model:value="secret"
            placeholder="请输入签名密钥"
          />
        </a-form-item>

        <a-form-item label="签名算法">
          <a-select v-model:value="algorithm">
            <a-select-option value="HS256">HS256</a-select-option>
            <a-select-option value="HS384">HS384</a-select-option>
            <a-select-option value="HS512">HS512</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="generateToken" :disabled="!canGenerate">
            生成 Token
          </a-button>
        </a-form-item>

        <template v-if="generatedToken">
          <a-divider>生成结果</a-divider>
          <a-form-item>
            <a-textarea
              v-model:value="generatedToken"
              :rows="4"
              readonly
            >
              <template #addonAfter>
                <a-button type="link" @click="copyToken">
                  复制
                </a-button>
              </template>
            </a-textarea>
          </a-form-item>
        </template>
      </template>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import CryptoJS from 'crypto-js'

export default {
  data() {
    return {
      mode: 'decode',
      token: '',
      decodedToken: null,
      headerInput: JSON.stringify({
        alg: 'HS256',
        typ: 'JWT'
      }, null, 2),
      payloadInput: JSON.stringify({
        sub: '1234567890',
        name: 'John Doe',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, null, 2),
      secret: '',
      algorithm: 'HS256',
      headerError: '',
      payloadError: '',
      generatedToken: ''
    }
  },
  computed: {
    tokenStatus() {
      if (!this.decodedToken?.payload.exp) return null

      const exp = this.decodedToken.payload.exp * 1000 // 转换为毫秒
      const now = Date.now()
      const diff = exp - now

      if (diff <= 0) {
        return {
          type: 'error',
          message: 'Token 已过期',
          description: `过期时间：${new Date(exp).toLocaleString()}`
        }
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      return {
        type: 'success',
        message: 'Token 有效',
        description: `过期时间：${new Date(exp).toLocaleString()}（剩余 ${days}天 ${hours}小时 ${minutes}分钟）`
      }
    },
    canGenerate() {
      return !this.headerError && !this.payloadError && this.secret
    }
  },
  methods: {
    decodeToken() {
      try {
        if (!this.token) {
          this.decodedToken = null
          return
        }

        const parts = this.token.split('.')
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format')
        }

        this.decodedToken = {
          header: JSON.parse(atob(this.padBase64(parts[0]))),
          payload: JSON.parse(atob(this.padBase64(parts[1]))),
          signature: parts[2]
        }
      } catch (err) {
        this.decodedToken = null
      }
    },
    validateHeaderJson() {
      try {
        JSON.parse(this.headerInput)
        this.headerError = ''
      } catch (err) {
        this.headerError = '无效的 JSON 格式'
      }
    },
    validatePayloadJson() {
      try {
        JSON.parse(this.payloadInput)
        this.payloadError = ''
      } catch (err) {
        this.payloadError = '无效的 JSON 格式'
      }
    },
    generateToken() {
      try {
        const header = JSON.parse(this.headerInput)
        const payload = JSON.parse(this.payloadInput)

        // Base64Url 编码
        const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload))

        // 生成签名
        const signatureInput = encodedHeader + '.' + encodedPayload
        const signature = this.sign(signatureInput, this.secret)

        // 组合 JWT
        this.generatedToken = `${encodedHeader}.${encodedPayload}.${signature}`
      } catch (err) {
        message.error('生成 Token 失败：' + err.message)
      }
    },
    padBase64(str) {
      return str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=')
    },
    base64UrlEncode(str) {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    },
    sign(input, secret) {
      let signature
      switch (this.algorithm) {
        case 'HS256':
          signature = CryptoJS.HmacSHA256(input, secret)
          break
        case 'HS384':
          signature = CryptoJS.HmacSHA384(input, secret)
          break
        case 'HS512':
          signature = CryptoJS.HmacSHA512(input, secret)
          break
      }
      return this.base64UrlEncode(signature.toString(CryptoJS.enc.Base64))
    },
    formatJson(obj) {
      return JSON.stringify(obj, null, 2)
    },
    copyToken() {
      if (this.generatedToken) {
        navigator.clipboard.writeText(this.generatedToken)
        message.success('Token 已复制到剪贴板')
      }
    }
  }
}
</script>

<style scoped>
.json-view {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
.signature {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  word-break: break-all;
}
.mb-4 {
  margin-bottom: 16px;
}
.error-text {
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 4px;
}
</style>