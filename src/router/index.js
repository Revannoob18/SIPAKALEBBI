import { createRouter, createWebHashHistory } from 'vue-router';

// Halaman untuk pengunjung
import PengunjungForm from '@/components/PengunjungForm.vue';
import FaceScan from '@/components/FaceScan.vue';
import Sukses from '@/views/Sukses.vue';

// Halaman admin
import LoginAdmin from '@/components/LoginAdmin.vue';
import AdminDashboard from '@/views/AdminDashboard.vue';

// Fungsi untuk memeriksa autentikasi
const isAuthenticated = () => {
  // Periksa apakah token login tersimpan di localStorage
  return !!localStorage.getItem('authToken');
};

const routes = [
  {
    path: '/',
    name: 'PengunjungForm',
    component: PengunjungForm
  },
  {
    path: '/facescan/:id',
    name: 'FaceScan',
    component: () => import('@/components/FaceScan.vue')
  },
  {
    path: '/sukses',
    name: 'Sukses',
    component: Sukses
  },
  {
    path: '/admin',
    name: 'LoginAdmin',
    component: LoginAdmin
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        // Jika belum login, arahkan ke halaman login
        next('/admin');
      } else {
        // Jika sudah login, izinkan akses
        next();
      }
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;