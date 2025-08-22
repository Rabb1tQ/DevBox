<template>
  <a-card title="高级编解码工具">
    <a-row :gutter="16">
      <a-col :span="24" class="codec-buttons">
        <a-button
            v-for="codec in codecList"
            :key="codec.key"
            :type="selectedCodec === codec.key ? 'primary' : 'default'"
            @click="selectCodec(codec.key)"
            class="codec-btn"
        >
          {{ codec.name }}
        </a-button>
      </a-col>
    </a-row>

    <a-form layout="vertical" class="mt-4">
      <a-form-item label="输入">
        <a-textarea
            v-model:value="input"
            :rows="6"
            :placeholder="getPlaceholder()"
        />
      </a-form-item>

      <a-row :gutter="16" class="mt-4">
        <a-col :span="12">
          <a-button
              type="primary"
              block
              @click="processCodec('encode')"
              :disabled="isNonDecodable('encode')"
          >
            编码
          </a-button>
        </a-col>
        <a-col :span="12">
          <a-button
              type="default"
              block
              @click="processCodec('decode')"
              :disabled="isNonDecodable('decode')"
          >
            解码
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
import { encode as base64Encode, decode as base64Decode } from 'js-base64'
import { md5, sha1, sha256, sha512 } from 'js-sha256'
import he from 'he'
import { Buffer } from 'buffer'

