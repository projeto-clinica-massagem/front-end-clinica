<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { downloadCsv } from '$lib/export.js';
  import { request } from '$lib/api.js';
  const fallbackMetrics = [
    { label: 'Vendas hoje', value: 'R$ 1.250,50', note: '+12,4% vs. ontem', tone: 'accent' },
    { label: 'Agendamentos', value: '24', note: '5 aguardando confirmação', tone: 'blue' },
    { label: 'Receita do mês', value: 'R$ 15.840', note: '+8,2% este mês', tone: 'green' },
    { label: 'Carrinhos ativos', value: '18', note: '3 abandonados hoje', tone: 'orange' }
  ];

  const fallbackAppointments = [
    { time: '09:30', client: 'Mariana Costa', service: 'Massagem relaxante', status: 'Confirmado' },
    { time: '11:00', client: 'Rafael Lima', service: 'Drenagem linfática', status: 'Aguardando' },
    { time: '14:30', client: 'Ana Beatriz', service: 'Limpeza de pele', status: 'Confirmado' },
    { time: '16:00', client: 'Carlos Eduardo', service: 'Massagem terapêutica', status: 'Confirmado' }
  ];
  let liveData = null;
  let dashboardError = '';
  $: metrics = liveData ? [
    { label: 'Vendas hoje', value: `R$ ${Number(liveData.sales?.revenue || 0).toFixed(2).replace('.', ',')}`, note: `${liveData.sales?.total || 0} vendas no período`, tone: 'accent' },
    { label: 'Agendamentos', value: String(liveData.appointments?.total || 0), note: `${liveData.appointments?.confirmed || 0} confirmados`, tone: 'blue' },
    { label: 'Receita do mês', value: `R$ ${Number(liveData.sales?.revenue || 0).toFixed(2).replace('.', ',')}`, note: `${liveData.sales?.paid || 0} vendas pagas`, tone: 'green' },
    { label: 'Carrinhos ativos', value: String(liveData.carts?.active || 0), note: `${liveData.carts?.items || 0} itens no carrinho`, tone: 'orange' }
  ] : fallbackMetrics;
  $: appointments = liveData?.upcoming_appointments || fallbackAppointments;
  let exporting = false;
  let exportMessage = '';

  onMount(async () => {
    try { liveData = await request('/dashboard'); }
    catch (exception) { dashboardError = exception.message || 'Não foi possível atualizar o dashboard.'; }
  });

  function exportReport() {
    exporting = true;
    exportMessage = '';
    const rows = [
      ...metrics.map((metric) => ({ seção: 'Indicadores', item: metric.label, valor: metric.value, detalhe: metric.note })),
      ...appointments.map((appointment) => ({ seção: 'Agenda', item: appointment.client, valor: appointment.time, detalhe: `${appointment.service} - ${appointment.status}` }))
    ];
    downloadCsv('relatorio-dashboard.csv', rows);
    exporting = false;
    exportMessage = 'Relatório exportado.';
    setTimeout(() => { exportMessage = ''; }, 3000);
  }
</script>

<svelte:head><title>Dashboard | Prover</title></svelte:head>

<section class="page-stack">
  {#if dashboardError}<div class="notice error-notice">{dashboardError}</div>{/if}
  <div class="welcome-row"><div><p class="muted">Quarta-feira, 21 de outubro de 2026</p><h2>Bom dia, vamos cuidar dos detalhes.</h2></div><div class="action-with-feedback"><button class="secondary-button" on:click={exportReport} disabled={exporting}>{exporting ? 'Exportando...' : 'Exportar relatório'} <span>↓</span></button>{#if exportMessage}<small class="export-success">{exportMessage}</small>{/if}</div></div>
  <div class="metric-grid">
    {#each metrics as metric}
      <article class="metric-card"><div class="metric-top"><span>{metric.label}</span><span class="metric-dot {metric.tone}"></span></div><strong>{metric.value}</strong><small class:positive={metric.tone !== 'orange'}>{metric.note}</small></article>
    {/each}
  </div>
  <div class="dashboard-grid">
    <article class="panel chart-panel"><div class="panel-heading"><div><p class="eyebrow">DESEMPENHO</p><h3>Receita ao longo do tempo</h3></div><select aria-label="Período"><option>Últimos 7 dias</option><option>Este mês</option></select></div><div class="chart"><div class="chart-value">R$ 6.420 <small>+18,6%</small></div><svg viewBox="0 0 700 230" role="img" aria-label="Gráfico de receita"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d79d55" stop-opacity=".32"/><stop offset="1" stop-color="#d79d55" stop-opacity="0"/></linearGradient></defs><path d="M0 190 C60 170 80 180 130 140 S220 160 270 115 S350 150 400 90 S490 120 540 70 S630 80 700 25 V230 H0Z" fill="url(#fill)"/><path d="M0 190 C60 170 80 180 130 140 S220 160 270 115 S350 150 400 90 S490 120 540 70 S630 80 700 25" fill="none" stroke="#d79d55" stroke-width="4" stroke-linecap="round"/></svg><div class="chart-labels"><span>15 out</span><span>17 out</span><span>19 out</span><span>21 out</span></div></div></article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">AGENDA</p><h3>Próximos horários</h3></div><a href={`${base}/appointments`} class="text-link">Ver todos →</a></div><div class="appointment-list">{#each appointments as appointment}<div class="appointment"><time>{appointment.time}</time><div><strong>{appointment.client}</strong><span>{appointment.service}</span></div><small class:waiting={appointment.status === 'Aguardando'}>{appointment.status}</small></div>{/each}</div></article>
  </div>
</section>
