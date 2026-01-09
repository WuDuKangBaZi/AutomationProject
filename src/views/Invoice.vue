<template>
    <div class="invoice-view">
        <el-form label-width="80px" class="search-form" style="flex: 0 0 auto;">
            <div class="form-fields">
                <el-form-item label="记录日期">
                    <el-date-picker v-model="formData.createdAt" type="date" value-format="YYYY-MM-DD" unlink-panels
                        style="width: 200px;" />
                </el-form-item>
                <el-form-item label="订单号">
                    <el-input v-model="formData.orderNo" placeholder="请输入订单号|支持模糊搜索" clearable></el-input>
                </el-form-item>
                <el-form-item label="订单平台" style="width: 250px;">
                    <el-select v-model="formData.platform" placeholder="请选择订单平台" @change="onPlatformChange" clearable>
                        <el-option v-for="option in platforms" :key="option" :label="option" :value="option" />
                    </el-select>
                </el-form-item>
                <el-form-item label="订单店铺" style="width: 250px;">
                    <el-select v-model="formData.shopName" placeholder="请选择订单店铺" clearable>
                        <el-option v-for="option in shops" :key="option" :label="option" :value="option" />
                    </el-select>
                </el-form-item>
            </div>
            <div class="form-actions">
                <el-button type="primary" @click="onSearch">搜索</el-button>
                <el-button>重置</el-button>
            </div>
        </el-form>
        <el-divider style="flex: 0 0 auto; margin: 8px 0;" />
        <div class="table-wrapper" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <el-table :data="invoiceTableData" style="width: 100%; flex: 1; overflow: auto;" border>
                <el-table-column prop="platform" label="平台" width="120" />
                <el-table-column prop="shopName" label="店铺" width="150" />
                <el-table-column prop="orderNo" label="订单号" width="180" show-overflow-tooltip>
                    <template #default="scope">
                        <span class="copy-td" @click="copyText(scope.row.orderNo)">{{ scope.row.orderNo }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="记录日期" width="250" />
                <el-table-column prop="invoicedB" label="是否需要开票">
                    <template #default="scope">
                        <span>{{ scope.row.invoicedB ? '是' : '否' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="invoicePdfPath" label="发票PDF路径" show-overflow-tooltip>
                    <template #default="scope">
                        <span class="copy-td" @click="copyText(scope.row.invoicePdfPath)">{{ scope.row.invoicePdfPath
                        }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="verifiedInJstTime" label="聚水潭核验" />
                <el-table-column prop="invoicedTime" label="开票时间" />
                <el-table-column prop="registeredSendbackTime" label="开票登记回传时间" />
                <el-table-column prop="sendbackDoneTime" label="开票回传完成时间" />
                <el-table-column prop="markInJstTime" label="聚水潭标记时间" />
                <el-table-column prop="status" label="开票状态">
                    <template #default="scope">
                        <span>{{ scope.row.status === 1 ? '成功' : (scope.row.status === 0 ? '处理中' : '失败') }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="failReason" label="失败原因" />

            </el-table>
            <div style="flex:0 0 auto;margin-top: 10px;">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="formData.pageSize"
                    :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" :total="total"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { onMounted, ref } from 'vue';
const platforms = ref<any[]>([]);
const shops = ref<any[]>([]);
const formData = ref({
    orderNo: '',
    platform: '',
    shopName: '',
    createdAt: '',
    pageNo: 1,
    pageSize: 20
});
const total = ref(0);
const currentPage = ref(1);

const invoiceTableData = ref<any[]>([]);
const getPlatforms = async () => {
    const resp = await http.get<any>('/invoice/getPlatforms');
    console.log('Platforms:', resp);
    platforms.value = resp;
}
const handleSizeChange = async (newSize: number) => {
    formData.value.pageSize = newSize;
    await onSearch();
}
const handleCurrentChange = async (newPage: number) => {
    formData.value.pageNo = newPage;
    await onSearch();
}
const onPlatformChange = async (value: string) => {
    const resp = await http.get<any>(`/invoice/getShops/${value}`);
    console.log('Shops:', resp);
    shops.value = resp;

}
const onSearch = async () => {
    console.log('Search with form data:', formData.value);
    const resp = await http.post<any>('/invoice/query', formData.value);
    console.log('Search Results:', resp);
    invoiceTableData.value = resp.records;
    total.value = resp.total;
}
const copyText = (text: string) => {
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
onMounted(() => {
    getPlatforms();
});

</script>
<style scoped>
.invoice-view {
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
}

.table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.copy-td {
    cursor: pointer;
    color: #409EFF;
}
</style>