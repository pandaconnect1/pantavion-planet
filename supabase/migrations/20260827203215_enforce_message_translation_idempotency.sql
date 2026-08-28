create unique index if not exists messages_sender_client_id_unique_idx
  on public.messages(sender_id, client_message_id)
  where client_message_id is not null;