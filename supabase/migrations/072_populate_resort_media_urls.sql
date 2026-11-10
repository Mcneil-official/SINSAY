-- 072_populate_resort_media_urls.sql
-- Adds logo_url column to establishments, removes Buceo Anilao, renames Eagle Point,
-- and updates Mabini dive resorts with their official cover photo (image_url),
-- logo/avatar (logo_url), and verified contact information.

-- 1. Schema Update
alter table public.establishments
  add column if not exists logo_url text;

-- 2. Cleanup: Remove Buceo Anilao Beach & Dive Resort
delete from public.establishments
where name ilike '%Buceo Anilao%';

-- 3. Rename Eagle Point to official name
update public.establishments
set name = 'Eagle Point Beach and Dive Resort'
where name ilike '%Eagle Point%';

-- 4. Populate Media URLs & Contacts for Mabini Dive Resorts

-- 1. Camp Netanya Resort & Spa
update public.establishments
set image_url = 'https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/486375461_1072652344889277_947795348170795983_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFuqDLnlBQQ-nYKU7q64RThsn-qLv-8xu-yf6ou_7zG7yUcN7gHj8L_QjGoSGXBuzGe5tPtVElv_DbxIfnLOnqN&_nc_ohc=5DWJkA3aIDwQ7kNvwFB7qee&_nc_oc=AdrYjXnBPbZLDo-nJuVy1wEmTZj-z3LD4jjDVbCKJzDfL0tjaMx5BOBotixuM2NxuSo&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=NOrXKnMFR4bfmH7lJ0d1HQ&_nc_ss=7b2a8&oh=00_AQTRcoXGYUmmLLGL63dQlbXSKrtfLupxdffv5xgXkvYbLQ&oe=6AF854BE',
    logo_url = 'https://scontent.fmnl17-7.fna.fbcdn.net/v/t39.30808-6/587239062_1271612108326632_5225715965126170736_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x1024&ctp=s1024x1024&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeG9HYJo33sBb5qKpvYn7FL4lT6HbpkUBiSVPodumRQGJLBOebb0SA16DCW6MSJomz7EyxdFTeWkdax2732kTs3f&_nc_ohc=Wocd9jz7fIoQ7kNvwFnpjrm&_nc_oc=AdpZpdmPbJeUHh8DbrZLh2qGUG9NAzGInmHL5JXlh2QY1se71kgcgbpNXkNW0QIjvfQ&_nc_zt=23&_nc_ht=scontent.fmnl17-7.fna&_nc_gid=YtQXfeIzt57SuvRzdjJwDA&_nc_ss=7b2a8&oh=00_AQTkecP8l-UXJHxAMt4OGOClmTWHTXkeemR7zOVBemu89Q&oe=6AF856FA',
    phone = '0927 895 4092',
    website = 'http://campnetanya.com.ph/',
    facebook = 'https://www.facebook.com/campnetanya'
where name ilike '%Camp Netanya%';

-- 2. Eagle Point Beach and Dive Resort
update public.establishments
set image_url = 'https://scontent.fmnl17-4.fna.fbcdn.net/v/t39.30808-6/486321523_9987946744570923_6106106329576027209_n.jpg?stp=dst-jpg_tt6&cstp=mx960x640&ctp=s960x640&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHpFt-Sy7kL8XRpukpSicUdD8LnXpByb74PwudekHJvvgYfMfyVfC9NTFzo9EoUU5qAKL1Y_V6bsWa6ZfwFX4pJ&_nc_ohc=-HBPIVsIqS8Q7kNvwHt_0VQ&_nc_oc=Adq8roz2US5zA7I7tBWIgF_G9bnfMeq1PLOgyNx--Vttjc5DSB7S_CG2pXbV-JFZpF8&_nc_zt=23&_nc_ht=scontent.fmnl17-4.fna&_nc_gid=kibA6xqKhXNHyEtJSci4Sg&_nc_ss=7b2a8&oh=00_AQRyNp9-3aq87lszBysoJBcKQ1ayZgpItBbiSxC8mAUh4w&oe=6AF88530',
    logo_url = 'https://scontent.fmnl17-8.fna.fbcdn.net/v/t39.30808-6/327218653_570635128046355_3303153511395818241_n.jpg?stp=dst-jpg_tt6&cstp=mx920x920&ctp=s920x920&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGX8oLxx_Y_kg00c37rxGc3X1wacBaOMlhfXBpwFo4yWIWAnxkNIEz0iByXr-PpLTaSXiFl_vwXcNGGHqd8TzgB&_nc_ohc=Ol3S1IXix44Q7kNvwFwQK7E&_nc_oc=AdpteEM_eZpNYIldInNo6uJYivXEm5rCE-KEsbLjvOgnsctVEkdpdTiepCAt5OFShrE&_nc_zt=23&_nc_ht=scontent.fmnl17-8.fna&_nc_gid=4OgeRGyHI8MovrJwOHT5Pg&_nc_ss=7b2a8&oh=00_AQRojTBQM8TUqt6TVPSskFzl9b4ogRMu3fSUWe_f0YGFQg&oe=6AF87D75',
    phone = '0917 846 3958',
    website = 'http://www.eaglepointresort.com.ph/',
    facebook = 'https://www.facebook.com/eaglepointbeachanddiveresort'
