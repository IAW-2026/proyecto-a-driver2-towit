export default function AppFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/30 py-4 text-center text-slate-500 text-sm mt-auto">
      <p>© {new Date().getFullYear()} TowIt - Tower App. Todos los derechos reservados.</p>
    </footer>
  );
}
