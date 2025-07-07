<template>
  <div class="chart-container">
    <Line :data="chartData" :options="options" />
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
  data: { type: Object, required: true }
});

// Fungsi untuk mengubah "2025-05" menjadi "Mei 2025"
function formatBulan(bulan) {
  const [year, month] = bulan.split("-");
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${namaBulan[parseInt(month, 10) - 1]} ${year}`;
}

const chartData = computed(() => ({
  labels: props.data.labels?.length
    ? props.data.labels.map(formatBulan)
    : ["-"],
  datasets: [
    {
      label: "Jumlah Pengunjung",
      data: props.data.data?.length ? props.data.data : [0],
      fill: true,
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.15)",
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  ]
}));

const options = {
  responsive: true,
  plugins: {
    legend: { display: true, labels: { color: "#222", font: { size: 14 } } },
    title: { display: false }
  },
  scales: {
    x: {
      title: { display: true, text: "Bulan", color: "#222" },
      ticks: { color: "#222" }
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: "Jumlah Pengunjung", color: "#222" },
      ticks: { color: "#222" }
    }
  }
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(59,130,246,0.08);
  padding: 2rem 1rem 1rem 1rem;
}
</style>