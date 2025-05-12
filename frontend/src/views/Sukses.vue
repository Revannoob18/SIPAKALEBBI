<template>
  <div class="success-container">
    <div class="checkmark-wrapper">
      <i class="fas fa-check-circle checkmark-icon"></i>
      <h1 class="success-text">Data Berhasil Disimpan!</h1>
      <p class="sub-text">Silakan masuk ke sekolah</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Sukses",
  mounted() {
    setTimeout(() => {
      this.$router.push('/');
    }, 7000); // Redirect setelah 7 detik
  }
};
</script>

<style scoped>
.success-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #2f318b 0%, #f8b50e 100%);
  flex-direction: column;
  text-align: center;
}

.checkmark-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.checkmark-icon {
  font-size: 80px;
  color: #ffffff;
  margin-bottom: 20px;
  animation: scaleUp 1s ease-in-out infinite;
}

.success-text {
  font-size: 24px;
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sub-text {
  font-size: 18px;
  color: #f0f0f0;
  text-align: center;
  line-height: 1.5;
}

@keyframes scaleUp {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>
