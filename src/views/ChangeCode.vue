<template>
    <div class="change-code-view">
        <el-form label-width="80px" class="search-form" style="flex: 0 0 auto;">
            <div class="form-fields">
                <el-form-item label="配置日期">
                    <el-date-picker type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
                        v-model="searchForm.date" />
                </el-form-item>
                <el-form-item label="旧编码">
                    <el-input placeholder="请输入旧编码" v-model="searchForm.oldCode" clear />
                </el-form-item>
                <el-form-item label="新编码">
                    <el-input placeholder="请输入新编码" v-model="searchForm.newCode" />
                </el-form-item>
            </div>
            <div class="form-actions">
                <el-button type="primary" @click="onSearch">搜索</el-button>
                <el-button type="success" @click="openDialog">批量导入</el-button>
                <el-button type="warning" @click="exportData">导出结果</el-button>
            </div>
        </el-form>
        <el-divider style="flex: 0 0 auto; margin: 8px 0;" />
        <div class="table-wrapper">
            <el-table :data="changeCodeList" style="flex: 1; width: 100%;" empty-text="暂无数据"
                :show-overflow-tooltip="true">
                <el-table-column prop="configDate" label="配置日期" />
                <el-table-column prop="oldCode" label="旧编码" />
                <el-table-column prop="goodsName" label="品名" />
                <el-table-column prop="newCode" label="新编码" />
                <el-table-column prop="remark" label="备注" />
                <el-table-column prop="notifiedPerson" label="通知人" />
                <el-table-column label="任务状态">
                    <template #default="scope">
                        <el-tag v-if="scope.row.taskStatus === '0'" type="info" size="small">待处理</el-tag>
                        <el-tag v-else-if="scope.row.taskStatus === '1'" type="warning" size="small">处理中</el-tag>
                        <el-tag v-else-if="scope.row.taskStatus === '2'" type="success" size="small">已完成</el-tag>
                        <el-tag v-else-if="scope.row.taskStatus === '-1'" type="danger" size="small">处理失败</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="错误信息">
                    <template #default="scope">
                        <div v-if="scope.row.errorMessage" style="color: red; white-space: pre-wrap;">
                            {{ scope.row.errorMessage }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="任务统计">
                    <template #default="scope">
                        <div style="display: flex; gap: 1px; flex-wrap: wrap;">
                            <el-tag type="info" size="small" title="总数">
                                总数:{{ scope.row.resultCount }}
                            </el-tag>
                            <el-tag type="success" size="small" title="成功数" v-if="scope.row.successCount > 0">
                                成功:{{ scope.row.successCount }}
                            </el-tag>
                            <el-tag type="danger" size="small" title="失败数" v-if="scope.row.failureCount > 0">
                                失败:{{ scope.row.failureCount }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <el-button type="text" size="small" @click="openDetails(scope.row.id)">查看详情</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div style="flex: 0 0 auto;margin-top: 10px;">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :pageSizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="searchTotal"
                    @current-change="onSearch" @size-change="onSearch">
                </el-pagination>
            </div>
        </div>
    </div>
    <el-dialog title="批量导入改编码" v-model="dialogVisible" width="50%">
        <el-input class="dialog-textarea" type="textarea" :rows="10" placeholder="请输入内容" clearable
            v-model="pastChangeCode" />
        <el-table :data="pastedRows" empty-text="粘贴数据后自动解析" border table-layout="auto" height="300px"
            style="width:100%">
            <el-table-column prop="configDate" label="配置日期" />
            <el-table-column prop="oldCode" label="旧编码" />
            <el-table-column prop="goodsName" label="品名" />
            <el-table-column prop="newCode" label="新编码" />
            <el-table-column prop="remark" label="备注" />
            <el-table-column prop="notifiedPerson" label="通知人" />
        </el-table>
        <template #footer>
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="batchInsert">确 定</el-button>
        </template>
    </el-dialog>
    <el-drawer title="改编码任务详情" v-model="detailsVisible" size="50%">
        <template #title>
            <div>
                <span>改编码任务详情</span>
                <el-button link type="primary" @click="copyExcelType">复制Excel可粘贴格式</el-button>
            </div>
        </template>
        <el-table :data="detailsList" border table-layout="auto" style="width:100%">
            <el-table-column prop="platform" label="平台" />
            <el-table-column prop="shop" label="店铺" width="" />
            <el-table-column prop="goodsId" label="商品ID" />
            <el-table-column prop="goodsName" label="商品名称" width="200px" show-overflow-tooltip>
                <template #default="scope">
                    <span
                        style="cursor:pointer; color:#409EFF; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        {{ scope.row?.goodsName }}
                    </span>
                </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" />
            <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip>
                <template #default="scope">
                    <span style="cursor:pointer; color:red; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        {{ scope.row.errorMessage }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" />
            <el-table-column prop="operationTime" label="操作时间" />
            <el-table-column prop="operatorType" label="操作类型" />
            <el-table-column prop="systemStyleCode" label="系统款号" show-overflow-tooltip>
                <template #default="scope">
                    <span
                        style="cursor:pointer; color:#409EFF; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        {{ scope.row?.systemStyleCode }}
                    </span>
                </template>
                </el-table-column>
            <el-table-column prop="status" label="状态" />
        </el-table>
    </el-drawer>
</template>
<script lang="ts" setup>
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
const pastChangeCode = ref("");
const dialogVisible = ref(false)
const detailsVisible = ref(false);
const changeCodeList = ref<any[]>([]);
const pageSize = ref(10);
const currentPage = ref(1);
const searchTotal = ref(0);
const detailsList = ref<any[]>([]);
const searchForm = reactive({
    date: '',
    oldCode: '',
    newCode: ''
});
const openDetails = async (rowId: any) => {
    const resp = await http.get<any>('/cc/queryDetails/' + rowId);
    detailsList.value = resp;
    detailsVisible.value = true;
}

const exportData = async () => {
    console.log("export data", searchForm);
    const resp = await http.post<any>('/pub/export/changeCode', searchForm);
    detailsList.value = resp;
}
const pastedRows = computed(() => {
    if (!pastChangeCode.value) return [];
    return pastChangeCode.value
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(line => {
            // 如果包含制表符，用制表符拆；否则用连续两个以上空格拆
            const cols = line.includes('\t')
                ? line.split('\t')
                : line.split(/\s{2,}/);

            return {
                configDate: (cols[0] || "").trim(),
                oldCode: (cols[1] || "").trim(),
                goodsName: (cols[2] || "").trim(),
                newCode: (cols[3] || "").trim(),
                remark: (cols[4] || "").trim(),
                notifiedPerson: (cols[5] || "").trim(),
            };
        });
})
const copyExcelType = async () => {
    if (!detailsList.value || detailsList.value.length === 0) {
        ElMessage.warning("当前无数据可复制");
        return;
    }
    // 1. 定义表头 (对应详情弹窗中的列)
    const headers = [
        '平台', '店铺', '商品ID', '商品名称', '状态',
        '错误信息', '操作人', '操作时间', '操作类型', '系统款号'
    ];

    // 2. 构建数据行 (使用制表符 \t 分隔)
    const rows = detailsList.value.map(row => {
        return [
            row.platform || '',
            row.shop || '',
            row.goodsId || '',
            row.goodsName || '',
            row.status || '',
            (row.errorMessage || '').replace(/[\r\n]+/g, ' '),
            row.operator || '',
            row.operationTime || '',
            row.operatorType || '',
            row.systemStyleCode || ''
        ].join('\t');
    });

    // 3. 组合最终文本
    const textToCopy = [headers.join('\t'), ...rows].join('\n');

    // 4. 写入剪贴板
    try {
        await navigator.clipboard.writeText(textToCopy);
        ElMessage.success("详情数据已复制，可直接粘贴到 Excel");
    } catch (err) {
        console.error('复制失败:', err);
        ElMessage.error("复制失败，请手动复制");
    }

}
async function batchInsert() {
    console.log("batch insert", pastedRows.value);
    try {
        const resp = await http.post('/cc/batch', pastedRows.value);
        ElMessage.success("批量导入成功");
    } catch (err) {
        ElMessage.error("批量导入失败，请检查数据格式是否正确!\n" + err);
    }

}
async function onSearch() {
    console.log("search", searchForm);
    const resp = await http.post<any>('/cc/query', {
        date: searchForm.date,
        oldCode: searchForm.oldCode,
        newCode: searchForm.newCode,
        pageSize: pageSize.value,
        pageNo: currentPage.value
    });
    changeCodeList.value = resp.records || [];
    searchTotal.value = resp.total || 0;
}
onMounted(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    searchForm.date = `${year}-${month}-${day}`;
})

function openDialog() {
    console.log("open dialog");
    dialogVisible.value = true;
}

</script>
<style scoped>
.change-code-view {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    /* user-select: none; */
}

.search-form {
    user-select: none;
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
}

.table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
</style>