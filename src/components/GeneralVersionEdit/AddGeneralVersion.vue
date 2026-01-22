<template>
    <el-dialog title="添加任务" v-model="addDialogVisible" width="50%">
        <template #title>
            <div style="user-select: none;">
                <span>添加通版改新任务</span>
            </div>
        </template>
        <!-- <el-divider> 粘贴 日期|编辑|文件名 列 </el-divider>
        <el-input type="text" v-model="pastedTitle" placeholder="日期|编辑|文件名" /> -->
        <el-divider> 粘贴编码等内容 </el-divider>
        <el-input type="textarea" :rows="10" placeholder="新编码|旧编码|商品名称|新版定价|类型|备注" v-model="pasted" clearable
            @input="handleInput">
        </el-input>
        <el-divider> 预览解析结果 </el-divider>
        <el-table :data="pastedRows" border max-height="300px" empty-text="粘贴数据后会自动拼接匹配" :show-overflow-tooltip="true">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="editor" label="编辑" width="120" />
            <el-table-column prop="fileName" label="文件名" width="200" />
            <el-table-column prop="newCode" label="新编码" width="150" />
            <!-- <el-table-column prop="oldCode" label="旧编码" width="150" /> -->
            <el-table-column prop="goodsName" label="商品名称" width="200" />
            <el-table-column prop="newPrice" label="新版定价" width="100" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="remark" label="备注" />
        </el-table>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="addDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="onSubmit">确 定</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import http from '@/utils/http';
import { ElTableColumn, ElMessage } from 'element-plus';
import { computed, ref } from 'vue';
const pasted = ref("");
const pastedRows = ref<any[]>([]);
let timer: any = null;
const props = defineProps<{
    visible: boolean;
}>();
const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'refreshData'): void; // 新增事件
}>();
const addDialogVisible = computed({
    get: () => props.visible,
    set: (val: boolean) => {
        emit('update:visible', val);
    }
});
const onSubmit = async () => {
    try {
        const resp = await http.post<any>('/generic/add', pastedRows.value);
        console.log("提交结果:", resp);
        emit('refreshData'); // 通知父组件刷新数据
        addDialogVisible.value = false;
        ElMessage({ message: '添加成功', type: 'success', duration: 2000 });
    } catch (error) {
        console.error('提交失败:', error);
        ElMessage({ message: '添加失败，请重试', type: 'error', duration: 3000 });
    }

};
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';

    // 1. 处理 "1.7" 或 "1.07" 这种月.日格式
    if (/^\d+\.\d+$/.test(dateStr)) {
        const parts = dateStr.split('.');
        const month = parts[0] ? parts[0].padStart(2, '0') : '01';
        const day = (parts[1] ?? '').padStart(2, '0');
        const year = new Date().getFullYear();
        return `${year}-${month}-${day}`;
    }
    return dateStr;
};
const parseRows = () => {
    if (!pasted.value) {
        pastedRows.value = [];
        return;
    }
    console.log("Parsing rows...");
    console.log(pasted.value);

    // 合并单元格中的换行
    const rawLines = pasted.value.split('\n');
    const lines: string[] = [];
    let tempLine = '';
    rawLines.forEach((line) => {
        if (tempLine) {
            tempLine += '\n' + line;
            if (/".*"$/.test(line)) {
                lines.push(tempLine);
                tempLine = '';
            }
        } else if (/^".*"$/.test(line) || !line.includes('"')) {
            lines.push(line);
        } else {
            tempLine = line;
        }
    });
    if (tempLine) lines.push(tempLine); // 处理最后一行未闭合的情况

    let currentCommon = {
        date: '',
        editor: '',
        fileName: ''
    };
    const results: any[] = [];
    lines.forEach((line, index) => {
        // 按制表符分割列，并去掉单元格内容的引号
        const cols = line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));

        // 提取本行的前3列
        const rawDate = cols[0] || '';
        const colEditor = cols[1] || '';
        const colFileName = cols[2] || '';
        // colDate需要转换
        const colDate = formatDate(rawDate);
        // 更新公共信息逻辑：
        if (colDate || colEditor || colFileName) {
            currentCommon = {
                date: colDate || currentCommon.date,
                editor: colEditor || currentCommon.editor,
                fileName: colFileName || currentCommon.fileName
            };
        }
        // 构建备注
        let operationRemark: object[] = [];
        const shopRemarks = ['天猫书海', '天猫敏尔', '天猫至美', '天猫好知', '天猫书一', '天猫南图', '豆豆书屋', '小豆同学'];
        shopRemarks.forEach((shop, i) => {
            const remarkColIndex = 9 + i; // 备注从第10列开始
            const remarkValue = cols[remarkColIndex] || '';
            if (remarkValue) {
                operationRemark.push({ [shop]: remarkValue }); // 动态键名
            }
        });

        // 构建行数据
        const row = {
            date: currentCommon.date,
            editor: currentCommon.editor,
            fileName: currentCommon.fileName,
            // 核心数据从第4列(索引3)开始
            newCode: cols[3] || '',
            goodsName: cols[5] || '',
            newPrice: cols[6] || '',
            type: cols[7] || '',
            remark: cols[8] || '',
            // 拼接各店备注
            operationRemark: operationRemark
        };
        console.log(`Parsed line ${index + 1}:`, cols);
        if (row.newCode || row.goodsName) {
            results.push(row);
        }
    });
    pastedRows.value = results;
    console.log("Parsed rows:", pastedRows.value);
}
const handleInput = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
        parseRows();              // <-- 新增：每次输入都重新解析
        // await checkDuplicates();  // <-- 再检查重复
    }, 400);
}
</script>
<style lang="css" scoped>
.el-divider--horizontal {
    margin: 12px 0;
}
</style>