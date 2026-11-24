export type FormulaId =
  | 'meanSalary'
  | 'medianSalary'
  | 'groupGapPct'
  | 'shapiroWilk'
  | 'logTransform'
  | 'normalHistogram'
  | 'qqPlot'
  | 'leveneTest'
  | 'boxplotIqr'
  | 'policySimulation'
  | 'offerCalculator'
  | 'regressionLinearity';

export interface FormulaSpec {
  category: string;
  title: string;
  formulaLatex: string;
  variables: Array<{ symbolLatex: string; desc: string }>;
  decisionRule: string;
}

export const FORMULAS: Record<FormulaId, FormulaSpec> = {
  meanSalary: {
    category: 'STATISTIKA DESKRIPTIF',
    title: 'Rata-Rata Gaji (Mean)',
    formulaLatex: String.raw`\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i`,
    variables: [
      { symbolLatex: String.raw`x_i`, desc: 'Gaji tahunan karyawan ke-i yang valid.' },
      { symbolLatex: String.raw`n`, desc: 'Total jumlah karyawan valid dalam dataset.' },
    ],
    decisionRule:
      'Jika rata-rata jauh lebih tinggi daripada median, menandakan adanya segelintir gaji ekstrem di sisi atas (distribusi miring ke kanan).',
  },
  medianSalary: {
    category: 'STATISTIKA DESKRIPTIF',
    title: 'Median Gaji (Nilai Tengah)',
    formulaLatex: String.raw`\text{Me} = \begin{cases} x_{(n+1)/2} & \text{jika } n \text{ ganjil} \\[6pt] \dfrac{x_{n/2} + x_{n/2+1}}{2} & \text{jika } n \text{ genap} \end{cases}`,
    variables: [
      { symbolLatex: String.raw`x_{(k)}`, desc: 'Nilai gaji urutan ke-k setelah data diurutkan dari terkecil ke terbesar.' },
      { symbolLatex: String.raw`n`, desc: 'Total baris gaji valid yang dianalisis.' },
    ],
    decisionRule:
      'Median lebih tahan (robust) terhadap outlier ekstrem dibanding rata-rata sehingga menjadi acuan posisi tengah struktur upah.',
  },
  groupGapPct: {
    category: 'INDIKATOR KESETARAAN',
    title: 'Kesenjangan Median Kelompok',
    formulaLatex: String.raw`\text{Gap} = \frac{\left|\text{Me}_{\max} - \text{Me}_{\min}\right|}{\text{Me}_{\max}} \times 100\%`,
    variables: [
      { symbolLatex: String.raw`\text{Me}_{\max}`, desc: 'Median gaji dari kelompok dengan median tertinggi.' },
      { symbolLatex: String.raw`\text{Me}_{\min}`, desc: 'Median gaji dari kelompok dengan median terendah.' },
    ],
    decisionRule:
      'Ambang keadilan FairPay: Gap ≤ 5% berada dalam batas wajar; Gap > 5% perlu ditinjau lebih lanjut.',
  },
  shapiroWilk: {
    category: 'UJI 01 · SHAPIRO-WILK',
    title: 'Uji Normalitas Shapiro–Wilk',
    formulaLatex: String.raw`W = \frac{\left(\sum_{i=1}^{n} a_i\, x_{(i)}\right)^2}{\sum_{i=1}^{n} \left(x_i - \bar{x}\right)^2}`,
    variables: [
      { symbolLatex: String.raw`x_{(i)}`, desc: 'Data gaji terurut dari nilai terkecil hingga terbesar.' },
      { symbolLatex: String.raw`a_i`, desc: 'Koefisien bobot Shapiro–Wilk berbasis nilai harapan distribusi normal baku.' },
      { symbolLatex: String.raw`\bar{x}`, desc: 'Rata-rata sampel data gaji.' },
    ],
    decisionRule:
      'Hipotesis nol (H₀): data berdistribusi normal. Jika p-value ≥ 0,05 maka Normal; jika p-value < 0,05 maka Tidak Normal.',
  },
  logTransform: {
    category: 'TRANSFORMASI DATA',
    title: 'Transformasi Logaritma Natural',
    formulaLatex: String.raw`Y' = \ln(Y) = \log_e(Y), \quad Y > 0`,
    variables: [
      { symbolLatex: String.raw`Y`, desc: 'Nilai gaji asli karyawan (bernilai positif).' },
      { symbolLatex: String.raw`e`, desc: 'Konstanta Euler (≈ 2,71828).' },
    ],
    decisionRule:
      'Digunakan saat sebaran gaji miring ke kanan agar efek nilai ekstrem terkompresi dan memenuhi asumsi normalitas parametrik.',
  },
  normalHistogram: {
    category: 'VISUALISASI NORMALITAS',
    title: 'Kurva Densitas Normal Teoretis',
    formulaLatex: String.raw`f(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x - \mu)^2}{2\sigma^2}\right)`,
    variables: [
      { symbolLatex: String.raw`\mu`, desc: 'Rata-rata sampel distribusi gaji yang sedang aktif.' },
      { symbolLatex: String.raw`\sigma`, desc: 'Simpangan baku (standar deviasi) sampel.' },
    ],
    decisionRule:
      'Semakin dekat profil batang histogram aktual mengikuti garis lonceng biru, semakin mendekati distribusi normal ideal.',
  },
  qqPlot: {
    category: 'VISUALISASI NORMALITAS',
    title: 'Quantile–Quantile (Q-Q) Plot',
    formulaLatex: String.raw`z_i = \Phi^{-1}\!\left(\frac{i - 0{,}375}{n + 0{,}25}\right)`,
    variables: [
      { symbolLatex: String.raw`\Phi^{-1}`, desc: 'Invers fungsi distribusi kumulatif normal standar (Z-score teoretis).' },
      { symbolLatex: String.raw`i`, desc: 'Peringkat observasi ke-i dari n sampel (pendekatan Blom).' },
    ],
    decisionRule:
      'Jika titik observasi sejajar dengan garis putus-putus diagonal, distribusi mendekati normal; lengkungan menandakan skewness atau ekor berat.',
  },
  leveneTest: {
    category: 'UJI 02 · LEVENE TEST',
    title: 'Uji Homogenitas Varians (Brown–Forsythe)',
    formulaLatex: String.raw`F = \frac{N - k}{k - 1} \cdot \frac{\sum_{i=1}^{k} n_i (\bar{Z}_i - \bar{Z})^2}{\sum_{i=1}^{k} \sum_{j=1}^{n_i} (Z_{ij} - \bar{Z}_i)^2}`,
    variables: [
      { symbolLatex: String.raw`Z_{ij}`, desc: 'Deviasi absolut selisih gaji individu terhadap median kelompok ke-i.' },
      { symbolLatex: String.raw`N,\, k`, desc: 'N adalah total sampel keseluruhan; k adalah jumlah kelompok.' },
      { symbolLatex: String.raw`n_i`, desc: 'Jumlah anggota pada kelompok ke-i.' },
    ],
    decisionRule:
      'Hipotesis nol (H₀): varians antarkelompok sama. Jika p-value ≥ 0,05 maka Varians Homogen; jika p-value < 0,05 maka Varians Heterogen.',
  },
  boxplotIqr: {
    category: 'VISUALISASI HOMOGENITAS',
    title: 'Boxplot & Rentang Interkuartil (IQR)',
    formulaLatex: String.raw`\text{IQR} = Q_3 - Q_1, \quad \text{Me} = Q_2`,
    variables: [
      { symbolLatex: String.raw`Q_1,\, Q_3`, desc: 'Kuartil bawah (persentil 25%) dan kuartil atas (persentil 75%).' },
      { symbolLatex: String.raw`Q_2`, desc: 'Garis tebal di tengah kotak yang menunjukkan median kelompok.' },
    ],
    decisionRule:
      'Perbedaan tinggi kotak (IQR) atau panjang whisker yang mencolok antar kelompok menunjukkan konsistensi rentang gaji yang tidak setara.',
  },
  policySimulation: {
    category: 'LABORATORIUM KEBIJAKAN',
    title: 'Model Simulasi Subsidi & Bonus Loyalitas',
    formulaLatex: String.raw`Y_{\text{baru}} = Y\bigl(1 + s \cdot \mathbb{I}(Y < \text{Me})\bigr) + 0{,}5\, Y\, l \cdot \min\!\left(\frac{X}{10},\, 1{,}5\right)`,
    variables: [
      { symbolLatex: String.raw`s`, desc: 'Persentase subsidi gaji bawah (berlaku bagi karyawan dengan gaji Y < Median).' },
      { symbolLatex: String.raw`l`, desc: 'Persentase bonus loyalitas bertahap berdasarkan masa kerja X.' },
      { symbolLatex: String.raw`\Delta\text{Budget}`, desc: 'Total estimasi tambahan anggaran payroll tahunan dari seluruh selisih Y_baru − Y.' },
    ],
    decisionRule:
      'Target ideal simulasi: Shapiro-Wilk p ≥ 0,05, Levene p ≥ 0,05, dan Kesenjangan Median ≤ 5% pada salinan memori tanpa mengubah data asli.',
  },
  offerCalculator: {
    category: 'KALKULATOR TAWARAN',
    title: 'Prediksi Rentang Gaji Kandidat Baru',
    formulaLatex: String.raw`\hat{y} = \beta_0 + \beta_1 X_{\text{kandidat}}, \quad \text{Rentang} = \hat{y} \pm 0{,}5\,\text{RSE}`,
    variables: [
      { symbolLatex: String.raw`\beta_0,\, \beta_1`, desc: 'Intersep (gaji dasar awal) dan kemiringan kenaikan gaji per tahun pengalaman.' },
      { symbolLatex: String.raw`\text{RSE}`, desc: 'Residual Standard Error, ukuran simpangan rata-rata prediksi regresi.' },
    ],
    decisionRule:
      'Menawarkan gaji di dalam rentang wajar (prediksi ± 0,5 RSE) mencegah distorsi struktur keadilan upah internal.',
  },
  regressionLinearity: {
    category: 'UJI 03 · LINEARITAS REGRESI',
    title: 'Linearitas Regresi & F-Deviasi',
    formulaLatex: String.raw`R^2 = 1 - \frac{\text{SSE}}{\text{SST}}, \quad F_{\text{dev}} = \frac{\text{SSE}_{\text{lin}} - \text{SSE}_{\text{kuad}}}{\text{SSE}_{\text{kuad}} / (n - 3)}`,
    variables: [
      { symbolLatex: String.raw`\hat{y}_{\text{lin}}`, desc: 'Model garis lurus β₀ + β₁x (kenaikan gaji proporsional tiap tahun).' },
      { symbolLatex: String.raw`\hat{y}_{\text{kuad}}`, desc: 'Model lengkung c₀ + c₁x + c₂x² untuk mendeteksi pelambatan (c₂ < 0).' },
      { symbolLatex: String.raw`F_{\text{dev}}`, desc: 'Uji F apakah kurva kuadratik signifikan lebih akurat dibanding garis lurus.' },
    ],
    decisionRule:
      'Jika p-deviasi ≥ 0,05 maka Cukup Linear. Jika p-deviasi < 0,05 dengan koefisien c₂ < 0 maka terindikasi titik jenuh karir (career plateau).',
  },
};
