<template>
    <el-dialog title="预售信息" v-model="addDialogVisible" width="50%" :before-close="() => { }">
        <span>粘贴自动识别预售信息</span>
        <el-input class="dialog-textarea" type="textarea" :rows="10" placeholder="请输入内容" v-model="pastPresale"
            clearable>
        </el-input>
        <el-table :data="pastedRows" empty-text="粘贴数据后自动解析" border table-layout="auto" height="300px"
            style="width:100%">
            <el-table-column prop="configDate" label="日期" />
            <el-table-column prop="configTime" label="时间" />
            <el-table-column prop="goodsCode" label="商品编码" />
            <el-table-column prop="goodsName" label="商品名称" />
            <el-table-column prop="shortageReason" label="缺货原因" />
            <el-table-column prop="presaleEndTime" label="预售截止" />
            <el-table-column prop="handlingMethod" label="处理方式" />
            <el-table-column prop="personInCharge" label="负责人" />
        </el-table>
        <template #footer>
            <el-button @click="close">取 消</el-button>
            <el-button type="primary" @click="submitPresale">确 定</el-button>
        </template>

    </el-dialog>
</template>
<script lang="ts" setup>
import { normalizeDate } from '@/utils/dateUtil';
import http from '@/utils/http';
import { computed, ref } from 'vue';

const props = defineProps<{
    visible: boolean;
}>();
const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e:'reoload'):void;
}>();
const addDialogVisible = computed({
    get: () => props.visible,
    set: (val: boolean) => {
        emit('update:visible', val);
    }
});

const pastPresale = ref("");
const pastedRows = computed(() => {
    if (!pastPresale.value) return [];
    return pastPresale.value
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(line => {
            // 如果包含制表符，用制表符拆；否则用连续两个以上空格拆
            const cols = line.includes('\t')
                ? line.split('\t')
                : line.split(/\s{2,}/);

            return {
                configDate: normalizeDate(cols[0]).trim(),
                configTime: (cols[1] || "").trim(),
                goodsCode: (cols[2] || "").trim(),
                goodsName: (cols[3] || "").trim(),
                shortageReason: (cols[4] || "").trim(),
                presaleEndTime: (normalizeDate(cols[5]) || "").trim(),
                handlingMethod: (cols[6] || "").trim(),
                personInCharge: (cols[7] || "").trim(),
                create_time: "" // 留空由后端生成
            };
        })
        .filter(r => r.goodsCode);// 过滤掉无 goods_id 的行
});
function close() {
    addDialogVisible.value = false;
    pastPresale.value = "";
}
async function submitPresale() {
    
    try{
        const resp = await http.post('/presaleMain/batchInsert', pastedRows.value);
        close();
        emit('reoload');
    }catch(error){
        console.error("Failed to submit presale data:", error);
        close();
    }
    
}
</script>
<style scoped></style>