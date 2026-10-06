import fs from 'fs';
import { HeroComputerInteractive } from '@/components/HeroComputerInteractive';
import { LandingMetadata } from '@/components/LandingMetadata';
import path from 'path';


export default function Home() {
  const filePath = path.join(process.cwd(), 'src/app/allocflow_hydrated_body.html');
  const htmlContent = fs.readFileSync(filePath, 'utf-8');

  return (
    <>
      <link rel="stylesheet" href="/_astro/base-layout.D3gcHEVS.css" />
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      <LandingMetadata />
      <HeroComputerInteractive />
      <script src="/interactive_features.js" defer></script>
    </>
  );
}
