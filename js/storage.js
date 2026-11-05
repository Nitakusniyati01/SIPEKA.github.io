/* SIPEKA - penyimpanan prototipe menggunakan LocalStorage */
const DB = {
  keys: { users: "sipeka_users", reports: "sipeka_reports", notifications: "sipeka_notifications", session: "sipeka_session", categories: "sipeka_categories" },
  read(key, fallback=[]) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  id(prefix="ID") { return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase(); },
  seed() {
    if (!localStorage.getItem(this.keys.users)) {
      this.write(this.keys.users, [
        {id:"USR001",name:"Administrator SIPEKA",email:"admin@sipeka.test",password:"admin123",role:"Admin",nim:"-",phone:""},
        {id:"USR002",name:"Petugas Kampus",email:"petugas@sipeka.test",password:"petugas123",role:"Petugas",nim:"-",phone:""},
        {id:"USR003",name:"Nita Kusniyati",email:"mahasiswa@sipeka.test",password:"nita123",role:"Mahasiswa",nim:"20260001",phone:""}
      ]);
    }
    if (!localStorage.getItem(this.keys.categories)) this.write(this.keys.categories, ["Fasilitas Kampus","Jaringan Internet","Akademik","Kelistrikan","Keamanan","Kebersihan","Lainnya"]);
    if (!localStorage.getItem(this.keys.reports)) {
      const now = new Date().toISOString();
      this.write(this.keys.reports, [
        {id:"PGD-001",userId:"USR003",name:"Nita Kusniyati",title:"Wi-Fi di Gedung A tidak stabil",category:"Jaringan Internet",location:"Gedung A, Lantai 2",date:new Date().toISOString().slice(0,10),description:"Koneksi Wi-Fi sering terputus saat kegiatan perkuliahan berlangsung.",photo:"",status:"Diproses",assigned:"Petugas Kampus",createdAt:now,history:[{status:"Menunggu",note:"Pengaduan dibuat",date:now},{status:"Diterima",note:"Pengaduan diterima admin",date:now},{status:"Diproses",note:"Sedang ditangani petugas",date:now}],response:"Petugas sedang melakukan pengecekan jaringan."},
        {id:"PGD-002",userId:"USR003",name:"Nita Kusniyati",title:"Lampu ruang kelas mati",category:"Kelistrikan",location:"Ruang 204",date:new Date().toISOString().slice(0,10),description:"Beberapa lampu di ruang kelas tidak menyala.",photo:"",status:"Selesai",assigned:"Petugas Kampus",createdAt:now,history:[{status:"Menunggu",note:"Pengaduan dibuat",date:now},{status:"Selesai",note:"Lampu telah diperbaiki",date:now}],response:"Lampu sudah diperbaiki."}
      ]);
    }
    if (!localStorage.getItem(this.keys.notifications)) this.write(this.keys.notifications, []);
  }
};
DB.seed();
