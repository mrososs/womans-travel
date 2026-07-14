-- Client requirement: the bank-transfer account holder is the business itself.
update public.bank_settings
set account_name = 'مؤسسة رحلات المستقبل الذهبي',
    updated_at = now()
where id = 1;
