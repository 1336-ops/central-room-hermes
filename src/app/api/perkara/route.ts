import { NextResponse } from "next/server";

const perkaraList = [
  {
    id: "p-001",
    nomor: "9/Pid.B/2026/PN Demo",
    jenisPerkara: "Pidana Biasa",
    agenda: "Persidangan",
    tanggal: "2026-04-30",
    jam: "09:00",
    majelis: "Ketua Majelis",
    terdakwa: "Erni Karubaba & Nelci Karubaba",
    kuasaHukum: "-",
    status: "in_progress",
    tahapan: "Persidangan",
    lamaProses: 18,
    klasifikasi: "Pengeroyokan",
  },
  {
    id: "p-002",
    nomor: "13/Pid.B/2026/PN Demo",
    jenisPerkara: "Pidana Biasa",
    agenda: "Sidang Perdana",
    tanggal: "2026-04-27",
    jam: "10:00",
    majelis: "Ketua Majelis",
    terdakwa: "Ari Doom",
    kuasaHukum: "-",
    status: "decided",
    tahapan: "Sidang Selesai",
    lamaProses: 22,
    klasifikasi: "Pengeroyokan",
  },
  {
    id: "p-003",
    nomor: "12/Pid.Sus/2026/PN Demo",
    jenisPerkara: "Pidana Khusus",
    agenda: "Musyawarah Majelis",
    tanggal: "2026-05-02",
    jam: "13:00",
    majelis: "Ketua Majelis",
    terdakwa: "Demas Kaba",
    kuasaHukum: "Dr. Anwar, S.H., M.H.",
    status: "in_progress",
    tahapan: "Musyawarah",
    lamaProses: 34,
    klasifikasi: "Narkotika",
  },
  {
    id: "p-004",
    nomor: "8/Pdt.G/2026/PN Demo",
    jenisPerkara: "Perdata Gugatan",
    agenda: "Putusan",
    tanggal: "2026-05-06",
    jam: "08:00",
    majelis: "Ketua Majelis",
    penggugat: "Merlin",
    termohon: "Hans",
    kuasaHukum: "-",
    status: "scheduled",
    tahapan: "Putusan",
    lamaProses: 45,
    klasifikasi: "Perceraian",
  },
  {
    id: "p-005",
    nomor: "14/Pid.Sus/2026/PN Demo",
    jenisPerkara: "Pidana Khusus",
    agenda: "Sidang Lanjutan",
    tanggal: "2026-05-05",
    jam: "09:30",
    majelis: "Anggota",
    terdakwa: "Robby Manggaprouw",
    kuasaHukum: "-",
    status: "scheduled",
    tahapan: "Persidangan",
    lamaProses: 10,
    klasifikasi: "Narkotika",
  },
  {
    id: "p-006",
    nomor: "21/Pdt.P/2026/PN Demo",
    jenisPerkara: "Perdata Permohonan",
    agenda: "Pemeriksaan Permohonan",
    tanggal: "2026-05-03",
    jam: "10:00",
    majelis: "Hakim Tunggal",
    pemohon: "Benyamin Y. Koromath",
    kuasaHukum: "-",
    status: "in_progress",
    tahapan: "Persidangan",
    lamaProses: 15,
    klasifikasi: "Penetapan Ahli Waris",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "4", 10)));
  const statusFilter = searchParams.get("status") || "all";

  const filtered =
    statusFilter === "all"
      ? perkaraList
      : perkaraList.filter((p) => p.status === statusFilter);

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return NextResponse.json({
    perkara: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}