where name ilike '%Eagle Point%';

-- 3. Altamare Dive & Leisure Resort Anilao
update public.establishments
set image_url = 'https://scontent.fmnl17-4.fna.fbcdn.net/v/t39.30808-6/475763277_1186501996818065_6106055726007537308_n.png?stp=dst-png&cstp=mx2659x984&ctp=s960x960&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHyHja_phcb5sIqP5vMVP-bUiT7YTAT2-tSJPthMBPb6yEx1HpCvNsu1q8nDVrG2ItiOkv1MSby-_YIRBHdINBg&_nc_ohc=sRbt7u6ho1gQ7kNvwE2B_CT&_nc_oc=Adogx2mTlVDSdQ-C2Jk5zZHZev1gSQ7-SKLhiL6Hdwy7KJvUeHFE0ntyf_euJW7UECg&_nc_zt=23&_nc_ht=scontent.fmnl17-4.fna&_nc_gid=xfFeX7qQTJXtRBGK7eka7Q&_nc_ss=7b2a8&oh=00_AQRAnFeFJpdGxv05DO9fC-szWSTYO8FDSRXiZGUKtldkqg&oe=6AF86D75',
    logo_url = 'https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/331000508_1170283113628048_1251866777329881306_n.jpg?stp=dst-jpg_tt6&cstp=mx1081x1081&ctp=s1081x1081&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeETyUE95RtnYC_Rga61VpaOEEzcVqJJsbUQTNxWokmxtWx22avGX2ZrMw-MTmwLb_KWXc6mDqlanOdxw-XmHYZL&_nc_ohc=OGPS7KXgnPgQ7kNvwHJi7R1&_nc_oc=Adq4SIVRRL-ZpY9etw73SbJf6ZhTxp6OJpA7odmFr0tX6bm9ryIzn5ZXrQdAeMo3wYE&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=z2AeGdvvhZPZHo6UYo0lOg&_nc_ss=7b2a8&oh=00_AQREx9J8JI9GkepQngDJCz1DDw9VNAWoaT_rWm0Vr8Po8g&oe=6AF87902',
    phone = '0916 691 9222',
    website = 'http://www.altamare.com.ph/',
    facebook = 'https://www.facebook.com/altamareresort'
where name ilike '%Altamare%';

-- 4. Aquaventure Reef Club
update public.establishments
set image_url = 'https://scontent.fcgy2-4.fna.fbcdn.net/v/t51.82787-15/564515838_18516943486064006_269757752742929607_n.webp?stp=dst-jpg_tt6&cstp=mx1440x1440&ctp=s1440x1440&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFsS06JeHwdYmJtmg3Y07PVEUQ1j87wnIURRDWPzvCchaZxZW_WZPZBrcb3jn8l72KuutlMrmH0rFE8NhHT9qyb&_nc_ohc=C-Q4l_VI15gQ7kNvwHa-FmC&_nc_oc=AdpjvGD9f9xxTzGlloLBGPzZrKFxdJrhvegnqN2zpUIoVMNKdlXMxAN9Wr5PFKUJjFw&_nc_zt=23&_nc_ht=scontent.fcgy2-4.fna&_nc_gid=b58ytRxpChAlL5KDuUAAlA&_nc_ss=7b2a8&oh=00_AQTBX82OEsC9sKWmtxI3seLLUMbR4pKcJnc833uSuaV5TA&oe=6AF89A79',
    logo_url = 'https://scontent.fcgy2-2.fna.fbcdn.net/v/t39.30808-6/309028326_483620033781243_7838150704797910096_n.jpg?stp=dst-jpg_tt6&cstp=mx761x761&ctp=s761x761&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFzaMsR1_YlwxYEdCssMtBQ3QEW4C_j9U_dARbgL-P1TxXjTsJrDP3SOzn8Fmm7x7lg4CE2P89NM1gYm2PF2BzO&_nc_ohc=jIOSdbBIOHUQ7kNvwEgaejQ&_nc_oc=AdqDJzE0vcBWoSQoqbuLaiJEMCtAWqFHkBXUJ_oQE1fYkH4LNIEVFVw7RVsFgrtnlxY&_nc_zt=23&_nc_ht=scontent.fcgy2-2.fna&_nc_gid=P2v8WAnrNjGXN9-LLOuwOQ&_nc_ss=7b2a8&oh=00_AQRa0wmipCkYCTqTjBQQa7-9mLKN2WBvJ77lFaKx8OjIzw&oe=6AF89777',
    phone = '0939 924 6488',
    website = 'https://www.aqua-venture.com/',
    facebook = 'https://www.facebook.com/aquaventurereefclub'
