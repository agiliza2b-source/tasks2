export const COLOR_PALETTE = [
  { id: 'slate', label: 'Padrão', bg: 'bg-slate-800', border: 'border-slate-700', dot: 'bg-slate-500' },
  { id: 'red', label: 'Vermelho', bg: 'bg-red-900/20', border: 'border-red-500/50', dot: 'bg-red-500' },
  { id: 'orange', label: 'Laranja', bg: 'bg-orange-900/20', border: 'border-orange-500/50', dot: 'bg-orange-500' },
  { id: 'amber', label: 'Amarelo', bg: 'bg-amber-900/20', border: 'border-amber-500/50', dot: 'bg-amber-500' },
  { id: 'green', label: 'Verde', bg: 'bg-green-900/20', border: 'border-green-500/50', dot: 'bg-green-500' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-900/20', border: 'border-emerald-500/50', dot: 'bg-emerald-500' },
  { id: 'teal', label: 'Turquesa', bg: 'bg-teal-900/20', border: 'border-teal-500/50', dot: 'bg-teal-500' },
  { id: 'cyan', label: 'Ciano', bg: 'bg-cyan-900/20', border: 'border-cyan-500/50', dot: 'bg-cyan-500' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-900/20', border: 'border-blue-500/50', dot: 'bg-blue-500' },
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-900/20', border: 'border-indigo-500/50', dot: 'bg-indigo-500' },
  { id: 'violet', label: 'Violeta', bg: 'bg-violet-900/20', border: 'border-violet-500/50', dot: 'bg-violet-500' },
  { id: 'purple', label: 'Roxo', bg: 'bg-purple-900/20', border: 'border-purple-500/50', dot: 'bg-purple-500' },
  { id: 'fuchsia', label: 'Fúcsia', bg: 'bg-fuchsia-900/20', border: 'border-fuchsia-500/50', dot: 'bg-fuchsia-500' },
  { id: 'pink', label: 'Rosa', bg: 'bg-pink-900/20', border: 'border-pink-500/50', dot: 'bg-pink-500' },
  { id: 'rose', label: 'Rosé', bg: 'bg-rose-900/20', border: 'border-rose-500/50', dot: 'bg-rose-500' },
];

export const getPaletteColor = (idOrClass) => {
    // Try to find by ID first
    let found = COLOR_PALETTE.find(c => c.id === idOrClass);
    if (found) return found;
    
    // Try to find by border class (legacy compatibility)
    found = COLOR_PALETTE.find(c => c.border === idOrClass);
    if (found) return found;

    // Default
    return COLOR_PALETTE[0];
};