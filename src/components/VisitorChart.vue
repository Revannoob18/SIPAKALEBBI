<template>
  <div class="chart-container">
    <div v-if="isLoading" class="loading">
      <p>📊 Loading chart data...</p>
    </div>
    <div v-else-if="hasValidData" class="chart-wrapper">
      <Line :data="chartData" :options="options" />
    </div>
    <div v-else class="no-data">
      <p>📭 Belum ada data untuk ditampilkan</p>
      <button @click="$emit('refresh')" class="refresh-btn">🔄 Refresh Data</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler);

const props = defineProps({
  data: { 
    type: Object, 
    required: true,
    default: () => ({ labels: [], data: [] })
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['refresh']);

// ✅ IMPROVED: Fungsi untuk mengubah format bulan
function formatBulan(bulan) {
  console.log("🔍 Formatting bulan:", bulan);
  
  if (!bulan) return "Unknown";
  
  // Handle different formats
  if (bulan.includes("-")) {
    // Format: "2025-01"
    const [year, month] = bulan.split("-");
    const namaBulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${namaBulan[monthIndex] || "Unknown"} ${year}`;
  }
  
  // Already formatted (e.g., "January 2025")
  return bulan;
}

// ✅ IMPROVED: Check if data is valid
const hasValidData = computed(() => {
  const labels = props.data?.labels;
  const data = props.data?.data;
  
  const isValid = Array.isArray(labels) && 
                  Array.isArray(data) && 
                  labels.length > 0 && 
                  data.length > 0 &&
                  !labels.includes("Error Loading") &&
                  !labels.includes("Belum Ada Data");
                  
  console.log("📊 Chart data validation:", {
    labels: labels,
    data: data,
    isValid: isValid
  });
  
  return isValid;
});

// ✅ IMPROVED: Chart data computation
const chartData = computed(() => {
  console.log("📊 Computing chart data from props:", props.data);
  
  if (!hasValidData.value) {
    return {
      labels: ["No Data"],
      datasets: [{
        label: "Jumlah Pengunjung",
        data: [0],
        fill: true,
        borderColor: "#dc3545",
        backgroundColor: "rgba(220,53,69,0.15)",
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    };
  }
  
  const formattedLabels = props.data.labels.map(formatBulan);
  const chartValues = props.data.data.map(val => parseInt(val) || 0);
  
  console.log("📊 Final chart data:", {
    labels: formattedLabels,
    data: chartValues
  });
  
  return {
    labels: formattedLabels,
    datasets: [{
      label: "Jumlah Pengunjung",
      data: chartValues,
      fill: true,
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.15)",
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: "#3b82f6",
      pointBorderColor: "#fff",
      pointBorderWidth: 2
    }]
  };
});

// ✅ IMPROVED: Chart options
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      display: true, 
      labels: { 
        color: "#222", 
        font: { size: 14 },
        usePointStyle: true
      } 
    },
    title: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#3b82f6',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      title: { 
        display: true, 
        text: "Bulan", 
        color: "#222",
        font: { size: 12, weight: 'bold' }
      },
      ticks: { 
        color: "#222",
        maxRotation: 45,
        minRotation: 0
      },
      grid: {
        color: 'rgba(0,0,0,0.1)'
      }
    },
    y: {
      beginAtZero: true,
      title: { 
        display: true, 
        text: "Jumlah Pengunjung", 
        color: "#222",
        font: { size: 12, weight: 'bold' }
      },
      ticks: { 
        color: "#222",
        stepSize: 1
      },
      grid: {
        color: 'rgba(0,0,0,0.1)'
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 20px 0 rgba(59,130,246,0.1);
  padding: 2rem;
  min-height: 400px;
  position: relative;
}

.chart-wrapper {
  width: 100%;
  height: 350px;
  position: relative;
}

.loading, .no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  color: #666;
}

.loading p {
  font-size: 1.1rem;
  margin: 0;
}

.no-data p {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: #999;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .chart-container {
    padding: 1rem;
    margin: 0 0.5rem;
  }
  
  .chart-wrapper {
    height: 300px;
  }
}
</style>