where name ilike '%Aquaventure%';

-- 5. Aiyanar Beach and Dive Resort
update public.establishments
set image_url = 'https://scontent.fcgy2-3.fna.fbcdn.net/v/t39.30808-6/486790068_1060977839398474_1185172687591118017_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1153&ctp=s960x960&_nc_cat=107&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEboh6e2vOuXrzkMS5HGeW730XIWARHtZffRchYBEe1l5BdoesiKMC21TXixXupTA4JBrOH5-95ZDMnH0CCUwCX&_nc_ohc=40WHIdnDo74Q7kNvwH2jLkJ&_nc_oc=AdpdXzs4fUGUgZiK-jFpBhOxL4HDAf_eXmDoEX69J9iE6tTgGohd1_kzuZlqQRf0Ans&_nc_zt=23&_nc_ht=scontent.fcgy2-3.fna&_nc_gid=Sx-4Oe1IR1o6vA_z5sB5gA&_nc_ss=7b2a8&oh=00_AQQraWpoC0dikDQxSTA3MMSXuktgVCOINOPnS9xRon7T0g&oe=6AF868A3',
    logo_url = 'https://scontent.fcgy2-4.fna.fbcdn.net/v/t39.30808-6/452862478_883942120435381_7774350060786131246_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHvzagvakiY9cFStB12vwjfoz6Z1zf61fujPpnXN_rV-0uGn-upfMMjCDa4BuH-wQc_tEi4gZn9VYHaW0IS0TQg&_nc_ohc=MmOkMfw4Do0Q7kNvwH-VYSL&_nc_oc=AdoRAczBLfojKrEj0aAP8EZzvsjk96GKYWZhIgewrN7YLDJ9IdSfOP9MVDCQvKFBxlE&_nc_zt=23&_nc_ht=scontent.fcgy2-4.fna&_nc_gid=me7FKPAIFoWldO8qGM86cA&_nc_ss=7b2a8&oh=00_AQQ2UYrXrh6MSOyBzoQVu9XJf6zsYJrTQXVuJjmXM9vGJw&oe=6AF87814',
    phone = '0917 883 1428',
    website = 'http://www.aiyanar.com/',
    facebook = 'https://www.facebook.com/AiyanarAnilao'
where name ilike '%Aiyanar%';

-- 6. Solitude Acacia Resort (No logo provided - fallback to initials badge)
update public.establishments
set image_url = 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/298927157_5293693547418276_2004401934041874327_n.jpg?stp=dst-jpg_tt6&cstp=mx1085x1085&ctp=s1085x1085&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGEP2GA1lDonsNXjhdQIgLSQIclDKC0iIdAhyUMoLSIhxIsbquUdHapfK37NL2umzz31U1VeM2pRjeg2a1IFZn0&_nc_ohc=q2oKakds3fkQ7kNvwEJ7DUb&_nc_oc=AdqPoWtmmmDqN8g2Q68ve3doRvZsQNgKylL4GpL3GRdpiRI8pnMsYFuZOlQo3hHVBeY&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=G-RDmfSQ7afXMruKJ8T8mw&_nc_ss=7a2a8&oh=00_AQQaXBFeD_u_oek7WEGhM18CsWCe1gZwwvOaXZKKCc1GyA&oe=6AF882C4',
    logo_url = null,
    phone = '0966 200 2941',
    website = 'https://solitude.world/',
    facebook = 'https://www.facebook.com/SolitudeAcacia'
where name ilike '%Solitude Acacia%';

-- 7. Planet Dive Resort
update public.establishments
set image_url = 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/481333237_8876738815765420_2772935053642187597_n.jpg?stp=dst-jpg_tt6&cstp=mx2050x780&ctp=s2050x780&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeECm6yL-b-cQ-4QlNav5532evfnMQxDYh569-cxDENiHkG5p0b_9_MX-ghqqvKSDYYi7CA8iwNwO65g57R45q1P&_nc_ohc=N7WWs6Ll1CQQ7kNvwG0cxvH&_nc_oc=AdrBfIzY5vS74NwlifrOtsKNRl3UiaRplZpor-u3hhUeY0Uqjacnej_RYJPtxYo7owI&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=zstm4HSsu4JjlbFwDpHaNA&_nc_ss=7b2a8&oh=00_AQSkZ_gRPo7b82uACxL7My_Ct3zTv_ozkDiKsT0zcL1D9g&oe=6AF88FE6',
    logo_url = 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/272452483_4488230617949617_4256815613495753653_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s1080x1080&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeF6DMHfW7O11VKOjUChTrAcYDVQQYPzzh1gNVBBg_POHehzh9Wi2XBfs5f4GQkf1-q8wlT6Z22Yjl3nUKM4kIrx&_nc_ohc=OnrGLC8OQ9cQ7kNvwH7afMD&_nc_oc=AdqBavsUxLzcl789E0I8FzhcKg-vLE4DSke8PKh1jNS6uV6ntg1Y1U6QC_exB76JjjY&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=pwqaG34h8aOuyifHeXWQ-g&_nc_ss=7b2a8&oh=00_AQTWzpe_qf3uq54LFOqVWaG6fq5NlLA0jV9t9rJ0ANuERQ&oe=6AF86986',
    phone = '0916 704 3718',
    website = 'http://planetdive.com.ph/',
    facebook = 'https://www.facebook.com/planetdiveresort'
