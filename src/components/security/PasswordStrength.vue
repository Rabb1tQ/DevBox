 <template>
  <a-card>
    <a-form layout="vertical">
      <a-form-item label="输入密码">
        <a-input-password
          v-model:value="password"
          placeholder="请输入要评估的密码"
          :maxLength="64"
        />
      </a-form-item>

      <template v-if="password">
        <a-form-item label="密码强度">
          <a-progress
            :percent="strengthScore * 25"
            :status="strengthStatus"
            :stroke-color="strengthColor"
          />
          <div class="strength-text">{{ strengthText }}</div>
        </a-form-item>

        <a-form-item label="评估详情">
          <a-descriptions bordered>
            <a-descriptions-item label="密码长度" :span="3">
              {{ password.length }} 个字符
            </a-descriptions-item>
            <a-descriptions-item label="破解时间" :span="3">
              {{ result.crack_times_display.offline_slow_hashing_1e4_per_second }}
            </a-descriptions-item>
            <a-descriptions-item label="评分详情" :span="3">
              <ul class="feedback-list">
                <template v-if="result.feedback.warning">
                  <li class="warning">{{ result.feedback.warning }}</li>
                </template>
                <template v-for="(suggestion, index) in result.feedback.suggestions" :key="index">
                  <li>{{ suggestion }}</li>
                </template>
              </ul>
            </a-descriptions-item>
          </a-descriptions>
        </a-form-item>

        <a-form-item label="密码组成">
          <a-tag v-if="hasUpperCase" color="blue">大写字母</a-tag>
          <a-tag v-if="hasLowerCase" color="green">小写字母</a-tag>
          <a-tag v-if="hasNumbers" color="orange">数字</a-tag>
          <a-tag v-if="hasSpecialChars" color="purple">特殊字符</a-tag>
        </a-form-item>
      </template>
    </a-form>
  </a-card>
</template>

<script>
import zxcvbn from 'zxcvbn'

export default {
  data() {
    return {
      password: '',
      result: null
    }
  },
  computed: {
    strengthScore() {
      return this.result ? this.result.score : 0
    },
    strengthText() {
      const texts = ['非常弱', '弱', '一般', '强', '非常强']
      return this.result ? texts[this.result.score] : ''
    },
    strengthStatus() {
      const statuses = ['exception', 'exception', 'normal', 'success', 'success']
      return this.result ? statuses[this.result.score] : 'normal'
    },
    strengthColor() {
      const colors = ['#ff4d4f', '#ffa940', '#fadb14', '#73d13d', '#52c41a']
      return this.result ? colors[this.result.score] : ''
    },
    hasUpperCase() {
      return /[A-Z]/.test(this.password)
    },
    hasLowerCase() {
      return /[a-z]/.test(this.password)
    },
    hasNumbers() {
      return /\d/.test(this.password)
    },
    hasSpecialChars() {
      return /[^A-Za-z0-9]/.test(this.password)
    }
  },
  watch: {
    password(newValue) {
      if (newValue) {
        this.result = zxcvbn(newValue)
      } else {
        this.result = null
      }
    }
  }
}
</script>

<style scoped>
.strength-text {
  margin-top: 8px;
  text-align: center;
  font-weight: bold;
}
.feedback-list {
  margin: 0;
  padding-left: 20px;
}
.feedback-list .warning {
  color: #ff4d4f;
}
</style>