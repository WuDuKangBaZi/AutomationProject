<template>
    <el-drawer v-model="visible" :title="title" size="50%" destory-on-close>
        <template #title>
            <div class="drawer-header">
                <span class="title-indicator"></span>
                <span class="drawer-title">{{ title }}</span>
            </div>
        </template>
        <div class="drawer-content">
            <!-- 修改：size="small" 更紧凑，column="3" 一行放更多 -->
            <el-descriptions title="基础信息" :column="4" border size="default">
                <el-descriptions-item label="配置日期">
                    {{ selectedPresaleMain?.configDateTime }}
                </el-descriptions-item>
                <el-descriptions-item label="商品编码">
                    {{ selectedPresaleMain?.goodsCode }}
                </el-descriptions-item>
                <el-descriptions-item label="商品名称" :span="2">
                    {{ selectedPresaleMain?.goodsName }}
                </el-descriptions-item>
                <el-descriptions-item label="处理方式">
                    <el-tag size="small">{{ selectedPresaleMain?.handlingMethod }}</el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="负责人">
                    {{ selectedPresaleMain?.personInCharge }}
                </el-descriptions-item>
                <el-descriptions-item label="预售截止" v-if="selectedPresaleMain?.presaleEndTime">
                    {{ selectedPresaleMain?.presaleEndTime }}
                </el-descriptions-item>
                <el-descriptions-item label="预售截止" v-else>
                    -
                </el-descriptions-item>
                <el-descriptions-item label="缺货原因" :span="3">
                    {{ selectedPresaleMain?.shortageReason || '-' }}
                </el-descriptions-item>
            </el-descriptions>
            <el-tabs v-model="activeTab" style="margin-top: 20px;" @tab-change="handleTabChange">
                <el-tab-pane label="获取到的ERP编码" name="erp">
                    <el-table :data="erpData" empty-text="没有获取到任何ERP编码,可能未生成任务?">
                        <el-table-column label="ERP编码" prop="erpCode"></el-table-column>
                        <el-table-column label="商品名称" prop="erpName"></el-table-column>
                        <el-table-column label="采集时间" prop="createTime"></el-table-column>
                    </el-table>
                </el-tab-pane>
                <el-tab-pane label="店铺执行情况" name="shop">
                    <el-table :data="taskInfo" empty-text="没有店铺的任务运行记录，可能未生成任务?" style="width: 100%;">
                        <el-table-column type="expand">
                            <template #default="props">
                                <div style="padding:10px 20px;background-color: #f8f9fa;">
                                    <!-- SKU列表 -->
                                    <div v-if="parseShopResult(props.row.resultData.SKU列表)">
                                        <h4 style="margin: 5px 0;">SKU处理详情:</h4>
                                        <el-table :data="parseShopResult(props.row.resultData.SKU列表)" border
                                            size="small" style="width: 100%;">
                                            <el-table-column prop="SKU" label="SKU编码" width="200px"></el-table-column>
                                            <el-table-column prop="处理方式" label="处理方式" width="120px"></el-table-column>
                                            <el-table-column prop="预售日期" label="预售日期"></el-table-column>
                                        </el-table>
                                        <div v-if="props.row.filePaths && props.row.filePaths.length > 0"
                                            style="margin-top: 10px;">
                                            <h4 style="margin: 5px 0;">附件下载:</h4>
                                            <div>
                                                <el-button v-for="(file, index) in props.row.filePaths" :key="index"
                                                    link size="small" type="primary" @click="openFile(file.filePath)">
                                                    {{ file.fileName }}
                                                </el-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="店铺名称" prop="shopName" width="80px" />
                        <el-table-column label="商品ID" prop="goodsId" width="200px" />
                        <el-table-column label="商品名称" prop="goodsName">
                            <template #default="scope">
                                {{ scope.row.resultData?.商品名称 || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column label="执行结果" prop="taskStatus" width="80px">
                            <template #default="scope">
                                <el-tag
                                    :type="scope.row.taskStatus === 2 ? 'success' : (scope.row.taskStatus === 'primary' ? 1 : 'danger')"
                                    size="small">{{ scope.row.taskStatus === 2 ? '成功' : (scope.row.taskStatus === 1 ?
                                        '进行中' :(scope.row.taskStatus === 3 ? "没有搜索到商品":'失败') ) }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="执行信息" width="100px">
                            <template #default="scope">
                                <el-tooltip effect="dark" :content="scope.row.resultData?.执行任务消息 || '-'" placement="top"
                                    :disabled="!scope.row.resultData?.执行任务消息">
                                    <div class="text-ellipsis" style="cursor:pointer; color:#409EFF;" @click="copyText(scope.row.resultData?.执行任务消息)"
                                        >
                                        {{ scope.row.resultData?.执行任务消息 || '-' }}
                                    </div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column label="执行时间" prop="createdAt" width="200px" />
                    </el-table>
                    <el-pagination background :total="shopTotal" v-model:page-size="shopPageSize"
                        @size-change="(size: number) => { shopPageSize = size; loadShopData(); }"
                        @current-change="(page: number) => { shopCurrentPage = page; loadShopData(); }"
                        v-model:current-page="shopCurrentPage" :page-sizes="[10, 20, 50, 100]"
                        layout="total,sizes,prev,pager,next"
                        style="margin-top: 20px; text-align: right;"></el-pagination>
                </el-tab-pane>
            </el-tabs>
        </div>
    </el-drawer>
</template>
<script lang="ts" setup>
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { computed, ref, watch } from 'vue';
const title = ref("");
const activeTab = ref("erp");
const shopPageSize = ref(20);
const shopCurrentPage = ref(1);
const shopTotal = ref(0);
const taskInfo = ref<any[]>([]);
const props = defineProps<{
    visible: boolean;
    selectedPresaleMain: any;
}>();
const erpData = ref<any[]>([]);
const handleTabChange = (tabName: string) => {
    console.log('Tab changed to:', tabName);
    if (tabName === 'erp') {
        loadErpData();
    } else if (tabName === 'shop') {
        loadShopData();
    }
};
const copyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        ElMessage({
            message: '已复制到剪贴板',
            type: 'success',
            duration: 500
        });
    }).catch(() => {
        ElMessage.error('复制失败');
    });
};
const loadErpData = async () => {
    const resp = await http.get<any>(`/presaleErp/m/${props.selectedPresaleMain.id}`)
    erpData.value = resp || [];
}
const loadShopData = async () => {
    const resp = await http.post<any>(`/presaleMain/getTaskInfo/${props.selectedPresaleMain.id}`, {
        pageNo: shopCurrentPage.value,
        pageSize: shopPageSize.value
    });
    console.log("shop data: ", resp);
    shopTotal.value = resp.total;
    taskInfo.value = resp.records || [];

}
const openFile = (filePath: string) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    window.open(`${baseUrl}${filePath}`, '_blank');
};
const parseShopResult = (jsonStr: string) => {
    try {
        if (!jsonStr) return null;
        return typeof jsonStr === 'object' ? jsonStr : JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse shop result JSON:", e);
        return null;
    }
}

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
}>();
const visible = computed({
    get: () => props.visible,
    set: (val: boolean) => {
        emit('update:visible', val);
    }
});
watch(() => props.visible, (v) => {
    if (v) {
        title.value = `${props.selectedPresaleMain ? props.selectedPresaleMain.goodsName : '未知商品'}`;
        taskInfo.value = [];
        erpData.value = [];
        activeTab.value = "erp";
        loadErpData();
    }
});
</script>
<style scoped>
.drawer-header {
    display: flex;
    align-items: center;
}

.title-indicator {
    width: 4px;
    height: 16px;
    background-color: #409EFF;
    /* 主题色 */
    margin-right: 8px;
    border-radius: 2px;
}

.drawer-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}
.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%; /* 确保它不会撑开容器 */
}
</style>