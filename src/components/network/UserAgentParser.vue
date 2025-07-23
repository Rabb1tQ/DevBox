<template>
  <a-card>
    <a-form layout="vertical">
      <a-form-item label="User-Agent 字符串">
        <a-textarea 
          v-model:value="userAgent" 
          :rows="4" 
          placeholder="请输入完整的 User-Agent 字符串" 
        />
      </a-form-item>

      <a-button 
        type="primary" 
        @click="parseUserAgent"
      >
        解析
      </a-button>

      <a-descriptions 
        v-if="parsedInfo" 
        bordered 
        :column="2" 
        style="margin-top: 16px"
      >
        <a-descriptions-item label="浏览器">
          {{ parsedInfo.browser }}
        </a-descriptions-item>
        <a-descriptions-item label="浏览器版本">
          {{ parsedInfo.browserVersion }}
        </a-descriptions-item>
        <a-descriptions-item label="操作系统">
          {{ parsedInfo.os }}
        </a-descriptions-item>
        <a-descriptions-item label="操作系统版本">
          {{ parsedInfo.osVersion }}
        </a-descriptions-item>
        <a-descriptions-item label="设备类型">
          {{ parsedInfo.deviceType }}
        </a-descriptions-item>
      </a-descriptions>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'

export default {
  data() {
    return {
      userAgent: navigator.userAgent,
      parsedInfo: null
    }
  },
  methods: {
    parseUserAgent() {
      if (!this.userAgent) {
        message.warning('请输入 User-Agent 字符串')
        return
      }

      try {
        this.parsedInfo = this.parseUserAgentString(this.userAgent)
      } catch (error) {
        message.error('解析失败：' + error.message)
      }
    },
    parseUserAgentString(ua) {
      // 这是一个简单的解析实现，实际项目中建议使用专业的 UA 解析库
      const browserRegexes = [
        { name: 'Chrome', regex: /Chrome\/(\d+\.\d+)/ },
        { name: 'Firefox', regex: /Firefox\/(\d+\.\d+)/ },
        { name: 'Safari', regex: /Safari\/(\d+\.\d+)/ },
        { name: 'Edge', regex: /Edg\/(\d+\.\d+)/ },
        { name: 'Internet Explorer', regex: /MSIE (\d+\.\d+)/ }
      ]

      const osRegexes = [
        { name: 'Windows', regex: /Windows NT (\d+\.\d+)/ },
        { name: 'macOS', regex: /Mac OS X (\d+[._]\d+)/ },
        { name: 'Linux', regex: /Linux/ },
        { name: 'iOS', regex: /iPhone OS (\d+[._]\d+)/ },
        { name: 'Android', regex: /Android (\d+\.\d+)/ }
      ]

      let browser = 'Unknown'
      let browserVersion = 'Unknown'
      let os = 'Unknown'
      let osVersion = 'Unknown'
      let deviceType = 'Unknown'

      // 浏览器解析
      for (const b of browserRegexes) {
        const match = ua.match(b.regex)
        if (match) {
          browser = b.name
          browserVersion = match[1]
          break
        }
      }

      // 操作系统解析
      for (const o of osRegexes) {
        const match = ua.match(o.regex)
        if (match) {
          os = o.name
          osVersion = match[1] || 'Unknown'
          break
        }
      }

      // 设备类型判断
      if (ua.includes('Mobile') || ua.includes('Android')) {
        deviceType = '移动设备'
      } else if (ua.includes('Tablet')) {
        deviceType = '平板'
      } else {
        deviceType = '桌面设备'
      }

      return {
        browser,
        browserVersion,
        os,
        osVersion,
        deviceType
      }
    }
  },
  mounted() {
    this.parseUserAgent()
  }
}
</script>

<style scoped>
.ant-descriptions {
  margin-top: 16px;
}
</style> 