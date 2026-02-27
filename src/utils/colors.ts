export const getSizeColor = (size?: string) => {
  switch (size?.toUpperCase()) {
    case 'S':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case 'M':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'L':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'XL':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'XXL':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};
