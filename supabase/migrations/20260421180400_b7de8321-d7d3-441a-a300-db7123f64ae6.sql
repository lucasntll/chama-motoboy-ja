-- Normalizar telefones: manter apenas 11 dígitos finais (DDD + número), removendo 55 extra
UPDATE public.establishments
SET phone = RIGHT(regexp_replace(phone, '\D', '', 'g'), 11)
WHERE phone IS NOT NULL;

UPDATE public.motoboys
SET phone = RIGHT(regexp_replace(phone, '\D', '', 'g'), 11)
WHERE phone IS NOT NULL;

-- Ativar todos os estabelecimentos existentes (estavam inactive impedindo login)
UPDATE public.establishments
SET status = 'active'
WHERE status = 'inactive';