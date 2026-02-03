import { Document } from "mongodb";

/**
 * Choropleth kecamatan data
 */
export interface ChoroplethKecamatan {
  nama: string;
  kode: string;
}

/**
 * Road damage document structure in MongoDB
 */
export interface RoadDamageDocument extends Document {
  id: number;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  kode_kecamatan: string;
  nama_kecamatan: string;
  latitude: number;
  longitude: number;
  kerusakan: "ringan" | "sedang" | "berat";
  choropleth?: ChoroplethKecamatan;
  // Additional metadata from detection
  damage_class?: string;
  confidence?: number;
  image_size?: string;
  image_width?: number;
  image_height?: number;
  processing_time?: number;
  created_at?: Date;
}

/**
 * Kabupaten statistics document structure in MongoDB
 */
export interface KabupatenStatsDocument extends Document {
  _id: string; // kode_kabupaten_kota
  nama: string;
  total: number;
  parah: number;
  sedang: number;
  ringan: number;
}

/**
 * Kecamatan statistics (calculated on-the-fly)
 */
export interface KecamatanStats {
  id: string;
  nama: string;
  data: {
    total: number;
    parah: number;
    sedang: number;
    ringan: number;
  };
}
