export interface SlideItem {
  id: number;
  title: string;
  description: string;
  features: string[];
  imageUrl: string;
  badge: string;
  visualTag: string;
}

export const INITIAL_SLIDES: SlideItem[] = [
  {
    id: 1,
    title: 'TEFA DKV Creative Management',
    description:
      'Platform digital enterprise terpadu untuk mengelola produksi cetak, kasir POS, manajemen file, dan workflow industri DKV.',
    features: ['Production Control', 'Point of Sales', 'File Inbox System'],
    imageUrl:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&q=85',
    badge: 'TEFA DKV',
    visualTag: 'Studio & Workstation DKV',
  },
  {
    id: 2,
    title: 'Manajemen Produksi Real-Time',
    description:
      'Pantau alur pengerjaan order dari pemeriksaan file masuk, cetak outdoor/indoor, finishing, hingga siap diambil.',
    features: ['Production Tracking', 'Queue Management', 'Quality Inspection'],
    imageUrl:
      'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1200&q=85',
    badge: 'SMK NU UNGARAN',
    visualTag: 'Mesin Press & Large Format Print',
  },
  {
    id: 3,
    title: 'Workspace Digital Siswa',
    description:
      'Wadah nyata siswa DKV untuk berkolaborasi, submit karya cetak, menerima order industri, dan melihat histori transaksi.',
    features: ['Student Asset Hub', 'Direct Order Form', 'Order Status Timeline'],
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=85',
    badge: 'Teaching Factory',
    visualTag: 'Portfolio & Project Management',
  },
];

const STORAGE_KEY = 'tefa_login_slides';

export const getLoginSlides = (): SlideItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SLIDES));
      return INITIAL_SLIDES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading slides from localStorage', e);
    return INITIAL_SLIDES;
  }
};

export const saveLoginSlides = (slides: SlideItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
    // Dispatch custom event to notify other components in same window
    window.dispatchEvent(new Event('tefa_slides_updated'));
  } catch (e) {
    console.error('Error saving slides to localStorage', e);
  }
};
