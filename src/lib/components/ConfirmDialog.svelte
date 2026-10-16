<!-- A yes/no question in a dialog. Open it by setting `open`; it closes itself on either answer. -->
<script lang="ts">
  let {
    open = $bindable(false),
    title,
    message = "",
    confirm = "Yes",
    danger = false,
    onconfirm,
    onclose,
  }: {
    open?: boolean;
    title: string;
    message?: string;
    confirm?: string;
    danger?: boolean;
    onconfirm: () => void;
    /** Called however the dialog closes, answered or not. */
    onclose?: () => void;
  } = $props();

  let dialog = $state<HTMLDialogElement>();

  $effect(() => {
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  onclose={() => {
    open = false;
    onclose?.();
  }}
>
  <h2>{title}</h2>
  {#if message}<p class="muted">{message}</p>{/if}
  <div class="row">
    <span class="spacer"></span>
    <button class="btn btn-quiet" onclick={() => (open = false)}>Cancel</button>
    <button
      class="btn {danger ? 'btn-danger' : 'btn-primary'}"
      onclick={() => {
        open = false;
        onconfirm();
      }}>{confirm}</button
    >
  </div>
</dialog>
