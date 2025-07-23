<template>
  <a-card title="加解密工具">
    <a-row :gutter="16">
      <a-col :span="24" class="crypto-buttons">
        <a-button 
          v-for="algo in cryptoAlgorithms" 
          :key="algo.key"
          :type="selectedAlgorithm === algo.key ? 'primary' : 'default'"
          @click="selectAlgorithm(algo.key)"
          class="crypto-btn"
        >
          {{ algo.name }}
        </a-button>
      </a-col>
    </a-row>

    <a-form layout="vertical" class="mt-4">
      <!-- AES 特定选项 -->
      <template v-if="selectedAlgorithm === 'aes'">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="模式">
              <a-select v-model:value="aesOptions.mode">
                <a-select-option value="ECB">ECB</a-select-option>
                <a-select-option value="CBC">CBC</a-select-option>
                <a-select-option value="CTR">CTR</a-select-option>
                <a-select-option value="CFB">CFB</a-select-option>
                <a-select-option value="OFB">OFB</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="密钥长度">
              <a-select v-model:value="aesOptions.keySize">
                <a-select-option :value="128">128位</a-select-option>
                <a-select-option :value="192">192位</a-select-option>
                <a-select-option :value="256">256位</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="输出格式">
              <a-select v-model:value="aesOptions.outputFormat">
                <a-select-option value="base64">Base64</a-select-option>
                <a-select-option value="hex">Hex</a-select-option>
                <a-select-option value="text">Text</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item v-if="aesOptions.mode !== 'ECB'" label="IV (初始化向量)">
          <a-input 
            v-model:value="aesOptions.iv" 
            :placeholder="'请输入16字节的初始化向量'"
            :suffix="`${aesOptions.iv.length}/16字节`"
            :status="aesOptions.iv.length > 0 && aesOptions.iv.length !== 16 ? 'error' : ''"
          />
        </a-form-item>
      </template>

      <a-form-item label="密钥">
        <a-input 
          v-model:value="key" 
          :placeholder="getKeyPlaceholder()"
          :suffix="getKeySuffix()"
          :status="key.length > 0 && !isValidKeyLength ? 'error' : ''"
        />
      </a-form-item>

      <a-form-item label="输入">
        <a-textarea 
          v-model:value="input" 
          :rows="6" 
          :placeholder="getInputPlaceholder()"
        />
      </a-form-item>

      <a-row :gutter="16" class="mt-4">
        <a-col :span="12">
          <a-button 
            type="primary" 
            block 
            @click="processCrypto('encrypt')"
          >
            加密
          </a-button>
        </a-col>
        <a-col :span="12">
          <a-button 
            type="default" 
            block 
            @click="processCrypto('decrypt')"
          >
            解密
          </a-button>
        </a-col>
      </a-row>

      <a-form-item label="结果" class="mt-4">
        <a-textarea 
          v-model:value="result" 
          :rows="6" 
          readonly 
        />
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import CryptoJS from 'crypto-js'
import forge from 'node-forge'

