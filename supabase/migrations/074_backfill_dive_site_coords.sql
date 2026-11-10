-- 074_backfill_dive_site_coords.sql
-- Backfills dive_sites coordinates with GPS-verified values.
-- Sources (highest trust first): waypointsdotph.com / waypoints.ph boat GPS
-- readings, LGU & UN-geonames entries, divers.world, Diveboard,
-- scubaspotadvisor.com, PADI, NOAA CREP survey extents.
--
-- Site NAMES are deliberately unchanged, so manifest dive counts
-- (dive_manifests.location = dive_sites.name), favorites, and deep links
-- are unaffected. Only lat/lng move.
--
-- Deliberately NOT touched:
--   * Twin Rocks Sanctuary  — DB value already matches boat GPS within ~170m
--     (kept as-is; catalog copy was the wrong one).
-- Unverified sites (Mermaid Rock, Diver's Sanctuary, Anilao Cove) are not
-- in dive_sites at all — the map renders only registered DB rows.

update public.dive_sites set lat = 13.7608,  lng = 120.9271 where name = 'Anilao Pier';
-- was 13.75 / 120.92 (~1.4 km SW of the town pier)

update public.dive_sites set lat = 13.7039,  lng = 120.8728
where name in ('Arthur''s Rock', 'Arthur’s Rock'); -- DB name uses U+2019 (’)
-- was 13.731 / 120.881 (~3 km NE; Sitio Balagbag, Brgy Bagalangit per LGU)

update public.dive_sites set lat = 13.72,    lng = 120.874  where name = 'Batong Buhay';
-- was 13.74 / 120.89 (on land; NOAA CREP survey bbox tops out at 13.7281 N,
-- and the MPA lies in Brgy Ligaya's Balayan Bay waters)

update public.dive_sites set lat = 13.7241,  lng = 120.8769 where name = 'Cathedral Rock';
-- was 13.7236 / 120.8804 (boat GPS at the cathedral buoy: 13.724117 / 120.876867)

update public.dive_sites set lat = 13.7223,  lng = 120.8759 where name = 'Eagle Point';
-- was 13.7223 / 120.88 (lng ~440 m east of the resort pier)

update public.dive_sites set lat = 13.8209,  lng = 120.9009 where name = 'Ligpo Island';
-- was 13.755 / 120.905 (~7 km SW; island is in Bauan waters — divers.world +
-- waypointsdotph barangay landing agree)

update public.dive_sites set lat = 13.8194,  lng = 120.9009 where name = 'Ligpo Pinnacle';
-- was 13.756 / 120.904 (wall site just off Ligpo Island per Reefwander/waypoints)

update public.dive_sites set lat = 13.6887,  lng = 120.9008 where name = 'Mainit Bubbles';
-- was 13.69 / 120.895 (bubble vents ~1 km NE of Mainit Point; distinct site)

update public.dive_sites set lat = 13.6823,  lng = 120.8932 where name = 'Mainit Point';
-- was 13.688 / 120.895 (divers.world + Reefwander "Mainit Corner")

update public.dive_sites set lat = 13.6865,  lng = 120.8958 where name = 'Secret Bay (Mainit Muck)';
-- was 13.69 / 120.9 (Secret Bay = Mainit Muck, south tip of the peninsula;
-- NOT Basura — Basura is a separate site near Anilao Pier)

update public.dive_sites set lat = 13.7578,  lng = 120.9242 where name = 'Siuli Reef';
-- was 13.6841 / 120.8906 (~8 km off; land POI + hotel proximity refs place
-- Siuli Reef off Anilao Beach Club, Brgy San Jose)

update public.dive_sites set lat = 13.6906,  lng = 120.8893 where name = 'Twin Rocks Sanctuary';
-- was 13.6904 / 120.8878 (~170 m; boat GPS 13.690567 / 120.889283 +
-- LGU/UN-geonames 13.69088 / 120.88910)