where name ilike '%Planet Dive%';

-- 8. The Philip Ann Resort
update public.establishments
set image_url = 'https://scontent.fcrk3-3.fna.fbcdn.net/v/t39.30808-6/481480382_657184970165352_5519932722880451621_n.jpg?stp=dst-jpg_tt6&cstp=mx1280x960&ctp=s1280x960&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGuYPzqTyhMdKUGiqH5fJMdmU6NuuMy6CSZTo264zLoJK1U6hMjlbDdTq67aizSQYhkSlnsXHfqJHn_8nMDKgNC&_nc_ohc=oZm-4wP0OzMQ7kNvwFSQboi&_nc_oc=AdrzVZb1R-myLAHsaqf5dU2bf7kOHXypcL3alZR_6uO5jWBE_JxnZxV8zX16zxU6Aqc&_nc_zt=23&_nc_ht=scontent.fcrk3-3.fna&_nc_gid=iMIQiOOnOIJb1WlvUx3b5A&_nc_ss=7b2a8&oh=00_AQTFiaurFPDmvPOl2v53FPGFRZyjMVOpslTMtGcu1NbTTQ&oe=6AF88EAD',
    logo_url = 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-6/273218816_138084728679169_3979358543503474867_n.jpg?stp=dst-jpg_tt6&cstp=mx1660x1667&ctp=s1660x1667&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHUYSwVO0rt1V4vm3zxWhReGXcOqGaj0oMZdw6oZqPSg1-SDHZRf0nOqWzo9LpRXJ7-a7hfIEgsAHgadk23Z9ld&_nc_ohc=3-NeCvvTuEkQ7kNvwErr00M&_nc_oc=Adq2u8OB_qhLMyDYZK_LXSPISzQ3jStYRNyVuXEOe-hpz_PQ06bM55o5d5nl22VNb_0&_nc_zt=23&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=_k2juVjno5No42X2V1Cztg&_nc_ss=7b2a8&oh=00_AQSLvLBaDcblmZJgO0uHaL-ESkhJ3TpMP0l4vM9FtzoVhg&oe=6AF88428',
    phone = '0915 933 5633',
    website = 'https://www.thephilipannresort.com/',
    facebook = 'https://www.facebook.com/1pjhphilipannresort'
where name ilike '%Philip Ann%';

-- 9. Bentrina Diving Resort
update public.establishments
set image_url = 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/474624259_999031675580345_8432458935485121518_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1536&ctp=s960x960&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGHYtzZi1NaQ9si2xwHt69su-85NnBlNiy77zk2cGU2LFOYzNdk85gbBdDafJsUFUz6nMdtVTW3Xii0x2Lq3jE8&_nc_ohc=vVyaNrt5-lIQ7kNvwHKmHEF&_nc_oc=AdrdWcfjPE7ZIt6L65SfbtXNz_kwsawKMBZA3qdC0AhnibaloElvGvx_1KcZIO11P9o&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=xRsmMjL0wPcoAfut9Vew3A&_nc_ss=7b2a8&oh=00_AQSXwmz1851o9CAXci91DkeJrO96CjIScVswBKwTsdq6mA&oe=6AF896F4',
    logo_url = 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-1/658827776_1339928058157370_4157308363252341083_n.jpg?stp=dst-jpg_tt6&cstp=mx1792x1792&ctp=s200x200&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=2d3e12&_nc_eui2=AeHKq6DwDkM4TLSt2VlzYxkvF5ROZ4JdrqcXlE5ngl2upxWsKJTYNxd4r-EApoCK6st5EAeK85d47guW4-8_ZmmU&_nc_ohc=QKwY537fd3MQ7kNvwEEl1-k&_nc_oc=AdorEDMvc_jSe7l6GyUODZ1jTsWwrra8rES7QS39b-XcTnfTNzYElc5BFiq1gzns_AM&_nc_zt=24&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=xRsmMjL0wPcoAfut9Vew3A&_nc_ss=7b2a8&oh=00_AQREQ6X7J1slAtTfvBKUckFrgjjxtfXtYYLC4hQxVhEwUQ&oe=6AF87DE9',
    phone = '0976 363 2424',
    website = 'https://www.bentrina.com/',
    facebook = 'https://www.facebook.com/bentrinaresort'
where name ilike '%Bentrina%';