export default {
  data() {
    return {
      cryptoAlgorithms: [
        { key: 'aes', name: 'AES' },
        { key: 'des', name: 'DES' },
        { key: 'tripledes', name: 'Triple DES' },
        { key: 'blowfish', name: 'Blowfish' },
        { key: 'rabbit', name: 'Rabbit' },
        { key: 'rc4', name: 'RC4' },
        { key: 'rsa', name: 'RSA' },
        { key: 'ecc', name: 'ECC' },
        { key: 'chacha20', name: 'ChaCha20' },
        { key: 'salsa20', name: 'Salsa20' }
      ],
      selectedAlgorithm: 'aes',
      input: '',
      key: '',
      result: '',
      aesOptions: {
        mode: 'CBC',
        keySize: 256,
        outputFormat: 'base64',
        iv: ''
      }
    }
  },
  computed: {
    isValidKeyLength() {
      const expectedLength = this.getExpectedKeyLength()
      return this.key.length === expectedLength
    }
  },
  methods: {
    selectAlgorithm(key) {
      this.selectedAlgorithm = key
      this.result = ''
      this.key = ''
    },
    getKeyPlaceholder() {
      const placeholders = {
        'aes': `请输入${this.aesOptions.keySize/8}字节的密钥`,
        'des': '请输入8位密钥',
        'tripledes': '请输入24位密钥',
        'blowfish': '请输入密钥',
        'rabbit': '请输入16位密钥',
        'rc4': '请输入密钥',
        'rsa': '请输入公钥或私钥',
        'ecc': '请输入密钥',
        'chacha20': '请输入32位密钥',
        'salsa20': '请输入32位密钥'
      }
      return placeholders[this.selectedAlgorithm]
    },
    getInputPlaceholder() {
      const placeholders = {
        'aes': '请输入要加密/解密的文本',
        'des': '请输入要加密/解密的文本',
        'tripledes': '请输入要加密/解密的文本',
        'blowfish': '请输入要加密/解密的文本',
        'rabbit': '请输入要加密/解密的文本',
        'rc4': '请输入要加密/解密的文本',
        'rsa': '请输入要加密/解密的文本',
        'ecc': '请输入要加密/解密的文本',
        'chacha20': '请输入要加密/解密的文本',
        'salsa20': '请输入要加密/解密的文本'
      }
      return placeholders[this.selectedAlgorithm]
    },
    getExpectedKeyLength() {
      const lengths = {
        'aes': this.aesOptions.keySize / 8,
        'des': 8,
        'tripledes': 24,
        'rabbit': 16,
        'rc4': 16,
        'chacha20': 32,
        'salsa20': 32
      }
      return lengths[this.selectedAlgorithm] || 0
    },
    getKeySuffix() {
      const expectedLength = this.getExpectedKeyLength()
      if (expectedLength === 0) {
        return ''  // RSA、ECC 等不需要固定长度的算法
      }
      return `${this.key.length}/${expectedLength}字节`
    },
    validateAesInput() {
      const keyLength = this.key.length
      const expectedLength = this.aesOptions.keySize / 8
      if (keyLength !== expectedLength) {
        throw new Error(`密钥长度必须为 ${expectedLength} 字节`)
      }

      if (this.aesOptions.mode !== 'ECB' && !this.aesOptions.iv) {
        throw new Error('请输入初始化向量 (IV)')
      }

      if (this.aesOptions.mode !== 'ECB' && this.aesOptions.iv.length !== 16) {
        throw new Error('初始化向量必须为16字节')
      }
    },
    processCrypto(operation) {
      if (!this.input) {
        message.warning('请输入文本')
        return
      }

      if (!this.key) {
        message.warning('请输入密钥')
        return
      }

      try {
        if (this.selectedAlgorithm === 'aes') {
          this.validateAesInput()
        }

        const crypto = this.getCrypto(this.selectedAlgorithm)
        const processFunc = crypto[operation]
        
        if (typeof processFunc === 'function') {
          this.result = processFunc(this.input, this.key)
        } else {
          message.error('不支持的操作')
        }
      } catch (error) {
        message.error(`处理失败：${error.message}`)
      }
    },
    getCrypto(algorithmKey) {
      const cryptos = {
        aes: {
          encrypt: (input, key) => {
            const options = {
              mode: CryptoJS.mode[this.aesOptions.mode],
              padding: CryptoJS.pad.Pkcs7,
              keySize: this.aesOptions.keySize / 32
            }

            if (this.aesOptions.mode !== 'ECB') {
              options.iv = CryptoJS.enc.Utf8.parse(this.aesOptions.iv)
            }

            const keyObj = CryptoJS.enc.Utf8.parse(key)
            const encrypted = CryptoJS.AES.encrypt(input, keyObj, options)

            switch (this.aesOptions.outputFormat) {
              case 'base64':
                return encrypted.toString()
              case 'hex':
                return encrypted.ciphertext.toString(CryptoJS.enc.Hex)
              case 'text':
                return encrypted.toString(CryptoJS.enc.Utf8)
              default:
                return encrypted.toString()
            }
          },
          decrypt: (input, key) => {
            const options = {
              mode: CryptoJS.mode[this.aesOptions.mode],
              padding: CryptoJS.pad.Pkcs7,
              keySize: this.aesOptions.keySize / 32
            }

            if (this.aesOptions.mode !== 'ECB') {
              options.iv = CryptoJS.enc.Utf8.parse(this.aesOptions.iv)
            }

            const keyObj = CryptoJS.enc.Utf8.parse(key)
            let decrypted

            if (this.aesOptions.outputFormat === 'hex') {
              const ciphertext = CryptoJS.enc.Hex.parse(input)
              const cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: ciphertext
              })
              decrypted = CryptoJS.AES.decrypt(cipherParams, keyObj, options)
            } else {
              decrypted = CryptoJS.AES.decrypt(input, keyObj, options)
            }

            return decrypted.toString(CryptoJS.enc.Utf8)
          }
        },
        des: {
          encrypt: (input, key) => CryptoJS.DES.encrypt(input, key).toString(),
          decrypt: (input, key) => CryptoJS.DES.decrypt(input, key).toString(CryptoJS.enc.Utf8)
        },
        tripledes: {
          encrypt: (input, key) => CryptoJS.TripleDES.encrypt(input, key).toString(),
          decrypt: (input, key) => CryptoJS.TripleDES.decrypt(input, key).toString(CryptoJS.enc.Utf8)
        },
        blowfish: {
          encrypt: (input, key) => CryptoJS.Blowfish.encrypt(input, key).toString(),
          decrypt: (input, key) => CryptoJS.Blowfish.decrypt(input, key).toString(CryptoJS.enc.Utf8)
        },
        rabbit: {
          encrypt: (input, key) => CryptoJS.Rabbit.encrypt(input, key).toString(),
          decrypt: (input, key) => CryptoJS.Rabbit.decrypt(input, key).toString(CryptoJS.enc.Utf8)
        },
        rc4: {
          encrypt: (input, key) => CryptoJS.RC4.encrypt(input, key).toString(),
          decrypt: (input, key) => CryptoJS.RC4.decrypt(input, key).toString(CryptoJS.enc.Utf8)
        },
        rsa: {
          encrypt: (input, key) => {
            const publicKey = forge.pki.publicKeyFromPem(key)
            return forge.util.encode64(publicKey.encrypt(input))
          },
          decrypt: (input, key) => {
            const privateKey = forge.pki.privateKeyFromPem(key)
            return privateKey.decrypt(forge.util.decode64(input))
          }
        },
        ecc: {
          encrypt: (input, publicKeyPem) => {
            const publicKey = forge.pki.publicKeyFromPem(publicKeyPem)
            const encrypted = publicKey.encrypt(input)
            return forge.util.encode64(encrypted)
          },
          decrypt: (input, privateKey) => {
            const privateKeyObj = forge.pki.privateKeyFromPem(privateKey)
            return privateKeyObj.decrypt(forge.util.decode64(input))
          }
        },
        chacha20: {
          encrypt: (input, key) => {
            const nonce = CryptoJS.lib.WordArray.random(12)
            const encrypted = CryptoJS.ChaCha20.encrypt(input, key, { iv: nonce })
            return encrypted.toString()
          },
          decrypt: (input, key) => {
            const decrypted = CryptoJS.ChaCha20.decrypt(input, key)
            return decrypted.toString(CryptoJS.enc.Utf8)
          }
        },
        salsa20: {
          encrypt: (input, key) => {
            const nonce = CryptoJS.lib.WordArray.random(8)
            const encrypted = CryptoJS.Salsa20.encrypt(input, key, { iv: nonce })
            return encrypted.toString()
          },
          decrypt: (input, key) => {
            const decrypted = CryptoJS.Salsa20.decrypt(input, key)
            return decrypted.toString(CryptoJS.enc.Utf8)
          }
        }
      }
      return cryptos[algorithmKey]
    }
  }
}
</script>

<style scoped>
.crypto-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.crypto-btn {
  margin-bottom: 8px;
}

.ant-form-item {
  margin-bottom: 16px;
}
</style> 