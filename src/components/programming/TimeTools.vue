<template>
  <div>
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="timestamp" tab="时间戳转换">
        <a-card>
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="时间戳">
                  <a-input-number
                    v-model:value="timestamp"
                    style="width: 100%"
                    :precision="0"
                    :max="9999999999999"
                    placeholder="请输入时间戳"
                  />
                  <div class="mt-2">
                    <a-radio-group v-model:value="timestampUnit" button-style="solid">
                      <a-radio-button value="s">秒</a-radio-button>
                      <a-radio-button value="ms">毫秒</a-radio-button>
                    </a-radio-group>
                    <a-button type="link" @click="setCurrentTimestamp">当前时间</a-button>
                  </div>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="日期时间">
                  <a-date-picker
                    v-model:value="datetime"
                    show-time
                    style="width: 100%"
                    :show-now="true"
                    @change="onDateChange"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </a-tab-pane>

      <a-tab-pane key="cron" tab="Cron 表达式">
        <a-card>
          <a-form layout="vertical">
            <a-form-item label="Cron 表达式">
              <a-input
                v-model:value="cronExpression"
                placeholder="请输入 Cron 表达式"
                :suffix="cronValid ? '✓' : '✗'"
                :status="cronExpression && !cronValid ? 'error' : ''"
              />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" @click="generateNextDates" :disabled="!cronValid">
                生成最近执行时间
              </a-button>
              <a-button class="ml-2" @click="showCronBuilder">图形化生成</a-button>
            </a-form-item>

            <template v-if="nextDates.length > 0">
              <a-divider>最近执行时间</a-divider>
              <a-list bordered>
                <a-list-item v-for="(date, index) in nextDates" :key="index">
                  {{ formatDate(date) }}
                </a-list-item>
              </a-list>
            </template>
          </a-form>
        </a-card>

        <!-- Cron 表达式生成器对话框 -->
        <a-modal
          v-model:visible="cronBuilderVisible"
          title="Cron 表达式生成器"
          width="800px"
          @ok="applyCronExpression"
        >
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="秒">
                  <a-select
                    v-model:value="cronBuilder.second"
                    style="width: 100%"
                    :options="cronOptions.seconds"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="分">
                  <a-select
                    v-model:value="cronBuilder.minute"
                    style="width: 100%"
                    :options="cronOptions.minutes"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="时">
                  <a-select
                    v-model:value="cronBuilder.hour"
                    style="width: 100%"
                    :options="cronOptions.hours"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="日">
                  <a-select
                    v-model:value="cronBuilder.day"
                    style="width: 100%"
                    :options="cronOptions.days"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="月">
                  <a-select
                    v-model:value="cronBuilder.month"
                    style="width: 100%"
                    :options="cronOptions.months"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="周">
                  <a-select
                    v-model:value="cronBuilder.week"
                    style="width: 100%"
                    :options="cronOptions.weeks"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
          <div class="mt-4">
            生成的表达式: {{ generatedCronExpression }}
          </div>
        </a-modal>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { CronParser } from 'cron-parser'

export default {
  data() {
    return {
      activeTab: 'timestamp',
      // 时间戳转换
      timestamp: null,
      datetime: null,
      timestampUnit: 's',
      
      // Cron 表达式
      cronExpression: '',
      nextDates: [],
      cronBuilderVisible: false,
      cronBuilder: {
        second: '*',
        minute: '*',
        hour: '*',
        day: '*',
        month: '*',
        week: '?'
      },
      cronOptions: {
        seconds: [
          { label: '每秒', value: '*' },
          { label: '每5秒', value: '*/5' },
          { label: '每10秒', value: '*/10' },
          { label: '每30秒', value: '*/30' }
        ],
        minutes: [
          { label: '每分钟', value: '*' },
          { label: '每5分钟', value: '*/5' },
          { label: '每10分钟', value: '*/10' },
          { label: '每30分钟', value: '*/30' }
        ],
        hours: [
          { label: '每小时', value: '*' },
          { label: '每2小时', value: '*/2' },
          { label: '每3小时', value: '*/3' },
          { label: '每6小时', value: '*/6' },
          { label: '每12小时', value: '*/12' }
        ],
        days: [
          { label: '每天', value: '*' },
          { label: '每2天', value: '*/2' },
          { label: '每周一', value: '? 1' },
          { label: '每月1号', value: '1' }
        ],
        months: [
          { label: '每月', value: '*' },
          { label: '每2月', value: '*/2' },
          { label: '每季度', value: '*/3' },
          { label: '每半年', value: '*/6' }
        ],
        weeks: [
          { label: '不指定', value: '?' },
          { label: '每周', value: '*' },
          { label: '周一至周五', value: '1-5' },
          { label: '周末', value: '6,7' }
        ]
      }
    }
  },
  computed: {
    cronValid() {
      try {
        if (!this.cronExpression) return true
        CronParser.parseExpression(this.cronExpression)
        return true
      } catch (e) {
        return false
      }
    },
    generatedCronExpression() {
      return `${this.cronBuilder.second} ${this.cronBuilder.minute} ${this.cronBuilder.hour} ${this.cronBuilder.day} ${this.cronBuilder.month} ${this.cronBuilder.week}`
    }
  },
  watch: {
    timestamp(val) {
      if (val) {
        const multiplier = this.timestampUnit === 's' ? 1000 : 1
        this.datetime = dayjs(val * multiplier)
      }
    },
    datetime(val) {
      if (val) {
        const divisor = this.timestampUnit === 's' ? 1000 : 1
        this.timestamp = Math.floor(val.valueOf() / divisor)
      }
    },
    timestampUnit() {
      if (this.timestamp) {
        const currentTimestamp = this.timestamp
        this.timestamp = this.timestampUnit === 's' 
          ? Math.floor(currentTimestamp / 1000)
          : currentTimestamp * 1000
      }
    }
  },
  methods: {
    setCurrentTimestamp() {
      const now = dayjs()
      this.datetime = now
      this.timestamp = Math.floor(now.valueOf() / (this.timestampUnit === 's' ? 1000 : 1))
    },
    onDateChange(date) {
      this.datetime = date
    },
    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    generateNextDates() {
      try {
        const interval = CronParser.parseExpression(this.cronExpression)
        this.nextDates = Array.from({ length: 5 }, () => interval.next().toDate())
      } catch (e) {
        message.error('Cron 表达式解析失败')
      }
    },
    showCronBuilder() {
      this.cronBuilderVisible = true
    },
    applyCronExpression() {
      this.cronExpression = this.generatedCronExpression
      this.cronBuilderVisible = false
      this.generateNextDates()
    }
  }
}
</script>

<style scoped>
.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.ml-2 {
  margin-left: 8px;
}
</style> 