<template>
    <div class="general-version-edit">
        <el-form label-width="80px" class="search-form" style="flex: 0 0 auto;">
            <div class="form-fields">
                <el-form-item label="配置日期">
                    <el-date-picker type="date" v-model="formData.configDate" value-format="YYYY-MM-DD"
                        placeholder="选择日期" />
                </el-form-item>
                <el-form-item label="文件名">
                    <el-input placeholder="请输入文件名|支持模糊搜索" v-model="formData.fileName" />
                </el-form-item>
                <el-form-item label="商品名称">
                    <el-input placeholder="请输入商品名称|支持模糊搜索" v-model="formData.productName" />
                </el-form-item>
            </div>
            <div class="form-actions">
                <el-button type="primary" @click="onQuery">
                    <el-icon>
                        <Search />
                    </el-icon>&nbsp;搜索
                </el-button>
                <el-button type="success" @click="addVisible = true">
                    <el-icon>
                        <Plus />
                    </el-icon>&nbsp;新增通版改新任务
                </el-button>
                <el-button type="warning" link @click="shopConfigVisible = true">
                    <el-icon>
                        <Setting />
                    </el-icon>&nbsp;店铺配置
                </el-button>
                <el-button type="warning" link @click="exportExcel">
                    <el-icon>
                        <Download />
                    </el-icon>&nbsp;导出结果
                </el-button>
            </div>
        </el-form>
        <el-divider style="flex: 0 0 auto; margin: 8px 0;" />
        <!-- 表格 + 分页 -->
        <div class="table-wrapper" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <el-table :data="searchDate" style="flex: 1; width: 100%;" empty-text="暂无数据" :show-overflow-tooltip="true"
                :cell-style="{ textAlign: 'center' }">
                <el-table-column label="日期" widht="175px" prop="date" align="center" width="175px" />
                <el-table-column label="文件名" prop="fileNae" align="center" width="100px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.fileName)">{{
                            scope.row.fileName }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="新版编码" prop="newCode" align="center" width="150px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.newCode)">{{
                            scope.row.newCode }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="商品名称" prop="goodsName" align="center" width="100px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.goodsName)">{{
                            scope.row.goodsName }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="新版定价" prop="newPrice" align="center" width="120px" />
                <el-table-column label="类型" align="center" prop="type" width="100px" />
                <el-table-column label="备注" align="center" prop="remark" width="200px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.remark)">{{
                            scope.row.remark }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="运营备注" align="center" width="150px">
                    <template #default="scope">
                        <span class="operation-remark-text" @click="openDrawer(scope.row)"
                            style="cursor: pointer; color: #409EFF;">
                            {{ formatOperationRemark(scope.row.operationRemark) || '点击编辑' }}
                        </span>
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
                            <span class=status-text-pending>{{ scope.row.taskPending }} </span>
                        </template>
                    </el-table-column>
                    <el-table-column width="60px" align="center">
                        <template #header>
                            <el-tooltip content="处理中数据数量" placement="top">
                                <el-icon class="status-text-running">
                                    <Loading />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class=status-text-running>{{ scope.row.taskRunning }} </span>
                        </template>
                    </el-table-column>
                    <el-table-column width="60px" align="center">
                        <template #header>
                            <el-tooltip content="处理成功数据数量" placement="top">
                                <el-icon class="status-text-success">
                                    <Check />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class=status-text-success>{{ scope.row.taskSuccess }} </span>
                        </template>
                    </el-table-column>
                    <el-table-column width="60px" align="center">
                        <template #header>
                            <el-tooltip content="处理失败数据数量" placement="top">
                                <el-icon class="status-text-fail">
                                    <Close />
                                </el-icon>
                            </el-tooltip>
                        </template>
                        <template #default="scope">
                            <span class=status-text-fail>{{ scope.row.taskFail }} </span>
                        </template>
                    </el-table-column>
                </el-table-column>
                <el-table-column label="操作" align="center" width="250px">
                    <template #default="scope">
                        <el-button type="danger" link size="small" @click="deleteRow(scope.row.id)">删除</el-button>
                        <el-button type="primary" link size="small" @click="showInfo(scope.row.id)">查看详细</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div style="flex: 0 0 auto; margin-top: 10px;">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="formData.pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>
    </div>
    <el-drawer title="运营备注详情" v-model="drawerVisible" size="35%" style="pointer-events: none; user-select: none;">
        <el-table :data="editableOperationRemark" style="width: 100%;" :show-overflow-tooltip="true"
            :cell-style="{ textAlign: 'center' }">
            <el-table-column label="店铺" prop="key" align="center" width="150px">
                <template #default="scope">
                    <el-select v-model="scope.row.key" placeholder="请选择店铺" style="width: 100%;">
                        <el-option v-for="shop in shopOptions" :key="shop.value" :label="shop.label"
                            :value="shop.value" />
                    </el-select>
                </template>
            </el-table-column>
            <el-table-column label="备注" prop="value" align="center">
                <template #default="scope">
                    <el-input v-model="scope.row.value" placeholder="请输入值" />
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100px">
                <template #default="scope">
                    <el-button type="danger" link size="small" @click="removeRow(scope.$index)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <!-- <div style="margin-top: 16px; text-align: right;">
            <el-button type="primary" @click="addRow">添加行</el-button>
            <el-button type="success" @click="saveOperationRemark">保存</el-button>
        </div> -->
    </el-drawer>
    <ShopConfig v-model:visible="shopConfigVisible" shopType="通版改新" />
    <AddGeneralVersion v-model:visible="addVisible" @refreshData="onQuery" />
</template>
<script setup lang="ts">
import AddGeneralVersion from '@/components/GeneralVersionEdit/AddGeneralVersion.vue';
import ShopConfig from '@/components/shop/ShopConfig.vue';
import http from '@/utils/http';
import { showNotification } from '@/utils/Notify';
import { Search, Plus, Download, Setting } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive, ref, onMounted } from 'vue';

const shopConfigVisible = ref(false);
const drawerVisible = ref(false);
const searchDate = ref<any>(null);
const addVisible = ref(false);
const selectedOperationRemark = ref<object>({});
const editableOperationRemark = ref<any[]>([]);
const selectedRowId = ref<number | null>(null);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const formData = reactive({
    fileName: '',
    configDate: "",
    productName: "",
    pageNo: 1,
    pageSize: 20,
});
const handleSizeChange = (newSize: number) => {
    formData.pageSize = newSize;
    onQuery();
};
const handleCurrentChange = (newPage: number) => {
    formData.pageNo = newPage;
    onQuery();
}
const exportExcel = async () => {
    ElMessage.info('当前功能还未实现...');
}
const showInfo = async (id: number) => {
    console.log('查看详细信息:', id);
}
const shopOptions = ref<{ label: string; value: string }[]>([]);
const formatOperationRemark = (remark: any) => {
    if (!remark) return '';

    // 如果是字符串（可能是 JSON 串），先尝试解析
    let data = remark;
    if (typeof remark === 'string') {
        try {
            data = JSON.parse(remark);
        } catch (e) {
            return remark; // 解析失败直接返回原字符串
        }
    }

    // 处理数组结构: [{"key": "val"}, {"key2": "val2"}]
    if (Array.isArray(data)) {
        return data.map(item => {
            const key = Object.keys(item)[0];
            return key ? `${key}: ${item[key]}` : '';
        }).filter(Boolean).join('; '); // 用分号连接
    }

    // 处理普通对象: {"key": "val"}
    if (typeof data === 'object') {
        return Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
    }

    return String(data);
};

async function deleteRow(id: number) {
    try {
        await ElMessageBox.confirm('确定要删除该通版改新任务吗？', '删除确认', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }).then(async () => {
            const resp = await http.post<any>('/generic/delete', { id }); // 假设后端接口为 /generic/deleteGeneralVersion
            ElMessage({
                message: '删除成功',
                type: 'success',
                duration: 2000,
            });
            onQuery(); // 刷新数据
        })


    } catch (error) {
        console.error('删除失败:', error);
        ElMessage({
            message: '删除失败',
            type: 'error',
            duration: 3000,
        });
    }

}
async function fetchShopOptions() {
    try {
        const resp = await http.post<any>('/shops/list/通版改新'); // 假设后端接口为 /generic/shopOptions
        console.log(resp)
        resp.forEach((shop: any) => {
            shopOptions.value.push({
                label: shop.shopName,
                value: shop.shopName,
            });
        });
    } catch (error) {
        console.error('获取店铺选项失败:', error);
        ElMessage({
            message: '获取店铺选项失败',
            type: 'error',
            duration: 3000,
        });
    }
}

onMounted(() => {
    fetchShopOptions();
});

function openDrawer(row: any) {
    console.log('备注内容:', row);
    drawerVisible.value = true;
    selectedOperationRemark.value = row.operationRemark;
    selectedRowId.value = row.id;
    // 修复：确保键和值有效
    editableOperationRemark.value = (row.operationRemark || []).map((item: any) => {
        const key = Object.keys(item || {})[0]; // 确保 item 是对象
        const value = key ? item[key] : ''; // 如果 key 存在，则获取值
        return { key: key || '', value }; // 如果 key 不存在，设置为空字符串
    });
}

function addRow() {
    editableOperationRemark.value.push({ key: '', value: '' });
}

function removeRow(index: number) {
    editableOperationRemark.value.splice(index, 1);
}

async function saveOperationRemark() {
    // 将键值对数组转换回后端需要的数组格式
    const updatedRemark = editableOperationRemark.value.map(row => ({
        [row.key]: row.value,
    }));
    console.log('保存的备注内容:', updatedRemark);
    const resp = await http.post('/generic/saveOperationRemark', {
        id: selectedRowId.value, // 假设有 id 字段
        operationRemark: updatedRemark,
    });
    console.log('保存结果:', resp);
    ElMessage({
        message: '运营备注已保存',
        type: 'success',
        duration: 2000,
    });
    drawerVisible.value = false;
}

async function onQuery() {
    const resp = await http.post<any>('/generic/query', formData);
    console.log('查询结果:', resp);
    searchDate.value = resp.records;
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
</script>
<style scoped>
.general-version-edit {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
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
</style>