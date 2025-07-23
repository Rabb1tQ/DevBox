<template>
  <a-card>
    <a-form layout="vertical">
      <a-form-item label="操作类型">
        <a-radio-group v-model:value="operationType" button-style="solid">
          <a-radio-button value="certificate">证书操作</a-radio-button>
          <a-radio-button value="key">密钥操作</a-radio-button>
          <a-radio-button value="convert">格式转换</a-radio-button>
          <a-radio-button value="encrypt">加解密</a-radio-button>
        </a-radio-group>
      </a-form-item>

      <!-- 证书操作 -->
      <template v-if="operationType === 'certificate'">
        <a-form-item label="证书操作">
          <a-select v-model:value="certOperation">
            <a-select-option value="generate-csr">生成证书请求(CSR)</a-select-option>
            <a-select-option value="self-signed">生成自签名证书</a-select-option>
            <a-select-option value="sign-csr">签发证书</a-select-option>
          </a-select>
        </a-form-item>

        <template v-if="certOperation === 'generate-csr'">
          <a-form-item label="密钥类型">
            <a-radio-group v-model:value="keyType">
              <a-radio value="rsa">RSA</a-radio>
              <a-radio value="ec">ECC</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="密钥长度" v-if="keyType === 'rsa'">
            <a-select v-model:value="keySize">
              <a-select-option value="2048">2048 位</a-select-option>
              <a-select-option value="3072">3072 位</a-select-option>
              <a-select-option value="4096">4096 位</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="椭圆曲线" v-if="keyType === 'ec'">
            <a-select v-model:value="curve">
              <a-select-option value="prime256v1">prime256v1 (NIST P-256)</a-select-option>
              <a-select-option value="secp384r1">secp384r1 (NIST P-384)</a-select-option>
              <a-select-option value="secp521r1">secp521r1 (NIST P-521)</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="证书信息">
            <a-input v-model:value="subject.C" placeholder="国家代码 (C, 例如: CN)" />
            <a-input v-model:value="subject.ST" placeholder="省份 (ST)" class="mt-2" />
            <a-input v-model:value="subject.L" placeholder="城市 (L)" class="mt-2" />
            <a-input v-model:value="subject.O" placeholder="组织 (O)" class="mt-2" />
            <a-input v-model:value="subject.OU" placeholder="部门 (OU)" class="mt-2" />
            <a-input v-model:value="subject.CN" placeholder="通用名称 (CN)" class="mt-2" />
          </a-form-item>
        </template>

        <template v-if="certOperation === 'self-signed'">
          <a-form-item label="有效期(天)">
            <a-input-number v-model:value="validity" :min="1" :max="3650" />
          </a-form-item>
        </template>
      </template>

      <!-- 密钥操作 -->
      <template v-if="operationType === 'key'">
        <a-form-item label="密钥操作">
          <a-select v-model:value="keyOperation">
            <a-select-option value="generate-key">生成密钥对</a-select-option>
            <a-select-option value="extract-pubkey">提取公钥</a-select-option>
            <a-select-option value="generate-params">生成 DH 参数</a-select-option>
          </a-select>
        </a-form-item>
      </template>

      <!-- 格式转换 -->
      <template v-if="operationType === 'convert'">
        <a-form-item label="转换类型">
          <a-select v-model:value="convertOperation">
            <a-select-option value="pem-to-der">PEM 转 DER</a-select-option>
            <a-select-option value="der-to-pem">DER 转 PEM</a-select-option>
            <a-select-option value="pkcs12-to-pem">PKCS#12 转 PEM</a-select-option>
            <a-select-option value="pem-to-pkcs12">PEM 转 PKCS#12</a-select-option>
          </a-select>
        </a-form-item>
      </template>

      <!-- 加解密操作 -->
      <template v-if="operationType === 'encrypt'">
        <a-form-item label="加解密操作">
          <a-select v-model:value="encryptOperation">
            <a-select-option value="encrypt">加密文件</a-select-option>
            <a-select-option value="decrypt">解密文件</a-select-option>
            <a-select-option value="digest">计算摘要</a-select-option>
          </a-select>
        </a-form-item>
        <template v-if="encryptOperation === 'encrypt' || encryptOperation === 'decrypt'">
          <a-form-item label="算法">
            <a-select v-model:value="cipher">
              <a-select-option value="aes-256-cbc">AES-256-CBC</a-select-option>
              <a-select-option value="aes-256-gcm">AES-256-GCM</a-select-option>
              <a-select-option value="chacha20">ChaCha20</a-select-option>
            </a-select>
          </a-form-item>
        </template>
      </template>

      <a-form-item>
        <a-button type="primary" @click="generateCommand">
          生成命令
        </a-button>
      </a-form-item>

      <template v-if="command">
        <a-form-item label="OpenSSL 命令">
          <a-input
            v-model:value="command"
            readonly
          >
            <template #addonAfter>
              <a-button type="link" @click="copyCommand">
                复制
              </a-button>
            </template>
          </a-input>
        </a-form-item>
      </template>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'

