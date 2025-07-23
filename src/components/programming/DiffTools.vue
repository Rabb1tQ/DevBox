<template>
  <div>
    <a-card>
      <h1>代码对比工具</h1>

      <div class="controls">
        <label class="wrap-label">
          <input type="checkbox" v-model="lineWrap" @change="toggleLineWrap" />
          自动换行
        </label>
        <button @click="highlightDiff">对比差异</button>
      </div>

      <div class="editor-container">
        <div class="editor-box">
          <label>原始代码</label>
          <textarea ref="left"></textarea>
        </div>
<!-- 
        <div class="split-line" title="对应行" aria-hidden="true">⇄</div>
 -->
        <div class="editor-box">
          <label>修改后代码</label>
          <textarea ref="right"></textarea>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
// 修改 CodeMirror 相关导入
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript";
import { diffWords } from "diff";

export default {
  setup() {
    const left = ref(null);
    const right = ref(null);
    const lineWrap = ref(true);
    let leftEditor = null;
    let rightEditor = null;

    onMounted(() => {
      leftEditor = CodeMirror.fromTextArea(left.value, {
        lineNumbers: true,
        mode: "javascript",
        theme: "default",
        lineWrapping: true,
        viewportMargin: Infinity,
      });

      rightEditor = CodeMirror.fromTextArea(right.value, {
        lineNumbers: true,
        mode: "javascript",
        theme: "default",
        lineWrapping: true,
        viewportMargin: Infinity,
      });
    });

    const toggleLineWrap = () => {
      leftEditor.setOption("lineWrapping", lineWrap.value);
      rightEditor.setOption("lineWrapping", lineWrap.value);
    };

    const clearLineClass = (editor) => {
      const lineCount = editor.lineCount();
      for (let i = 0; i < lineCount; i++) {
        editor.removeLineClass(i, "background", "added-line");
        editor.removeLineClass(i, "background", "removed-line");
      }
    };

    const highlightDiff = () => {
      const leftText = leftEditor.getValue();
      const rightText = rightEditor.getValue();

      leftEditor.getAllMarks().forEach((m) => m.clear());
      rightEditor.getAllMarks().forEach((m) => m.clear());
      clearLineClass(leftEditor);
      clearLineClass(rightEditor);

      const leftLines = leftText.split("\n");
      const rightLines = rightText.split("\n");
      const maxLines = Math.max(leftLines.length, rightLines.length);

      for (let i = 0; i < maxLines; i++) {
        const leftLine = leftLines[i] || "";
        const rightLine = rightLines[i] || "";

        if (leftLine === rightLine) continue;

        const diff = diffWords(leftLine, rightLine);
        let leftIdx = 0;
        let rightIdx = 0;
        let hasChange = false;

        diff.forEach((part) => {
          if (part.added) {
            rightEditor.markText(
              { line: i, ch: rightIdx },
              { line: i, ch: rightIdx + part.value.length },
              { className: "added-inline" }
            );
            rightIdx += part.value.length;
            hasChange = true;
          } else if (part.removed) {
            leftEditor.markText(
              { line: i, ch: leftIdx },
              { line: i, ch: leftIdx + part.value.length },
              { className: "removed-inline" }
            );
            leftIdx += part.value.length;
            hasChange = true;
          } else {
            leftIdx += part.value.length;
            rightIdx += part.value.length;
          }
        });

        if (hasChange) {
          leftEditor.addLineClass(i, "background", "removed-line");
          rightEditor.addLineClass(i, "background", "added-line");
        }
      }
    };

    return {
      left,
      right,
      lineWrap,
      toggleLineWrap,
      highlightDiff,
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
.split-line {
  width: 30px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #666;
  user-select: none;
  background: #fafafa;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}
.split-line::before {
  content: "";
  position: absolute;
  width: 1px;
  background: #ccc;
  top: 5px;
  bottom: 5px;
  left: 50%;
  z-index: 1;
}
:deep(.added-inline) {
  background-color: #b2fab4;
}
:deep(.removed-inline) {
  background-color: #ffbcbc;
}
:deep(.added-line) {
  background-color: #e6f9e6 !important;
}
:deep(.removed-line) {
  background-color: #f9e6e6 !important;
}
.controls {
  max-width: 1200px;
  margin: 10px auto 30px;
  text-align: center;
}
button {
  font-size: 16px;
  padding: 8px 18px;
  margin: 0 10px;
  cursor: pointer;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
}
button:hover {
  background-color: #0056b3;
}
.wrap-label {
  font-weight: normal;
  user-select: none;
}
.wrap-label input {
  margin-right: 6px;
}
</style>
