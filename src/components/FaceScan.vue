<template>
  <div class="scan-page">
    <div class="scan-container">
      <h1 class="title">Scan Wajah Anda</h1>
      <div v-if="loadingModels" class="loading-indicator">
        <div class="spinner"></div>
        <p>Memuat model deteksi wajah, mohon tunggu...</p>
      </div>
      <div v-else class="video-container">
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
          :disabled="loadingModels || scanning"
        >
          Ambil Foto & Simpan
        </button>
        <div v-if="scanning" class="overlay">
          <div class="spinner"></div>
          <p>Memindai wajah, mohon tunggu...</p>
        </div>
      </div>
      <div v-if="qrCode" class="qr-container">
        <p>Data dan wajah berhasil disimpan! Untuk memindai QR code:</p>
        <ol>
          <li>Buka aplikasi pemindai QR di ponsel Anda (misalnya, Google Lens, QR Scanner, atau kamera ponsel).</li>
          <li>Arahkan kamera ke kode QR di bawah ini.</li>
          <li>Ikuti tautan yang muncul untuk verifikasi kunjungan Anda.</li>
        </ol>
        <qrcode-vue :value="qrCode" :size="400" level="H" />
        <button @click="downloadQR">Unduh QR Code</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { usePengunjungStore } from '../storage/pengunjungStore';
import * as faceapi from "face-api.js";
import axios from "axios";
import QrcodeVue from 'qrcode.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const pengunjungStore = usePengunjungStore();

const pengunjungId = ref(null);
const loadingModels = ref(true);
const scanning = ref(false);
const video = ref(null);
const qrCode = ref(null);

onMounted(async () => {
  pengunjungId.value = route.params.id;
  await loadModels();
  await nextTick();
  await initCamera();
});

async function initCamera() {
  try {
    // Cek izin kamera (optional, bisa dihapus jika bermasalah di beberapa browser)
    if (navigator.permissions && navigator.permissions.query) {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      if (permissionStatus.state === 'denied') {
        toast.error("Akses kamera ditolak. Izinkan akses kamera di pengaturan browser Anda.", { timeout: 5000 });
        return;
      }
    }

    if (!video.value) {
      toast.error("Elemen video tidak ditemukan. Coba muat ulang halaman.", { timeout: 5000 });
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    video.value.srcObject = stream;
  } catch (error) {
    let errorMessage = "Tidak dapat mengakses kamera.";
    if (error.name === "NotReadableError") {
      errorMessage = "Kamera sedang digunakan oleh aplikasi lain atau tidak tersedia. Tutup aplikasi lain dan coba lagi.";
    } else if (error.name === "NotAllowedError") {
      errorMessage = "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser Anda.";
    }
    toast.error(errorMessage, { timeout: 5000 });
  }
}

async function loadModels() {
  const MODEL_URL = "http://localhost:5000/models";
  try {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Pemuatan model timeout")), 10000);
    });
    await Promise.race([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      timeout,
    ]);
    loadingModels.value = false;
    // Load model lain di background
    Promise.all([
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch(() => {});
  } catch (error) {
    toast.error("Gagal memuat model deteksi wajah.", { timeout: 3000 });
    loadingModels.value = false;
  }
}

async function captureFace() {
  if (loadingModels.value) {
    toast.info("Model masih dimuat, tunggu sebentar…", { timeout: 2000 });
    return;
  }
  if (!video.value || !video.value.srcObject) {
    toast.error("Kamera belum siap. Coba muat ulang halaman.", { timeout: 2000 });
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
      const canvas = document.createElement("canvas");
      canvas.width = video.value.videoWidth;
      canvas.height = video.value.videoHeight;
      canvas.getContext("2d").drawImage(video.value, 0, 0);
      const imageBase64 = canvas.toDataURL("image/jpeg");
      await uploadFace(imageBase64);
      scanning.value = false;
    } else {
      scanning.value = false;
      toast.error("Wajah tidak terdeteksi. Memuat ulang halaman…", { timeout: 2000 });
      setTimeout(() => window.location.reload(), 2000);
    }
  } catch (error) {
    scanning.value = false;
    toast.error("Gagal mendeteksi wajah. Memuat ulang halaman…", { timeout: 2000 });
    setTimeout(() => window.location.reload(), 2000);
  }
}