export default {
  data() {
    return {
      operationType: 'certificate',
      certOperation: 'generate-csr',
      keyType: 'rsa',
      keySize: '2048',
      curve: 'prime256v1',
      subject: {
        C: '',
        ST: '',
        L: '',
        O: '',
        OU: '',
        CN: ''
      },
      validity: 365,
      keyOperation: 'generate-key',
      convertOperation: 'pem-to-der',
      encryptOperation: 'encrypt',
      cipher: 'aes-256-cbc',
      command: ''
    }
  },
  methods: {
    generateCommand() {
      let cmd = 'openssl '

      switch (this.operationType) {
        case 'certificate':
          cmd += this.generateCertificateCommand()
          break
        case 'key':
          cmd += this.generateKeyCommand()
          break
        case 'convert':
          cmd += this.generateConvertCommand()
          break
        case 'encrypt':
          cmd += this.generateEncryptCommand()
          break
      }

      this.command = cmd
    },
    generateCertificateCommand() {
      let cmd = ''
      let subj = ''

      switch (this.certOperation) {
        case 'generate-csr': {
          cmd = `req -new -${this.keyType}`
          if (this.keyType === 'rsa') {
            cmd += ` -newkey rsa:${this.keySize}`
          } else {
            cmd += ` -newkey ec -pkeyopt ec_paramgen_curve:${this.curve}`
          }
          cmd += ' -nodes'
          cmd += ` -keyout private.key -out request.csr`
          
          // 添加主题信息
          subj = '/'
          for (const [key, value] of Object.entries(this.subject)) {
            if (value) {
              subj += `${key}=${value}/`
            }
          }
          if (subj !== '/') {
            cmd += ` -subj "${subj}"`
          }
          break
        }
        case 'self-signed': {
          cmd = `req -x509 -new -${this.keyType}`
          if (this.keyType === 'rsa') {
            cmd += ` -newkey rsa:${this.keySize}`
          } else {
            cmd += ` -newkey ec -pkeyopt ec_paramgen_curve:${this.curve}`
          }
          cmd += ' -nodes'
          cmd += ` -days ${this.validity}`
          cmd += ' -keyout private.key -out certificate.crt'
          break
        }
        case 'sign-csr': {
          cmd = 'x509 -req -in request.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out certificate.crt'
          cmd += ` -days ${this.validity}`
          break
        }
      }
      return cmd
    },
    generateKeyCommand() {
      let cmd = ''
      switch (this.keyOperation) {
        case 'generate-key':
          if (this.keyType === 'rsa') {
            cmd = `genrsa -out private.key ${this.keySize}`
          } else {
            cmd = `ecparam -name ${this.curve} -genkey -noout -out private.key`
          }
          break
        case 'extract-pubkey':
          cmd = `rsa -in private.key -pubout -out public.key`
          break
        case 'generate-params':
          cmd = 'dhparam -out dhparams.pem 2048'
          break
      }
      return cmd
    },
    generateConvertCommand() {
      let cmd = ''
      switch (this.convertOperation) {
        case 'pem-to-der':
          cmd = 'x509 -in cert.pem -outform DER -out cert.der'
          break
        case 'der-to-pem':
          cmd = 'x509 -in cert.der -inform DER -out cert.pem'
          break
        case 'pkcs12-to-pem':
          cmd = 'pkcs12 -in cert.p12 -out cert.pem -nodes'
          break
        case 'pem-to-pkcs12':
          cmd = 'pkcs12 -export -in cert.pem -inkey key.pem -out cert.p12'
          break
      }
      return cmd
    },
    generateEncryptCommand() {
      let cmd = ''
      switch (this.encryptOperation) {
        case 'encrypt':
          cmd = `enc -${this.cipher} -e -in file.txt -out file.enc`
          break
        case 'decrypt':
          cmd = `enc -${this.cipher} -d -in file.enc -out file.txt`
          break
        case 'digest':
          cmd = 'dgst -sha256 -out hash.txt file.txt'
          break
      }
      return cmd
    },
    copyCommand() {
      if (this.command) {
        navigator.clipboard.writeText(this.command)
        message.success('命令已复制到剪贴板')
      }
    }
  }
}
</script>

<style scoped>
.mt-2 {
  margin-top: 8px;
}
</style> 