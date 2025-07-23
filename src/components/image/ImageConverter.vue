<template>
  <a-card>
    <a-form layout="vertical">
      <a-form-item label="上传图片">
        <a-upload
          accept="image/*,.svg"
          :before-upload="handleImageUpload"
          :show-upload-list="false"
        >
          <a-button>
            <upload-outlined />
            选择图片
          </a-button>
          <span class="upload-hint">
            支持 PNG、JPG、SVG 等格式
          </span>
        </a-upload>
      </a-form-item>

      <template v-if="sourceImage">
        <div class="image-preview">
          <img :src="sourceImage" alt="Source" />
        </div>

        <a-form-item label="转换选项">
          <a-space>
            <a-select
              v-model:value="targetFormat"
              style="width: 120px"
            >
              <a-select-option value="png">PNG</a-select-option>
              <a-select-option value="jpeg">JPEG</a-select-option>
              <a-select-option value="webp">WebP</a-select-option>
              <a-select-option value="ico">ICO</a-select-option>
              <a-select-option value="svg">SVG</a-select-option>
            </a-select>

            <template v-if="targetFormat === 'jpeg'">
              <a-input-number
                v-model:value="quality"
                :min="1"
                :max="100"
                addon-after="%"
                style="width: 120px"
              />
            </template>

            <template v-if="targetFormat === 'ico'">
              <a-select
                v-model:value="icoSize"
                style="width: 120px"
              >
                <a-select-option value="16">16x16</a-select-option>
                <a-select-option value="32">32x32</a-select-option>
                <a-select-option value="48">48x48</a-select-option>
                <a-select-option value="64">64x64</a-select-option>
                <a-select-option value="128">128x128</a-select-option>
                <a-select-option value="256">256x256</a-select-option>
              </a-select>
            </template>
          </a-space>
        </a-form-item>

        <a-form-item>
          <a-button 
            type="primary"
            :loading="converting"
            @click="convertImage"
          >
            转换并下载
          </a-button>
        </a-form-item>
      </template>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import potrace from 'potrace'
import toIco from 'to-ico'
import { Buffer } from 'buffer'

export default {
  components: {
    UploadOutlined
  },
  data() {
    return {
      sourceImage: '',
      sourceFile: null,
      targetFormat: 'png',
      quality: 90,
      icoSize: '32',
      converting: false
    }
  },
  methods: {
    handleImageUpload(file) {
      if (!file.type.startsWith('image/') && !file.type.includes('svg')) {
        message.error('请上传图片文件')
        return false
      }

      this.sourceFile = file
      const reader = new FileReader()
      reader.onload = (e) => {
        this.sourceImage = e.target.result
      }
      reader.readAsDataURL(file)
      return false
    },
    async convertImage() {
      if (!this.sourceFile) {
        message.warning('请先上传图片')
        return
      }

      this.converting = true
      try {
        if (this.targetFormat === 'svg') {
          await this.convertToSvg()
        } else {
          await this.convertToRaster()
        }
      } catch (err) {
        message.error('转换失败：' + err.message)
      } finally {
        this.converting = false
      }
    },
    async convertToSvg() {
      return new Promise((resolve, reject) => {
        const trace = new potrace.Potrace()
        const reader = new FileReader()
        reader.onload = () => {
          trace.loadImage(reader.result, (err) => {
            if (err) reject(err)
            const svg = trace.getSVG()
            this.downloadFile(svg, 'image.svg', 'image/svg+xml')
            resolve()
          })
        }
        reader.readAsDataURL(this.sourceFile)
      })
    },
    async convertToRaster() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = this.sourceImage
      })

      // 设置画布尺寸
      if (this.targetFormat === 'ico') {
        canvas.width = parseInt(this.icoSize)
        canvas.height = parseInt(this.icoSize)
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      // 绘制图片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // 转换为目标格式
      let mimeType = 'image/' + this.targetFormat
      let quality = this.targetFormat === 'jpeg' ? this.quality / 100 : 1

      // 特殊处理 ICO 格式
      if (this.targetFormat === 'ico') {
        try {
          // 获取 PNG buffer
          const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
          const pngArrayBuffer = await pngBlob.arrayBuffer()
          const buffer = Buffer.from(pngArrayBuffer)
          
          // 转换为 ICO
          const icoBuffer = await toIco([buffer])
          const blob = new Blob([icoBuffer], { type: 'image/x-icon' })
          const url = URL.createObjectURL(blob)
          this.downloadFile(url, 'favicon.ico', 'image/x-icon')
          URL.revokeObjectURL(url)
          return
        } catch (err) {
          console.error('ICO conversion error:', err)
          message.error('ICO 格式转换失败：' + err.message)
          return
        }
      }

      const dataUrl = canvas.toDataURL(mimeType, quality)
      const fileName = `image.${this.targetFormat}`
      this.downloadFile(dataUrl, fileName, mimeType)
    },
    downloadFile(content, fileName, mimeType) {
      const link = document.createElement('a')
      link.download = fileName

      if (typeof content === 'string') {
        // 如果内容是 URL 或 base64 格式
        link.href = content
      } else {
        // 如果内容是 Buffer 或 Blob
        const blob = new Blob([content], { type: mimeType })
        link.href = URL.createObjectURL(blob)
      }

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 如果是 Blob URL，需要释放
      if (link.href.startsWith('blob:')) {
        URL.revokeObjectURL(link.href)
      }
    }
  }
}
</script>

<style scoped>
.upload-hint {
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.45);
}
.image-preview {
  margin: 16px 0;
  text-align: center;
}
.image-preview img {
  max-width: 100%;
  max-height: 400px;
}
</style>