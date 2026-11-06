<script>
  import { onMount } from 'svelte';
  import { clearCart, getCart, removeCartItem, updateCartItem } from '$lib/cart.js';

  let cart = null;
  let loading = true;
  let error = '';

  async function load() {
    loading = true;
    error = '';
    try { cart = await getCart(); }
    catch (exception) { error = exception.message || 'Não foi possível carregar o carrinho.'; }
    finally { loading = false; }
  }

  async function changeQuantity(item, quantity) {
    if (quantity < 1) return;
    try { cart = await updateCartItem(item.id, quantity); }
    catch (exception) { error = exception.message || 'Não foi possível atualizar o item.'; }
  }

  async function remove(item) {
    try { await removeCartItem(item.id); await load(); }
    catch (exception) { error = exception.message || 'Não foi possível remover o item.'; }
  }

  async function clear() {
    if (!confirm('Limpar todos os itens do carrinho?')) return;
    try { cart = await clearCart(); }
    catch (exception) { error = exception.message || 'Não foi possível limpar o carrinho.'; }
  }

  onMount(load);
</script>

<svelte:head><title>Carrinho | Clínica</title></svelte:head>

<section class="page-stack"><div class="page-actions"><div><p class="muted">Itens selecionados pelo cliente</p></div><button class="secondary-button compact" on:click={load}>Atualizar</button></div>{#if error}<div class="notice error-notice">{error}</div>{/if}{#if loading}<div class="panel empty-state">Carregando carrinho...</div>{:else if !cart?.items?.length}<div class="panel empty-state">Carrinho vazio.</div>{:else}<div class="cart-layout"><div class="panel cart-items"><div class="panel-heading"><h3>Itens do carrinho</h3><button class="table-action danger-action" on:click={clear}>Limpar carrinho</button></div>{#each cart.items as item}<div class="cart-item"><div><strong>{item.product_name || item.name}</strong><small>{item.unit_price ? `R$ ${Number(item.unit_price).toFixed(2).replace('.', ',')} cada` : ''}</small></div><div class="cart-item-actions"><input aria-label={`Quantidade de ${item.product_name || item.name}`} type="number" min="1" value={item.quantity} on:change={(event) => changeQuantity(item, Number(event.currentTarget.value))} /><button class="table-action danger-action" on:click={() => remove(item)}>Remover</button></div></div>{/each}</div><aside class="panel cart-summary"><p class="eyebrow">RESUMO</p><h3>Total</h3><strong>R$ {Number(cart.total || 0).toFixed(2).replace('.', ',')}</strong><button class="primary-button" disabled>Checkout pelo backend</button></aside></div>{/if}</section>
