<template>
  <div class="scan-page">
    <div class="scan-container">
      <h1 class="title">Scan Wajah Anda</h1>
      <div class="video-container">
        <video
          ref="video"
          autoplay
          muted
          playsinline
          width="100%"
          height="auto"
        ></video>
      </div>
      <div class="button-container">
        <button
          @click="captureFace"
          class="scan-button"
          :disabled="loadingModels"
        >
          Ambil Foto & Simpan
        </button>
        <!-- Spinner Loading -->
        <div v-if="scanning" class="overlay">
          <div class="spinner"></div>
          <p>Memindai wajah, mohon tunggu...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const pengunjungId = ref(null);
const loadingModels = ref(true);
const scanning = ref(false);
const video = ref(null);

onMounted(async () => {
  pengunjungId.value = route.params.id;
  await initCamera();
  await loadModels();
});

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    video.value.srcObject = stream;
  } catch (error) {
    console.error('Gagal mengakses kamera:', error);
    toast.error('Tidak dapat mengakses kamera.', { timeout: 3000 });
  }
}

async function loadModels() {
  const MODEL_URL = 'http://localhost:5000/models';
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  } catch (error) {
    console.error('Gagal memuat model:', error);
    toast.error('Gagal memuat model deteksi wajah.', { timeout: 3000 });
  } finally {
    loadingModels.value = false;
  }
}

async function captureFace() {
  if (loadingModels.value) {
    toast.info('Model masih dimuat, tunggu sebentar…', { timeout: 2000 });
    return;
  }

  scanning.value = true;

  try {
    const detection = await faceapi.detectSingleFace(
      video.value,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      })
    );

    if (detection) {
      const canvas = document.createElement('canvas');
      canvas.width = video.value.videoWidth;
      canvas.height = video.value.videoHeight;
      canvas.getContext('2d').drawImage(video.value, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg');
      await uploadFace(imageBase64);
    } else {
      scanning.value = false;
      toast.error('Wajah tidak terdeteksi. Memuat ulang halaman…', { timeout: 2000 });
      setTimeout(() => window.location.reload(), 2000);
    }
  } catch (error) {
    scanning.value = false;
    console.error('Gagal mendeteksi wajah:', error);
    toast.error('Gagal mendeteksi wajah. Memuat ulang halaman…', { timeout: 2000 });
    setTimeout(() => window.location.reload(), 2000);
  }
}

async function uploadFace(imageBase64) {
  try {
    const blob = dataURLtoBlob(imageBase64);
    const formData = new FormData();
    formData.append('image', blob, 'face.jpg');
    formData.append('pengunjung_id', pengunjungId.value);

    await axios.post('http://localhost:5000/api/upload-face', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.success('Wajah berhasil disimpan!', { timeout: 3000 });
    router.push('/sukses');
  } catch (error) {
    scanning.value = false;
    console.error('Gagal upload wajah:', error.response?.data || error.message);
    toast.error('Gagal mengunggah wajah. Memuat ulang halaman…', { timeout: 2000 });
    setTimeout(() => window.location.reload(), 2000);
  }
}

function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
</script>

<style scoped>
/* Latar belakang gradasi lebih smooth */
.scan-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #2f318b, #f8b50e);
  background-size: 400% 400%;
  animation: bgMove 20s ease infinite;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
  color: white;
}

/* Animasi latar lebih halus dan terus bergerak */
@keyframes bgMove {
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

/* Kontainer Scan transparan */
.scan-container {
  background: rgba(255, 255, 255, 0.15); /* transparan elegan */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.5s ease;
}

.scan-container:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 45px rgba(0, 0, 0, 0.4);
}

/* Judul */
h1.title {
  color: #ffffff;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 10px rgba(0, 0, 0, 0.3);
  animation: fadeDown 2s ease forwards;
}

/* Efek fade lembut untuk judul */
@keyframes fadeDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Wadah video wajah */
.video-container {
  margin: 20px 0;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 300px;
  background: rgba(47, 49, 139, 0.3); /* sedikit biru transparan */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(5px);
}

/* Video wajahnya */
.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
  filter: brightness(1.1) contrast(1.1); /* sedikit dipoles agar "menyatu" */
}

/* Tombol scan */
.scan-button {
  margin-top: 20px;
  padding: 12px 30px;
  background: #f8b50e;
  color: white;
  font-size: 1.2rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.scan-button:hover {
  background: #ffca3a;
  transform: scale(1.08);
}

.scan-button:active {
  transform: scale(0.98);
}

/* Responsif */
@media (max-width: 768px) {
  .scan-container {
    padding: 2rem;
    width: 90%;
  }

  .video-container {
    height: 220px;
  }

  h1.title {
    font-size: 2rem;
  }
}

/* Spinner overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #ccc;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.overlay p {
  font-weight: bold;
  color: #333;
}
</style>
