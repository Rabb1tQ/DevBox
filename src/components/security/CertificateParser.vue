 <template>
  <a-card>
    <a-form layout="vertical">
      <a-form-item label="证书内容">
        <a-textarea
          v-model:value="certContent"
          :rows="8"
          placeholder="请粘贴 PEM 格式的证书内容（包含 BEGIN CERTIFICATE 和 END CERTIFICATE）"
        />
      </a-form-item>

      <a-form-item>
        <a-space>
          <a-button type="primary" @click="parseCertificate">
            解析证书
          </a-button>
          <a-upload
            accept=".cer,.crt,.pem"
            :before-upload="handleFileUpload"
            :show-upload-list="false"
          >
            <a-button>
              <upload-outlined />
              上传证书文件
            </a-button>
          </a-upload>
        </a-space>
      </a-form-item>

      <template v-if="certInfo">
        <a-divider>证书信息</a-divider>
        
        <a-descriptions bordered>
          <a-descriptions-item label="主题" :span="3">
            {{ certInfo.subject }}
          </a-descriptions-item>
          <a-descriptions-item label="颁发者" :span="3">
            {{ certInfo.issuer }}
          </a-descriptions-item>
          <a-descriptions-item label="序列号" :span="3">
            {{ certInfo.serialNumber }}
          </a-descriptions-item>
          <a-descriptions-item label="版本" :span="1">
            {{ certInfo.version }}
          </a-descriptions-item>
          <a-descriptions-item label="签名算法" :span="2">
            {{ certInfo.signatureAlgorithm }}
          </a-descriptions-item>
          <a-descriptions-item label="生效时间" :span="1">
            {{ certInfo.notBefore }}
          </a-descriptions-item>
          <a-descriptions-item label="过期时间" :span="2">
            {{ certInfo.notAfter }}
          </a-descriptions-item>
        </a-descriptions>

        <template v-if="certInfo.extensions">
          <a-divider>证书扩展</a-divider>
          <a-collapse>
            <a-collapse-panel v-for="(ext, index) in certInfo.extensions" :key="index" :header="ext.name">
              <pre>{{ ext.value }}</pre>
            </a-collapse-panel>
          </a-collapse>
        </template>
      </template>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import * as asn1js from 'asn1js'
import { Certificate } from 'pkijs'

export default {
  components: {
    UploadOutlined
  },
  data() {
    return {
      certContent: '',
      certInfo: null
    }
  },
  methods: {
    handleFileUpload(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.certContent = e.target.result
        this.parseCertificate()
      }
      reader.readAsText(file)
      return false
    },
    async parseCertificate() {
      if (!this.certContent) {
        message.warning('请输入证书内容')
        return
      }

      try {
        // 移除 PEM 头尾和换行符
        const b64 = this.certContent
          .replace(/-+BEGIN CERTIFICATE-+/, '')
          .replace(/-+END CERTIFICATE-+/, '')
          .replace(/\s/g, '')

        // 转换为二进制数据
        const binary = atob(b64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }

        // 解析 ASN.1 结构
        const asn1 = asn1js.fromBER(bytes.buffer)
        if (asn1.offset === -1) {
          throw new Error('无法解析证书结构')
        }

        const certificate = new Certificate({ schema: asn1.result })
        
        // 提取证书信息
        this.certInfo = {
          subject: certificate.subject.typesAndValues.map(tv => 
            `${tv.type}=${tv.value.valueBlock.value}`).join(', '),
          issuer: certificate.issuer.typesAndValues.map(tv => 
            `${tv.type}=${tv.value.valueBlock.value}`).join(', '),
          serialNumber: certificate.serialNumber.valueBlock.toString(),
          version: certificate.version + 1,
          signatureAlgorithm: certificate.signatureAlgorithm.algorithmId,
          notBefore: new Date(certificate.notBefore.value).toLocaleString(),
          notAfter: new Date(certificate.notAfter.value).toLocaleString(),
          extensions: certificate.extensions?.map(ext => ({
            name: ext.extnID,
            value: JSON.stringify(ext.parsedValue || ext.extnValue, null, 2)
          }))
        }
      } catch (err) {
        message.error('证书解析失败：' + err.message)
      }
    }
  }
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
</style>