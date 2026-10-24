document.addEventListener("DOMContentLoaded", () => {
  // 1. Logika untuk Halaman Utama (Daftar Artikel)
  const articleList = document.getElementById("article-list");
  if (articleList) {
    loadArticles();
  }

  // 2. Logika untuk Halaman Detail Artikel
  const urlParams = new URLSearchParams(window.location.search);
  const articleFile = urlParams.get("file");

  // Pastikan ini adalah halaman artikel dan parameter file ada
  if (document.getElementById("article-content-container") && articleFile) {
    loadArticleDetail(articleFile);
  } else if (
    document.getElementById("article-content-container") &&
    !articleFile
  ) {
    document.getElementById("article-content-container").innerHTML =
      '<div class="article-detail"><h2>Tidak ada artikel yang dipilih.</h2><a href="index.html">Kembali ke Beranda</a></div>';
  }
});

/**
 * Fungsi untuk mengambil dan merender daftar artikel di index.html
 */
async function loadArticles() {
  const articleListContainer = document.getElementById("article-list");

  /* 
      PENTING:
      Karena ini adalah website statis di Cloudflare Pages dan murni frontend (tanpa backend/API),
      JavaScript vanila tidak bisa membaca isi direktori folder (seperti readdir) secara otomatis.
      
      Untuk produksi sungguhan:
      Bisa menambahkan file index.json di root /content/artikel yang berisi daftar nama file, 
      lalu JS fetch index.json tersebut.
      
      Di sini kita simulasikan dengan daftar manual (array).
    */
  const filesToLoad = ["contoh-artikel-1.json"];

  // Kosongkan kontainer sebelum merender (menghapus text 'Memuat artikel...')
  articleListContainer.innerHTML = "";

  try {
    for (const file of filesToLoad) {
      // Fetch file JSON dari folder
      const response = await fetch(`./content/artikel/${file}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const article = await response.json();

      // Format tanggal agar mudah dibaca
      const publishDate = new Date(article.date).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Membuat elemen kartu (Card)
      const card = document.createElement("article");
      card.className = "article-card";
      card.innerHTML = `
                <h3>${article.title}</h3>
                <div class="article-meta">
                    Penulis: <strong>${article.author}</strong> | ${publishDate}
                </div>
                <p>${article.abstract}</p>
                <a href="artikel.html?file=${file}" class="read-more">Baca Selengkapnya</a>
            `;

      articleListContainer.appendChild(card);
    }

    if (filesToLoad.length === 0) {
      articleListContainer.innerHTML =
        "<p>Belum ada artikel ilmiah yang diterbitkan.</p>";
    }
  } catch (error) {
    console.error("Error saat memuat daftar artikel:", error);
    articleListContainer.innerHTML =
      '<p style="color:red;">Terjadi kesalahan saat memuat artikel.</p>';
  }
}

/**
 * Fungsi untuk mengambil dan merender detail dari 1 artikel di artikel.html
 */
async function loadArticleDetail(filename) {
  try {
    const response = await fetch(`./content/artikel/${filename}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const article = await response.json();

    // Format tanggal
    const publishDate = new Date(article.date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Update tag title di head HTML untuk SEO & Browser tab
    document.title = `${article.title} - Portal Jurnal Ilmiah`;

    // Render data text biasa ke DOM
    document.getElementById("article-title").textContent = article.title;
    document.getElementById("article-author").textContent = article.author;
    document.getElementById("article-date").textContent = publishDate;
    document.getElementById("article-abstract-text").textContent =
      article.abstract;

    // Render Markdown Body (Simulasi Sederhana)
    // Di dunia nyata, Anda mungkin butuh library seperti "marked.js" untuk mengubah string markdown ke HTML seutuhnya.
    // Simulasi ini hanya merubah baris baru (\n) menjadi <br>
    const parsedBody = article.body
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>");
    document.getElementById("article-body").innerHTML = parsedBody;

    // Render Tombol PDF (Jika URL PDF tersedia di JSON)
    const pdfContainer = document.getElementById("pdf-container");
    if (article.pdf_file && article.pdf_file.trim() !== "") {
      pdfContainer.innerHTML = `<a href="${article.pdf_file}" class="pdf-download-btn" target="_blank" rel="noopener noreferrer">Unduh / Lihat Jurnal (PDF)</a>`;
    }
  } catch (error) {
    console.error("Error saat memuat detail artikel:", error);
    document.getElementById("article-content-container").innerHTML =
      '<div class="article-detail"><h2>Artikel tidak ditemukan atau gagal dimuat.</h2><br><a href="index.html">Kembali ke Beranda</a></div>';
  }
}

// Variable Global untuk Cerpen & Paginasi
let dataCerpenGlobal = [];
let currentPage = 1;
const itemsPerPage = 3; // Dibatasi 3 karya yang tampil per halaman

document.addEventListener("DOMContentLoaded", () => {
  loadDataCerpen();
});

// 1. Fetch Data dari JSON
function loadDataCerpen() {
  fetch("./assets/data/cerpen.json")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal mengambil data cerpen.");
      return response.json();
    })
    .then((data) => {
      dataCerpenGlobal = data;
      updateFinalisSection(dataCerpenGlobal);
      renderLokaKaryaPage(1); // Default ke halaman 1
    })
    .catch((err) => {
      console.error(err);
    });
}

// Update Informasi 6 Finalis (Juara 1-3 & Finalis 4-6)
function updateFinalisSection(data) {
  // Filter khusus kategori_slug "finalis"
  const finalisData = data.filter((item) => item.kategori_slug === "finalis");

  // Urutkan berdasarkan angka peringkat
  finalisData.sort((a, b) => (a.peringkat || 99) - (b.peringkat || 99));

  finalisData.forEach((item, index) => {
    const idNum = String(index + 1).padStart(2, "0");
    const titleEl = document.getElementById(`title-cerpen-${idNum}`);
    const authorEl = document.getElementById(`author-cerpen-${idNum}`);

    if (titleEl) titleEl.innerText = item.judul;
    if (authorEl) authorEl.innerText = `"${item.penulis}"`;

    // Ambil elemen card induk (baik Juara 1-3 maupun Finalis 4-6)
    const cardEl = titleEl?.closest(".finalis-card, .finalis-sub-card");
    if (cardEl) {
      // 1. Update Thumbnail / Cover Image (Juara 1-3)
      const videoPreview = cardEl.querySelector(".video-preview");
      if (videoPreview) {
        const defaultCover = "assets/img/header-reca.webp";
        const coverSrc = item.cover_img || defaultCover;

        // Atur Gambar Cover
        videoPreview.innerHTML = `
          <img src="${coverSrc}" alt="${item.judul}" />
          ${item.video_embed ? '<div class="play-overlay">▶</div>' : ''}
        `;

        // Atur Event Click ke PDF / Video
        videoPreview.setAttribute("onclick", `bukaPdfCerpen('${item.id}')`);
      }

      // 2. Update Tombol 'Baca Naskah'
      const btnRead = cardEl.querySelector(".btn-read");
      if (btnRead) {
        btnRead.setAttribute("onclick", `bukaPdfCerpen('${item.id}')`);
      }
    }
  });
}

// 3. Render Kartu Karya Loka Karya Berdasarkan Halaman (Paginasi 3 Karya)
function renderLokaKaryaPage(page) {
  currentPage = page;
  const grid = document.getElementById("cerpenGrid");
  const paginationNav = document.getElementById("paginationNav");

  const pesertaData = dataCerpenGlobal.filter(
    (item) => item.kategori_slug === "peserta",
  );

  if (pesertaData.length === 0) {
    grid.innerHTML = `<p class="text-center">Belum ada karya peserta yang diunggah.</p>`;
    paginationNav.innerHTML = "";
    return;
  }

  // Hitung Slice Data (Index Awal & Akhir)
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = pesertaData.slice(startIndex, endIndex);

  // Render 3 Kartu Karya
  grid.innerHTML = paginatedItems
    .map(
      (item) => `
        <div class="cerpen-card">
            <span class="badge-kategori">${item.kategori}</span>
            <h4 class="card-title">${item.judul}</h4>
            <p class="card-author">Karya: <strong>${item.penulis}</strong></p>
            <p class="card-sinopsis">${item.sinopsis}</p>
            <button class="btn-read" onclick="bukaPdfCerpen('${item.id}')">
                📖 Baca Naskah
            </button>
        </div>
    `,
    )
    .join("");

  // Render Tombol Paginasi (1, 2, 3, dst.)
  const totalPages = Math.ceil(pesertaData.length / itemsPerPage);
  let pageButtons = "";

  for (let i = 1; i <= totalPages; i++) {
    pageButtons += `
            <button 
                class="page-btn ${i === currentPage ? "active" : ""}" 
                onclick="renderLokaKaryaPage(${i})"
            >
                ${i}
            </button>
        `;
  }

  paginationNav.innerHTML = pageButtons;
}

// 4. Toggle Tampilan Container Loka Karya
function toggleLokaKaryaGrid() {
  const container = document.getElementById("lokaKaryaContainer");
  container.classList.toggle("hidden");
}

// Fungsi Buka Modal Pop-up PDF + Media Embed
function bukaPdfCerpen(idCerpen) {
  const item = dataCerpenGlobal.find((c) => c.id === idCerpen);
  if (!item) return;

  // 1. Set Informasi Teks Pop-up
  document.getElementById("modalKategori").innerText = item.kategori || "Peserta";
  document.getElementById("modalJudul").innerText = item.judul;
  document.getElementById("modalPenulis").innerText = `Oleh: ${item.penulis}`;

  // 2. Element Media Wrapper & PDF Frame
  const mediaWrapper = document.getElementById("modalVideoWrapper");
  const mediaIframe = document.getElementById("modalVideoIframe");
  const mediaTitle = mediaWrapper.querySelector("h4");
  const pdfFrame = document.getElementById("modalPdfFrame");

  // 3. Cek apakah ada Media Embed (Video / Komik Strip)
  if (item.media_embed || item.video_embed) {
    const embedUrl = item.media_embed || item.video_embed;
    
    // Ubah judul bagian sesuai tipe media (Video atau Komik Strip)
    if (item.media_type === "komik") {
      mediaTitle.innerText = "🎨 Karya Komik Strip Finalis";
    } else {
      mediaTitle.innerText = "🎬 Video Unjuk Karya / Pembacaan Finalis";
    }

    // Ubah link Google Drive dari /view menjadi /preview agar bisa di-embed
    const formattedEmbedUrl = embedUrl.replace(/\/view(\?usp=sharing)?$/, "/preview");
    mediaIframe.src = formattedEmbedUrl;
    
    mediaWrapper.classList.remove("hidden");
  } else {
    mediaIframe.src = "";
    mediaWrapper.classList.add("hidden");
  }

  // 4. Set File PDF Naskah
  pdfFrame.src = item.pdf_file || item.pdf_url || "";

  // 5. Tampilkan Modal
  const modal = document.getElementById("pdfModal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

// Fungsi Tutup Modal
function closePdfModal() {
  const modal = document.getElementById("pdfModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  // Hentikan pemutaran video/media saat modal ditutup
  document.getElementById("modalVideoIframe").src = "";
  document.getElementById("modalPdfFrame").src = "";
}

// ==========================================
// LOGIKA INTERAKTIF SLIDE / TAB LAKON (TIAP BIDANG)
// ==========================================

// Data Tiap Bidang
const dataBidang = {
  1: {
    nama: "Bidang 1: Operasional Intern",
    fotoUtama: "assets/img/DOKUM-BIDANG/bidang1-sc.webp",
    deskripsi:
      "Mengembangkan potensi nalar, iklim ilmiah, dan budaya kepenulisan mahasiswa melalui berbagai kompetisi, pelatihan, serta pendampingan karya cipta.",
    proker: [
      {
        nama: "HARI ULANG TAHUN UKMPP",
        foto: "assets/img/DOKUM-BIDANG/hut.webp",
      },
      { nama: "KEROHANIAN", foto: "assets/img/DOKUM-BIDANG/kerohanian.webp" },
      {
        nama: "ORIENTASI DAN KADERISASI",
        foto: "assets/img/DOKUM-BIDANG/orkad.webp",
      },
      {
        nama: "BERSIH SEKRETARIAT DAN INVENTARIS",
        foto: "assets/img/DOKUM-BIDANG/bersih-sekre.webp",
      },
      {
        nama: "HUBUNGAN ALUMNI DAN KEARSIPAN",
        foto: "assets/img/DOKUM-BIDANG/hak.webp",
      },
    ],
  },
  2: {
    nama: "Bidang 2: Diskusi Dan Penalaran",
    fotoUtama: "assets/img/DOKUM-BIDANG/bidang2-sc.webp",
    deskripsi:
      "Fokus pada pengkaderan, pemeliharaan loyalitas fungsionaris, serta peningkatan kapasitas kepemimpinan dan manajemen organisasi secara berkelanjutan.",
    proker: [
      {
        nama: "FORUM DISKUSI ILMIAH",
        foto: "assets/img/DOKUM-BIDANG/fdi.webp",
      },
      {
        nama: "KARYA ILMIAH MAHASISWA",
        foto: "assets/img/DOKUM-BIDANG/kim.webp",
      },
      {
        nama: "LATIHAN KETERAMPILAN MANAJEMEN MAHASISWA TINGKAT DASAR",
        foto: "assets/img/DOKUM-BIDANG/lkmm-td.webp",
      },
    ],
  },
  3: {
    nama: "Bidang 3: Penelitian Dan Pengembangan Teknologi",
    fotoUtama: "assets/img/DOKUM-BIDANG/bidang3-sc.webp",
    deskripsi:
      "Membangun jaring relasi strategis dengan pihak eksternal, alumni, UKM sejenis, serta mengelola pengabdian masyarakat berbasis penalaran.",
    proker: [
      {
        nama: "TECHNO FAIR AND SEMINAR",
        foto: "assets/img/DOKUM-BIDANG/tfs.webp",
      },
      {
        nama: "PENELITIAN ILMIAH",
        foto: "assets/img/DOKUM-BIDANG/pi.webp",
      },
    ],
  },
  4: {
    nama: "Bidang 4: Hubungan Masyarakat",
    fotoUtama: "assets/img/DOKUM-BIDANG/bidang4-sc.webp",
    deskripsi:
      "Mengelola media komunikasi visual, dokumentasi kegiatan, publikasi majalah/jurnal, serta memproduksi konten kreatif resmi UKM PP.",
    proker: [
      {
        nama: "POLINEMA ESSAY COMPETITION",
        foto: "assets/img/DOKUM-BIDANG/pec.webp",
      },
      { nama: "LOGIC INSIGHT", foto: "assets/img/desain-reca.webp" },
      { nama: "KELEMBAGAAN", foto: "assets/img/DOKUM-BIDANG/kelembagaan.webp" },
      { nama: "SOSIAL MEDIA", foto: "assets/img/DOKUM-BIDANG/sosmed.webp" },
    ],
  },
};

// Fungsi Switcher Tab Bidang (Ter-update)
function pilihBidang(nomorBidang) {
  const data = dataBidang[nomorBidang];
  if (!data) return;

  // 1. Update State Tombol Tab
  const tombols = document.querySelectorAll(".lakon-section .bidang-card");
  tombols.forEach((btn, index) => {
    btn.classList.toggle("active", index === nomorBidang - 1);
  });

  // 2. Efek Transisi Container
  const viewContainer = document.getElementById("bidangDetailView");
  viewContainer.style.opacity = "0.3";

  setTimeout(() => {
    // 3. Update Informasi Atas (Judul, Foto Anggota, Deskripsi)
    document.getElementById("bidangTitle").innerText = data.nama;
    document.getElementById("bidangMainImg").src = data.fotoUtama;
    document.getElementById("bidangDesc").innerText = `"${data.deskripsi}"`;

    // 4. Update Galeri Kartu Proker di Bawah
    const prokerContainer = document.getElementById("bidangProkerList");
    prokerContainer.innerHTML = data.proker
      .map(
        (p, idx) => `
      <div class="proker-card-expand ${idx === 0 ? "active" : ""}">
        <img src="${p.foto}" alt="${p.nama}" />
        <div class="proker-card-overlay">
          <span class="proker-card-title">${p.nama}</span>
        </div>
      </div>
    `,
      )
      .join("");

    viewContainer.style.opacity = "1";
  }, 150);
}
