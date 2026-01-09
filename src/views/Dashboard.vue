<template>
    <div class="dashboard-container">
        <div class="robot-grid">
            <div v-if="robots.length === 0">
                等待加载中...</div>
            <!-- 修改这里：遍历 sortedRobots -->
            <div v-for="robot in sortedRobots" :key="robot.robotId" class="grid-item">
                <el-card class="robot-card" :class="getStatusClass(robot.status)" shadow="hover">
                    <!-- 头部：名称与状态点 -->
                    <div class="card-header">
                        <div class="header-left">
                            <el-icon class="robot-icon">
                                <Monitor />
                            </el-icon>
                            <span class="name">{{ robot.robotName }}</span>
                        </div>
                        <el-tag :type="getStatusType(robot.status)" effect="dark" size="small" round>
                            {{ statusText(robot) }}
                        </el-tag>
                    </div>

                    <!-- 内容区域 -->
                    <div class="card-content">
                        <div class="info-row">
                            <span class="label">ID</span>
                            <span class="value mono">{{ robot.robotId }}</span>
                        </div>

                        <!-- 修改：当前任务 (增加 tooltip 和 复制) -->
                        <div class="info-row" v-if="robot.status !== 'OFFLINE'">
                            <span class="label">当前任务</span>
                            <el-tooltip effect="dark" :content="robot.currentTask || '—'" placement="top"
                                :disabled="!robot.currentTask">
                                <span class="value text-ellipsis" @click="copyText(robot.currentTask)"
                                    :class="{ 'clickable-hover': robot.currentTask }">
                                    {{ robot.currentTask || '—' }}
                                </span>
                            </el-tooltip>
                        </div>

                        <!-- 修改：当前步骤 (增加 tooltip 和 复制) -->
                        <div class="info-row" v-if="robot.status !== 'OFFLINE'">
                            <span class="label">当前步骤</span>
                            <el-tooltip effect="dark" :content="robot.currentStep || '—'" placement="top"
                                :disabled="!robot.currentStep">
                                <span class="value highlight text-ellipsis" @click="copyText(robot.currentStep)"
                                    :class="{ 'clickable-hover': robot.currentStep }">
                                    {{ robot.currentStep || '—' }}
                                </span>
                            </el-tooltip>
                        </div>

                        <!-- 新增：持续时间 -->
                        <div class="info-row" v-if="robot.status !== 'OFFLINE'">
                            <span class="label">持续时间</span>
                            <span class="value mono time-duration" :class="{ 'long-duration': isLongDuration(robot) }">
                                {{ formatDuration(robot) }}
                            </span>
                        </div>
                        <!-- 内存占用 -->
                        <div class="info-row" v-if="robot.status !== 'OFFLINE'">
                            <span class="label">内存占用</span>
                            <span class="value mono" 
                            :class="{ 'high-memory': isHighMemory(robot.memory) }">
                                {{ robot.memory ? robot.memory : '—' }}
                            </span>
                        </div>
                        <!-- 最后在线时间 -->
                         <div class="info-row" v-else>
                            <span class="label">最后在线</span>
                            <span class="value mono">
                                {{ robot.lastHeartbeat ? new Date(Number(robot.lastHeartbeat)).toLocaleString() : '—' }}
                            </span>
                        </div>
                        <div class="info-row message-row">
                            <span class="label">消息</span>
                            <el-tooltip effect="dark" :content="robot.message || '暂无消息'" placement="top"
                                :disabled="!robot.message">
                                <div class="message-box" @click="copyText(robot.message)"
                                    :class="{ 'clickable': robot.message }">
                                    <span class="value text-ellipsis">
                                        {{ robot.message || '—' }}
                                    </span>
                                    <el-icon v-if="robot.message" class="copy-icon">
                                        <CopyDocument />
                                    </el-icon>
                                </div>
                            </el-tooltip>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { onMounted, onUnmounted, ref } from 'vue';
