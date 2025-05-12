<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name:'App'
}
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
  display: flex;
  flex-direction: column;
}
</style>