-- 10. Amor Laut
update public.establishments
set image_url = 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-6/615930217_122093499393232519_924081617315974795_n.png?stp=dst-png&cstp=mx820x360&ctp=s820x360&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGVPht9yS8lLcZ2HhtnuLJC93ZhfhBUpJz3dmF-EFSknBlhh4avVSWU6_t76TuyhQskv-Ukjbz3Ijo5LGPENzUm&_nc_ohc=xv8iRNrBMgMQ7kNvwE2o69c&_nc_oc=Adry2BXUpL5IsUCmnysQRIwR46hzf8AOjaocKffWCd5NFIpMWrCtLjKIES9Zmvs3zSg&_nc_zt=23&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=p_WjMkPCSg_DKSp5DQqeig&_nc_ss=7b2a8&oh=00_AQT4lf8XM7SfQlxIgLrdilcElKN9FjDydgAFAXXXwET0aQ&oe=6AF87922',
    logo_url = 'https://scontent.fcrk3-1.fna.fbcdn.net/v/t39.30808-1/616040467_10228727754888782_5996157034759117307_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1000&ctp=s200x200&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=2d3e12&_nc_eui2=AeGKe3uKhVDrfbk3U_pgg7RBaocGtjCrIJdqhwa2MKsglz3fEas2YxA1NH0J6gJuEb2gpb5cQVfwgyoIPKwA_9I3&_nc_ohc=lEUHhumeDO4Q7kNvwEZWOaV&_nc_oc=AdqBB9Isi0Kd4PDTdndXTpkzATAeq-wLJ4HQPw2fY0v_sHD26xQo43-Yxu4fqO6paWs&_nc_zt=24&_nc_ht=scontent.fcrk3-1.fna&_nc_gid=p_WjMkPCSg_DKSp5DQqeig&_nc_ss=7b2a8&oh=00_AQTrhoq--4-PfW4EwCKpurMUtfydhT722TWA3QhCpzkY9w&oe=6AF87A83',
    phone = '0917 108 7451',
    website = 'https://www.amorlautresort.com/',
    facebook = 'https://www.facebook.com/amorlautresort'
where name ilike '%Amor Laut%';

-- 11. Saltitude Dive & Beach Resort
update public.establishments
set image_url = 'https://scontent.fcrk3-3.fna.fbcdn.net/v/t39.30808-6/548258915_1302819038522423_4083472316127921106_n.jpg?stp=dst-jpg_tt6&cstp=mx1600x639&ctp=s1600x639&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEZWZVsF_R8iGwuy_18n9A-tp0V-uCwWte2nRX64LBa18XWMGTXZY2kiCOz-VmxHRwpjyxIaI4PZpuxKIx247sI&_nc_ohc=mI4-I8wEgAYQ7kNvwHnnDrF&_nc_oc=Adqz8MwWvVJ3_VhFFcI3-5OMjOW_xvDuNcXMPvQtOYGiUmMb7jc1vWgSoSZpSN6NiAg&_nc_zt=23&_nc_ht=scontent.fcrk3-3.fna&_nc_gid=4URpifilnEvp2aZ--J5nbA&_nc_ss=7b2a8&oh=00_AQSxpk5MK5SZvVcbh9ZgO1Fic7YSSSiIRgvqFRA0zj9d-A&oe=6AF8966B',
    logo_url = 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/606444828_1396527059151620_7568899151324333291_n.jpg?stp=dst-jpg_tt6&cstp=mx720x720&ctp=s720x720&_nc_cat=101&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFPdM3PgpPpL_ZqtwZ7FdonfOFbQKxszQ984VtArGzND8YluWcQL8F8GjSOScmMX2Rvy0XFMpuP3ouR5e74EzhC&_nc_ohc=PGXG8QvHPIIQ7kNvwFDRiOZ&_nc_oc=AdqeENJervJejgN_YMzc4y_Dp486ingvWW_ybMPxRhDyAQQLw7_CsochradKXr-xdQU&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=0iI_6wcy9zrpQ-dlD8cljw&_nc_ss=7b2a8&oh=00_AQQOxvpZ5gQqR8l7D3LPdW3qrZwmosCBGKGtJV9w77Zk2Q&oe=6AF89FDE',
    phone = '0917 109 8812',
    facebook = 'https://www.facebook.com/profile.php?id=100063830172974'
where name ilike '%Saltitude%';

