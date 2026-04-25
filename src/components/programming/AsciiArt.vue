<template>
  <a-card title="ASCII Art 文本生成" class="ascii-art-card">
    <div class="ascii-art-layout">
      <!-- 顶部控制区 -->
      <div class="control-area">
        <a-row :gutter="12">
          <a-col :span="10">
            <a-input
              v-model:value="inputText"
              placeholder="仅支持英文和常用符号"
              allow-clear
              size="small"
              @change="generateAscii"
            />
          </a-col>
          <a-col :span="5">
            <a-select
              v-model:value="selectedFont"
              show-search
              :filter-option="filterFont"
              @change="generateAscii"
              size="small"
              style="width: 100%"
            >
              <a-select-option
                v-for="font in availableFonts"
                :key="font"
                :value="font"
              >
                {{ font }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-select
              v-model:value="horizontalLayout"
              @change="generateAscii"
              size="small"
              style="width: 100%"
            >
              <a-select-option value="default">水平默认</a-select-option>
              <a-select-option value="full">水平完整</a-select-option>
              <a-select-option value="fitted">水平适应</a-select-option>
              <a-select-option value="controlled smushing">水平控制合并</a-select-option>
              <a-select-option value="universal smushing">水平通用合并</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-select
              v-model:value="verticalLayout"
              @change="generateAscii"
              size="small"
              style="width: 100%"
            >
              <a-select-option value="default">垂直默认</a-select-option>
              <a-select-option value="full">垂直完整</a-select-option>
              <a-select-option value="fitted">垂直适应</a-select-option>
              <a-select-option value="controlled smushing">垂直控制合并</a-select-option>
              <a-select-option value="universal smushing">垂直通用合并</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="1" style="text-align: right">
            <a-button type="primary" size="small" @click="copyResult" :disabled="!asciiOutput" title="复制当前字体结果">
              复制
            </a-button>
          </a-col>
        </a-row>
        <a-row :gutter="12" style="margin-top: 8px">
          <a-col :span="24">
            <a-space size="small">
              <a-button size="small" @click="generateCommon" :loading="generatingCommon" :disabled="!inputText">
                生成常用字体 ({{ commonFontNames.length }})
              </a-button>
              <a-button size="small" @click="generateAll" :loading="generatingAll" :disabled="!inputText">
                生成全部字体 ({{ availableFonts.length }})
              </a-button>
              <a-button v-if="allResults.length > 0" size="small" @click="clearAllResults">
                清除预览
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </div>

      <!-- 预览区 -->
      <div class="preview-area">
        <a-spin :spinning="loading" tip="生成中...">
          <div class="preview-content">
            <!-- 所有字体生成结果 -->
            <div v-if="allResults.length > 0" class="all-results">
              <div
                v-for="(item, index) in allResults"
                :key="index"
                class="ascii-result-card"
                :class="{ 'selected': item.font === selectedFont }"
                @click="selectFont(item.font)"
              >
                <div class="ascii-result-header">
                  <span class="ascii-result-font-name">{{ item.font }}</span>
                  <a-button type="link" size="small" @click.stop="copyText(item.text)">复制</a-button>
                </div>
                <pre class="ascii-output">{{ item.text }}</pre>
              </div>
            </div>
            <!-- 单字体预览 -->
            <div v-else-if="asciiOutput" class="ascii-result-card selected">
              <div class="ascii-result-header">
                <span class="ascii-result-font-name">{{ selectedFont }}</span>
                <a-button type="link" size="small" @click="copyText(asciiOutput)">复制</a-button>
              </div>
              <pre class="ascii-output">{{ asciiOutput }}</pre>
            </div>
            <a-empty v-else description="请输入文本以预览" style="margin-top: 40px" />
          </div>
        </a-spin>
      </div>
    </div>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import figlet from 'figlet'

// 静态导入常用字体（构建时打包，无需网络请求）
import Standard from 'figlet/importable-fonts/Standard.js'
import Slant from 'figlet/importable-fonts/Slant.js'
import Banner from 'figlet/importable-fonts/Banner.js'
import Block from 'figlet/importable-fonts/Block.js'
import Digital from 'figlet/importable-fonts/Digital.js'
import ANSIShadow from 'figlet/importable-fonts/ANSI Shadow.js'
import Big from 'figlet/importable-fonts/Big.js'
import Small from 'figlet/importable-fonts/Small.js'
import Isometric1 from 'figlet/importable-fonts/Isometric1.js'
import Ghost from 'figlet/importable-fonts/Ghost.js'
import StarWars from 'figlet/importable-fonts/Star Wars.js'
import Graffiti from 'figlet/importable-fonts/Graffiti.js'
import Speed from 'figlet/importable-fonts/Speed.js'
import Rectangles from 'figlet/importable-fonts/Rectangles.js'
import Shadow from 'figlet/importable-fonts/Shadow.js'
import Chunky from 'figlet/importable-fonts/Chunky.js'
import Colossal from 'figlet/importable-fonts/Colossal.js'
import Bubble from 'figlet/importable-fonts/Bubble.js'
import Thin from 'figlet/importable-fonts/Thin.js'
import Thick from 'figlet/importable-fonts/Thick.js'
import Computer from 'figlet/importable-fonts/Computer.js'
import Letters from 'figlet/importable-fonts/Letters.js'
import SubZero from 'figlet/importable-fonts/Sub-Zero.js'
import Poison from 'figlet/importable-fonts/Poison.js'
import Twisted from 'figlet/importable-fonts/Twisted.js'
import Roman from 'figlet/importable-fonts/Roman.js'
import Crazy from 'figlet/importable-fonts/Crazy.js'
import DotMatrix from 'figlet/importable-fonts/Dot Matrix.js'
import EftiRobot from 'figlet/importable-fonts/Efti Robot.js'
import Puffy from 'figlet/importable-fonts/Puffy.js'

// 常用字体映射（构建时打包）
const bundledFonts = {
  'Standard': Standard,
  'Slant': Slant,
  'Banner': Banner,
  'Block': Block,
  'Digital': Digital,
  'ANSI Shadow': ANSIShadow,
  'Big': Big,
  'Small': Small,
  'Isometric1': Isometric1,
  'Ghost': Ghost,
  'Star Wars': StarWars,
  'Graffiti': Graffiti,
  'Speed': Speed,
  'Rectangles': Rectangles,
  'Shadow': Shadow,
  'Chunky': Chunky,
  'Colossal': Colossal,
  'Bubble': Bubble,
  'Thin': Thin,
  'Thick': Thick,
  'Computer': Computer,
  'Letters': Letters,
  'Sub-Zero': SubZero,
  'Poison': Poison,
  'Twisted': Twisted,
  'Roman': Roman,
  'Crazy': Crazy,
  'Dot Matrix': DotMatrix,
  'Efti Robot': EftiRobot,
  'Puffy': Puffy
}

export default {
  data() {
    return {
      inputText: '',
      selectedFont: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      asciiOutput: '',
      allResults: [],
      availableFonts: [],
      loading: false,
      generatingAll: false,
      generatingCommon: false
    }
  },
  computed: {
    commonFontNames() {
      return Object.keys(bundledFonts).sort((a, b) => a.localeCompare(b))
    }
  },
  created() {
    // 1. 预加载打包的常用字体
    Object.entries(bundledFonts).forEach(([name, data]) => {
      figlet.parseFont(name, data)
    })

    // 2. 设置 fetch 路径，用于加载其余字体
    figlet.defaults({ fontPath: './fonts' })

    // 3. 获取完整字体列表
    figlet.fonts((err, fonts) => {
      if (err) {
        console.error('获取字体列表失败:', err)
        // 降级：只使用打包的字体
        this.availableFonts = Object.keys(bundledFonts).sort((a, b) => a.localeCompare(b))
        return
      }
      this.availableFonts = fonts.sort((a, b) => a.localeCompare(b))
    })
  },
  methods: {
    async generateAscii() {
      if (!this.inputText) {
        this.asciiOutput = ''
        return
      }
      this.loading = true
      try {
        this.asciiOutput = await figlet.text(this.inputText, {
          font: this.selectedFont,
          horizontalLayout: this.horizontalLayout,
          verticalLayout: this.verticalLayout,
          width: 120,
          whitespaceBreak: true
        })
      } catch (e) {
        this.asciiOutput = '生成失败: ' + e.message
      }
      this.loading = false
    },
    async generateCommon() {
      if (!this.inputText) {
        message.warning('请先输入文本')
        return
      }
      this.generatingCommon = true
      this.loading = true
      const results = []

      for (const font of this.commonFontNames) {
        try {
          const text = figlet.textSync(this.inputText, {
            font: font,
            horizontalLayout: this.horizontalLayout,
            verticalLayout: this.verticalLayout,
            width: 120,
            whitespaceBreak: true
          })
          results.push({ font, text })
        } catch (e) {
          // 跳过生成失败的字体
        }
      }

      this.allResults = results
      const current = results.find(r => r.font === this.selectedFont)
      this.asciiOutput = current ? current.text : ''
      this.generatingCommon = false
      this.loading = false
    },
    async generateAll() {
      if (!this.inputText) {
        message.warning('请先输入文本')
        return
      }
      this.generatingAll = true
      this.loading = true
      const results = []

      for (const font of this.availableFonts) {
        try {
          const text = await figlet.text(this.inputText, {
            font: font,
            horizontalLayout: this.horizontalLayout,
            verticalLayout: this.verticalLayout,
            width: 120,
            whitespaceBreak: true
          })
          results.push({ font, text })
        } catch (e) {
          // 跳过生成失败的字体
        }
      }

      this.allResults = results
      const current = results.find(r => r.font === this.selectedFont)
      this.asciiOutput = current ? current.text : ''
      this.generatingAll = false
      this.loading = false
    },
    clearAllResults() {
      this.allResults = []
    },
    selectFont(font) {
      this.selectedFont = font
      this.generateAscii()
    },
    filterFont(input, option) {
      return option.value.toLowerCase().includes(input.toLowerCase())
    },
    copyResult() {
      if (!this.asciiOutput) {
        message.warning('没有可复制的内容')
        return
      }
      this.copyText(this.asciiOutput)
    },
    copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        message.success('已复制到剪贴板')
      }).catch(() => {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        message.success('已复制到剪贴板')
      })
    }
  }
}
</script>

<style scoped>
.ascii-art-card {
  height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
}

.ascii-art-card :deep(.ant-card-head) {
  flex-shrink: 0;
}

.ascii-art-card :deep(.ant-card-body) {
  padding: 12px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ascii-art-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.control-area {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.preview-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.preview-area :deep(.ant-spin-nested-loading) {
  height: 100%;
}

.preview-area :deep(.ant-spin-container) {
  height: 100%;
}

.preview-content {
  height: 100%;
  overflow: hidden;
}

.all-results {
  height: 100%;
  overflow-y: auto;
}

.ascii-result-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.ascii-result-card:hover {
  border-color: #91caff;
}

.ascii-result-card.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.ascii-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.ascii-result-font-name {
  font-weight: 600;
  color: #1890ff;
  font-size: 12px;
}

.ascii-output {
  font-family: 'Courier New', Courier, monospace;
  font-size: 8px;
  line-height: 1.1;
  margin: 0;
  padding: 8px;
  white-space: pre;
  overflow-x: auto;
  background: #fff;
}
</style>
