<template>
  <view class="device-page">
    <view class="header">
      <text class="title">设备详情</text>
      <text v-if="device">已连接: {{ device.name || device.deviceId }}</text>
    </view>

    <view v-if="device">
      <view class="button-group">
        <view class="action-button" @click="refreshServices">刷新服务</view>
      </view>

      <scroll-view class="service-list" scroll-y>
        <view
          v-for="svc in services"
          :key="svc.uuid"
          class="service-item"
          @click="expandService(svc.uuid)"
        >
          <view class="svc-header">
            <text>服务: {{ svc.uuid }}</text>
            <text>{{ expandedService === svc.uuid ? '▲' : '▼' }}</text>
          </view>

          <view v-if="expandedService === svc.uuid" class="char-list">
            <view
              v-for="char in characteristics[svc.uuid] || []"
              :key="char.uuid"
              class="char-item"
            >
              <text class="char-uuid">{{ char.uuid }}</text>
              <text class="char-value">value: {{ char.value || '--' }}</text>

              <view class="char-buttons">
                <view
                  v-if="char.properties.read"
                  class="char-button"
                  @click.stop="readChar(svc.uuid, char.uuid)"
                >
                  读
                </view>
                <view
                  v-if="char.properties.write || char.properties.writeWithoutResponse"
                  class="char-button"
                  @click.stop="writeCharPrompt(svc.uuid, char.uuid)"
                >
                  写
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-else class="no-device">
      <text>请先连接设备。</text>
    </view>

    <!-- 写入输入弹窗 -->
    <view v-if="writeDialog.visible" class="write-dialog">
      <view class="dialog-box">
        <text class="dialog-title">写入特征值</text>
        <input
          v-model="writeDialog.input"
          placeholder="输入 16 进制，如：01 ff ab"
          class="dialog-input"
        />

        <view class="dialog-buttons">
          <view class="dialog-btn cancel" @click="closeWriteDialog">取消</view>
          <view class="dialog-btn confirm" @click="confirmWrite">写入</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Device {
  deviceId: string
  name?: string
}

interface BLEService {
  uuid: string
  isPrimary?: boolean
}

interface BLECharacteristic {
  uuid: string
  properties: {
    read?: boolean
    write?: boolean
    writeWithoutResponse?: boolean
    notify?: boolean
    indicate?: boolean
  }
  value: string | null
}

const props = defineProps<{ device: Device | null }>()

const services = ref<BLEService[]>([])
const characteristics = ref<Record<string, BLECharacteristic[]>>({})
const expandedService = ref<string | null>(null)

watch(
  () => props.device,
  (newDev) => {
    if (newDev) {
      refreshServices()
    } else {
      services.value = []
      characteristics.value = {}
      expandedService.value = null
    }
  }
)

function refreshServices() {
  if (!props.device) return

  uni.getBLEDeviceServices({
    deviceId: props.device.deviceId,
    success(res) {
      services.value = res.services || []
      characteristics.value = {}

      res.services.forEach((svc: BLEService) => {
        loadCharacteristics(svc.uuid)
      })
    },
    fail(err) {
      console.error('获取服务失败', err)
    }
  })
}

function loadCharacteristics(serviceUUID: string) {
  if (!props.device) return

  uni.getBLEDeviceCharacteristics({
    deviceId: props.device.deviceId,
    serviceId: serviceUUID,
    success(res) {
      const chars: BLECharacteristic[] = (res.characteristics || []).map(
        (c: any) => ({
          ...c,
          value: null
        })
      )
      characteristics.value[serviceUUID] = chars
    },
    fail(err) {
      console.error('获取特征值失败', err)
    }
  })
}

function expandService(uuid: string) {
  expandedService.value = expandedService.value === uuid ? null : uuid
}

function readChar(svcUUID: string, charUUID: string) {
  if (!props.device) return

  uni.readBLECharacteristicValue({
    deviceId: props.device.deviceId,
    serviceId: svcUUID,
    characteristicId: charUUID,
    success() {
      uni.onBLECharacteristicValueChange((res) => {
        if (res.characteristicId === charUUID) {
          const arr = Array.from(new Uint8Array(res.value))
          const hex = arr.map((b) => b.toString(16).padStart(2, '0')).join(' ')
          updateCharValue(svcUUID, charUUID, hex)
        }
      })
    },
    fail(err) {
      console.error('读取失败', err)
    }
  })
}

const writeDialog = ref<{
  visible: boolean
  serviceUUID: string
  charUUID: string
  input: string
}>({
  visible: false,
  serviceUUID: '',
  charUUID: '',
  input: ''
})

function writeCharPrompt(serviceUUID: string, charUUID: string) {
  writeDialog.value = {
    visible: true,
    serviceUUID,
    charUUID,
    input: ''
  }
}

function closeWriteDialog() {
  writeDialog.value.visible = false
}

function confirmWrite() {
  const input = writeDialog.value.input.trim()
  if (!input || !props.device) return

  const bytes = new Uint8Array(
    input.split(/\s+/).map((v) => parseInt(v, 16))
  )

  uni.writeBLECharacteristicValue({
    deviceId: props.device.deviceId,
    serviceId: writeDialog.value.serviceUUID,
    characteristicId: writeDialog.value.charUUID,
    value: bytes.buffer,
    success() {
      console.log('写入成功')
      updateCharValue(writeDialog.value.serviceUUID, writeDialog.value.charUUID, input)
    },
    fail(err) {
      console.error('写入失败', err)
    },
    complete() {
      closeWriteDialog()
    }
  })
}

function updateCharValue(svcUUID: string, charUUID: string, value: string) {
  const arr = characteristics.value[svcUUID]
  if (!arr) return
  const idx = arr.findIndex((c) => c.uuid === charUUID)
  if (idx !== -1) arr[idx].value = value
}
</script>

<style scoped>
/* 样式保持不变，直接复制你提供的 */
.device-page {
  padding: 16px;
}
.header .title {
  font-size: 20px;
  font-weight: bold;
}
.button-group {
  margin: 12px 0;
}
.action-button {
  background-color: #007aff;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  text-align: center;
}
.service-list {
  max-height: 600px;
}
.service-item {
  background-color: #eef;
  margin-bottom: 8px;
  border-radius: 6px;
  padding: 8px;
}
.svc-header {
  flex-direction: row;
  justify-content: space-between;
  display: flex;
}
.char-list {
  margin-top: 6px;
  padding-left: 12px;
}
.char-item {
  background-color: #fff;
  margin-bottom: 6px;
  padding: 6px;
  border-radius: 4px;
}
.char-uuid {
  font-size: 14px;
  font-weight: bold;
}
.char-value {
  font-size: 12px;
  margin-top: 2px;
}
.char-buttons {
  flex-direction: row;
  display: flex;
  margin-top: 4px;
}
.char-button {
  background-color: #007aff;
  color: white;
  padding: 4px 10px;
  margin-right: 8px;
  border-radius: 4px;
  font-size: 12px;
}
/* ✅ 弹窗样式 */
.write-dialog {
  position: fixed;
  left: 0;
  bottom: 0;
  right: 0;
  top: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  justify-content: center;
  align-items: center;
  display: flex;
}

.dialog-box {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
}

.dialog-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.dialog-input {
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 14px;
  width: 100%;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
}

.dialog-btn {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  font-weight: bold;
  color: white;
}

.cancel {
  background-color: #999;
  margin-right: 8px;
}

.confirm {
  background-color: #007aff;
}
</style>
