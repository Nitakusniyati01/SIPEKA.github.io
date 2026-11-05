const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let currentUser = null, currentPage = "dashboard", toastTimer;
const icons = {dashboard:"▦",reports:"▤",newReport:"＋",categories:"◇",users:"♙",notifications:"♧",summary:"▥",profile:"⚙"};
const navItems = [
  {id:"dashboard",label:"Dashboard",icon:"▦",roles:["Mahasiswa","Admin","Petugas"]},
  {id:"reports",label:"Data Pengaduan",icon:"▤",roles:["Mahasiswa","Admin","Petugas"]},
  {id:"newReport",label:"Buat Pengaduan",icon:"＋",roles:["Mahasiswa"]},
  {id:"categories",label:"Kategori",icon:"◇",roles:["Admin"]},
  {id:"users",label:"Data Pengguna",icon:"♙",roles:["Admin"]},
  {id:"notifications",label:"Notifikasi",icon:"♧",roles:["Mahasiswa","Admin","Petugas"]},
  {id:"summary",label:"Laporan & Rekap",icon:"▥",roles:["Admin","Petugas"]},
  {id:"profile",label:"Profil Saya",icon:"⚙",roles:["Mahasiswa","Admin","Petugas"]}
];
const reports = () => DB.read(DB.keys.reports);
const users = () => DB.read(DB.keys.users);
const categories = () => DB.read(DB.keys.categories);
const notifications = () => DB.read(DB.keys.notifications);
const fmtDate = d => d ? new Date(d).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "-";
const initials = name => (name||"U").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
const escapeHTML = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statusBadge = s => `<span class="badge status-${escapeHTML(s)}">${escapeHTML(s)}</span>`;
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function showAuth(type="login"){
  $("#mainView").classList.add("hidden");$("#authView").classList.remove("hidden");
  const box=$("#authContent");
  if(type==="register") box.innerHTML=`<h2 class="auth-title">Buat akun mahasiswa</h2><p class="auth-sub muted">Daftar untuk mulai menyampaikan pengaduan kampus.</p>
    <form id="registerForm"><div class="field"><label>Nama lengkap</label><input name="name" required placeholder="Nama lengkap"></div><div class="field"><label>NIM</label><input name="nim" required placeholder="Nomor induk mahasiswa"></div><div class="field"><label>Email</label><input name="email" type="email" required placeholder="nama@email.com"></div><div class="field"><label>Password</label><input name="password" type="password" minlength="6" required placeholder="Minimal 6 karakter"></div><button class="btn btn-primary btn-block">Daftar Sekarang</button></form><div class="auth-links"><span class="muted">Sudah punya akun?</span><a class="link" data-auth="login">Masuk</a></div>`;
  else if(type==="forgot") box.innerHTML=`<h2 class="auth-title">Atur ulang password</h2><p class="auth-sub muted">Masukkan email akun dan password baru. Pada prototipe ini, perubahan dilakukan langsung di browser.</p><form id="forgotForm"><div class="field"><label>Email terdaftar</label><input name="email" type="email" required placeholder="nama@email.com"></div><div class="field"><label>Password baru</label><input name="password" type="password" minlength="6" required placeholder="Minimal 6 karakter"></div><div class="field"><label>Konfirmasi password</label><input name="confirm" type="password" minlength="6" required placeholder="Ulangi password baru"></div><button class="btn btn-primary btn-block">Simpan Password Baru</button></form><div class="auth-links"><a class="link" data-auth="login">← Kembali ke login</a></div>`;
  else box.innerHTML=`<h2 class="auth-title">Selamat datang 👋</h2><p class="auth-sub muted">Masuk ke akun SIPEKA untuk mengelola pengaduan lingkungan kampus.</p><form id="loginForm"><div class="field"><label>Email</label><input name="email" type="email" required placeholder="Masukkan email"></div><div class="field"><label>Password</label><input name="password" type="password" required placeholder="Masukkan password"></div><button class="btn btn-primary btn-block">Masuk ke SIPEKA →</button></form><div class="auth-links"><a class="link" data-auth="forgot">Lupa password?</a><a class="link" data-auth="register">Buat akun</a></div><div class="demo-box"><strong>Akun demo untuk mencoba:</strong><br>Admin: admin@sipeka.test / admin123<br>Petugas: petugas@sipeka.test / petugas123<br>Mahasiswa: mahasiswa@sipeka.test / nita123</div>`;
}
function login(user){currentUser=user;DB.write(DB.keys.session,user.id);$("#authView").classList.add("hidden");$("#mainView").classList.remove("hidden");currentPage="dashboard";renderShell();renderPage();}
function logout(){currentUser=null;localStorage.removeItem(DB.keys.session);$("#mainView").classList.add("hidden");showAuth("login");}
function renderShell(){
  $("#sideName").textContent=currentUser.name;$("#sideRole").textContent=currentUser.role;$("#sideAvatar").textContent=initials(currentUser.name);$("#topAvatar").textContent=initials(currentUser.name);$("#topName").textContent=currentUser.name;
  $("#navigation").innerHTML=navItems.filter(n=>n.roles.includes(currentUser.role)).map(n=>`<button data-page="${n.id}" class="${currentPage===n.id?"active":""}"><span class="nav-icon">${n.icon}</span>${n.label}</button>`).join("");
  const unread=notifications().filter(n=>n.userId===currentUser.id&&!n.read).length;$("#notificationDot").classList.toggle("hidden",!unread);
}
function setPage(page){currentPage=page;$("#sidebar").classList.remove("open");renderShell();renderPage();window.scrollTo(0,0);}
function addNotification(userId,title,message){const list=notifications();list.unshift({id:DB.id("NTF"),userId,title,message,date:new Date().toISOString(),read:false});DB.write(DB.keys.notifications,list);}
function statCard(label,value,icon,caption="Ringkasan data"){return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-caption">${caption}</div></div>`;}
function visibleReports(){const all=reports();return currentUser.role==="Mahasiswa"?all.filter(r=>r.userId===currentUser.id):all;}
function renderDashboard(){
 const all=visibleReports(),count=s=>all.filter(r=>r.status===s).length;
 const greeting=currentUser.role==="Mahasiswa"?"Pantau dan kelola pengaduan yang kamu sampaikan.":"Pantau laporan masuk dan tindak lanjut masalah di lingkungan kampus.";
 return `<div class="welcome"><div><h3>Halo, ${escapeHTML(currentUser.name.split(" ")[0])}! 👋</h3><p>${greeting}</p></div><div class="welcome-art">🏫</div></div>
 <div class="stats">${statCard("Total Pengaduan",all.length,"▤")}${statCard("Menunggu",count("Menunggu"),"◷")}${statCard("Diproses",count("Diproses"),"⚙")}${statCard("Selesai",count("Selesai"),"✓")}</div>
 <div class="section-head"><div><h3>Pengaduan Terbaru</h3><p>Daftar laporan yang terakhir masuk.</p></div><button class="btn btn-light" data-page="reports">Lihat semua →</button></div>
 <div class="panel">${reportTable(all.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5))}</div>`;
}
function reportTable(list){
 if(!list.length)return `<div class="empty"><div class="empty-icon">📭</div>Belum ada pengaduan.</div>`;
 return `<div class="table-wrap"><table><thead><tr><th>ID / TANGGAL</th><th>JUDUL PENGADUAN</th><th>KATEGORI</th><th>PELAPOR</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>${list.map(r=>`<tr><td><strong>${escapeHTML(r.id)}</strong><div class="table-sub">${fmtDate(r.createdAt)}</div></td><td><div class="table-title">${escapeHTML(r.title)}</div><div class="table-sub">${escapeHTML(r.location)}</div></td><td>${escapeHTML(r.category)}</td><td>${escapeHTML(r.name)}</td><td>${statusBadge(r.status)}</td><td><div class="actions"><button class="action-btn" data-detail="${r.id}">Detail</button>${currentUser.role!=="Mahasiswa"?`<button class="action-btn" data-manage="${r.id}">Proses</button>`:""}</div></td></tr>`).join("")}</tbody></table></div>`;
}
function renderReports(){
 const list=visibleReports();
 return `<div class="section-head"><div><h3>Data Pengaduan</h3><p>${currentUser.role==="Mahasiswa"?"Daftar pengaduan yang telah kamu buat.":"Kelola seluruh pengaduan yang masuk."}</p></div>${currentUser.role==="Mahasiswa"?`<button class="btn btn-primary" data-page="newReport">＋ Buat Pengaduan</button>`:""}</div>
 <div class="panel"><div class="toolbar"><div class="toolbar-left"><input class="search-input" id="reportSearch" placeholder="Cari judul atau ID..."></div><div class="toolbar-right"><select class="search-input" id="statusFilter"><option value="">Semua status</option>${["Menunggu","Diterima","Diproses","Selesai","Ditolak"].map(s=>`<option>${s}</option>`).join("")}</select></div></div><div id="reportTable">${reportTable(list)}</div></div>`;
}
function filteredReportTable(){
 const q=($("#reportSearch")?.value||"").toLowerCase(),s=$("#statusFilter")?.value||"";
 const list=visibleReports().filter(r=>(r.title+" "+r.id+" "+r.category).toLowerCase().includes(q)&&(!s||r.status===s));
 $("#reportTable").innerHTML=reportTable(list);
}
function renderNewReport(){
 return `<div class="section-head"><div><h3>Buat Pengaduan Baru</h3><p>Sampaikan masalah yang terjadi di lingkungan kampus.</p></div></div><div class="panel"><div class="notice">💡 Jelaskan masalah dengan lengkap dan sertakan lokasi agar petugas lebih mudah melakukan tindak lanjut.</div><form id="reportForm"><div class="form-grid"><div class="field span-2"><label>Judul pengaduan *</label><input name="title" required maxlength="100" placeholder="Contoh: AC ruang kelas tidak berfungsi"></div><div class="field"><label>Kategori *</label><select name="category" required>${categories().map(c=>`<option>${escapeHTML(c)}</option>`).join("")}</select></div><div class="field"><label>Tanggal kejadian *</label><input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></div><div class="field span-2"><label>Lokasi kejadian *</label><input name="location" required placeholder="Contoh: Gedung B, ruang 201"></div><div class="field span-2"><label>Deskripsi masalah *</label><textarea name="description" required minlength="10" placeholder="Ceritakan kronologi atau detail masalah..."></textarea></div><div class="field span-2"><label>Foto dokumentasi (opsional)</label><input name="photo" type="file" accept="image/*"><small class="muted">Foto disimpan di browser. Gunakan gambar berukuran kecil agar penyimpanan tidak cepat penuh.</small></div></div><div class="form-actions"><button type="button" class="btn btn-light" data-page="reports">Batal</button><button class="btn btn-primary">Kirim Pengaduan</button></div></form></div>`;
}
function renderCategories(){
 const cats=categories(),all=reports();
 return `<div class="section-head"><div><h3>Kategori Pengaduan</h3><p>Kelola kelompok masalah yang dapat dipilih mahasiswa.</p></div><button class="btn btn-primary" id="addCategory">＋ Tambah Kategori</button></div><div class="category-grid">${cats.map((c,i)=>`<div class="category-card"><div class="cat-icon">${["🏢","📶","🎓","💡","🛡️","🧹","📌"][i%7]}</div><strong>${escapeHTML(c)}</strong><small>${all.filter(r=>r.category===c).length} pengaduan</small><div style="margin-top:12px"><button class="action-btn" data-edit-cat="${escapeHTML(c)}">Ubah nama</button> <button class="action-btn" data-del-cat="${escapeHTML(c)}">Hapus</button></div></div>`).join("")}</div>`;
}
function renderUsers(){
 const list=users();
 return `<div class="section-head"><div><h3>Data Pengguna</h3><p>Daftar akun yang terdaftar dalam prototipe SIPEKA.</p></div><button class="btn btn-primary" id="addUser">＋ Tambah Pengguna</button></div><div class="panel"><div class="table-wrap"><table><thead><tr><th>NAMA</th><th>EMAIL</th><th>NIM</th><th>PERAN</th><th>AKSI</th></tr></thead><tbody>${list.map(u=>`<tr><td><strong>${escapeHTML(u.name)}</strong></td><td>${escapeHTML(u.email)}</td><td>${escapeHTML(u.nim||"-")}</td><td><span class="badge status-Diterima">${u.role}</span></td><td><div class="actions"><button class="action-btn" data-edit-user="${u.id}">Edit</button>${u.id!==currentUser.id?`<button class="action-btn" data-del-user="${u.id}">Hapus</button>`:""}</div></td></tr>`).join("")}</tbody></table></div></div>`;
}
function renderNotifications(){
 const list=notifications().filter(n=>n.userId===currentUser.id);
 return `<div class="section-head"><div><h3>Notifikasi</h3><p>Informasi terbaru terkait aktivitas akun dan pengaduan.</p></div><button class="btn btn-light" id="readAll">Tandai semua dibaca</button></div><div class="panel">${list.length?list.map(n=>`<div class="notification-item"><div class="stat-icon">♧</div><div><strong style="font-size:13px">${escapeHTML(n.title)}</strong><p>${escapeHTML(n.message)}</p><small>${new Date(n.date).toLocaleString("id-ID")}${n.read?" · Dibaca":" · Belum dibaca"}</small></div></div>`).join(""):`<div class="empty"><div class="empty-icon">🔔</div>Belum ada notifikasi.</div>`}</div>`;
}
function renderSummary(){
 const all=reports(),statuses=["Menunggu","Diterima","Diproses","Selesai","Ditolak"];
 return `<div class="section-head"><div><h3>Laporan & Rekap Pengaduan</h3><p>Ringkasan seluruh pengaduan yang tercatat.</p></div><button class="btn btn-primary" id="exportCsv">↓ Unduh CSV</button></div><div class="panel"><div class="report-cards">${statuses.map(s=>`<div class="report-card"><span>${s}</span><strong>${all.filter(r=>r.status===s).length}</strong></div>`).join("")}<div class="report-card"><span>Total Pengaduan</span><strong>${all.length}</strong></div></div><div class="section-head"><div><h3>Rincian Pengaduan</h3><p>Data dapat diunduh untuk dokumentasi.</p></div></div>${reportTable(all)}</div>`;
}
function renderProfile(){
 return `<div class="section-head"><div><h3>Profil Saya</h3><p>Kelola informasi akun SIPEKA.</p></div></div><div class="panel"><div class="profile-head"><div class="avatar">${initials(currentUser.name)}</div><div><strong>${escapeHTML(currentUser.name)}</strong><div class="muted" style="font-size:12px;margin-top:4px">${currentUser.role}</div></div></div><form id="profileForm"><div class="form-grid"><div class="field"><label>Nama lengkap</label><input name="name" required value="${escapeHTML(currentUser.name)}"></div><div class="field"><label>Email</label><input name="email" type="email" required value="${escapeHTML(currentUser.email)}"></div><div class="field"><label>NIM</label><input name="nim" value="${escapeHTML(currentUser.nim||"")}" ${currentUser.role!=="Mahasiswa"?"disabled":""}></div><div class="field"><label>Nomor telepon</label><input name="phone" value="${escapeHTML(currentUser.phone||"")}" placeholder="08xxxxxxxxxx"></div><div class="field span-2"><label>Password baru (kosongkan jika tidak diubah)</label><input name="password" type="password" minlength="6" placeholder="Minimal 6 karakter"></div></div><div class="form-actions"><button class="btn btn-primary">Simpan Perubahan</button></div></form></div>`;
}
function renderPage(){
 const pages={dashboard:["Dashboard",renderDashboard],reports:["Data Pengaduan",renderReports],newReport:["Buat Pengaduan",renderNewReport],categories:["Kategori Pengaduan",renderCategories],users:["Data Pengguna",renderUsers],notifications:["Notifikasi",renderNotifications],summary:["Laporan & Rekap",renderSummary],profile:["Profil Saya",renderProfile]};
 if(!pages[currentPage]||!navItems.some(n=>n.id===currentPage&&n.roles.includes(currentUser.role)))currentPage="dashboard";
 $("#pageHeading").textContent=pages[currentPage][0];$("#pageContent").innerHTML=pages[currentPage][1]();renderShell();
}
function openModal(title,body){$("#modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close-btn" id="closeModal">✕</button></div>${body}</div></div>`;}
function closeModal(){$("#modalRoot").innerHTML="";}
function showDetail(id){
 const r=reports().find(x=>x.id===id);if(!r)return;
 if(currentUser.role==="Mahasiswa"&&r.userId!==currentUser.id)return toast("Pengaduan tidak ditemukan.");
 const history=(r.history||[]).slice().reverse().map(h=>`<div class="timeline-item"><strong>${escapeHTML(h.status)}</strong><p>${escapeHTML(h.note)}</p><small class="muted">${new Date(h.date).toLocaleString("id-ID")}</small></div>`).join("");
 openModal("Detail Pengaduan",`<div class="detail-grid"><div><div class="detail-row"><div class="detail-label">ID PENGADUAN</div><div class="detail-value">${r.id}</div></div><div class="detail-row"><div class="detail-label">JUDUL</div><div class="detail-value">${escapeHTML(r.title)}</div></div><div class="detail-row"><div class="detail-label">DESKRIPSI</div><div class="detail-value" style="font-weight:400;line-height:1.6">${escapeHTML(r.description)}</div></div><div class="detail-row"><div class="detail-label">LOKASI</div><div class="detail-value">${escapeHTML(r.location)}</div></div><div class="detail-row"><div class="detail-label">PELAPOR</div><div class="detail-value">${escapeHTML(r.name)}</div></div><div class="detail-row"><div class="detail-label">TANGGAPAN PETUGAS</div><div class="detail-value">${escapeHTML(r.response||"Belum ada tanggapan.")}</div></div></div><div><div class="detail-row"><div class="detail-label">STATUS</div>${statusBadge(r.status)}</div><div class="detail-row"><div class="detail-label">KATEGORI</div><div class="detail-value">${escapeHTML(r.category)}</div></div><div class="detail-row"><div class="detail-label">TANGGAL KEJADIAN</div><div class="detail-value">${fmtDate(r.date)}</div></div><div class="detail-row"><div class="detail-label">RIWAYAT STATUS</div><div class="timeline">${history||"Belum ada riwayat."}</div></div></div></div>${currentUser.role==="Mahasiswa"&&r.status==="Menunggu"?`<div class="form-actions"><button class="btn btn-light" data-edit-report="${r.id}">Edit Pengaduan</button><button class="btn btn-danger" data-delete-report="${r.id}">Hapus</button></div>`:""}${currentUser.role!=="Mahasiswa"?`<div class="form-actions"><button class="btn btn-primary" data-manage="${r.id}">Proses Pengaduan</button></div>`:""}`);
}
function manageReport(id){
 const r=reports().find(x=>x.id===id);if(!r)return;
 openModal("Tindak Lanjut Pengaduan",`<form id="manageForm" data-id="${id}"><div class="field"><label>Ubah status</label><select name="status">${["Menunggu","Diterima","Diproses","Selesai","Ditolak"].map(s=>`<option ${r.status===s?"selected":""}>${s}</option>`).join("")}</select></div><div class="field"><label>Petugas penanggung jawab</label><input name="assigned" value="${escapeHTML(r.assigned||currentUser.name)}"></div><div class="field"><label>Tanggapan / catatan</label><textarea name="response" placeholder="Tuliskan tindak lanjut...">${escapeHTML(r.response||"")}</textarea></div><button class="btn btn-primary btn-block">Simpan Tindak Lanjut</button></form>`);
}
function editReport(id){
 const r=reports().find(x=>x.id===id);if(!r)return;
 closeModal();setPage("newReport");
 const form=$("#reportForm");if(!form)return;
 form.dataset.edit=id;form.elements.title.value=r.title;form.elements.category.value=r.category;form.elements.date.value=r.date;form.elements.location.value=r.location;form.elements.description.value=r.description;
 form.querySelector("button[type=submit]")?.focus();
}
function deleteReport(id){
 if(!confirm("Yakin ingin menghapus pengaduan ini?"))return;
 DB.write(DB.keys.reports,reports().filter(r=>r.id!==id));closeModal();renderPage();toast("Pengaduan berhasil dihapus.");
}
function saveReport(form){
 const data=new FormData(form),id=form.dataset.edit;
 const list=reports(),existing=id?list.find(r=>r.id===id):null;
 const report={id:id||DB.id("PGD-"),userId:existing?.userId||currentUser.id,name:existing?.name||currentUser.name,title:data.get("title").trim(),category:data.get("category"),date:data.get("date"),location:data.get("location").trim(),description:data.get("description").trim(),photo:"",status:existing?.status||"Menunggu",assigned:existing?.assigned||"",createdAt:existing?.createdAt||new Date().toISOString(),history:existing?.history||[],response:existing?.response||""};
 const file=form.elements.photo?.files?.[0];
 const save=()=>{if(!existing)report.history.push({status:"Menunggu",note:"Pengaduan dibuat oleh mahasiswa",date:new Date().toISOString()});if(existing)list[list.findIndex(r=>r.id===id)]=report;else list.unshift(report);DB.write(DB.keys.reports,list);if(!existing)users().filter(u=>u.role==="Admin"||u.role==="Petugas").forEach(u=>addNotification(u.id,"Pengaduan baru",`${currentUser.name} mengirim pengaduan: ${report.title}`));toast(existing?"Pengaduan berhasil diperbarui.":"Pengaduan berhasil dikirim.");setPage("reports");};
 if(file){if(file.size>700000){toast("Ukuran foto maksimal 700 KB untuk prototipe.");return;}const reader=new FileReader();reader.onload=()=>{report.photo=reader.result;save();};reader.readAsDataURL(file);}else save();
}
function exportCSV(){
 const rows=[["ID","Tanggal","Judul","Kategori","Lokasi","Pelapor","Status","Tanggapan"],...reports().map(r=>[r.id,r.date,r.title,r.category,r.location,r.name,r.status,r.response||""])];
 const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));a.download="laporan-pengaduan-sipeka.csv";a.click();URL.revokeObjectURL(a.href);
}
document.addEventListener("click",e=>{
 const auth=e.target.closest("[data-auth]");if(auth){showAuth(auth.dataset.auth);return;}
 const page=e.target.closest("[data-page]");if(page){setPage(page.dataset.page);return;}
 const detail=e.target.closest("[data-detail]");if(detail){showDetail(detail.dataset.detail);return;}
 const manage=e.target.closest("[data-manage]");if(manage){manageReport(manage.dataset.manage);return;}
 const edit=e.target.closest("[data-edit-report]");if(edit){editReport(edit.dataset.editReport);return;}
 const del=e.target.closest("[data-delete-report]");if(del){deleteReport(del.dataset.deleteReport);return;}
 if(e.target.id==="closeModal"||e.target.classList.contains("modal-backdrop"))closeModal();
 if(e.target.id==="logoutBtn")logout();
 if(e.target.id==="mobileMenu")$("#sidebar").classList.toggle("open");
 if(e.target.id==="readAll"){const list=notifications().map(n=>n.userId===currentUser.id?{...n,read:true}:n);DB.write(DB.keys.notifications,list);renderPage();toast("Semua notifikasi ditandai dibaca.");}
 if(e.target.id==="exportCsv")exportCSV();
 if(e.target.id==="addCategory")openModal("Tambah Kategori",`<form id="categoryForm"><div class="field"><label>Nama kategori</label><input name="name" required></div><button class="btn btn-primary btn-block">Simpan</button></form>`);
 if(e.target.dataset.editCat)openModal("Ubah Kategori",`<form id="categoryForm" data-old="${escapeHTML(e.target.dataset.editCat)}"><div class="field"><label>Nama kategori</label><input name="name" required value="${escapeHTML(e.target.dataset.editCat)}"></div><button class="btn btn-primary btn-block">Simpan</button></form>`);
 if(e.target.dataset.delCat){const cat=e.target.dataset.delCat;if(reports().some(r=>r.category===cat)){toast("Kategori masih digunakan oleh pengaduan.");return;}if(confirm("Hapus kategori ini?")){DB.write(DB.keys.categories,categories().filter(c=>c!==cat));renderPage();toast("Kategori dihapus.");}}
 if(e.target.id==="addUser")openUserForm();
 if(e.target.dataset.editUser)openUserForm(e.target.dataset.editUser);
 if(e.target.dataset.delUser){if(confirm("Hapus pengguna ini?")){DB.write(DB.keys.users,users().filter(u=>u.id!==e.target.dataset.delUser));renderPage();toast("Pengguna dihapus.");}}
});
function openUserForm(id=""){
 const u=users().find(x=>x.id===id);
 openModal(u?"Edit Pengguna":"Tambah Pengguna",`<form id="userForm" data-id="${id}"><div class="field"><label>Nama</label><input name="name" required value="${escapeHTML(u?.name||"")}"></div><div class="field"><label>Email</label><input name="email" type="email" required value="${escapeHTML(u?.email||"")}"></div><div class="field"><label>NIM</label><input name="nim" value="${escapeHTML(u?.nim||"")}"></div><div class="field"><label>Peran</label><select name="role">${["Mahasiswa","Petugas","Admin"].map(r=>`<option ${u?.role===r?"selected":""}>${r}</option>`).join("")}</select></div>${u?"":`<div class="field"><label>Password awal</label><input name="password" required minlength="6" type="password"></div>`}<button class="btn btn-primary btn-block">Simpan Pengguna</button></form>`);
}
document.addEventListener("input",e=>{if(e.target.id==="reportSearch")filteredReportTable();});
document.addEventListener("change",e=>{if(e.target.id==="statusFilter")filteredReportTable();});
document.addEventListener("submit",e=>{
 e.preventDefault();const f=e.target,d=new FormData(f);
 if(f.id==="loginForm"){const email=d.get("email").trim().toLowerCase(),pass=d.get("password"),u=users().find(x=>x.email.toLowerCase()===email&&x.password===pass);if(!u){toast("Email atau password salah.");return;}login(u);}
 if(f.id==="registerForm"){const email=d.get("email").trim().toLowerCase();if(users().some(u=>u.email.toLowerCase()===email)){toast("Email sudah terdaftar.");return;}const u={id:DB.id("USR"),name:d.get("name").trim(),email,password:d.get("password"),role:"Mahasiswa",nim:d.get("nim").trim(),phone:""};DB.write(DB.keys.users,[...users(),u]);toast("Registrasi berhasil. Silakan login.");showAuth("login");}
 if(f.id==="forgotForm"){const email=d.get("email").trim().toLowerCase(),list=users(),i=list.findIndex(u=>u.email.toLowerCase()===email);if(i<0){toast("Email tidak ditemukan.");return;}if(d.get("password")!==d.get("confirm")){toast("Konfirmasi password tidak sama.");return;}list[i].password=d.get("password");DB.write(DB.keys.users,list);toast("Password berhasil diubah. Silakan login.");showAuth("login");}
 if(f.id==="reportForm")saveReport(f);
 if(f.id==="manageForm"){const list=reports(),i=list.findIndex(r=>r.id===f.dataset.id),old=list[i].status,newStatus=d.get("status");list[i].status=newStatus;list[i].assigned=d.get("assigned");list[i].response=d.get("response");if(old!==newStatus||d.get("response"))list[i].history.push({status:newStatus,note:d.get("response")||"Status diperbarui",date:new Date().toISOString()});DB.write(DB.keys.reports,list);addNotification(list[i].userId,"Pembaruan pengaduan",`Status pengaduan ${list[i].id} sekarang: ${newStatus}. ${d.get("response")||""}`);closeModal();renderPage();toast("Tindak lanjut berhasil disimpan.");}
 if(f.id==="categoryForm"){const name=d.get("name").trim(),old=f.dataset.old,list=categories();if(!name){return;}if(list.some(c=>c.toLowerCase()===name.toLowerCase()&&c!==old)){toast("Kategori sudah ada.");return;}if(old)DB.write(DB.keys.categories,list.map(c=>c===old?name:c));else DB.write(DB.keys.categories,[...list,name]);closeModal();renderPage();toast("Kategori berhasil disimpan.");}
 if(f.id==="userForm"){const list=users(),id=f.dataset.id,email=d.get("email").trim().toLowerCase();if(list.some(u=>u.email.toLowerCase()===email&&u.id!==id)){toast("Email sudah digunakan.");return;}if(id){const i=list.findIndex(u=>u.id===id);Object.assign(list[i],{name:d.get("name").trim(),email,nim:d.get("nim"),role:d.get("role")});}else list.push({id:DB.id("USR"),name:d.get("name").trim(),email,nim:d.get("nim"),role:d.get("role"),password:d.get("password"),phone:""});DB.write(DB.keys.users,list);closeModal();renderPage();toast("Data pengguna disimpan.");}
 if(f.id==="profileForm"){const list=users(),i=list.findIndex(u=>u.id===currentUser.id),email=d.get("email").trim().toLowerCase();if(list.some(u=>u.email.toLowerCase()===email&&u.id!==currentUser.id)){toast("Email sudah digunakan akun lain.");return;}Object.assign(list[i],{name:d.get("name").trim(),email,phone:d.get("phone"),...(currentUser.role==="Mahasiswa"?{nim:d.get("nim")}:{})});if(d.get("password"))list[i].password=d.get("password");DB.write(DB.keys.users,list);currentUser=list[i];renderShell();renderPage();toast("Profil berhasil diperbarui.");}
});
const sessionId=localStorage.getItem(DB.keys.session);
if(sessionId){const found=users().find(u=>u.id===sessionId);if(found)login(found);else showAuth("login");}else showAuth("login");
