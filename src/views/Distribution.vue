<template>
    <div class="distribution-view">
        <el-form label-width="auto" class="search-form" style="flex: 0 0 auto;">
            <div class="form-fields">
                <el-form-item label="配置日期">
                    <el-date-picker type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
                </el-form-item>
                <el-form-item label="关键词">
                    <el-input placeholder="输入关键词" clear />
                </el-form-item>
                <el-form-item label="聚水潭编码">
                    <el-input placeholder="输入聚水潭编码" clear />
                </el-form-item>
                <el-form-item label="发起时间">
                    <el-date-picker type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
                </el-form-item>
            </div>
            <div class="from-action">
                <el-button type="primary" @click="onSearch">搜索</el-button>
                <el-button type="success" @click="addDialogVisible = true">批量导入</el-button>
                <el-button type="warning">导出结果</el-button>
            </div>
        </el-form>
        <el-divider style="flex: 0 0 auto; margin: 8px 0;" />
        <div class="table-wrapper">
            <el-table :data="searchRows" style="flex: 1;width: 100%;" empty-text="暂无数据" :show-overflow-tooltip="true">
                <el-table-column label="配置日期" prop="configDate" />
                <el-table-column label="关键词" prop="keyword" />
                <el-table-column label="售价" prop="price" />
                <el-table-column label="上架店铺" prop="store" />
                <el-table-column label="重要程度" prop="importance" />
                <el-table-column label="发起时间" prop="initTime" />
                <el-table-column label="目标上架时间" prop="targetTime" />
                <el-table-column label="源商品ID" prop="productId">
                    <template #default="{ row }">
                        <div v-if="row.productId === ''">
                            <el-button link type="primary">补充源数据</el-button>
                        </div>
                        <div v-else>
                            {{ row.productId }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="{ row }">
                        <div v-if="row.productId === ''">
                            <el-button link type="warning" disabled>数据缺失</el-button>
                        </div>
                        <div v-else>
                            <el-button link type="primary">查看运行详情</el-button>
                        </div>
                    </template>

                </el-table-column>
            </el-table>
        </div>
    </div>
    <el-dialog title="批量导入铺货任务" width="75%" v-model="addDialogVisible">
        <el-input class="dialog-textarea" type="textarea" :rows="10" placeholder="请输入内容" clearable
            v-model="pastDistri" />
        <el-table :data="pastedRows" empty-text="粘贴数据后自动解析" border table-layout="auto" height="300px"
            style="width: 100%;">
            <el-table-column label="关键词" prop="keyword" />
            <el-table-column label="售价" prop="price" />
            <el-table-column label="上架店铺" prop="store" />
            <el-table-column label="聚水潭店铺ID" prop="storeId" />
            <el-table-column label="重要程度" prop="importance" />
            <el-table-column label="SKU策略" prop="skuStrategy" />
            <el-table-column label="发起时间" prop="initTime" />
            <el-table-column label="目标上架时间" prop="targetTime" />
        </el-table>
        <template #footer>
            <el-button @click="addDialogVisible = false">关闭</el-button>
            <el-button type="primary" @click="batchInsert">确认导入</el-button>
        </template>
    </el-dialog>

</template>
<script setup lang="ts">
import { normalizeDate } from '@/utils/dateUtil';
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
const addDialogVisible = ref(false);
const pastDistri = ref('');
const searchRows = ref<any[]>([]);
const pastedRows = computed(() => {
    if (!pastDistri.value) {
        console.log('没有输入数据');
        return [];
    };
    return pastDistri.value.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
        .map(lin => {
            const cols = lin.includes('\t') ? lin.split('\t') : lin.split(/\s{2,}/);
            return {
                keyword: (cols[0] || '').trim(),
                price: (cols[12] || '').trim(),
                store: (cols[15] || '').trim(),
                storeId: (cols[16] || '').trim(),
                importance: (cols[17] || '').trim(),
                initTime: (normalizeDate(cols[22]) || '').trim(),
                targetTime: (normalizeDate(cols[29]) || '').trim(),
                productId: (cols[31] || '').trim(),
            };
        });
})
const groupedRows = computed(() => {
    type RawRow = {
        keyword: string;
        price: string;
        store: string;
        storeId: string;
        importance: string;
        initTime: string;
        targetTime: string;
        productId: string;
    };

    type GroupRow = {
        keyword: string;
        price: string;
        store: string[];
        storeId: string[];
        importance: string;
        initTime: string;
        targetTime: string;
        productId: string;
        // 内部去重用
        _pairSet?: Set<string>;
    };

    const map = new Map<string, GroupRow>();

    for (const r of pastedRows.value as RawRow[]) {
        const keyword = (r.keyword || '').trim();
        if (!keyword) continue;

        let g = map.get(keyword);
        if (!g) {
            g = {
                keyword,
                price: r.price || '',
                store: [],
                storeId: [],
                importance: r.importance || '',
                initTime: r.initTime || '',
                targetTime: r.targetTime || '',
                productId: r.productId || '',
                _pairSet: new Set<string>(),
            };
            map.set(keyword, g);
        }

        const store = (r.store || '').trim();
        const storeId = (r.storeId || '').trim();

        // store + storeId 作为一组唯一键，避免重复
        const pairKey = `${store}||${storeId}`;
        if ((store || storeId) && !g._pairSet!.has(pairKey)) {
            g._pairSet!.add(pairKey);
            g.store.push(store);
            g.storeId.push(storeId);
        }
    }

    return Array.from(map.values()).map(({ _pairSet, ...rest }) => rest);
});
async function batchInsert() {
    console.log('批量插入数据', groupedRows.value);
    const resp = await http.post('/distri/batch_insert', groupedRows.value);
    console.log('批量插入结果', resp);
}
async function onSearch() {
    try {
        const resp: any = await http.post('/distri/query', {})
        console.log('查询结果', resp.records);
        ElMessage.success('查询成功');
        searchRows.value = resp.records || [];
    } catch (error) {
        console.error('查询失败', error);
        ElMessage.error('查询失败');
    }
}
</script>
<style scope>
.distribution-view {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
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