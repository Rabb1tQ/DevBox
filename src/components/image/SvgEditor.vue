<template>
  <a-card>
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form layout="vertical">
          <a-form-item label="SVG 代码">
            <a-textarea
              v-model:value="svgCode"
              :rows="20"
              @input="updatePreview"
            />
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="formatCode">
                格式化代码
              </a-button>
              <a-button @click="minifyCode">
                压缩代码
              </a-button>
              <a-button @click="downloadSvg">
                下载 SVG
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-col>
      <a-col :span="12">
        <div class="preview-container">
          <div class="preview-header">
            <span>预览</span>
            <a-space>
              <a-input-number
                v-model:value="previewWidth"
                :min="50"
                :max="800"
                addon-after="px"
                style="width: 120px"
                @change="updatePreviewSize"
              />
              <a-input-number
                v-model:value="previewHeight"
                :min="50"
                :max="800"
                addon-after="px"
                style="width: 120px"
                @change="updatePreviewSize"
              />
            </a-space>
          </div>
          <div 
            class="preview-content"
            v-html="sanitizedSvgCode"
            :style="{ width: previewWidth + 'px', height: previewHeight + 'px' }"
          ></div>
        </div>
      </a-col>
    </a-row>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import prettier from 'prettier'
import svgParser from 'prettier/parser-html'

export default {
  data() {
    return {
      svgCode: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <circle cx="50" cy="50" r="40" fill="#6366f1" />\n</svg>',
      previewWidth: 400,
      previewHeight: 400
    }
  },
  computed: {
    sanitizedSvgCode() {
      // 简单的 XSS 防护
      return this.svgCode
        .replace(/on\w+=/gi, '')
        .replace(/javascript:/gi, '')
    }
  },
  methods: {
    updatePreview() {
      // 预览会通过 computed 属性自动更新
    },
    updatePreviewSize() {
      // 预览尺寸更新时可以添加其他逻辑
    },
    formatCode() {
      try {
        this.svgCode = prettier.format(this.svgCode, {
          parser: 'html',
          plugins: [svgParser],
          printWidth: 80
        })
      } catch (err) {
        message.error('格式化失败：' + err.message)
      }
    },
    minifyCode() {
      try {
        // 移除空白字符和换行
        this.svgCode = this.svgCode
          .replace(/>\s+</g, '><')
          .replace(/\s+/g, ' ')
          .trim()
      } catch (err) {
        message.error('压缩失败：' + err.message)
      }
    },
    downloadSvg() {
      const blob = new Blob([this.svgCode], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'image.svg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.preview-container {
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  padding: 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
  margin: 0 auto;
}
</style> 