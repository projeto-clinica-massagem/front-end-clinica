<script>
  import { onMount } from 'svelte';
  import { cancelAppointment, createAppointment, getActiveServices, getAppointments, getAvailableSlots, getClients, getMassagistas, getRooms, updateAppointment } from '$lib/appointments.js';
  import { isMockApi } from '$lib/api.js';

  const emptyForm = () => ({ client_id: '', service_id: '', massagista_id: '', room_id: '', notes: '', status: 'pending' });
  let appointments = [];
  let clients = [];
  let services = [];
  let massagistas = [];
  let rooms = [];
  let loading = true;
  let optionsLoading = true;
  let slotsLoading = false;
  let saving = false;
  let error = '';
  let optionsError = '';
  let search = '';
  let statusFilter = '';
  let showModal = false;
  let editingAppointment = null;
  let form = emptyForm();
  let selectedDate = dateKey(new Date());
  let selectedTime = '';
  let slots = [];
  let monthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  $: calendarDays = buildCalendar(monthCursor);
  $: selectedService = services.find((service) => String(service.id) === String(form.service_id));

  async function load() {
    loading = true;
    error = '';
    try { appointments = await getAppointments({ search, status: statusFilter }); }
    catch (exception) { error = exception.message || 'Não foi possível carregar os agendamentos.'; }
    finally { loading = false; }
  }

  async function loadOptions() {
    optionsLoading = true;
    optionsError = '';
    const results = await Promise.allSettled([getClients(), getActiveServices(), getMassagistas(), getRooms()]);
    if (results[0].status === 'fulfilled') clients = results[0].value;
    if (results[1].status === 'fulfilled') services = results[1].value;
    if (results[2].status === 'fulfilled') massagistas = results[2].value;
    if (results[3].status === 'fulfilled') rooms = results[3].value;
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) optionsError = 'Algumas opções da agenda não puderam ser carregadas.';
    optionsLoading = false;
  }

  async function loadSlots() {
    const service = services.find((item) => String(item.id) === String(form.service_id));
    if (!selectedDate || !service) { slots = []; return; }
    slotsLoading = true;
    try {
      const result = await getAvailableSlots(selectedDate, service.duration_minutes, form.massagista_id);
      slots = result.available_slots || result.slots || [];
    } catch (exception) {
      slots = [];
      error = exception.message || 'Não foi possível carregar os horários disponíveis.';
    } finally { slotsLoading = false; }
  }

  function buildCalendar(month) {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date, key: dateKey(date), day: date.getDate(), current: date.getMonth() === month.getMonth() };
    });
  }

  function dateKey(date) { return date.toISOString().slice(0, 10); }
  function formatMonth(date) { return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); }
  function appointmentDate(appointment) { return (appointment.scheduled_date || appointment.scheduled_start || '').slice(0, 10); }
  function hasAppointments(key) { return appointments.some((appointment) => appointmentDate(appointment) === key && appointment.status !== 'cancelled'); }
  function moveMonth(amount) { monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + amount, 1); }
  function goToday() { const today = new Date(); monthCursor = new Date(today.getFullYear(), today.getMonth(), 1); selectedDate = dateKey(today); loadSlots(); }
  function selectDay(day) { selectedDate = day.key; selectedTime = ''; loadSlots(); }

  function defaultDate() {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    date.setMinutes(0, 0, 0);
    return dateKey(date);
  }

  function openCreate() {
    if (optionsLoading) { error = 'Carregando opções da agenda...'; return; }
    editingAppointment = null;
    selectedDate = defaultDate();
    selectedTime = '';
    monthCursor = new Date(`${selectedDate}T00:00:00`);
    form = { ...emptyForm(), client_id: clients[0]?.id || '', service_id: services[0]?.id || '', massagista_id: massagistas[0]?.id || '', room_id: rooms[0]?.id || '' };
    showModal = true;
    loadSlots();
  }

  function openEdit(appointment) {
    editingAppointment = appointment;
    const dateTime = appointment.scheduled_date || appointment.scheduled_start || '';
    selectedDate = dateTime.slice(0, 10);
    selectedTime = dateTime.slice(11, 16);
    monthCursor = new Date(`${selectedDate}T00:00:00`);
    form = { client_id: appointment.client_id || '', service_id: appointment.service_id || appointment.services?.[0]?.service_id || '', massagista_id: appointment.massagista_id || '', room_id: appointment.room_id || '', notes: appointment.notes || '', status: appointment.status || 'pending' };
    showModal = true;
    loadSlots();
  }

  function closeModal() { if (!saving) showModal = false; }

  async function save() {
    const client = clients.find((item) => String(item.id) === String(form.client_id));
    const service = services.find((item) => String(item.id) === String(form.service_id));
    if (!client || !service || !selectedDate || !selectedTime) { error = 'Selecione cliente, serviço, dia e horário.'; return; }
    saving = true;
    error = '';
    const payload = { ...form, scheduled_date: `${selectedDate}T${selectedTime}`, duration_minutes: service.duration_minutes, client_name: client.name, service_name: service.name, notes: form.notes.trim() || null };
    try {
      if (editingAppointment) {
        const updated = await updateAppointment(editingAppointment.id, payload);
        appointments = appointments.map((item) => item.id === updated.id ? updated : item);
      } else {
        const created = await createAppointment(payload);
        appointments = [created, ...appointments];
      }
      showModal = false;
    } catch (exception) { error = exception.message || 'Não foi possível salvar o agendamento.'; }
    finally { saving = false; }
  }

  async function cancel(appointment) {
    if (!confirm(`Cancelar o agendamento de ${appointment.client_name}?`)) return;
    try {
      const result = await cancelAppointment(appointment.id);
      appointments = appointments.map((item) => item.id === appointment.id ? { ...item, status: result.status || 'cancelled' } : item);
    } catch (exception) { error = exception.message || 'Não foi possível cancelar o agendamento.'; }
  }

  function statusLabel(status) { return { pending: 'Pendente', scheduled: 'Agendado', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Concluído' }[status] || status; }
  function handleKeydown(event) { if (event.key === 'Escape') closeModal(); }

  onMount(() => {
    load();
    loadOptions();
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<svelte:head><title>Agendamentos | Prover</title></svelte:head>

<section class="page-stack">
  <div class="page-actions"><div><p class="muted">Agenda da clínica</p><h2>Agendamentos</h2></div><button class="primary-button compact" on:click={openCreate} disabled={optionsLoading}>+ Novo agendamento</button></div>
  <div class="toolbar"><input aria-label="Buscar agendamento" bind:value={search} on:keydown={(event) => event.key === 'Enter' && load()} placeholder="Buscar cliente ou serviço..." /><select aria-label="Filtrar status" bind:value={statusFilter} on:change={load}><option value="">Todos os status</option><option value="pending">Pendentes</option><option value="scheduled">Agendados</option><option value="confirmed">Confirmados</option><option value="cancelled">Cancelados</option></select><button class="secondary-button compact" on:click={load}>Buscar</button></div>
  {#if error}<div class="notice error-notice">{error}</div>{/if}
  {#if loading}<div class="panel empty-state">Carregando agendamentos...</div>{:else if appointments.length === 0}<div class="panel empty-state">Nenhum agendamento encontrado.</div>{:else}<div class="panel table-wrap"><table><thead><tr><th>Cliente</th><th>Serviço</th><th>Data e hora</th><th>Status</th><th>Ações</th></tr></thead><tbody>{#each appointments as appointment}<tr><td><strong>{appointment.client_name}</strong></td><td>{appointment.service_name}</td><td>{new Date(appointment.scheduled_date || appointment.scheduled_start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td><td><span class:inactive={appointment.status === 'cancelled'} class="status-pill">{statusLabel(appointment.status)}</span></td><td><div class="row-actions"><button class="table-action" on:click={() => openEdit(appointment)} disabled={appointment.status === 'cancelled'}>Editar</button>{#if appointment.status !== 'cancelled'}<button class="table-action danger-action" on:click={() => cancel(appointment)}>Cancelar</button>{/if}</div></td></tr>{/each}</tbody></table></div>{/if}
</section>

{#if showModal}<div class="modal-overlay" role="presentation" on:click={(event) => event.target === event.currentTarget && closeModal()}><div class="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title" tabindex="-1"><div class="modal-header"><div><p class="eyebrow">AGENDA</p><h2 id="appointment-modal-title">{editingAppointment ? 'Editar agendamento' : 'Novo agendamento'}</h2></div><button class="modal-close" aria-label="Fechar" on:click={closeModal}>×</button></div><div class="calendar-layout"><section class="calendar-section"><div class="calendar-toolbar"><button class="calendar-nav" aria-label="Mês anterior" on:click={() => moveMonth(-1)}>‹</button><h3>{formatMonth(monthCursor)}</h3><button class="calendar-nav" aria-label="Próximo mês" on:click={() => moveMonth(1)}>›</button><button class="calendar-today" on:click={goToday}>Hoje</button></div><div class="calendar-weekdays">{#each ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as weekday}<span>{weekday}</span>{/each}</div><div class="calendar-grid">{#each calendarDays as day}<button class:outside={!day.current} class:selected={selectedDate === day.key} class:has-events={hasAppointments(day.key)} class="calendar-day" on:click={() => selectDay(day)}><span>{day.day}</span>{#if hasAppointments(day.key)}<i></i>{/if}</button>{/each}</div></section><form class="appointment-form modal-form" on:submit|preventDefault={save}><div class="selected-date">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div><label>Cliente *<select bind:value={form.client_id} required><option value="">Selecione o cliente</option>{#each clients as client}<option value={client.id}>{client.name}</option>{/each}</select></label>{#if !isMockApi()}<label>Massagista *<select bind:value={form.massagista_id} on:change={loadSlots} required><option value="">Selecione o massagista</option>{#each massagistas as person}<option value={person.id}>{person.name}</option>{/each}</select></label><label>Sala<select bind:value={form.room_id}><option value="">Sem sala</option>{#each rooms as room}<option value={room.id}>{room.name}</option>{/each}</select></label>{/if}<label>Serviço *<select bind:value={form.service_id} on:change={loadSlots} required><option value="">Selecione o serviço</option>{#each services as service}<option value={service.id}>{service.name} · {service.duration_minutes} min · R$ {Number(service.price).toFixed(2).replace('.', ',')}</option>{/each}</select></label><div><span class="field-label">Horários disponíveis *</span>{#if slotsLoading}<div class="slot-state">Buscando horários...</div>{:else if slots.length === 0}<div class="slot-state">Selecione um serviço para ver horários.</div>{:else}<div class="time-slots">{#each slots as slot}<button type="button" class:selected={selectedTime === slot} on:click={() => selectedTime = slot}>{slot}</button>{/each}</div>{/if}</div><label>Status<select bind:value={form.status}><option value="pending">Pendente</option><option value="scheduled">Agendado</option><option value="confirmed">Confirmado</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select></label><label>Observações<textarea bind:value={form.notes} rows="2" placeholder="Observações opcionais"></textarea></label><div class="modal-actions"><button type="button" class="secondary-button" on:click={closeModal} disabled={saving}>Cancelar</button><button type="submit" class="primary-button" disabled={saving || optionsLoading}>{saving ? 'Salvando...' : 'Confirmar agendamento'}</button></div></form></div></div></div>{/if}
