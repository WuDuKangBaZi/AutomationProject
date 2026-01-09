<template>
    <div class="presale-view">
        <el-form label-width="80px" class="search-form" style="flex: 0 0 auto;">
            <div class="form-fields">
                <el-form-item label="配置日期">
                    <el-date-picker type="date" v-model="formData.configDate" value-format="YYYY-MM-DD" />
                </el-form-item>

                <el-form-item label="预售编码">
                    <el-input placeholder="请输入预售编码" v-model="formData.goodsCode" />
                </el-form-item>

                <el-form-item label="处理方式" style="width: 200px;">
                    <el-select placeholder="请选择处理方式" v-model="formData.handlingMethod">
                        <el-option label="全部" value="" />
                        <el-option label="预售" value="预售" />
                        <el-option label="取消预售" value="取消预售" />
                        <el-option label="下架" value="下架" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <div v-if="taskProgress.erpCount !== 0 || taskProgress.shopCount !== 0"
                        style="font-weight: bold; color: #409EFF;">
                        <span class="task-summary">
                            当前待执行任务：
                            <el-tag type="danger" size="small" effect="plain" class="ml-2">ERP采集: {{
                                taskProgress.erpCount
                                }}</el-tag>
                            <el-tag type="danger" size="small" effect="plain" class="ml-2">店铺执行: {{
                                taskProgress.shopCount
                                }}</el-tag>
                        </span>
                    </div>
                </el-form-item>
            </div>

            <div class="form-actions">
                <el-button type="primary" @click="onSearch">
                    <el-icon>
                        <Search />
                    </el-icon>&nbsp;搜索
                </el-button>
                <el-button type="success" small @click="openAddDialog">
                    <el-icon>
                        <Plus />
                    </el-icon>新增预售主任务
                </el-button>
                <el-button type="success" link @click="shoowShopConfig">
                    <el-icon>
                        <Setting />
                    </el-icon>店铺配置
                </el-button>
                <el-button type="warning" small link @click="exportExcel">
                    <el-icon>
                        <Download />
                    </el-icon>导出结果
                </el-button>
            </div>
        </el-form>

        <el-divider style="flex: 0 0 auto; margin: 8px 0;" />

        <!-- 表格 + 分页容器 -->
        <div class="table-wrapper" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <el-table :data="searchData" style="flex: 1; width: 100%;" empty-text="暂无数据" :show-overflow-tooltip="true"
                :cell-style="{ textAlign: 'center' }">
                <el-table-column label="配置日期" width="175px" prop="configDateTime" align="center" />
                <el-table-column prop="goodsCode" label="商品编码" width="200px" align="center">
                    <template #default="scope">
                        <span style="cursor:pointer; color:#409EFF;" @click="copyText(scope.row?.goodsCode)">
                            {{ scope.row?.goodsCode }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="goodsName" label="商品名称" width="300px" align="center">
                    <template #default="scope">
                        <span style="cursor:pointer; color:#409EFF;" @click="copyText(scope.row?.goodsName)">
                            {{ scope.row?.goodsName }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="shortageReason" label="缺货原因" width="100px" />
                <el-table-column prop="presaleEndTime" label="预售截止" width="100" />
                <el-table-column prop="handlingMethod" label="处理方式" width="90px" style="align-content: center;" />
                <el-table-column prop="personInCharge" label="负责人" width="100px" />
                <el-table-column label="ERP采集" align="center" width="100px">
                    <template #default="scope">
                        <el-icon style="color: #52c41a;" v-if="scope.row?.mainTaskSuccess > 0">
                            <Finished />
                        </el-icon>
                        <el-icon style="color: #ff4d4f;" v-if="scope.row?.mainTaskFailed > 0">
                            <el-icon>
                                <CloseBold />
                            </el-icon>
                        </el-icon>
                    </template>
                </el-table-column>
                <el-table-column label="店铺执行情况汇总" align="center">
                    <el-table-column width="60px" align="center">
                        <template #header>
                            <el-tooltip content="待处理数据数量" placement="top">
                                <el-icon class="status-text-pending">
                                    <Timer />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class="status-text-pending">{{ scope.row?.erpTaskPending }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column width="60px" align="center">
                        <template #header>
                            <el-tooltip content="进行中数据数量" placement="top">
                                <el-icon class="status-text-running">
                                    <Loading />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class="status-text-running">{{ scope.row?.erpTaskRunning }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column width="60px" align="center">
                        <template #header>
                            <el-tooltip placement="top">
                                <template #content>
                                    成功数量<br />此处成功为成功商品数量，而不是成功ERP任务数量
                                </template>
                                <el-icon class="status-text-success">
                                    <Finished />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class="status-text-success">{{ scope.row?.erpTaskSuccess }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column width="60px" align="center">
                        <template #header>
                            <el-tooltip placement="top">
                                <template #content>
                                    失败数量<br />此处失败为失败商品数量，而不是失败ERP任务数量
                                </template>
                                <el-icon class="status-text-fail">
                                    <CloseBold />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class="status-text-fail">{{ scope.row?.erpTaskFail }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column width="80px" align="center">
                        <template #header>
                            <el-tooltip content="未搜索到商品数据数量" placement="top">
                                <el-icon class="status-text-empty">
                                    <DocumentDelete />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class="status-text-empty">{{ scope.row?.erpTaskEmpty }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column width="80px" align="center">
                        <template #header>
                            <el-tooltip content="取消的任务数量" placement="top">
                                <el-icon class="status-text-canel">
                                    <CircleClose />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class="status-text-canel">{{ scope.row?.erpTaskCancel }}</span>
                        </template>
                    </el-table-column>
                </el-table-column>
                <el-table-column label="操作" width="140px" align="center">
                    <template #default="scope">
                        <div class="action-buttons">
                            <el-button link size="small" type="primary"
                                @click="showPresaleInfo(scope.row)">查看详细</el-button>
                            <el-button link size="small" type="danger" @click="deleteTask(scope.row)">删除任务</el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div style="flex: 0 0 auto; margin-top: 10px;">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="formData.pageSize"
                    :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" :total="total"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>
        <ShopConfig v-model:visible="shopConfigVisible" shopType="预售" />
        <AddPresaleMain v-model:visible="addPresaleDialogVisible" @reoload="onSearch" />
        <PresaleMainInfo v-model:visible="presaleInfo" :selectedPresaleMain="selectedRow" />
    </div>
</template>
<script lang="ts" setup>
import { defineComponent, h, onMounted, reactive, ref } from 'vue';
import ShopConfig from '@/components/shop/ShopConfig.vue';
import AddPresaleMain from '@/components/presale/main/AddPresaleMain.vue';
import PresaleMainInfo from '@/components/presale/main/PresaleMainInfo.vue';
import http from '@/utils/http';
import { ElMessage, ElMessageBox, ElRadio, ElRadioGroup } from 'element-plus';
import { Finished, CloseBold, Timer, Loading, DocumentDelete, Download, Setting, CircleClose } from '@element-plus/icons-vue';
const taskProgress = reactive({
    erpCount: 0,
    shopCount: 0,
})
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const presaleInfo = ref(false);
const shopConfigVisible = ref(false);
const addPresaleDialogVisible = ref(false);
const selectedRow = ref<any>(null);
const formData = reactive({
    configDate: "",
    goodsCode: '',
    handlingMethod: '',
    pageNo: 1,
    pageSize: 20
});
const searchData = ref<any[]>([]);
function shoowShopConfig() {
    console.log("show shop config");
    shopConfigVisible.value = true;
}
function openAddDialog() {
    addPresaleDialogVisible.value = true;
}
async function onSearch() {
    console.log("on search");
    const resp = await http.post<any>('/presaleMain/search', formData);
    total.value = resp.total;
    searchData.value = resp.records || [];
    getTaskProgress();
}
function deleteTask(row: any) {
    ElMessageBox.confirm(`确定删除预售任务【${row.goodsCode}】吗？此操作不可恢复！`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        console.log("delete presale task:", row);
        const resp = await http.post<any>(`/presaleMain/delete/${row.id}`);
        if (resp.code !== 200) {
            ElMessage({
                message: resp.message || '预售任务删除失败',
                type: 'error',
                duration: 2000
            });
            return;
        } else {
            ElMessage({
                message: '预售任务删除成功',
                type: 'success',
                duration: 2000
            });
        }
        onSearch();
    }).catch(() => {
        console.log("取消删除预售任务");
    });

}
function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard:', text);
        ElMessage({
            message: '已复制到剪贴板',
            type: 'success',
            duration: 500
        });
    }).catch(err => {
        console.error('Could not copy text: ', err);
        ElMessage({
            message: '复制到剪切板失败!',
            type: 'error',
            duration: 3000
        });
    });
}
function exportExcel() {
    const exportType = ref('明细')
    const exprotOptions = ref('全部')
    const ContentComponent = defineComponent({
        setup() {
            // 在组件内部维护状态，或者直接使用外部的 ref
            return () => h('div', null, [
                h('p', { style: 'margin-bottom: 5px; font-weight: bold;' }, '导出类型：'),
                h(ElRadioGroup, {
                    modelValue: exportType.value,
                    'onUpdate:modelValue': (val: any) => { exportType.value = val }
                }, () => [
                    h(ElRadio, { value: '明细', label: '明细' }, () => '明细'),
                    h(ElRadio, { value: '汇总', label: '汇总' }, () => '汇总')
                ]),

                h('p', { style: 'margin-top: 15px; margin-bottom: 5px; font-weight: bold;' }, '导出选项：'),
                h(ElRadioGroup, {
                    modelValue: exprotOptions.value,
                    'onUpdate:modelValue': (val: any) => { exprotOptions.value = val }
                }, () => [
                    h(ElRadio, { value: '全部', label: '全部' }, () => '全部'),
                    h(ElRadio, { value: '成功项', label: '成功项' }, () => '仅成功'),
                    h(ElRadio, { value: '失败项', label: '失败项' }, () => '仅失败')
                ])
            ]);
        }
    });
    ElMessageBox({
        title: '请选择导出类型',
        // 传入组件的 h 函数渲染结果
        message: h(ContentComponent),
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
    }).then(async () => {
        console.log("export excel:", exportType.value, exprotOptions.value);
        const resp = await http.post('/pub/export/presaleMain',
            {
                presaleMainQueryDTO: formData,
                exportType: exportType.value,
                exportOption: exprotOptions.value
            }
        )

    }).catch(() => {
        console.log("export cancelled");
    })
}
function handleSizeChange(size: number) {
    pageSize.value = size;
    formData.pageSize = size;
    onSearch();
}
function handleCurrentChange(page: number) {
    currentPage.value = page;
    formData.pageNo = page;
    onSearch();
}
function showPresaleInfo(row: any) {
    console.log("show presale info:", row);
    selectedRow.value = row;
    presaleInfo.value = true;
}
async function getTaskProgress() {
    const resp = await http.get<any>('/task/presale/progress');
    console.log("task progress:", resp);
    taskProgress.erpCount = resp.erpCount;
    taskProgress.shopCount = resp.shopCount;
}
onMounted(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    formData.configDate = `${year}-${month}-${day}`;
    formData.handlingMethod = '全部';
    // 获取当前任务进度
    getTaskProgress();
})

</script>
<style scoped>
.presale-view {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.search-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.search-form .form-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.search-form .form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    margin-left: 10px;
}

.table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.task-summary {
    font-size: 14px;
    white-space: nowrap;
    /* 防止换行 */
    display: inline-flex;
    align-items: center;
}

.ml-2 {
    margin-left: 8px;
}

.status-text-pending {
    color: #E6A23C;
}

.status-text-running {
    color: #409EFF;
}

.status-text-success {
    color: #67C23A;
}

.status-text-fail {
    color: #F56C6C;
}

.status-text-empty {
    color: #909399;
}

.status-text-canel {
    color: #909399;
}

.action-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
}
</style>