async function uploadFace(imageBase64) {
  try {
    const blob = dataURLtoBlob(imageBase64);
    const formData = new FormData();
    formData.append("nama", pengunjungStore.data.nama);
    formData.append("hp", pengunjungStore.data.hp);
    formData.append("instansi", pengunjungStore.data.instansi);
    formData.append("tujuan", pengunjungStore.data.tujuan);
    formData.append("keperluan", pengunjungStore.data.keperluan);
    formData.append("foto", blob, "face.jpg");

    const response = await axios.post("http://localhost:5000/api/pengunjung", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const pengunjungId = response.data.id;
    qrCode.value = `http://localhost:5000/api/pengunjung/${pengunjungId}`;
    toast.success("Data dan wajah berhasil disimpan! QR code ditampilkan di bawah.", { timeout: 3000 });

    // Format nomor HP ke format WhatsApp
    let phoneNumber = pengunjungStore.data.hp.replace(/[- ]/g, "");
    if (!phoneNumber.startsWith("+62") && !phoneNumber.startsWith("62")) {
      phoneNumber = `+62${phoneNumber.replace(/^0/, "")}`;
    }
    if (!/^\+62[0-9]{9,12}$/.test(phoneNumber)) {
      throw new Error("Nomor telepon tidak valid untuk WhatsApp.");
    }

    await axios.post("http://localhost:5000/api/send-qr", {
      phoneNumber,
      pengunjungId,
    });

    pengunjungStore.reset();
  } catch (error) {
    scanning.value = false;
    toast.error(`Gagal mengunggah data: ${error.response?.data?.error || error.message}`, { timeout: 2000 });
  }
}

function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function downloadQR() {
  // Ambil canvas QRCodeVue (biasanya canvas pertama di .qr-container)
  const qrContainer = document.querySelector('.qr-container');
  const canvas = qrContainer ? qrContainer.querySelector('canvas') : null;
  if (!canvas) {
    toast.error("QR code belum tersedia untuk diunduh.");
    return;
  }
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'qr_code.png';
  link.click();
}
</script>

<style scoped>
.scan-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #2f318b, #ffffff);
  background-size: 200% 200%;
  animation: gradientMove 10s ease infinite;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
  color: white;
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

.scan-container {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin: 0 auto;
}

.scan-container:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
}

h1.title {
  color: #ffffff;
  font-size: 2.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.5);
  animation: fadeIn 1.5s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-container {
  margin: 20px 0;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 350px;
  background: rgba(47, 49, 139, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
  filter: brightness(1.2) contrast(1.1);
}

.scan-button {
  margin-top: 20px;
  padding: 15px 40px;
  background: linear-gradient(135deg, #ffffff, #2f318b);
  color: #2f318b;
  font-size: 1.3rem;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.scan-button:hover {
  background: linear-gradient(135deg, #2f318b, #ffffff);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.scan-button:active {
  transform: scale(0.95);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(47, 49, 139, 0.9);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.overlay p {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
}

.qr-container {
  margin-top: 1rem;
  z-index: 1001;
  }

.qr-container ol {
  text-align: left;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #ffffff;
}

.qr-container p {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.qr-container button {
  margin-top: 1rem;
  background: linear-gradient(90deg, #2f318b 60%, #1976d2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.qr-container button:hover {
  background: linear-gradient(90deg, #1976d2 60%, #2f318b 100%);
}

@media (max-width: 768px) {
  .scan-container {
    padding: 2rem;
    width: 90%;
  }

  .video-container {
    height: 250px;
  }

  h1.title {
    font-size: 2rem;
  }

  .scan-button {
    font-size: 1.1rem;
    padding: 12px 30px;
  }

  .qr-container ol {
    font-size: 0.9rem;
  }
}
</style>