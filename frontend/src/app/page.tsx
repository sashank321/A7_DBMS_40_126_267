import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default function Home() {
  const filePath = path.join(process.cwd(), 'src/app/allocflow_hydrated_body.html');
  const htmlContent = fs.readFileSync(filePath, 'utf-8');

  return (
    <>
      {/* Floating Retro Banner to Enter KnowledgeSphere Cockpit */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 bg-[#F4F1E6] border-2 border-[#0F0F0F] rounded shadow-[4px_4px_0px_0px_#0F0F0F] max-w-[95vw]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E57D25] animate-pulse"></span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F0F0F]">
            KnowledgeSphere AI <span className="text-[#888] font-normal">• Enterprise Intelligence</span>
          </span>
        </div>
        <div className="h-4 w-px bg-[#ccc] hidden sm:block"></div>
        <span className="hidden sm:inline-block font-mono text-[11px] text-[#555]">
          PostgreSQL 18.4 • 384-dim Vectors • Grounded RAG • Text-to-SQL
        </span>
        <Link
          href="/dashboard"
          className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F0F0F] text-[#F4F1E6] font-mono text-xs font-bold uppercase tracking-wider rounded border border-[#0F0F0F] hover:bg-[#E57D25] hover:text-[#0F0F0F] transition-all"
        >
          Enter Cockpit →
        </Link>
      </div>

      <link rel="stylesheet" href="/_astro/base-layout.D3gcHEVS.css" />
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      <script src="/interactive_features.js" defer></script>
    </>
  );
}