import { Monitor, CopyDocument } from '@element-plus/icons-vue';
import { computed } from 'vue';
import { useWebSocket } from '@/utils/ws/useWebSocket'
const { connect, subscribe, unsubscribe } = useWebSocket('/ws/robot')
const robotTopic = '/topic/robot/state'
const robots = ref<any[]>([]);
let timer: number | null = null;
// 新增：用于驱动倒计时刷新的响应式当前时间
const now = ref(Date.now());
let durationTimer: number | null = null;

// 定义状态权重：数字越小排越前
const statusPriority: Record<string, number> = {
    'RUNNING': 2,  // 工作中排第一
    'IDLE': 3,     // 空闲排第二
    'ERROR': 1,    // 错误排第三
    'OFFLINE': 4   // 离线排最后
};

// 创建排序后的计算属性
const sortedRobots = computed(() => {
    // 创建副本以避免直接修改原数组
    return [...robots.value].sort((a, b) => {
        // 1. 获取权重，默认为 99 (未知状态排最后)
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;

        // 2. 首先按状态权重排序
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // 3. 如果状态相同，按 robotId 排序 (可选，保持列表稳定)
        return (a.robotId || '').localeCompare(b.robotId || '');
    });
});

const loadRobot = async () => {
    try {
        const res = await http.get<any>('/robot/list');
        robots.value = res;
    } catch (e) {
        console.error(e);
    }
};
const isHighMemory = (memoryStr: string|undefined) => {
    if (!memoryStr || typeof memoryStr !== 'string') return false;
    
    try {
        // 格式通常为 "20.6GB/31.9GB"
        const parts = memoryStr.split('/');
        if (parts.length !== 2) return false;

        // 提取数值，去掉 'GB' 等单位
        const used = parts[0] ? parseFloat(parts[0]) : NaN;
        const total = parts[1] ? parseFloat(parts[1]) : NaN;

        if (isNaN(used) || isNaN(total) || total === 0) return false;

        // 计算百分比，超过 80% 返回 true
        return (used / total) > 0.8;
    } catch (e) {
        return false;
    }
};
const statusText = ((robot: any) => {
    switch (robot.status) {
        case 'IDLE':
            return '空闲';
        case 'RUNNING':
            return '工作中';
        case 'OFFLINE':
            return '离线';
        default:
            return '错误';
    }
});

const copyText = async (text: string) => {
    if (!text || text === '—') return;
    try {
        await navigator.clipboard.writeText(text);
        ElMessage.success('复制成功');
    } catch (err) {
        ElMessage.error('复制失败');
    }
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'RUNNING': return 'card-running';
        case 'IDLE': return 'card-idle';
        case 'OFFLINE': return 'card-offline';
        default: return 'card-error';
    }
};

const getStatusType = (status: string) => {
    switch (status) {
        case 'RUNNING': return 'primary'; // 工作中 - 蓝色
        case 'IDLE': return 'success';    // 空闲 - 绿色
        case 'OFFLINE': return 'info';    // 离线 - 灰色
        default: return 'danger';         // 错误 - 红色
    }
};

// 新增：格式化持续时间 (依赖 now.value 触发自动更新)
const formatDuration = (robot: any) => {
    if (!robot.statusSince) return '—';
    const start = Number(robot.statusSince);
    // const start = new Date(robot.lastHeartbeat).getTime();
    const diff = Math.max(0, now.value - start);

    // 计算时分秒
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor(diff / (1000 * 60 * 60));

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
};

// 新增：判断是否超时过长 (例如超过10分钟显示红色)
const isLongDuration = (robot: any) => {
    if (!robot.statusSince) return false;
    const start = Number(robot.lastHeartbeat);
    const diff = now.value - start;
    return diff > 10 * 60 * 1000; // 10分钟
};

onMounted(async () => {
    connect()
    subscribe(robotTopic, (robotView) => {
        console.log("Received robot update:", robotView);
        const index = robots.value.findIndex(r => r.robotId === robotView.robotId)
        if (index !== -1) {
            robots.value[index] = robotView
        } else {
            robots.value.push(robotView)
        }
    })
    durationTimer = window.setInterval(() => {
        now.value = Date.now();
    }, 1000);
    setTimeout(async() =>{
        try {
            console.log("Loading robots on mount");
            await http.get<any>('/robot/state/init');
        } catch (e) {
            console.error('Failed to load robots on mount:', e);
        }
    },3000)
});

