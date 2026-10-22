import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Inputs = {
  businessName: string;
  industry: string;
  investment: number;
  discountRate: number;
  price: number;
  startingUnits: number;
  annualGrowth: number;
  variableCost: number;
  labor: number;
  indirect: number;
  expenses: number;
  marketing: number;
};

type YearResult = {
  year: number;
  units: number;
  revenue: number;
  costs: number;
  net: number;
  cumulative: number;
};

const initialInputs: Inputs = {
  businessName: 'Café Sierra',
  industry: 'Alimentos y bebidas',
  investment: 18000,
  discountRate: 8,
  price: 15,
  startingUnits: 520,
  annualGrowth: 12,
  variableCost: 4.75,
  labor: 2200,
  indirect: 1200,
  expenses: 950,
  marketing: 800,
};

const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
const compactMoney = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 }).format(value);
const percent = (value: number) => `${value.toFixed(1)}%`;

function calculateResults(inputs: Inputs): { years: YearResult[]; npv: number; irr: number; payback: number | null; breakEvenUnits: number; profitYear: number | null } {
  let cumulative = -inputs.investment;
  const years: YearResult[] = Array.from({ length: 5 }, (_, index) => {
    const year = index + 1;
    const units = Math.round(inputs.startingUnits * Math.pow(1 + inputs.annualGrowth / 100, index));
    const revenue = units * inputs.price;
    const fixedCosts = (inputs.labor + inputs.indirect + inputs.expenses + inputs.marketing) * Math.pow(1.04, index);
    const costs = units * inputs.variableCost + fixedCosts;
    const net = revenue - costs;
    cumulative += net;
    return { year, units, revenue, costs, net, cumulative };
  });

  const npv = years.reduce((total, row) => total + row.net / Math.pow(1 + inputs.discountRate / 100, row.year), -inputs.investment);
  const cashFlows = [-inputs.investment, ...years.map((row) => row.net)];
  const npvAt = (rate: number) => cashFlows.reduce((total, flow, index) => total + flow / Math.pow(1 + rate, index), 0);
  let low = -0.99;
  let high = 2;
  for (let i = 0; i < 80; i += 1) {
    const middle = (low + high) / 2;
    if (npvAt(middle) > 0) low = middle;
    else high = middle;
  }
  const irr = npvAt(2) > 0 ? 200 : ((low + high) / 2) * 100;
  let payback: number | null = null;
  let previous = -inputs.investment;
  for (const row of years) {
    if (previous < 0 && row.cumulative >= 0) {
      payback = row.year - Math.abs(previous) / Math.max(row.net, 1);
      break;
    }
    previous = row.cumulative;
  }
  const contribution = inputs.price - inputs.variableCost;
  const breakEvenUnits = contribution > 0 ? Math.ceil((inputs.labor + inputs.indirect + inputs.expenses + inputs.marketing) / contribution) : 0;
  const profitYear = years.find((row) => row.net > 0)?.year ?? null;
  return { years, npv, irr, payback, breakEvenUnits, profitYear };
}

