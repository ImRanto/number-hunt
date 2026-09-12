import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CircleHelp,
  Clock3,
  Columns3,
  Expand,
  Grid2X2,
  ImageDown,
  ListRestart,
  Moon,
  Pause,
  Play,
  Printer,
  RefreshCw,
  Rows3,
  Sparkles,
  Sun,
  Target,
  TimerReset,
  Trophy,
  X,
} from 'lucide-react';

const PRESETS = [
  { label: '5 × 5', rows: 5, cols: 5, hint: 'Échauffement' },
  { label: '8 × 8', rows: 8, cols: 8, hint: 'Classique' },
  { label: '10 × 10', rows: 10, cols: 10, hint: 'Concentration' },
  { label: '12 × 12', rows: 12, cols: 12, hint: 'Endurance' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Facile', description: 'Repères nets', color: '#059669' },
  { id: 'hard', label: 'Difficile', description: 'Attention soutenue', color: '#D97706' },
  { id: 'very-hard', label: 'Très difficile', description: 'Le regard vacille', color: '#7C3AED' },
];

function fisherYates(length) {
  const values = Array.from({ length }, (_, index) => index + 1);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
  }
  return values;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Badge({ children, tone }) {
  const toneStyles = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20',
    hard: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20',
    'very-hard': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/20',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide', toneStyles[tone])}>
      {children}
    </span>
  );
}

