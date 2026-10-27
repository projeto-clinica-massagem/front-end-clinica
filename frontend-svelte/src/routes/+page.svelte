<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { downloadCsv } from '$lib/export.js';
  import { request } from '$lib/api.js';
  let liveData = null;
  let salesHistory = [];
  let loading = true;
  let dashboardError = '';
  $: metrics = liveData ? [
    { label: 'Vendas hoje', value: `R$ ${Number(liveData.sales?.revenue || 0).toFixed(2).replace('.', ',')}`, note: `${liveData.sales?.total || 0} vendas no período`, tone: 'accent' },
    { label: 'Agendamentos', value: String(liveData.appointments?.total || 0), note: `${liveData.appointments?.confirmed || 0} confirmados`, tone: 'blue' },
    { label: 'Receita do mês', value: `R$ ${Number(liveData.sales?.revenue || 0).toFixed(2).replace('.', ',')}`, note: `${liveData.sales?.paid || 0} vendas pagas`, tone: 'green' },
    { label: 'Carrinhos ativos', value: String(liveData.carts?.active || 0), note: `${liveData.carts?.items || 0} itens no carrinho`, tone: 'orange' }
  ] : [
    { label: 'Vendas hoje', value: '—', note: 'Carregando dados', tone: 'accent' },
    { label: 'Agendamentos', value: '—', note: 'Carregando dados', tone: 'blue' },
    { label: 'Receita do mês', value: '—', note: 'Carregando dados', tone: 'green' },
    { label: 'Carrinhos ativos', value: '—', note: 'Carregando dados', tone: 'orange' }
  ];
  $: appointments = liveData?.upcoming_appointments || [];
  $: chartValues = buildChartValues(salesHistory);
  $: chartMax = Math.max(...chartValues, 1);
  $: chartPoints = chartValues.map((value, index) => `${(index / (chartValues.length - 1)) * 700},${210 - (value / chartMax) * 170}`).join(' ');
  $: chartArea = `${chartPoints} 700,230 0,230`;
  $: chartLabels = getChartLabels();
  let exporting = false;
  let exportMessage = '';

  onMount(async () => {
    try {
      const [dashboard, sales] = await Promise.all([request('/dashboard'), request('/sales')]);
      liveData = dashboard;
      salesHistory = Array.isArray(sales) ? sales : sales?.items || sales?.results || [];
    }
    catch (exception) { dashboardError = exception.message || 'Não foi possível atualizar o dashboard.'; }
    finally { loading = false; }
  });

  function buildChartValues(sales) {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date.toISOString().slice(0, 10);
    });
    return days.map((day) => sales.filter((sale) => sale.created_at?.slice(0, 10) === day).reduce((sum, sale) => sum + Number(sale.total || 0), 0));
  }

  function getChartLabels() {
    const today = new Date();
    return [0, 2, 4, 6].map((offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - offset));
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
    });
  }

  function exportReport() {
    exporting = true;
    exportMessage = '';
    const rows = [
      ...metrics.map((metric) => ({ seção: 'Indicadores', item: metric.label, valor: metric.value, detalhe: metric.note })),
      ...appointments.map((appointment) => ({ seção: 'Agenda', item: appointment.client, valor: appointment.time, detalhe: `${appointment.service} - ${appointment.status}` }))
    ];
    if (!liveData) return;
    downloadCsv('relatorio-dashboard.csv', rows);
    exporting = false;
    exportMessage = 'Relatório exportado.';
    setTimeout(() => { exportMessage = ''; }, 3000);
  }
</script>

<svelte:head><title>Dashboard | Prover</title></svelte:head>

<section class="page-stack">
  {#if dashboardError}<div class="notice error-notice">{dashboardError}</div>{/if}
  <div class="welcome-row"><div><p class="muted">Dados atualizados pela API</p><h2>Bom dia, vamos cuidar dos detalhes.</h2></div><div class="action-with-feedback"><button class="secondary-button" on:click={exportReport} disabled={exporting || loading || !liveData}>{exporting ? 'Exportando...' : 'Exportar relatório'} <span>↓</span></button>{#if exportMessage}<small class="export-success">{exportMessage}</small>{/if}</div></div>
  <div class="metric-grid">
    {#each metrics as metric}
      <article class="metric-card"><div class="metric-top"><span>{metric.label}</span><span class="metric-dot {metric.tone}"></span></div><strong>{metric.value}</strong><small class:positive={metric.tone !== 'orange'}>{metric.note}</small></article>
    {/each}
  </div>
  <div class="dashboard-grid">
    <article class="panel chart-panel"><div class="panel-heading"><div><p class="eyebrow">DESEMPENHO</p><h3>Receita ao longo do tempo</h3></div><span class="chart-period">Últimos 7 dias</span></div><div class="chart"><div class="chart-value">R$ {Number(liveData?.sales?.revenue || 0).toFixed(2).replace('.', ',')} <small>{salesHistory.length} registros</small></div><svg viewBox="0 0 700 230" role="img" aria-label="Gráfico de receita"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d79d55" stop-opacity=".32"/><stop offset="1" stop-color="#d79d55" stop-opacity="0"/></linearGradient></defs><polygon points={chartArea} fill="url(#fill)" class="chart-area"/><polyline points={chartPoints} fill="none" stroke="#d79d55" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="chart-line"/>{#each chartValues as value, index}<circle cx={(index / (chartValues.length - 1)) * 700} cy={210 - (value / chartMax) * 170} r="4" fill="#b97e42" class="chart-point"/>{/each}</svg><div class="chart-labels">{#each chartLabels as label}<span>{label}</span>{/each}</div></div></article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">AGENDA</p><h3>Próximos horários</h3></div><a href={`${base}/appointments`} class="text-link">Ver todos →</a></div>{#if appointments.length === 0}<div class="empty-state compact-empty">Nenhum agendamento no período.</div>{:else}<div class="appointment-list">{#each appointments as appointment}<div class="appointment"><time>{appointment.time}</time><div><strong>{appointment.client}</strong><span>{appointment.service}</span></div><small class:waiting={appointment.status === 'Aguardando'}>{appointment.status}</small></div>{/each}</div>{/if}</article>
  </div>
</section>