function NumberField({ label, value, onChange, prefix = '$', suffix }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; suffix?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        {prefix && <b>{prefix}</b>}
        <input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

function App() {
  const [inputs, setInputs] = useState<Inputs>(initialInputs);
  const [hasReport, setHasReport] = useState(false);
  const [saved, setSaved] = useState(false);
  const results = useMemo(() => calculateResults(inputs), [inputs]);
  const maxChart = Math.max(...results.years.flatMap((row) => [row.revenue, row.costs]), 1);

  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) => setInputs((current) => ({ ...current, [key]: value }));

  const generateReport = async () => {
    setHasReport(true);
    setSaved(false);
    if (supabase) {
      const { error } = await supabase.from('business_simulations').insert({
        business_name: inputs.businessName,
        industry: inputs.industry,
        input_data: inputs,
        results,
      });
      if (!error) setSaved(true);
    }
    window.setTimeout(() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const reset = () => {
    setInputs(initialInputs);
    setHasReport(false);
    setSaved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><BarChart3 size={21} /></div><span>viabilidad<span className="brand-accent">.SV</span></span></div>
        <div className="topbar-note"><span className="status-dot" /> Análisis inteligente para tu negocio</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> Planea con claridad</div>
          <h1>Descubre si tu idea<br /><em>es un buen negocio.</em></h1>
          <p>Transforma tus números en una decisión segura. Calcula la viabilidad, rentabilidad y recuperación de tu inversión en minutos.</p>
          <div className="hero-points"><span><CheckCircle2 size={17} /> Indicadores financieros</span><span><CheckCircle2 size={17} /> Proyección a 5 años</span></div>
        </div>
        <div className="hero-visual">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="floating-card card-main"><span className="mini-label">Rentabilidad proyectada</span><strong>{percent(Math.max(results.irr, 0))}</strong><div className="sparkline"><span /><span /><span /><span /><span /><span /></div><small>Tu negocio puede crecer</small></div>
          <div className="floating-card card-side"><TrendingUp size={18} /><strong>{compactMoney(Math.max(results.npv, 0))}</strong><small>VAN estimado</small></div>
          <div className="grid-lines" />
        </div>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><span className="step">PASO 01</span><h2>Cuéntanos sobre tu negocio</h2><p>Comienza con la información base de tu proyecto.</p></div><span className="progress-label">1 de 2</span></div>
        <div className="form-grid intro-grid">
          <label className="field wide"><span>Nombre del negocio</span><input className="plain-input" value={inputs.businessName} onChange={(event) => update('businessName', event.target.value)} placeholder="Ej. Café Sierra" /></label>
          <label className="field"><span>Giro del negocio</span><div className="select-wrap"><select value={inputs.industry} onChange={(event) => update('industry', event.target.value)}><option>Alimentos y bebidas</option><option>Comercio</option><option>Servicios profesionales</option><option>Manufactura</option><option>Tecnología</option><option>Agroindustria</option></select><ChevronDown size={17} /></div></label>
          <NumberField label="Inversión inicial" value={inputs.investment} onChange={(value) => update('investment', value)} />
          <NumberField label="Tasa de descuento anual" value={inputs.discountRate} suffix="%" prefix="" onChange={(value) => update('discountRate', value)} />
        </div>

        <div className="section-heading second-heading"><div><span className="step">PASO 02</span><h2>Construye tu proyección</h2><p>Usaremos estos datos para estimar tus flujos durante los próximos 5 años.</p></div><span className="progress-label">2 de 2</span></div>
        <div className="form-grid economics-grid">
          <div className="form-card"><div className="card-title"><CircleDollarSign size={18} /><div><strong>Ingresos</strong><small>¿Cuánto esperas vender?</small></div></div><NumberField label="Precio promedio de venta" value={inputs.price} onChange={(value) => update('price', value)} /><NumberField label="Unidades vendidas en año 1" value={inputs.startingUnits} prefix="" onChange={(value) => update('startingUnits', value)} /><NumberField label="Crecimiento anual esperado" value={inputs.annualGrowth} suffix="%" prefix="" onChange={(value) => update('annualGrowth', value)} /></div>
          <div className="form-card"><div className="card-title"><WalletCards size={18} /><div><strong>Costos y gastos</strong><small>¿Cuánto cuesta operar?</small></div></div><NumberField label="Costo variable por unidad" value={inputs.variableCost} onChange={(value) => update('variableCost', value)} /><NumberField label="Mano de obra anual" value={inputs.labor} onChange={(value) => update('labor', value)} /><NumberField label="Costos indirectos anuales" value={inputs.indirect} onChange={(value) => update('indirect', value)} /><NumberField label="Gastos administrativos" value={inputs.expenses} onChange={(value) => update('expenses', value)} /><NumberField label="Marketing y publicidad" value={inputs.marketing} onChange={(value) => update('marketing', value)} /></div>
        </div>
        <div className="action-row"><button className="ghost-button" onClick={reset}><RefreshCw size={16} /> Limpiar datos</button><button className="primary-button" onClick={generateReport}>Generar mi análisis <ArrowRight size={18} /></button></div>

        {hasReport && <section id="report" className="report-section">
          <div className="report-header"><div><span className="step">TU RESULTADO</span><h2>El panorama de {inputs.businessName}</h2><p>Una lectura sencilla de la salud financiera de tu proyecto.</p></div><div className="saved-pill"><CheckCircle2 size={15} /> {saved ? 'Análisis guardado' : 'Análisis listo'}</div></div>
          <div className="metric-grid"><div className={`metric-card ${results.npv >= 0 ? 'positive' : 'negative'}`}><div className="metric-icon"><TrendingUp size={20} /></div><span>VAN</span><strong>{money(results.npv)}</strong><small>{results.npv >= 0 ? 'Valor creado sobre tu inversión' : 'Revisa el nivel de inversión'}</small></div><div className={`metric-card ${results.irr >= inputs.discountRate ? 'positive' : 'negative'}`}><div className="metric-icon"><Target size={20} /></div><span>TIR</span><strong>{percent(results.irr)}</strong><small>{results.irr >= inputs.discountRate ? 'Supera tu tasa mínima' : 'Está por debajo de tu tasa mínima'}</small></div><div className="metric-card"><div className="metric-icon"><WalletCards size={20} /></div><span>PAYBACK</span><strong>{results.payback ? `${results.payback.toFixed(1)} años` : 'Más de 5 años'}</strong><small>Tiempo para recuperar la inversión</small></div><div className="metric-card"><div className="metric-icon"><BarChart3 size={20} /></div><span>PUNTO DE EQUILIBRIO</span><strong>{results.breakEvenUnits.toLocaleString('es-MX')}</strong><small>Unidades al año para no perder</small></div></div>

          <div className="report-columns"><div className="panel chart-panel"><div className="panel-heading"><div><h3>Ingresos vs. costos y gastos</h3><p>Proyección anual en pesos mexicanos</p></div><div className="legend"><span className="legend-income" /> Ingresos <span className="legend-cost" /> Costos</div></div><div className="bar-chart">{results.years.map((row) => <div className="bar-column" key={row.year}><div className="bars"><div className="bar income" style={{ height: `${Math.max(row.revenue / maxChart * 100, 3)}%` }} title={money(row.revenue)} /><div className="bar cost" style={{ height: `${Math.max(row.costs / maxChart * 100, 3)}%` }} title={money(row.costs)} /></div><span>Año {row.year}</span></div>)}</div></div><div className="panel insight-panel"><div className="insight-icon"><Lightbulb size={21} /></div><div><span className="step">LECTURA CLAVE</span><h3>{results.npv >= 0 ? 'Tu proyecto tiene una señal financiera positiva' : 'Tu proyecto necesita ajustes antes de invertir'}</h3><p>{results.profitYear ? `Comenzarías a generar ganancias desde el año ${results.profitYear}. ` : 'Aún no aparecen ganancias dentro del periodo analizado. '}La recuperación de tu inversión ocurre {results.payback ? `en aproximadamente ${results.payback.toFixed(1)} años` : 'después de los 5 años proyectados'}.</p></div></div></div>

          <div className="panel cashflow-panel"><div className="panel-heading"><div><h3>Flujo de efectivo proyectado</h3><p>Observa cómo evoluciona tu dinero año con año.</p></div><span className="annual-badge">5 años</span></div><div className="table-wrap"><table><thead><tr><th>Concepto</th><th>Año 0</th>{results.years.map((row) => <th key={row.year}>Año {row.year}</th>)}</tr></thead><tbody><tr><td>Ingresos</td><td>—</td>{results.years.map((row) => <td key={row.year}>{money(row.revenue)}</td>)}</tr><tr><td>Costos y gastos</td><td>—</td>{results.years.map((row) => <td key={row.year}>{money(row.costs)}</td>)}</tr><tr className="net-row"><td>Flujo neto</td><td className="negative-text">-{money(inputs.investment)}</td>{results.years.map((row) => <td key={row.year} className={row.net >= 0 ? 'positive-text' : 'negative-text'}>{money(row.net)}</td>)}</tr><tr className="cumulative-row"><td>Flujo acumulado</td><td className="negative-text">-{money(inputs.investment)}</td>{results.years.map((row) => <td key={row.year} className={row.cumulative >= 0 ? 'positive-text' : 'negative-text'}>{money(row.cumulative)}</td>)}</tr></tbody></table></div></div>

          <div className="recommendations"><div><span className="step">RECOMENDACIONES</span><h2>Decide con más confianza</h2></div><div className="recommendation-grid"><article><span>01</span><h3>Cuida tu margen</h3><p>Tu margen por unidad es de {money(inputs.price - inputs.variableCost)}. Busca proveedores o ajustes de precio para protegerlo.</p></article><article><span>02</span><h3>Alcanza el equilibrio</h3><p>Planea vender al menos {results.breakEvenUnits.toLocaleString('es-MX')} unidades al año para cubrir todos tus costos.</p></article><article><span>03</span><h3>Haz seguimiento mensual</h3><p>Compara ventas reales contra esta proyección y actualiza tus supuestos cada trimestre.</p></article></div></div>
        </section>}
      </section>
      <footer><span>viabilidad.SV</span><span>Herramienta de planeación financiera</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Volver arriba ↑</button></footer>
    </main>
  );
}

export default App;