function IconButton({ label, onClick, children, active = false, testId }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border text-slate-500 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:border-blue-500/50 dark:hover:bg-blue-400/10 dark:hover:text-blue-300 dark:focus-visible:ring-offset-slate-950',
        active && 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-500/50 dark:bg-blue-400/10 dark:text-blue-300',
      )}
    >
      {children}
    </button>
  );
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [settings, setSettings] = useState({ rows: 8, cols: 8, difficulty: 'easy' });
  const [customRows, setCustomRows] = useState('8');
  const [customCols, setCustomCols] = useState('8');
  const [numbers, setNumbers] = useState(() => fisherYates(64));
  const [target, setTarget] = useState(1);
  const [marked, setMarked] = useState(() => new Set());
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('idle');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('grilles-theme');
    const dark = storedTheme === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('grilles-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const interval = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const activeDifficulty = useMemo(
    () => DIFFICULTIES.find((difficulty) => difficulty.id === settings.difficulty) ?? DIFFICULTIES[0],
    [settings.difficulty],
  );
  const found = status === 'found';
  const selectedCount = marked.size;
  const isPreset = PRESETS.some((preset) => preset.rows === settings.rows && preset.cols === settings.cols);
  const statusLabel = found ? 'Trouvé !' : status === 'running' ? 'En cours' : status === 'paused' ? 'En pause' : status === 'stopped' ? 'Arrêté' : 'Prêt à jouer';

  const generateGrid = useCallback((nextSettings = settings) => {
    const total = Math.min(400, Math.max(4, nextSettings.rows * nextSettings.cols));
    const nextNumbers = fisherYates(total);
    setIsRegenerating(true);
    setNumbers(nextNumbers);
    setTarget(nextNumbers[Math.floor(Math.random() * nextNumbers.length)]);
    setMarked(new Set());
    setSeconds(0);
    setStatus('idle');
    window.setTimeout(() => setIsRegenerating(false), 420);
  }, [settings]);

  const applyDimensions = (rows, cols) => {
    const safeRows = Math.min(20, Math.max(2, rows || 2));
    const safeCols = Math.min(20, Math.max(2, cols || 2));
    setCustomRows(String(safeRows));
    setCustomCols(String(safeCols));
    const nextSettings = { ...settings, rows: safeRows, cols: safeCols };
    setSettings(nextSettings);
    generateGrid(nextSettings);
  };

  const choosePreset = (rows, cols) => {
    setCustomRows(String(rows));
    setCustomCols(String(cols));
    const nextSettings = { ...settings, rows, cols };
    setSettings(nextSettings);
    generateGrid(nextSettings);
  };

  const chooseDifficulty = (difficulty) => {
    setSettings((current) => ({ ...current, difficulty }));
    setMarked(new Set());
    if (status === 'found') setStatus('idle');
  };

  const toggleCell = (value) => {
    if (found) return;
    setMarked((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    if (value === target) {
      setStatus('found');
    }
  };

  const toggleStartPause = () => {
    if (found) return;
    setStatus((current) => (current === 'running' ? 'paused' : 'running'));
  };

  const stopGame = () => {
    setStatus('stopped');
  };

  const resetGame = () => {
    setSeconds(0);
    setMarked(new Set());
    setStatus('idle');
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const exportPng = () => {
    const cellSize = settings.cols >= 16 ? 72 : settings.cols >= 12 ? 88 : 108;
    const padding = 56;
    const headerHeight = 148;
    const gap = settings.cols >= 14 ? 5 : 8;
    const gridWidth = settings.cols * cellSize + (settings.cols - 1) * gap;
    const gridHeight = settings.rows * cellSize + (settings.rows - 1) * gap;
    const canvas = document.createElement('canvas');
    canvas.width = (gridWidth + padding * 2) * 2;
    canvas.height = (gridHeight + headerHeight + padding * 2) * 2;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.fillStyle = '#F8FAFC';
    context.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    context.fillStyle = '#0F172A';
    context.font = '700 30px "DM Sans", Arial, sans-serif';
    context.fillText('Grilles de nombres', padding, padding + 10);
    context.fillStyle = '#64748B';
    context.font = '500 15px "DM Sans", Arial, sans-serif';
    context.fillText(`${settings.rows} × ${settings.cols} · ${activeDifficulty.label}`, padding, padding + 39);
    context.fillStyle = '#2563EB';
    context.font = '700 15px "DM Sans", Arial, sans-serif';
    context.fillText(`Nombre mystère : ${target}`, padding, padding + 72);
    context.fillStyle = '#94A3B8';
    context.font = '500 13px "DM Sans", Arial, sans-serif';
    context.fillText(`Chronomètre ${formatTime(seconds)} · ${numbers.length} nombres uniques`, padding, padding + 98);

    const gridTop = padding + headerHeight;
    const radius = Math.min(12, cellSize * 0.12);
    numbers.forEach((value, index) => {
      const row = Math.floor(index / settings.cols);
      const col = index % settings.cols;
      const x = padding + col * (cellSize + gap);
      const y = gridTop + row * (cellSize + gap);
      const isMarked = marked.has(value);
      const isFound = found && value === target;
      context.beginPath();
      context.roundRect(x, y, cellSize, cellSize, radius);
      context.fillStyle = isFound ? '#059669' : isMarked ? '#2563EB' : '#FFFFFF';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = isFound ? '#047857' : isMarked ? '#1D4ED8' : '#E2E8F0';
      context.stroke();
      context.fillStyle = isFound || isMarked ? '#FFFFFF' : '#334155';
      const fontSize = Math.max(12, Math.min(26, cellSize * (settings.difficulty === 'very-hard' ? 0.2 : settings.difficulty === 'hard' ? 0.235 : 0.27)));
      context.font = `700 ${fontSize}px "Space Mono", monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(value), x + cellSize / 2, y + cellSize / 2 + 1);
    });
    context.textAlign = 'start';
    context.textBaseline = 'alphabetic';

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `grille-${settings.rows}x${settings.cols}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };

  const cellTextClass = settings.difficulty === 'very-hard'
    ? 'text-[clamp(9px,2.4vw,15px)] tracking-[-0.08em]'
    : settings.difficulty === 'hard'
      ? 'text-[clamp(10px,2.8vw,17px)] tracking-[-0.04em]'
      : 'text-[clamp(11px,3vw,18px)]';

  return (
    <div className="app-shell min-h-[100dvh] bg-[#F8FAFC] text-[#0F172A] transition-colors dark:bg-[#0B1220] dark:text-slate-100">
      <header className="no-print sticky top-0 z-10 border-b border-[#E2E8F0]/90 bg-[#F8FAFC]/90 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1220]/90">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#2563EB] text-white shadow-lg shadow-blue-600/20">
              <Grid2X2 size={20} strokeWidth={2.5} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#F8FAFC] bg-[#D97706] dark:border-[#0B1220]" />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-[-0.02em]">Grilles de nombres</div>
              <div className="hidden text-[11px] font-medium text-slate-500 sm:block dark:text-slate-400">Un jeu de concentration, à votre rythme.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-slate-600 sm:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className={cn('h-2 w-2 rounded-full', status === 'running' ? 'animate-pulse bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')} />
              <span data-testid="status-game">{statusLabel}</span>
            </div>
            <IconButton
              label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
              onClick={() => setIsDark((current) => !current)}
              active={isDark}
              testId="button-toggle-theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[292px_minmax(0,1fr)] lg:gap-8 lg:px-10 lg:py-8">
        <aside className="no-print space-y-5 lg:sticky lg:top-[96px] lg:self-start">
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Configuration</p>
                <h1 className="text-[20px] font-bold tracking-[-0.04em]">Votre grille</h1>
              </div>
              <Sparkles size={18} className="text-blue-500" />
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Taille rapide</label>
                  <span className="font-mono-app text-[10px] text-slate-400">{settings.rows * settings.cols} cases</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => {
                    const active = settings.rows === preset.rows && settings.cols === preset.cols;
                    return (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => choosePreset(preset.rows, preset.cols)}
                        data-testid={`button-preset-${preset.rows}x${preset.cols}`}
                        className={cn(
                          'group rounded-xl border px-3 py-2.5 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                          active ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-300' : 'border-[#E2E8F0] bg-white text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
                        )}
                      >
                        <span className="block text-sm font-bold">{preset.label}</span>
                        <span className={cn('mt-0.5 block text-[10px] font-medium', active ? 'text-blue-500' : 'text-slate-400')}>{preset.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-5 dark:border-slate-800">
                <div className="mb-2.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Dimensions libres</label>
                  {isPreset && <Badge tone="neutral">Préréglage</Badge>}
                </div>
                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-slate-400"><Rows3 size={12} /> Lignes</span>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={customRows}
                      onChange={(event) => setCustomRows(event.target.value)}
                      onBlur={() => applyDimensions(Number(customRows), Number(customCols))}
                      data-testid="input-custom-rows"
                      className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 font-mono-app text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <span className="mb-3 text-slate-300">×</span>
                  <label className="min-w-0 flex-1">
                    <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-slate-400"><Columns3 size={12} /> Colonnes</span>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={customCols}
                      onChange={(event) => setCustomCols(event.target.value)}
                      onBlur={() => applyDimensions(Number(customRows), Number(customCols))}
                      data-testid="input-custom-cols"
                      className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 font-mono-app text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-5 dark:border-slate-800">
                <div className="mb-2.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Niveau visuel</label>
                  <CircleHelp size={14} className="text-slate-400" aria-label="Le niveau modifie le rendu des nombres" />
                </div>
                <div className="space-y-1.5">
                  {DIFFICULTIES.map((difficulty) => {
                    const active = settings.difficulty === difficulty.id;
                    return (
                      <button
                        type="button"
                        key={difficulty.id}
                        onClick={() => chooseDifficulty(difficulty.id)}
                        data-testid={`button-difficulty-${difficulty.id}`}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                          active ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800' : 'border-transparent hover:border-[#E2E8F0] hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60',
                        )}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: difficulty.color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold">{difficulty.label}</span>
                          <span className="block text-[10px] text-slate-400">{difficulty.description}</span>
                        </span>
                        {active && <Check size={15} className="text-blue-600 dark:text-blue-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Target size={16} />
              <span className="text-xs font-bold">Comment jouer ?</span>
            </div>
            <p className="text-xs leading-relaxed text-blue-800/70 dark:text-blue-200/70">
              Lancez le chrono, puis trouvez le nombre mystère. Cliquez une seconde fois pour retirer un repère.
            </p>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={settings.difficulty}>{activeDifficulty.label}</Badge>
                <span className="text-xs font-medium text-slate-400">•</span>
                <span className="font-mono-app text-[11px] text-slate-400">{settings.rows} × {settings.cols}</span>
              </div>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.02] tracking-[-0.06em]">Trouvez le nombre.</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">Une grille neuve, un seul objectif. Prenez le temps de regarder.</p>
            </div>
            <div className="no-print flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => generateGrid()}
                data-testid="button-regenerate"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <RefreshCw size={15} className={isRegenerating ? 'animate-spin' : ''} />
                Nouvelle grille
              </button>
              <IconButton label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'} onClick={toggleFullscreen} active={isFullscreen} testId="button-fullscreen">
                {isFullscreen ? <X size={18} /> : <Expand size={18} />}
              </IconButton>
              <IconButton label="Imprimer ou enregistrer en PDF" onClick={() => window.print()} testId="button-print">
                <Printer size={18} />
              </IconButton>
              <IconButton label="Exporter la grille en PNG" onClick={exportPng} testId="button-export-png">
                <ImageDown size={18} />
              </IconButton>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px]">
            <div className="print-card rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-panel sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', found ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300')}>
                    {found ? <Trophy size={19} /> : <Target size={19} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Nombre mystère</p>
                    <p className="font-mono-app text-xl font-bold tracking-[-0.06em]" data-testid="text-target-number">{target}</p>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {found ? (
                    <motion.div
                      key="found"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                      data-testid="status-found"
                    >
                      <Check size={14} /> Trouvé en {formatTime(seconds)}
                    </motion.div>
                  ) : (
                    <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden text-right sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Repères</p>
                      <p className="font-mono-app text-sm font-bold text-slate-700 dark:text-slate-200" data-testid="text-marked-count">{String(selectedCount).padStart(2, '0')} <span className="font-sans text-xs font-medium text-slate-400">sélectionnés</span></p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-grid-paper print-grid rounded-xl border border-[#E2E8F0] p-2.5 sm:p-4 dark:border-slate-800">
                <motion.div
                  key={`${settings.rows}-${settings.cols}-${target}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className={cn('grid w-full gap-1.5 sm:gap-2', isRegenerating && 'grid-regenerating')}
                  style={{ gridTemplateColumns: `repeat(${settings.cols}, minmax(0, 1fr))` }}
                  role="grid"
                  aria-label={`Grille de ${settings.rows} lignes et ${settings.cols} colonnes`}
                  data-testid="number-grid"
                >
                  {numbers.map((value, index) => {
                    const isMarked = marked.has(value);
                    const isTarget = value === target;
                    return (
                      <button
                        type="button"
                        key={`${value}-${index}`}
                        role="gridcell"
                        aria-label={`Nombre ${value}${isMarked ? ', sélectionné' : ''}`}
                        aria-pressed={isMarked}
                        onClick={() => toggleCell(value)}
                        data-testid={`grid-cell-${value}`}
                        className={cn(
                          'grid-cell aspect-square min-w-0 rounded-lg border bg-white font-mono-app font-bold text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.03)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-none dark:focus-visible:ring-offset-slate-900',
                          cellTextClass,
                          isMarked && 'border-blue-500 bg-blue-600 text-white shadow-[0_3px_8px_rgba(37,99,235,0.24)] dark:border-blue-400 dark:bg-blue-500 dark:text-white',
                          !isMarked && 'hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-500/60 dark:hover:bg-blue-400/10 dark:hover:text-blue-300',
                          isTarget && found && 'grid-cell--found border-emerald-500 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-500',
                        )}
                      >
                        {isTarget && found ? <Check className="mx-auto" size={Math.min(18, 18 * (12 / settings.cols))} strokeWidth={3} /> : value}
                      </button>
                    );
                  })}
                </motion.div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Cliquez pour marquer</span>
                <span className="font-mono-app">{numbers.length} nombres uniques</span>
              </div>
            </div>

            <aside className="no-print rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-panel xl:self-start dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Clock3 size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Chronomètre</span>
              </div>
              <div className="mb-5 rounded-xl bg-[#F8FAFC] px-4 py-5 text-center dark:bg-slate-950">
                <div className="timer-digit font-mono-app text-[38px] font-bold leading-none tracking-[-0.08em] text-[#0F172A] dark:text-slate-100" data-testid="text-timer">{formatTime(seconds)}</div>
                <div className={cn('mt-2 text-[11px] font-semibold', found ? 'text-emerald-600 dark:text-emerald-400' : status === 'running' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} data-testid="status-timer">{found ? 'Objectif atteint' : status === 'running' ? 'Le temps passe' : statusLabel}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleStartPause}
                  disabled={found}
                  data-testid="button-start-pause"
                  className={cn('col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50', status === 'running' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700')}
                >
                  {status === 'running' ? <><Pause size={16} /> Mettre en pause</> : <><Play size={16} fill="currentColor" /> {status === 'paused' ? 'Reprendre' : 'Démarrer'}</>}
                </button>
                <button type="button" onClick={stopGame} data-testid="button-stop" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-[#DC2626] transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-900/50 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20">
                  <span className="h-2 w-2 rounded-full bg-[#DC2626]" /> Arrêter
                </button>
                <button type="button" onClick={resetGame} data-testid="button-reset-timer" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <TimerReset size={15} /> Réinitialiser
                </button>
              </div>
              <div className="mt-5 border-t border-[#E2E8F0] pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Progression</span>
                  <span className="font-mono-app font-bold text-slate-600 dark:text-slate-300" data-testid="text-progress">{selectedCount}/{numbers.length}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div className={cn('h-full rounded-full', found ? 'bg-emerald-500' : 'bg-blue-500')} animate={{ width: `${Math.max(3, (selectedCount / numbers.length) * 100)}%` }} />
                </div>
              </div>
            </aside>
          </div>

          <footer className="no-print flex flex-col gap-2 border-t border-[#E2E8F0] pt-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <span className="flex items-center gap-1.5"><ListRestart size={13} /> Chaque grille est mélangée sans doublon.</span>
            <span>Grilles de nombres · outil personnel</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
