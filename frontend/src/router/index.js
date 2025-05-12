import { createRouter, createWebHistory } from 'vue-router';

// Halaman untuk pengunjung
import PengunjungForm from '@/components/PengunjungForm.vue';
import FaceScan from '@/components/FaceScan.vue';
import Sukses from '@/views/Sukses.vue';

// Halaman admin
import LoginAdmin from '@/components/LoginAdmin.vue';
import AdminDashboard from '@/views/AdminDashboard.vue';

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
    component: AdminDashboard
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
