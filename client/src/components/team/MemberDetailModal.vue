<script setup>
import MemberDetailDrawer from './MemberDetailDrawer.vue';

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  member: {
    type: Object,
    default: null
  },
  projectKey: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue', 'close', 'remove']);
</script>

<template>
  <MemberDetailDrawer
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :member="member"
    :projectKey="projectKey"
    @remove="$emit('remove', $event)"
    @close="$emit('close')"
  />
</template>
