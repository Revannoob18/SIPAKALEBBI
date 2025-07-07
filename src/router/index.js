import { createRouter, createWebHashHistory } from "vue-router";

// Halaman untuk pengunjung
import PengunjungForm from "@/components/PengunjungForm.vue";
import FaceScan from "@/components/FaceScan.vue";
import Sukses from "@/views/Sukses.vue";

// Halaman admin
import LoginAdmin from "@/components/LoginAdmin.vue";
import AdminDashboard from "@/views/AdminDashboard.vue";

// Fungsi untuk memeriksa autentikasi
const isAuthenticated = () => {
  // Periksa apakah token login tersimpan di localStorage
  return !!localStorage.getItem("authToken");
};

const routes = [
  {
    path: "/",
    name: "PengunjungForm",
    component: PengunjungForm,
  },
  {
    path: "/facescan",
    name: "FaceScan",
    component: () => import("@/components/FaceScan.vue"),
  },
  {
    path: "/sukses",
    name: "Sukses",
    component: Sukses,
  },
  {
    path: "/admin",
    component: LoginAdmin,
  },
  {
  path: "/admin/dashboard",
  name: "AdminDashboard",
  component: AdminDashboard,
  meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Route guard untuk proteksi halaman admin
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return next("/admin"); // Redirect ke halaman login admin jika belum login
    }
  }
  next();
});

export default router;
