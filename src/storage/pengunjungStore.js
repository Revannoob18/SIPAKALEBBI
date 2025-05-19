import { defineStore } from 'pinia';

export const usePengunjungStore = defineStore('pengunjung', {
  state: () => ({
    data: {
      nama: "",
      hp: "",
      instansi: "",
      tujuan: "",
      keperluan: "",
    }
  }),
  actions: {
    setData(form) {
      this.data = { ...form };
    },
    reset() {
      this.data = {
        nama: "",
        hp: "",
        instansi: "",
        tujuan: "",
        keperluan: "",
      };
    }
  }
});