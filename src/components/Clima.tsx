import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Droplets, Moon, Sun, Umbrella } from "lucide-react";

/**
 * Clima atual + máx/mín e chance de chuva das próximas horas (OpenWeather, plano grátis,
 * uso comercial permitido com crédito visível). Sem OPENWEATHER_API_KEY, não aparece.
 * Atualiza no máximo a cada 15 minutos (cache do servidor).
 */
const LAT = process.env.NEXT_PUBLIC_CLIMA_LAT || "-3.1190";
const LON = process.env.NEXT_PUBLIC_CLIMA_LON || "-60.0217";

type Atual = { main: { temp: number; feels_like: number; humidity: number }; weather: { id: number; description: string; icon: string }[] };
type Previsao = { list: { dt: number; main: { temp_min: number; temp_max: number }; pop: number }[] };

function Icone({ id, noite }: { id: number; noite: boolean }) {
  const p = { size: 30, className: "text-vinho-acao" };
  if (id >= 200 && id < 300) return <CloudLightning {...p} />;
  if (id >= 300 && id < 400) return <CloudDrizzle {...p} />;
  if (id >= 500 && id < 600) return <CloudRain {...p} />;
  if (id >= 700 && id < 800) return <CloudFog {...p} />;
  if (id === 800) return noite ? <Moon {...p} /> : <Sun {...p} />;
  if (id === 801 || id === 802) return noite ? <Cloud {...p} /> : <CloudSun {...p} />;
  return <Cloud {...p} />;
}

type DadosClima = { id: number; descricao: string; noite: boolean; temp: number; sensacao: number; umidade: number; max: number; min: number; chuva: number | null };

async function buscarClima(): Promise<DadosClima | null> {
  const chave = process.env.OPENWEATHER_API_KEY;
  if (!chave) return null;
  const base = `lat=${LAT}&lon=${LON}&units=metric&lang=pt_br&appid=${chave}`;
  try {
    const [ra, rp] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${base}`, { next: { revalidate: 900 } }),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${base}&cnt=4`, { next: { revalidate: 900 } }),
    ]);
    if (!ra.ok) return null;
    const atual = (await ra.json()) as Atual;
    const proximas = rp.ok ? ((await rp.json()) as Previsao).list : [];
    const w = atual.weather[0];
    return {
      id: w.id,
      descricao: w.description,
      noite: w.icon.endsWith("n"),
      temp: Math.round(atual.main.temp),
      sensacao: Math.round(atual.main.feels_like),
      umidade: atual.main.humidity,
      max: Math.round(Math.max(atual.main.temp, ...proximas.map((p) => p.main.temp_max))),
      min: Math.round(Math.min(atual.main.temp, ...proximas.map((p) => p.main.temp_min))),
      chuva: proximas.length ? Math.round(Math.max(...proximas.map((p) => p.pop)) * 100) : null,
    };
  } catch {
    return null;
  }
}

export async function Clima({ cidade }: { cidade: string }) {
  const c = await buscarClima();
  if (!c) return null;
  return (
    <div className="flex items-center gap-3">
      <Icone id={c.id} noite={c.noite} />
      <div>
        <p className="font-titulo text-3xl font-semibold leading-none">
          {c.temp}°<span className="ml-1 font-corpo text-xs font-normal text-vinho-muted">{c.descricao.charAt(0).toUpperCase() + c.descricao.slice(1)}</span>
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-vinho-muted">
          <span>{cidade}</span>
          <span>↑{c.max}° ↓{c.min}°</span>
          <span>Sensação {c.sensacao}°</span>
          <span className="inline-flex items-center gap-0.5"><Droplets size={11} />{c.umidade}%</span>
          {c.chuva !== null && (
            <span className={`inline-flex items-center gap-0.5 ${c.chuva >= 50 ? "font-medium text-blue-700" : ""}`}>
              <Umbrella size={11} />{c.chuva}% chuva (12h)
            </span>
          )}
        </p>
        <p className="text-[9px] text-vinho-muted/70">Clima: © OpenWeather</p>
      </div>
    </div>
  );
}
