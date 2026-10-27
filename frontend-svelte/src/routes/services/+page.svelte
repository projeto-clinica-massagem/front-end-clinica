<script>
  import { onMount } from 'svelte';
  import { createService, deleteService, getServices, updateService } from '$lib/services.js';

  const emptyForm = () => ({ name: '', description: '', category: '', duration_minutes: '', price: '', active: true });
  let services = [];
  let loading = true;
  let saving = false;
  let error = '';
  let search = '';
  let showModal = false;
  let editingService = null;
  let form = emptyForm();

  async function load() {
    loading = true;
    error = '';
    try { services = (await getServices({ search })).items; }
    catch (exception) { error = exception.message || 'Não foi possível carregar os serviços.'; }
    finally { loading = false; }
  }

  function openCreate() { editingService = null; form = emptyForm(); showModal = true; }

  function openEdit(service) {
    editingService = service;
    form = { name: service.name || '', description: service.description || '', category: service.category || '', duration_minutes: service.duration_minutes ?? '', price: service.price ?? '', active: service.active !== false };
    showModal = true;
  }

  function closeModal() { if (!saving) showModal = false; }

  async function save() {
    if (!form.name.trim() || form.duration_minutes === '' || form.price === '') { error = 'Preencha nome, duração e preço.'; return; }
    saving = true;
    error = '';
    const payload = { ...form, name: form.name.trim(), description: form.description.trim() || null, category: form.category.trim() || null, duration_minutes: Number(form.duration_minutes), price: Number(form.price) };
    try {
      if (editingService) {
        const updated = await updateService(editingService.id, payload);
        services = services.map((item) => item.id === updated.id ? updated : item);
      } else {
        const created = await createService(payload);
        services = [created, ...services];
      }
      showModal = false;
    } catch (exception) { error = exception.message || 'Não foi possível salvar o serviço.'; }
    finally { saving = false; }
  }

  async function remove(service) {
    if (!confirm(`Excluir o serviço "${service.name}"?`)) return;
    try { await deleteService(service.id); services = services.filter((item) => item.id !== service.id); }
    catch (exception) { error = exception.message || 'Não foi possível excluir o serviço.'; }
  }

  async function toggleStatus(service) {
    try {
      const updated = await updateService(service.id, { active: !service.active });
      services = services.map((item) => item.id === updated.id ? updated : item);
    } catch (exception) { error = exception.message || 'Não foi possível alterar o status.'; }
  }

  function handleKeydown(event) { if (event.key === 'Escape') closeModal(); }

  onMount(() => {
    load();
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<svelte:head><title>Serviços | Prover</title></svelte:head>

<section class="page-stack">
  <div class="page-actions"><div><p class="muted">Catálogo da clínica</p><h2>Serviços</h2></div><button class="primary-button compact" on:click={openCreate}>+ Novo serviço</button></div>
  <div class="toolbar"><input aria-label="Buscar serviço" bind:value={search} on:keydown={(event) => event.key === 'Enter' && load()} placeholder="Buscar por nome..." /><button class="secondary-button compact" on:click={load}>Buscar</button></div>
  {#if error}<div class="notice error-notice">{error}</div>{/if}
  {#if loading}<div class="panel empty-state">Carregando serviços...</div>{:else if services.length === 0}<div class="panel empty-state">Nenhum serviço encontrado.</div>{:else}<div class="panel table-wrap"><table><thead><tr><th>Nome</th><th>Categoria</th><th>Duração</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead><tbody>{#each services as service}<tr><td><strong>{service.name}</strong>{#if service.description}<small class="table-subtitle">{service.description}</small>{/if}</td><td>{service.category || 'Sem categoria'}</td><td>{service.duration_minutes || '-'} min</td><td>R$ {Number(service.price || 0).toFixed(2).replace('.', ',')}</td><td><button class:inactive={!service.active} class="status-pill status-button" on:click={() => toggleStatus(service)}>{service.active === false ? 'Inativo' : 'Ativo'}</button></td><td><div class="row-actions"><button class="table-action" on:click={() => openEdit(service)}>Editar</button><button class="table-action danger-action" on:click={() => remove(service)}>Excluir</button></div></td></tr>{/each}</tbody></table></div>{/if}
</section>

{#if showModal}<div class="modal-overlay" role="presentation" on:click={(event) => event.target === event.currentTarget && closeModal()}><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="service-modal-title" tabindex="-1"><div class="modal-header"><div><p class="eyebrow">CATÁLOGO</p><h2 id="service-modal-title">{editingService ? 'Editar serviço' : 'Novo serviço'}</h2></div><button class="modal-close" aria-label="Fechar" on:click={closeModal}>×</button></div><form class="modal-form" on:submit|preventDefault={save}><label>Nome *<input bind:value={form.name} required placeholder="Nome do serviço" /></label><label>Descrição<textarea bind:value={form.description} rows="2" placeholder="Descrição opcional"></textarea></label><div class="form-grid-two"><label>Categoria<input bind:value={form.category} placeholder="Massagem, estética..." /></label><label>Status<select bind:value={form.active}><option value={true}>Ativo</option><option value={false}>Inativo</option></select></label></div><div class="form-grid-two"><label>Duração (minutos) *<input type="number" min="1" step="1" bind:value={form.duration_minutes} required /></label><label>Preço (R$) *<input type="number" min="0" step="0.01" bind:value={form.price} required /></label></div><div class="modal-actions"><button type="button" class="secondary-button" on:click={closeModal} disabled={saving}>Cancelar</button><button type="submit" class="primary-button" disabled={saving}>{saving ? 'Salvando...' : editingService ? 'Salvar alterações' : 'Criar serviço'}</button></div></form></div></div>{/if}