-- 12. Paradiso Rito
update public.establishments
set image_url = 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-6/561919048_1398560852277269_2907266908909172835_n.jpg?stp=dst-jpg_tt6&cstp=mx850x315&ctp=s850x315&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=86c6b0&_nc_eui2=AeFWAyDvikFQpOExuJaQHlfh-8OIC5-d4ab7w4gLn53hpn7eJZ5TE7kly4lxfDy1AgQ2y1ZLvQdurmJ9Mmscz62H&_nc_ohc=JtC0B8gJ-2sQ7kNvwEdhv9r&_nc_oc=AdoniWYD0_ed0mVcv6r7z0rwhfKyqb3tfP7OInQkDqNBAf8NxKGu8Q4BSDQPQZpKsd8&_nc_zt=23&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=IIR9iQIH91jyTUczVufWPQ&_nc_ss=7b2a8&oh=00_AQRaF9UP578cys0fpLPrVhHA_9VDi3fvYsLtewtF7U7VSg&oe=6AF86A26',
    logo_url = 'https://scontent.fcrk3-1.fna.fbcdn.net/v/t39.30808-6/464203103_1089946663138691_2188769566225356927_n.jpg?stp=dst-jpg_tt6&cstp=mx811x810&ctp=s811x810&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEe8omHp-U-fimm8ifHueJs5DgByivDxgDkOAHKK8PGAMmgdgJAlhQ_08tSSjF_O8On63w6H4I_XOpuk8hQlAmu&_nc_ohc=v-gJEc8L8qgQ7kNvwHTOo_e&_nc_oc=Adod_ljR08GGKNrfVRru-odplZjQJ_EQSufAaQ1zp_l4qD1IeUzK2lSDZddpRt7w7hc&_nc_zt=23&_nc_ht=scontent.fcrk3-1.fna&_nc_gid=3VJClhcrDK7nNFn9ZZz9YQ&_nc_ss=7b2a8&oh=00_AQRwymyLgnxodezSDX06OI1B_iPygni9GVUiaMSPyYAaSg&oe=6AF88813',
    phone = '0928 420 5438',
    website = 'https://paradisorito.com/',
    facebook = 'https://www.facebook.com/ParadisoRito'
where name ilike '%Paradiso Rito%';

-- 13. Portulano Dive Resort
update public.establishments
set image_url = 'https://www.portulano.com/images/portulano-reef-view.jpg',
    logo_url = null,
    phone = '+63 917 540 4257',
    website = 'http://www.portulano.com/',
    facebook = 'https://www.facebook.com/portulanodiveresort'
where name ilike '%Portulano%';

-- 14. Vista Aplaya Resort
update public.establishments
set image_url = 'https://vistaaplayaresort.com/images/vista-aplaya-hero.jpg',
    logo_url = null,
    phone = '+63 917 669 1222',
    facebook = 'https://www.facebook.com/vistaaplayaresort'
where name ilike '%Vista Aplaya%';

-- 15. Vivere Azure
update public.establishments
set image_url = 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/856939490_1577289474424448_1660928548533681695_n.png?stp=dst-png&cstp=mx1640x924&ctp=s960x960&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEqYe17KvhxBKxODYevxjnESpmPLpL3-KxKmY8ukvf4rN9U3LCmxx4EkYxsTjYMiKJtX25pS04YgmLdrp7rD2As&_nc_ohc=sqZXkPQv0b0Q7kNvwFYY7kh&_nc_oc=Adqh9dDtl84y9qvbUZzo3gwD9EspCjDvdCDUYI9RUq3ibvSsGjjOGkzTmUto8VwOEVs&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=VzNx6jGqZ8yyEAL8m-ybhg&_nc_ss=7b2a8&oh=00_AQQAJZDrP7r2eIbFzD6WLheHulxzNOcsZOrsALB6avkJWQ&oe=6AF873C3',
    logo_url = 'https://scontent.fcrk3-1.fna.fbcdn.net/v/t39.30808-6/582767732_1286256126861119_7799279999388314252_n.jpg?stp=dst-jpg_tt6&cstp=mx500x500&ctp=s500x500&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFMgWiv3P6Cd6gFHgjnUsFPwsSmsm0MED3CxKaybQwQPRXWYn2Bjnn_m_3Mrg96OgIq-y6edxq-pyRCY-Y-dasD&_nc_ohc=dkRcmFH_oA4Q7kNvwFa2cel&_nc_oc=Adq0VqK7CHe1NvCqJCrRRZtdnXvkJ_ktWff98CgR0waq88rf9sS3Jx25b_-86f9pbjU&_nc_zt=23&_nc_ht=scontent.fcrk3-1.fna&_nc_gid=HaU1dHFWGUtE00sZye4gNw&_nc_ss=7b2a8&oh=00_AQSPHMXDJ3qtR092o69y74Iwook-1jGTbiBw99_Dvdof4A&oe=6AF8892E',
    phone = '+63 2 8771 7777',
    website = 'https://vivereazure.com/',
    facebook = 'https://www.facebook.com/vivere.azure'
where name ilike '%Vivere Azure%';

