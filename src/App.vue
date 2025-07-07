<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
const isLoggedIn = !!localStorage.getItem('authToken');
</script>

<style scoped>
@import 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';

body {
  margin: 0;
  background: linear-gradient(to right, #e3f2fd, #ffffff);
  font-family: 'Segoe UI', sans-serif;
  transition: all 0.3s ease-in-out;
}

#app {
  min-height: 100vh;
  display: block; /* atau flex-direction: column; tanpa justify/align center */
}
</style>