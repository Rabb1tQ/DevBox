<template>
  <a-card>
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="generate" tab="生成二维码">
        <a-form layout="vertical">
          <a-form-item label="文本内容">
            <a-textarea
              v-model:value="qrText"
              :rows="4"
              placeholder="请输入要生成二维码的文本内容"
            />
          </a-form-item>
          
          <a-form-item label="二维码配置">
            <a-space>
              <a-input-number
                v-model:value="qrSize"
                :min="100"
                :max="400"
                addon-after="px"
                style="width: 120px"
              />
              <a-select
                v-model:value="errorCorrectionLevel"
                style="width: 120px"
              >
                <a-select-option value="L">低纠错</a-select-option>
                <a-select-option value="M">中纠错</a-select-option>
                <a-select-option value="Q">较高纠错</a-select-option>
                <a-select-option value="H">高纠错</a-select-option>
              </a-select>
              <a-color-picker v-model:value="qrColor" />
            </a-space>
          </a-form-item>

          <a-form-item>
            <a-space>
              <a-button type="primary" @click="generateQR">
                生成二维码
              </a-button>
              <a-button v-if="qrDataUrl" @click="downloadQR">
                下载二维码
              </a-button>
            </a-space>
          </a-form-item>

          <div v-if="qrDataUrl" class="qr-preview">
            <img :src="qrDataUrl" :alt="qrText" />
          </div>
        </a-form>
      </a-tab-pane>

      <a-tab-pane key="scan" tab="识别二维码">
        <a-form layout="vertical">
          <a-form-item label="上传图片">
            <a-upload
              accept="image/*"
              :before-upload="handleImageUpload"
              :show-upload-list="false"
            >
              <a-button>
                <upload-outlined />
                选择图片
              </a-button>
            </a-upload>
          </a-form-item>

          <div v-if="uploadedImage" class="image-preview">
            <img :src="uploadedImage" alt="Uploaded QR Code" />
          </div>

          <a-form-item v-if="scannedResult" label="识别结果">
            <a-textarea
              v-model:value="scannedResult"
              :rows="4"
              readonly
            />
            <a-button type="link" @click="copyResult">
              复制结果
            </a-button>
          </a-form-item>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import QRCode from 'qrcode'
import jsQR from 'jsqr'

export default {
  components: {
    UploadOutlined
  },
  data() {
    return {
      activeTab: 'generate',
      qrText: '',
      qrSize: 200,
      errorCorrectionLevel: 'M',
      qrColor: '#000000',
      qrDataUrl: '',
      uploadedImage: '',
      scannedResult: ''
    }
  },
  methods: {
    async generateQR() {
      if (!this.qrText) {
        message.warning('请输入要生成二维码的文本内容')
        return
      }

      try {
        this.qrDataUrl = await QRCode.toDataURL(this.qrText, {
          width: this.qrSize,
          margin: 1,
          color: {
            dark: this.qrColor,
            light: '#ffffff'
          },
          errorCorrectionLevel: this.errorCorrectionLevel
        })
      } catch (err) {
        message.error('生成二维码失败：' + err.message)
      }
    },
    downloadQR() {
      const link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = this.qrDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    handleImageUpload(file) {
      if (!file.type.startsWith('image/')) {
        message.error('请上传图片文件')
        return false
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        this.uploadedImage = e.target.result
        this.scanQRCode(e.target.result)
      }
      reader.readAsDataURL(file)
      return false
    },
    scanQRCode(dataUrl) {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = image.width
        canvas.height = image.height
        context.drawImage(image, 0, 0)
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        if (code) {
          this.scannedResult = code.data
        } else {
          message.error('未能识别出二维码')
          this.scannedResult = ''
        }
      }
      image.src = dataUrl
    },
    copyResult() {
      if (this.scannedResult) {
        navigator.clipboard.writeText(this.scannedResult)
        message.success('已复制到剪贴板')
      }
    }
  }
}
</script>

<style scoped>
.qr-preview, .image-preview {
  margin-top: 16px;
  text-align: center;
}
.qr-preview img, .image-preview img {
  max-width: 100%;
  max-height: 400px;
}
</style> 