-- 16. Pier Uno Dive Resort
update public.establishments
set image_url = 'https://scontent.fcrk3-1.fna.fbcdn.net/v/t39.30808-6/479362634_1093900906085927_7342592545443043606_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1365&ctp=s2048x1365&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHzNrMLNbxuUmFdGErh7tDetuYat53_E-a25hq3nf8T5s4-SKFAj7T4E4v0Jx-ou4T-RckDBd5KxFBGdJm7AEMk&_nc_ohc=DGrxr6Eo6icQ7kNvwFmudfk&_nc_oc=AdoHSoqHCT244LkW09JYprNXdE8dJh08SSKZ-G15w6cyj4qMLixrB7aUBJCyv-dnTJE&_nc_zt=23&_nc_ht=scontent.fcrk3-1.fna&_nc_gid=cfPDmz_23jxoXVkaGJYfow&_nc_ss=7a2a8&oh=00_AQQswNN34oR_gMmdysH4V-EYVgKY5O3VeTCA3EERnv-MdA&oe=6AF886FD',
    logo_url = 'https://scontent.fcrk3-3.fna.fbcdn.net/v/t39.30808-6/304858813_470684458407578_4968840164843642754_n.jpg?stp=dst-jpg_tt6&cstp=mx958x958&ctp=s958x958&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeE_ExDZqZs4l-BHH_rtaPCwTGaYSLGlVypMZphIsaVXKiuv77zyJO9oZPwo5f6Vha4uMZ6dxCsz4UpJ_-qV3kyp&_nc_ohc=4WCJX2ZPulAQ7kNvwGJyxIa&_nc_oc=Adqiu2VT7OwW4BzDNpRXGknRrw-ofIgh3d7HcR02btCZKE2Ui52iS8WQfrTGaS0d5Cg&_nc_zt=23&_nc_ht=scontent.fcrk3-3.fna&_nc_gid=Nt3csg7Gz_ry6Pwx4YVQew&_nc_ss=7b2a8&oh=00_AQScyemhlECNaSbfJNvOFFEVP2iH8sJAu8q_YFPJhpcAdg&oe=6AF88208',
    phone = '0917 808 1877',
    website = 'https://pierunodiveresort.com/',
    facebook = 'https://www.facebook.com/pierunodiveresort.ph'
where name ilike '%Pier Uno%';

-- 17. Arthur's Place Dive Resort (No logo provided - fallback to initials badge)
update public.establishments
set image_url = 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/292350327_449757850488567_7622841057531360150_n.jpg?stp=dst-jpg_tt6&cstp=mx958x960&ctp=s958x960&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeH3Ul7tSfkpRhWqiA1sCRoVpjCnow9DKUumMKejD0MpSwIESu-YuybFjQPkDWbql00LLAKPanUVe1cR7irtMmwz&_nc_ohc=X1a9EChYQyUQ7kNvwHW-grQ&_nc_oc=AdraaGiY3zH5cV4Mg5xbO1jKvTQM1a5UfSZDDRqCYE83VAhuILXGOR6oh828nc-eQUA&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=hkmRtdnUn2n0Iuc4WHem0Q&_nc_ss=7a2a8&oh=00_AQTZglwc4qHWvPgzDnk3Yo-ZMiStxtkOIZu8Zl5uGrANPw&oe=6AF88AA8',
    logo_url = null,
    phone = '0917 777 9341',
    website = 'https://www.arthursplacediveresort.com/',
    facebook = 'https://www.facebook.com/arthursplacediveresort'
where name ilike '%Arthur%';

-- 18. Sea Spring Resort (No logo provided - fallback to initials badge)
update public.establishments
set image_url = 'https://scontent.fcrk3-1.fna.fbcdn.net/v/t39.30808-6/486170778_1079026230930075_421883258370683482_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1536&ctp=s2048x1536&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeE7JL2uXiuYy7Bu-IsS380yq2k6CTd7cleraToJN3tyV1r2vIsQp9c5DT_d0KfnDtRgxeTdOQdUshhajjrKnH8e&_nc_ohc=17rESu_s5G8Q7kNvwHu3xix&_nc_oc=AdokABE66DuFTvwlngvC0gBQyrtq7dpDn5TksBH1XXOSFS0fciVe0ipij1Nifh-inIU&_nc_zt=23&_nc_ht=scontent.fcrk3-1.fna&_nc_gid=_k3chJu_wBGUyDNjqDhLQw&_nc_ss=7b2a8&oh=00_AQSCzgxRIeBnVcnEsOhhmj5jHL84lBGCa5Ntr5BSfpBMuQ&oe=6AF89818',
    logo_url = null,
    phone = '0917 564 8085',
    facebook = 'https://www.facebook.com/seaspring'
where name ilike '%Sea Spring%';

