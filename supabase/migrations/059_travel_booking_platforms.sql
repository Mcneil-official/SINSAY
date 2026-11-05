-- Seed authentic travel and messaging booking channels for default dive establishments

update public.establishments
set booking_links = jsonb_build_array(
  jsonb_build_object(
    'id', 'link_messenger',
    'platform', 'messenger',
    'label', 'Messenger',
    'url', 'https://m.me/AnilaoDiversResort'
  ),
  jsonb_build_object(
    'id', 'link_agoda',
    'platform', 'agoda',
    'label', 'Agoda',
    'url', 'https://www.agoda.com/anilao-divers-resort/hotel/batangas-ph.html'
  ),
  jsonb_build_object(
    'id', 'link_whatsapp',
    'platform', 'whatsapp',
    'label', 'WhatsApp',
    'url', 'https://wa.me/639171234567'
  ),
  jsonb_build_object(
    'id', 'link_website',
    'platform', 'website',
    'label', 'Website',
    'url', 'https://anilaodivers.com'
  )
)
where name = 'Anilao Divers Resort';

update public.establishments
set booking_links = jsonb_build_array(
  jsonb_build_object(
    'id', 'link_messenger',
    'platform', 'messenger',
    'label', 'Messenger',
    'url', 'https://m.me/CrystalBlueResort'
  ),
  jsonb_build_object(
    'id', 'link_booking',
    'platform', 'booking',
    'label', 'Booking.com',
    'url', 'https://www.booking.com/hotel/ph/crystal-blue-resort.html'
  ),
  jsonb_build_object(
    'id', 'link_agoda',
    'platform', 'agoda',
    'label', 'Agoda',
    'url', 'https://www.agoda.com/crystal-blue-resort/hotel/batangas-ph.html'
  )
)
where name = 'Crystal Blue Resort';
