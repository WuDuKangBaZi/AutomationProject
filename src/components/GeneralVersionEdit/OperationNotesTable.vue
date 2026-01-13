<template>
    <el-tooltip
      class="item"
      effect="dark"
      placement="top"
      :disabled="!notes || notes.length === 0"
    >
      <template #content>
        <el-table :data="notes" border style="width: 300px">
          <el-table-column prop="key" label="Key" width="120"></el-table-column>
          <el-table-column prop="value" label="Value"></el-table-column>
        </el-table>
      </template>
      <slot></slot>
    </el-tooltip>
  </template>
  
  <script>
  export default {
    props: {
      notes: {
        type: Array,
        required: true,
      },
    },
  };
  </script>
  
  <style scoped>
  /* 可根据需求调整样式 */
  </style>
  