-- 19. Blue Ribbon Dive Resort
update public.establishments
set image_url = 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-6/486613235_1064232755729385_5573979953265691326_n.jpg?stp=dst-jpg_tt6&cstp=mx960x364&ctp=s960x364&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeFK_dE_UiM2oucoZ9cdzezhezfgNlYwmBp7N-A2VjCYGi764ArDOj5gTtJhCDXzsw6Qbkd-a7O-T9wa7MMPlSta&_nc_ohc=EdNAe4xEixIQ7kNvwGxoTRR&_nc_oc=AdrZOEbrVkS04ZWjkoWz0RUIIC8yVCYtc2kRSEM1a88C2G3Cspwt8aMkMUNtZBnfFuA&_nc_zt=23&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=nDVwsuDju0pABd_YGf-0pw&_nc_ss=7b2a8&oh=00_AQRZJy3_FWmwZ2AgkCcqw9QPvpZFys_3QKnwtdMpax7ROA&oe=6AF89717',
    logo_url = 'https://scontent.fcrk3-3.fna.fbcdn.net/v/t39.30808-6/425834134_787994366686560_7405274588685600039_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s1080x1080&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeH5nLgbL8sdtDlX74iN65j5BaqvQL6O5vwFqq9Avo7m_J38IthUvIT_XTydp3hTv1Egou3vxaXejAo-G-f9-GLj&_nc_ohc=GxZzZPWJJxgQ7kNvwHZQ9cQ&_nc_oc=Adr_83g3uRPuMnYzSHuukAAJcNtlBUZ2ZB5SQvvlaJDtDLaEBRdhXqEfqPUsvPYXD30&_nc_zt=23&_nc_ht=scontent.fcrk3-3.fna&_nc_gid=unyACGhFEkGsGeBxpdkH-g&_nc_ss=7b2a8&oh=00_AQTR1EKQwfgOH4vee0O7rkdDtVRnpZc9_xL_WfUmnKelKQ&oe=6AF8A24C',
    phone = '+63 917 893 2719',
    website = 'https://blueribbondivers.com/',
    facebook = 'https://www.facebook.com/Blueribbonphilippines'
where name ilike '%Blue Ribbon%';

-- 5. Update sync trigger to preserve logo_url on application approval
create or replace function public.sync_operator_application_public_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_avatar_path text;
  v_target_est_id uuid;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  select t.email, t.avatar_path
  into v_email, v_avatar_path
  from public.tourists t
  where t.id = new.tourist_id;

  -- 1) Explicit establishment_id from application
  if new.establishment_id is not null then
    v_target_est_id := new.establishment_id;
  else
    -- 2) Match by name & location on an unclaimed listing (case-insensitive)
    select e.id into v_target_est_id
    from public.establishments e
    where lower(trim(e.name)) = lower(trim(new.resort_name))
      and lower(trim(coalesce(e.location, ''))) = lower(trim(coalesce(new.resort_location, '')))
      and (e.is_claimed = false or e.operator_id is null)
    limit 1;
  end if;

  if v_target_est_id is not null then
    -- Claim existing establishment
    update public.establishments
    set
      operator_id = new.tourist_id,
      is_claimed = true,
      name = coalesce(nullif(trim(new.resort_name), ''), name),
      location = coalesce(nullif(trim(new.resort_location), ''), location),
      phone = coalesce(nullif(trim(new.contact_number), ''), phone),
      email = coalesce(nullif(trim(new.resort_email), ''), v_email, email),
      website = coalesce(nullif(trim(new.website_url), ''), website),
      facebook = coalesce(nullif(trim(new.facebook_url), ''), facebook),
      description = coalesce(nullif(trim(new.resort_description), ''), description),
      operator_avatar_path = coalesce(v_avatar_path, operator_avatar_path),
      cover_image_paths = case
        when cardinality(new.cover_image_paths) > 0 then new.cover_image_paths
        else cover_image_paths
      end,
      booking_url = coalesce(new.booking_url, booking_url),
      booking_links = coalesce(new.booking_links, booking_links),
      pcssd_url = coalesce(new.pcssd_url, pcssd_url),
      dot_url = coalesce(new.dot_url, dot_url)
    where id = v_target_est_id;
  else
    -- Insert new establishment for this operator
    insert into public.establishments (
      name, location, accreditation, phone, email, website, facebook,
      description, accredited, is_claimed, operator_id, operator_avatar_path,
      cover_image_paths, booking_url, booking_links, pcssd_url, dot_url
    ) values (
      new.resort_name,
      new.resort_location,
      'Accredited',
      new.contact_number,
      coalesce(new.resort_email, v_email),
      new.website_url,
      new.facebook_url,
      new.resort_description,
      true,
      true,
      new.tourist_id,
      v_avatar_path,
      coalesce(new.cover_image_paths, '{}'),
      new.booking_url,
      new.booking_links,
      new.pcssd_url,
      new.dot_url
    )
    on conflict (operator_id) do update set
      name = excluded.name,
      location = excluded.location,
      phone = excluded.phone,
      email = excluded.email,
      website = excluded.website,
      facebook = excluded.facebook,
      description = excluded.description,
      operator_avatar_path = excluded.operator_avatar_path,
      cover_image_paths = excluded.cover_image_paths,
      booking_url = excluded.booking_url,
      booking_links = excluded.booking_links,
      pcssd_url = excluded.pcssd_url,
      dot_url = excluded.dot_url,
      is_claimed = true;
  end if;

  return new;
end;
$$;
