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
/* Latar belakang dengan gradasi dinamis */
.success-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #2f318b, #ffffff);
  background-size: 200% 200%;
  animation: gradientMove 8s ease infinite;
  flex-direction: column;
  text-align: center;
  overflow: hidden;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Wrapper untuk ikon dan teks */
.checkmark-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: fadeIn 1.5s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ikon centang dengan animasi */
.checkmark-icon {
  font-size: 80px;
  color: #ffffff;
  margin-bottom: 20px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Teks utama */
.success-text {
  font-size: 28px;
  color: #ffffff;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: fadeInText 2s ease forwards;
}

@keyframes fadeInText {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Teks tambahan */
.sub-text {
  font-size: 18px;
  color: #ffffff;
  text-align: center;
  line-height: 1.5;
  animation: fadeInText 2.5s ease forwards;
}
</style>