onUnmounted(() => {
    if (durationTimer) {
        clearInterval(durationTimer);
    }
    unsubscribe(robotTopic)
})
</script>
<style scoped>
.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    /* 关键：限制最大宽度，根据你的卡片宽度调整，例如 60% 或具体像素 */
    max-width: 160px;
    display: inline-block;
    /* 必须是 block 或 inline-block 才能设置宽度 */
    vertical-align: middle;
}

.message {
    color: #666;
    font-size: 14px;
}

.robot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    /* Grid 默认 align-items: stretch，所以行内元素高度会自动拉伸到最高的那个 */
}

.grid-item {
    display: flex;
    flex-direction: column;
    height: 100%; /* 关键修改 1 */
}

.robot-card {
    border-radius: 8px;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid #e4e7ed; /* 默认边框 */
    position: relative;
    overflow: hidden;
}

.robot-card:hover {
    transform: translateY(-4px);
}

/* --- 状态样式定义 --- */

/* 1. 工作中：蓝色主调，增加呼吸阴影，表示正在运行 */
.robot-card.card-running {
    border-top: 4px solid #409eff;
    background-color: #f0f9ff; /* 极浅的蓝色背景 */
}
.robot-card.card-running:hover {
    box-shadow: 0 0 15px rgba(64, 158, 255, 0.4);
}

/* 2. 空闲：绿色主调，表示健康待命 */
.robot-card.card-idle {
    border-top: 4px solid #67c23a;
    background-color: #ffffff;
}
.robot-card.card-idle:hover {
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

/* 3. 错误/异常：红色主调，醒目警示 */
.robot-card.card-error {
    border: 1px solid #f56c6c;
    border-top: 4px solid #f56c6c;
    background-color: #fef0f0; /* 浅红色背景 */
}
.robot-card.card-error .name {
    color: #f56c6c; /* 标题也变红 */
}

/* 4. 离线：灰色主调，降低存在感 */
.robot-card.card-offline {
    border-top: 4px solid #909399;
    background-color: #f4f4f5; /* 浅灰色背景 */
    filter: grayscale(100%);   /* 整体灰度 */
    opacity: 0.8;
}
.robot-card.card-offline .card-content {
    opacity: 0.6; /* 内容更淡 */
}

.high-memory {
    color: #f56c6c !important; /* 红色 */
    font-weight: bold;
}

.robot-card:hover {
    transform: translateY(-4px);
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
}

.offline {
    filter: grayscale(60%);
}

.dashboard-container {
    padding: 16px;
}

.grid-item {
    display: flex;
    flex-direction: column;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.header-left {
    display: flex;
    align-items: center;
}

.robot-icon {
    margin-right: 8px;
}

.card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* 增加高度防止布局跳动 */
    min-height: 24px;
}

.label {
    font-weight: bold;
    color: #333;
}

.value {
    color: #666;
}

.value.mono {
    font-family: monospace;
}

.value.highlight {
    color: #409eff;
}

.message-row .message-box {
    display: flex;
    align-items: center;
    gap: 4px;
}

.message-box.clickable {
    cursor: pointer;
    color: #409eff;
}

.copy-icon {
    font-size: 14px;
}

/* 增加一个鼠标悬停变色效果，提示用户可点击 */
.clickable-hover:hover {
    color: #409eff;
    /* Element Plus 主色 */
    text-decoration: underline;
}

.time-duration {
    font-weight: bold;
    color: #606266;
}

/* 持续时间过长的警告样式 */
.long-duration {
    color: #f56c6c !important;
    /* 红色 */
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }

    100% {
        opacity: 1;
    }
}

.time-duration.long-duration {
    font-weight: bold;
    color: #e6a23c;
    /* Example color for long duration */
}
</style>
