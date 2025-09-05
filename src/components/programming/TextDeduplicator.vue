<template>
  <div>
    <a-card>
      <h1>文本去重工具</h1>

      <div class="controls">
        <label class="wrap-label">
          <input type="checkbox" v-model="lineWrap" @change="toggleLineWrap" />
          自动换行
        </label>
        <label class="case-sensitive-label">
          <input type="checkbox" v-model="caseSensitive" />
          区分大小写
        </label>
        <label class="trim-label">
          <input type="checkbox" v-model="trimWhitespace" />
          去除首尾空格
        </label>
        <button @click="deduplicateText">去重处理</button>
        <button @click="clearAll">清空</button>
      </div>

      <div class="editor-container">
        <div class="editor-box">
          <label>原始文本</label>
          <textarea ref="inputEditor"></textarea>
        </div>
        <div class="editor-box">
          <label>去重结果</label>
          <textarea ref="outputEditor" readonly></textarea>
        </div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">原始行数:</span>
          <span class="stat-value">{{ originalLineCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">去重后行数:</span>
          <span class="stat-value">{{ deduplicatedLineCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">重复行数:</span>
          <span class="stat-value">{{ duplicateLineCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">去重率:</span>
          <span class="stat-value">{{ deduplicationRate }}%</span>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script>
import { onMounted, ref, computed } from "vue";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript";

export default {
  setup() {
    const inputEditor = ref(null);
    const outputEditor = ref(null);
    const lineWrap = ref(true);
    const caseSensitive = ref(false);
    const trimWhitespace = ref(true);
    const originalLineCount = ref(0);
    const deduplicatedLineCount = ref(0);

    let inputCodeMirror = null;
    let outputCodeMirror = null;

    const duplicateLineCount = computed(() => {
      return originalLineCount.value - deduplicatedLineCount.value;
    });

    const deduplicationRate = computed(() => {
      if (originalLineCount.value === 0) return 0;
      return Math.round((duplicateLineCount.value / originalLineCount.value) * 100);
    });

    onMounted(() => {
      inputCodeMirror = CodeMirror.fromTextArea(inputEditor.value, {
        lineNumbers: true,
        mode: "javascript",
        theme: "default",
        lineWrapping: true,
        viewportMargin: Infinity,
        placeholder: "请输入需要去重的文本，每行一个条目..."
      });

      outputCodeMirror = CodeMirror.fromTextArea(outputEditor.value, {
        lineNumbers: true,
        mode: "javascript",
        theme: "default",
        lineWrapping: true,
        viewportMargin: Infinity,
        readOnly: true,
        placeholder: "去重结果将显示在这里..."
      });

      // 监听输入变化
      inputCodeMirror.on('change', () => {
        updateStats();
      });
    });

    const toggleLineWrap = () => {
      inputCodeMirror.setOption("lineWrapping", lineWrap.value);
      outputCodeMirror.setOption("lineWrapping", lineWrap.value);
    };

    const updateStats = () => {
      const text = inputCodeMirror.getValue();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      originalLineCount.value = lines.length;
    };

    const deduplicateText = () => {
      const inputText = inputCodeMirror.getValue();
      const lines = inputText.split('\n');
      
      // 处理每一行
      const processedLines = lines.map(line => {
        if (trimWhitespace.value) {
          return line.trim();
        }
        return line;
      });

      // 去重逻辑
      const uniqueLines = [];
      const seen = new Set();
      
      processedLines.forEach(line => {
        const key = caseSensitive.value ? line : line.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLines.push(line);
        }
      });

      // 更新输出编辑器
      const result = uniqueLines.join('\n');
      outputCodeMirror.setValue(result);
      
      // 更新统计信息
      deduplicatedLineCount.value = uniqueLines.length;
    };

    const clearAll = () => {
      inputCodeMirror.setValue('');
      outputCodeMirror.setValue('');
      originalLineCount.value = 0;
      deduplicatedLineCount.value = 0;
    };

    return {
      inputEditor,
      outputEditor,
      lineWrap,
      caseSensitive,
      trimWhitespace,
      originalLineCount,
      deduplicatedLineCount,
      duplicateLineCount,
      deduplicationRate,
      toggleLineWrap,
      deduplicateText,
      clearAll
    };
  },
};
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
  margin: 20px;
  background: #f9f9f9;
}

h1 {
  text-align: center;
  margin-bottom: 15px;
}

.editor-container {
  display: flex;
  margin: 0 auto;
  height: 600px;
  border: 1px solid #ddd;
  background: white;
}

.editor-box {
  width: 50%;
  display: flex;
  flex-direction: column;
}

.editor-box label {
  padding: 8px 12px;
  background: #f0f0f0;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
}

:deep(.CodeMirror) {
  flex-grow: 1;
  height: 100% !important;
  font-size: 14px;
}

.controls {
  max-width: 1200px;
  margin: 10px auto 30px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

button {
  font-size: 16px;
  padding: 8px 18px;
  cursor: pointer;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
}

button:hover {
  background-color: #0056b3;
}

button:last-of-type {
  background-color: #6c757d;
}

button:last-of-type:hover {
  background-color: #545b62;
}

.wrap-label,
.case-sensitive-label,
.trim-label {
  font-weight: normal;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.wrap-label input,
.case-sensitive-label input,
.trim-label input {
  margin: 0;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
}

@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
    height: auto;
  }
  
  .editor-box {
    width: 100%;
    height: 300px;
  }
  
  .controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .stats {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
