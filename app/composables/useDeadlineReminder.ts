import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { checklists, peranInfo, type Peran } from '~/data/checklists'
import { bacaProgres } from '~/composables/useStore'
import { hariIni } from '~/utils/tanggal'

const BULAN_MAP: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
}

/** Hitung tanggal tenggat terdekat berikutnya dari teks seperti "31 Agustus" */
export function parseTenggatBerikutnya(teks: string, refDate = new Date()): Date | null {
  const m = teks.trim().toLowerCase().match(/^(\d{1,2})\s+([a-z]+)$/)
  if (!m) return null
  const tgl = Number(m[1])
  const bln = BULAN_MAP[m[2]!]
  if (bln === undefined || tgl < 1 || tgl > 31) return null

  const startToday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate())
  let target = new Date(refDate.getFullYear(), bln, tgl)
  if (target < startToday) target = new Date(refDate.getFullYear() + 1, bln, tgl)
  return target
}

export function sisaHariTenggat(teks: string, refDate = new Date()): number | null {
  const target = parseTenggatBerikutnya(teks, refDate)
  if (!target) return null
  const startToday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate())
  return Math.round((target.getTime() - startToday.getTime()) / 86_400_000)
}

type Izin = 'granted' | 'denied' | 'default'

export function useDeadlineReminder() {
  const { periode } = usePeriode()
  const { isDesktop } = useDesktopBackend()
  const toast = useToast()
  const didukung = useState<boolean>('notif-supported', () => false)
  const izin = useState<Izin>('notif-permission', () => 'default')
  const aktif = useState<boolean>('notif-aktif', () => false)

  /*
   * Di desktop, notifikasi Web API di WebView2 tidak bisa diandalkan, jadi dipakai plugin
   * notifikasi Tauri (notifikasi Windows asli). Di browser tetap memakai Notification API.
   */
  async function bacaIzin(): Promise<Izin> {
    if (isDesktop.value) return (await isPermissionGranted()) ? 'granted' : 'default'
    return Notification.permission
  }

  async function mintaIzin(): Promise<Izin> {
    if (isDesktop.value) return await requestPermission()
    return await Notification.requestPermission()
  }

  function tampilkan(judul: string, isi: string) {
    if (isDesktop.value) {
      sendNotification({ title: judul, body: isi })
      return
    }
    new Notification(judul, { body: isi, icon: '/favicon.svg', tag: 'ceklis-sd-tenggat' })
  }

  async function sinkronStatusNotif() {
    if (!import.meta.client) return
    didukung.value = isDesktop.value || 'Notification' in window
    if (!didukung.value) return
    try { izin.value = await bacaIzin() }
    catch { izin.value = 'default' }
    try { aktif.value = localStorage.getItem('ceklis:notif') === '1' }
    catch { aktif.value = false }
  }

  function tenggatTerdekat() {
    const peranList = Object.keys(peranInfo) as Peran[]
    const list: { peran: Peran, judul: string, tenggat: string, sisa: number }[] = []
    for (const peran of peranList) {
      const st = bacaProgres(peran, periode.value.ta, periode.value.semester)
      for (const k of checklists[peran]) {
        for (const item of k.items) {
          if (!item.tenggat || st.done[item.id]) continue
          const sisa = sisaHariTenggat(item.tenggat)
          if (sisa !== null) list.push({ peran, judul: item.judul, tenggat: item.tenggat, sisa })
        }
      }
    }
    return list.sort((a, b) => a.sisa - b.sisa)
  }

  function kirimNotif() {
    if (!didukung.value || izin.value !== 'granted') return false
    const dekat = tenggatTerdekat()
    if (!dekat.length) return false
    const utama = dekat[0]!
    const infoSisa = utama.sisa === 0 ? 'hari ini' : `${utama.sisa} hari lagi (${utama.tenggat})`
    tampilkan('Pengingat Tenggat Ceklis SD', `${utama.judul}: ${infoSisa}.`)
    return true
  }

  async function togglePengingat() {
    await sinkronStatusNotif()
    if (!didukung.value) {
      toast.add({ title: 'Perangkat tidak mendukung notifikasi', color: 'warning' })
      return
    }
    if (aktif.value) {
      aktif.value = false
      try { localStorage.setItem('ceklis:notif', '0') }
      catch { /* abaikan */ }
      toast.add({ title: 'Pengingat tenggat dinonaktifkan', color: 'neutral' })
      return
    }
    try { izin.value = await mintaIzin() }
    catch { izin.value = 'denied' }
    if (izin.value !== 'granted') {
      toast.add({
        title: 'Izin notifikasi ditolak',
        description: isDesktop.value
          ? 'Aktifkan notifikasi untuk Ceklis SD di Pengaturan Windows > Sistem > Notifikasi.'
          : 'Aktifkan izin notifikasi di pengaturan browser jika ingin menerima pengingat.',
        color: 'warning',
      })
      return
    }
    aktif.value = true
    try {
      localStorage.setItem('ceklis:notif', '1')
      localStorage.setItem('ceklis:notif:last', hariIni())
    }
    catch { /* abaikan */ }
    kirimNotif()
    toast.add({ title: 'Pengingat tenggat aktif', description: 'Anda akan diingatkan saat membuka Ceklis SD jika ada tenggat mendekat.', color: 'success' })
  }

  async function cekHarian() {
    await sinkronStatusNotif()
    if (!didukung.value || !aktif.value || izin.value !== 'granted') return
    try {
      const today = hariIni()
      if (localStorage.getItem('ceklis:notif:last') === today) return
      const dekat = tenggatTerdekat().filter(d => d.sisa <= 30)
      if (dekat.length && kirimNotif()) localStorage.setItem('ceklis:notif:last', today)
    }
    catch { /* abaikan */ }
  }

  return { didukung, izin, aktif, togglePengingat, cekHarian, tenggatTerdekat }
}