export default {
  data() {
    return {
      codecList: [
        { key: 'base64', name: 'Base64' },
        { key: 'url', name: 'URL' },
        { key: 'hex', name: 'Hex' },
        { key: 'html', name: 'HTML 实体' },
        { key: 'binary', name: '二进制' },
        { key: 'rot13', name: 'ROT13' },
        { key: 'caesar', name: '凯撒密码' },
        { key: 'morse', name: '摩斯电码' },
        { key: 'base32', name: 'Base32' },
        { key: 'md5', name: 'MD5' },
        { key: 'sha1', name: 'SHA-1' },
        { key: 'sha256', name: 'SHA-256' },
        { key: 'sha512', name: 'SHA-512' },
        { key: 'unicode', name: 'Unicode' },
        { key: 'ascii', name: 'ASCII' }
      ],
      selectedCodec: 'base64',
      input: '',
      result: ''
    }
  },
  methods: {
    selectCodec(key) {
      this.selectedCodec = key
      this.result = ''
    },
    getPlaceholder() {
      const placeholders = {
        'base64': '请输入要编码/解码的文本',
        'url': '请输入要编码/解码的文本',
        'hex': '请输入要编码/解码的文本',
        'html': '请输入要编码/解码的文本',
        'binary': '请输入要编码/解码的文本',
        'rot13': '请输入要编码/解码的文本',
        'caesar': '请输入要编码/解码的文本',
        'morse': '请输入要编码/解码的文本',
        'base32': '请输入要编码/解码的文本',
        'md5': '请输入要计算哈希的文本',
        'sha1': '请输入要计算哈希的文本',
        'sha256': '请输入要计算哈希的文本',
        'sha512': '请输入要计算哈希的文本',
        'unicode': '请输入要编码/解码的文本',
        'ascii': '请输入要编码/解码的文本'
      }
      return placeholders[this.selectedCodec]
    },
    isNonDecodable(operation) {
      const nonDecodable = ['md5', 'sha1', 'sha256', 'sha512']
      return operation === 'decode' && nonDecodable.includes(this.selectedCodec)
    },
    async processCodec(operation) {
      if (!this.input) {
        message.warning('请输入文本')
        return
      }

      try {
        const codec = this.getCodec(this.selectedCodec)
        const processFunc = codec[operation]

        if (typeof processFunc === 'function') {
          this.result = await processFunc(this.input)
        } else {
          message.error('不支持的操作')
        }
      } catch (error) {
        message.error(`处理失败：${error.message}`)
      }
    },
    getCodec(codecKey) {
      const codecs = {
        base64: {
          encode: input => base64Encode(input),
          decode: input => base64Decode(input)
        },
        url: {
          encode: input => encodeURIComponent(input),
          decode: input => decodeURIComponent(input)
        },
        hex: {
          encode: input => Buffer.from(input).toString('hex'),
          decode: input => Buffer.from(input, 'hex').toString('utf8')
        },
        html: {
          encode: input => he.encode(input),
          decode: input => he.decode(input)
        },
        binary: {
          encode: input => Array.from(input).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
          decode: input => input.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('')
        },
        rot13: {
          encode: input => input.replace(/[a-zA-Z]/g, c => String.fromCharCode((c.charCodeAt(0) % 97 < 13 ? c.charCodeAt(0) + 13 : c.charCodeAt(0) - 13))),
          decode: input => input.replace(/[a-zA-Z]/g, c => String.fromCharCode((c.charCodeAt(0) % 97 < 13 ? c.charCodeAt(0) + 13 : c.charCodeAt(0) - 13)))
        },
        caesar: {
          encode: input => {
            const shift = 3
            return input.replace(/[a-zA-Z]/g, c => String.fromCharCode((c.charCodeAt(0) + shift - (c <= 'Z' ? 65 : 97)) % 26 + (c <= 'Z' ? 65 : 97)))
          },
          decode: input => {
            const shift = 3
            return input.replace(/[a-zA-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - shift - (c <= 'Z' ? 65 : 97) + 26) % 26 + (c <= 'Z' ? 65 : 97)))
          }
        },
        morse: {
          encode: this.morseEncode,
          decode: this.morseDecode
        },
        base32: {
          encode: this.base32Encode,
          decode: this.base32Decode
        },
        md5: {
          encode: input => md5(input),
          decode: () => 'MD5 不可解码'
        },
        sha1: {
          encode: input => sha1(input),
          decode: () => 'SHA-1 不可解码'
        },
        sha256: {
          encode: input => sha256(input),
          decode: () => 'SHA-256 不可解码'
        },
        sha512: {
          encode: input => sha512(input),
          decode: () => 'SHA-512 不可解码'
        },
        unicode: {
          encode: input => {
            // 中文转Unicode
            return input.split('').map(char => {
              const code = char.charCodeAt(0);
              // 对于ASCII字符不转义
              return code < 128 ? char : '\\u' + code.toString(16).padStart(4, '0');
            }).join('');
          },
          decode: input => {
            // Unicode转中文
            return input.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
              return String.fromCharCode(parseInt(hex, 16));
            });
          }
        },
        ascii: {
          encode: input => {
            // 将每个字符强制转换为十进制ASCII码（无论是否可打印）
            return input.split('').map(char =>
                char.charCodeAt(0) // 直接返回数字编码
            ).join(' '); // 用空格分隔每个编码
          },
          decode: input => {
            // 按空格分割输入，将每个数字字符串转为字符
            return input.trim().split(/\s+/).map(numStr => {
              const code = parseInt(numStr, 10);
              return isNaN(code) ? '' : String.fromCharCode(code); // 跳过非法数字
            }).join('');
          }
        }
      }
      return codecs[codecKey]
    },
    morseEncode(input) {
      const morseCode = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
        'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
        'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
        '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
      }
      return input.toUpperCase().split('').map(c => morseCode[c] || c).join(' ')
    },
    morseDecode(input) {
      const morseCode = {
        '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H',
        '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P',
        '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
        '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4',
        '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9'
      }
      return input.split(' ').map(code => morseCode[code] || code).join('')
    },
    base32Encode(input) {
      const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
      let bits = 0, value = 0, result = ''
      for (let i = 0; i < input.length; i++) {
        value = (value << 8) + input.charCodeAt(i)
        bits += 8
        while (bits >= 5) {
          bits -= 5
          result += base32Alphabet[(value >>> bits) & 31]
        }
      }
      if (bits > 0) {
        result += base32Alphabet[(value << (5 - bits)) & 31]
        while (result.length % 8 !== 0) result += '='
      }
      return result
    },
    base32Decode(input) {
      const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
      input = input.replace(/=/g, '')
      let bits = 0, value = 0, result = ''
      for (let i = 0; i < input.length; i++) {
        value = (value << 5) + base32Alphabet.indexOf(input[i])
        bits += 5
        while (bits >= 8) {
          bits -= 8
          result += String.fromCharCode((value >>> bits) & 255)
        }
      }
      return result
    }
  }
}
</script>

<style scoped>
.codec-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.codec-btn {
  margin-bottom: 8px;
}

</style>