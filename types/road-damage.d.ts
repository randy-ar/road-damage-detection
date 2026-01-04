export interface RoadDamageData {
  id: number;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  kode_kecamatan: string;
  nama_kecamatan: string;
  latitude: number;
  longitude: number;
  kerusakan: string; // ringan, sedang, berat
  choropleth?: ChoroplethKecamatan;
}

export interface ChoroplethKecamatan {
  nama: string;
  kode: string;
}
