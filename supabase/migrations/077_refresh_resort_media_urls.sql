-- 077_refresh_resort_media_urls.sql
-- Replaces expired Facebook CDN URLs (which expired on Nov 14, 2026 with 403 Forbidden)
-- with permanent, non-expiring HTTPS image URLs for all pre-populated Mabini dive resorts.
-- Also clears expired Facebook logo_url links so ResortLogoBadge renders crisp initials badges.

-- 1. Camp Netanya Resort & Spa
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Camp Netanya%';

-- 2. Eagle Point Beach and Dive Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Eagle Point%';

-- 3. Altamare Dive & Leisure Resort Anilao
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Altamare%';

-- 4. Aquaventure Reef Club
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Aquaventure%';

-- 5. Aiyanar Beach and Dive Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Aiyanar%';

-- 6. Solitude Acacia Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Solitude Acacia%';

-- 7. Planet Dive Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1512353087810-25dfcd100962?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1512353087810-25dfcd100962?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Planet Dive%';

-- 8. The Philip Ann Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Philip Ann%';

-- 9. Bentrina Diving Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Bentrina%';

-- 10. Amor Laut
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Amor Laut%';

-- 11. Saltitude Dive & Beach Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Saltitude%';

-- 12. Paradiso Rito
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Paradiso Rito%';

-- 13. Portulano Dive Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Portulano%';

-- 14. Vista Aplaya Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Vista Aplaya%';

-- 15. Vivere Azure
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Vivere Azure%';

-- 16. Pier Uno Dive Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Pier Uno%';

-- 17. Arthur's Place Dive Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Arthur%';

-- 18. Sea Spring Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Sea Spring%';

-- 19. Blue Ribbon Dive Resort
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
    photo_url = case when photo_url is null or photo_url ilike '%fbcdn.net%' then 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80' else photo_url end,
    logo_url = case when logo_url ilike '%fbcdn.net%' then null else logo_url end
where name ilike '%Blue Ribbon%';

-- 20. General fallback for any remaining establishment still holding fbcdn links
update public.establishments
set image_url = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
where image_url ilike '%fbcdn.net%';

update public.establishments
set photo_url = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
where photo_url ilike '%fbcdn.net%';

update public.establishments
set logo_url = null
where logo_url ilike '%fbcdn.net%';
