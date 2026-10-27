<script>
  import { onMount } from 'svelte';
  import { createClient, deleteClient, getClients, updateClient } from '$lib/clients.js';

  const emptyForm = () => ({ name: '', cpf: '', phone: '', email: '' });
  let clients = [];
  let loading = true;
  let saving = false;
  let error = '';
  let search = '';
  let showModal = false;
  let editingClient = null;
  let form = emptyForm();

  $: filteredClients = clients.filter((client) => `${client.name || ''} ${client.cpf || ''} ${client.email || ''} ${client.phone || ''}`.toLowerCase().includes(search.toLowerCase()));

  async function load() {
    loading = true;
    error = '';
    try { clients = await getClients(); }
    catch (exception) { error = exception.message || 'Não foi possível carregar os clientes.'; }
    finally { loading = false; }
  }

  function openCreate() { editingClient = null; form = emptyForm(); showModal = true; }

  function openEdit(client) {
    editingClient = client;
    form = { name: client.name || '', cpf: client.cpf || '', phone: client.phone || '', email: client.email || '' };
    showModal = true;
  }

  function closeModal() { if (!saving) showModal = false; }

  async function save() {
    if (!form.name.trim() || !form.cpf.trim() || !form.phone.trim()) {
      error = 'Preencha nome, CPF e telefone.';
      return;
    }
    const cpf = form.cpf.replace(/\D/g, '');
    if (cpf.length !== 11) { error = 'Informe um CPF com 11 dígitos.'; return; }
    saving = true;
    error = '';
    const payload = { name: form.name.trim(), cpf, phone: form.phone.trim(), email: form.email.trim() || null };
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, payload);
        clients = clients.map((client) => client.id === updated.id ? updated : client);
      } else {
        const created = await createClient(payload);
        clients = [created, ...clients];
      }
      showModal = false;
    } catch (exception) { error = exception.message || 'Não foi possível salvar o cliente.'; }
    finally { saving = false; }
  }

  async function remove(client) {
    if (!confirm(`Excluir o cliente "${client.name}"?`)) return;
    try { await deleteClient(client.id); clients = clients.filter((item) => item.id !== client.id); }
    catch (exception) { error = exception.message || 'Não foi possível excluir o cliente.'; }
  }

  function handleKeydown(event) { if (event.key === 'Escape') closeModal(); }

  onMount(() => {
    load();
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<svelte:head><title>Clientes | Prover</title></svelte:head>

<section class="page-stack">
  <div class="page-actions"><div><p class="muted">Diretório da clínica</p><h2>Clientes</h2></div><button class="primary-button compact" on:click={openCreate}>+ Novo cliente</button></div>
  <div class="toolbar"><input aria-label="Buscar cliente" bind:value={search} placeholder="Buscar por nome, CPF, e-mail ou telefone..." /><button class="secondary-button compact" on:click={load}>Atualizar</button></div>
  {#if error}<div class="notice error-notice">{error}</div>{/if}
  {#if loading}<div class="panel empty-state">Carregando clientes...</div>{:else if filteredClients.length === 0}<div class="panel empty-state">Nenhum cliente encontrado.</div>{:else}<div class="panel table-wrap"><table><thead><tr><th>Cliente</th><th>CPF</th><th>E-mail</th><th>Telefone</th><th>Ações</th></tr></thead><tbody>{#each filteredClients as client}<tr><td><strong>{client.name || 'Sem nome'}</strong></td><td>{client.cpf || '-'}</td><td>{client.email || '-'}</td><td>{client.phone || '-'}</td><td><div class="row-actions"><button class="table-action" on:click={() => openEdit(client)}>Editar</button><button class="table-action danger-action" on:click={() => remove(client)}>Excluir</button></div></td></tr>{/each}</tbody></table></div>{/if}
</section>

{#if showModal}<div class="modal-overlay" role="presentation" on:click={(event) => event.target === event.currentTarget && closeModal()}><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="client-modal-title" tabindex="-1"><div class="modal-header"><div><p class="eyebrow">DIRETÓRIO</p><h2 id="client-modal-title">{editingClient ? 'Editar cliente' : 'Novo cliente'}</h2></div><button class="modal-close" aria-label="Fechar" on:click={closeModal}>×</button></div><form class="modal-form" on:submit|preventDefault={save}><label>Nome *<input bind:value={form.name} required placeholder="Nome completo" /></label><label>CPF *<input bind:value={form.cpf} required maxlength="14" placeholder="000.000.000-00" /></label><label>Telefone *<input bind:value={form.phone} required placeholder="+55 11 99999-9999" /></label><label>E-mail (opcional)<input type="email" bind:value={form.email} placeholder="cliente@exemplo.com" /></label><div class="modal-actions"><button type="button" class="secondary-button" on:click={closeModal} disabled={saving}>Cancelar</button><button type="submit" class="primary-button" disabled={saving}>{saving ? 'Salvando...' : editingClient ? 'Salvar alterações' : 'Criar cliente'}</button></div></form></div></div>{/if}
