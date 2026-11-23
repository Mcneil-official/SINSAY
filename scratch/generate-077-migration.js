const fs = require('fs');

const freshLogos = JSON.parse(fs.readFileSync('scratch/fresh-active-links.json', 'utf8'));
const logoMap = {};
for (const item of freshLogos) {
  logoMap[item.name] = item.url;
}

// User-provided resort details from dive_resorts.txt
const RESORTS_SQL_DATA = [
  {
    name: 'Camp Netanya Resort & Spa',
    match: '%Camp Netanya%',
    hero: 'https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/486375461_1072652344889277_947795348170795983_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFuqDLnlBQQ-nYKU7q64RThsn-qLv-8xu-yf6ou_7zG7yUcN7gHj8L_QjGoSGXBuzGe5tPtVElv_DbxIfnLOnqN&_nc_ohc=5DWJkA3aIDwQ7kNvwFB7qee&_nc_oc=AdrYjXnBPbZLDo-nJuVy1wEmTZj-z3LD4jjDVbCKJzDfL0tjaMx5BOBotixuM2NxuSo&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=NOrXKnMFR4bfmH7lJ0d1HQ&_nc_ss=7b2a8&oh=00_AQTRcoXGYUmmLLGL63dQlbXSKrtfLupxdffv5xgXkvYbLQ&oe=6AF854BE',
    freshLogo: logoMap['Camp Netanya Resort & Spa'],
    phone: '0927 895 4092',
    website: 'http://campnetanya.com.ph/',
    facebook: 'https://www.facebook.com/campnetanya'
  },
  {
    name: 'Eagle Point Beach and Dive Resort',
    match: '%Eagle Point%',
    hero: 'https://scontent.fmnl17-4.fna.fbcdn.net/v/t39.30808-6/486321523_9987946744570923_6106106329576027209_n.jpg?stp=dst-jpg_tt6&cstp=mx960x640&ctp=s960x640&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHpFt-Sy7kL8XRpukpSicUdD8LnXpByb74PwudekHJvvgYfMfyVfC9NTFzo9EoUU5qAKL1Y_V6bsWa6ZfwFX4pJ&_nc_ohc=-HBPIVsIqS8Q7kNvwHt_0VQ&_nc_oc=Adq8roz2US5zA7I7tBWIgF_G9bnfMeq1PLOgyNx--Vttjc5DSB7S_CG2pXbV-JFZpF8&_nc_zt=23&_nc_ht=scontent.fmnl17-4.fna&_nc_gid=kibA6xqKhXNHyEtJSci4Sg&_nc_ss=7b2a8&oh=00_AQRyNp9-3aq87lszBysoJBcKQ1ayZgpItBbiSxC8mAUh4w&oe=6AF88530',
    freshLogo: logoMap['Eagle Point Beach and Dive Resort'],
    phone: '0917 846 3958',
    website: 'http://www.eaglepointresort.com.ph/',
    facebook: 'https://www.facebook.com/eaglepointbeachanddiveresort'
  },
  {
    name: 'Altamare Dive & Leisure Resort Anilao',
    match: '%Altamare%',
    hero: 'https://scontent.fmnl17-4.fna.fbcdn.net/v/t39.30808-6/475763277_1186501996818065_6106055726007537308_n.png?stp=dst-png&cstp=mx2659x984&ctp=s960x960&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHyHja_phcb5sIqP5vMVP-bUiT7YTAT2-tSJPthMBPb6yEx1HpCvNsu1q8nDVrG2ItiOkv1MSby-_YIRBHdINBg&_nc_ohc=sRbt7u6ho1gQ7kNvwE2B_CT&_nc_oc=Adogx2mTlVDSdQ-C2Jk5zZHZev1gSQ7-SKLhiL6Hdwy7KJvUeHFE0ntyf_euJW7UECg&_nc_zt=23&_nc_ht=scontent.fmnl17-4.fna&_nc_gid=xfFeX7qQTJXtRBGK7eka7Q&_nc_ss=7b2a8&oh=00_AQRAnFeFJpdGxv05DO9fC-szWSTYO8FDSRXiZGUKtldkqg&oe=6AF86D75',
    freshLogo: logoMap['Altamare Dive & Leisure Resort Anilao'],
    phone: '0916 691 9222',
    website: 'http://www.altamare.com.ph/',
    facebook: 'https://www.facebook.com/altamareresort'
  },
  {
    name: 'Aquaventure Reef Club',
    match: '%Aquaventure%',
    hero: 'https://scontent.fcgy2-4.fna.fbcdn.net/v/t51.82787-15/564515838_18516943486064006_269757752742929607_n.webp?stp=dst-jpg_tt6&cstp=mx1440x1440&ctp=s1440x1440&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFsS06JeHwdYmJtmg3Y07PVEUQ1j87wnIURRDWPzvCchaZxZW_WZPZBrcb3jn8l72KuutlMrmH0rFE8NhHT9qyb&_nc_ohc=C-Q4l_VI15gQ7kNvwHa-FmC&_nc_oc=AdpjvGD9f9xxTzGlloLBGPzZrKFxdJrhvegnqN2zpUIoVMNKdlXMxAN9Wr5PFKUJjFw&_nc_zt=23&_nc_ht=scontent.fcgy2-4.fna&_nc_gid=b58ytRxpChAlL5KDuUAAlA&_nc_ss=7b2a8&oh=00_AQTBX82OEsC9sKWmtxI3seLLUMbR4pKcJnc833uSuaV5TA&oe=6AF89A79',
    freshLogo: logoMap['Aquaventure Reef Club'],
    phone: '0939 924 6488',
    website: 'https://www.aqua-venture.com/',
    facebook: 'https://www.facebook.com/aquaventurereefclub'
  },
  {
    name: 'Aiyanar Beach and Dive Resort',
    match: '%Aiyanar%',
    hero: 'https://scontent.fcgy2-3.fna.fbcdn.net/v/t39.30808-6/486790068_1060977839398474_1185172687591118017_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1153&ctp=s960x960&_nc_cat=107&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEboh6e2vOuXrzkMS5HGeW730XIWARHtZffRchYBEe1l5BdoesiKMC21TXixXupTA4JBrOH5-95ZDMnH0CCUwCX&_nc_ohc=40WHIdnDo74Q7kNvwH2jLkJ&_nc_oc=AdpdXzs4fUGUgZiK-jFpBhOxL4HDAf_eXmDoEX69J9iE6tTgGohd1_kzuZlqQRf0Ans&_nc_zt=23&_nc_ht=scontent.fcgy2-3.fna&_nc_gid=Sx-4Oe1IR1o6vA_z5sB5gA&_nc_ss=7b2a8&oh=00_AQQraWpoC0dikDQxSTA3MMSXuktgVCOINOPnS9xRon7T0g&oe=6AF868A3',
    freshLogo: logoMap['Aiyanar Beach and Dive Resort'],
    phone: '0917 883 1428',
    website: 'http://www.aiyanar.com/',
    facebook: 'https://www.facebook.com/AiyanarAnilao'
  },
  {
    name: 'Solitude Acacia Resort',
    match: '%Solitude Acacia%',
    hero: 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/298927157_5293693547418276_2004401934041874327_n.jpg?stp=dst-jpg_tt6&cstp=mx1085x1085&ctp=s1085x1085&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGEP2GA1lDonsNXjhdQIgLSQIclDKC0iIdAhyUMoLSIhxIsbquUdHapfK37NL2umzz31U1VeM2pRjeg2a1IFZn0&_nc_ohc=q2oKakds3fkQ7kNvwEJ7DUb&_nc_oc=AdqPoWtmmmDqN8g2Q68ve3doRvZsQNgKylL4GpL3GRdpiRI8pnMsYFuZOlQo3hHVBeY&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=G-RDmfSQ7afXMruKJ8T8mw&_nc_ss=7a2a8&oh=00_AQQaXBFeD_u_oek7WEGhM18CsWCe1gZwwvOaXZKKCc1GyA&oe=6AF882C4',
    freshLogo: logoMap['Solitude Acacia Resort'],
    phone: '0966 200 2941',
    website: 'https://solitude.world/',
    facebook: 'https://www.facebook.com/SolitudeAcacia'
  },
  {
    name: 'Planet Dive Resort',
    match: '%Planet Dive%',
    hero: 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/481333237_8876738815765420_2772935053642187597_n.jpg?stp=dst-jpg_tt6&cstp=mx2050x780&ctp=s2050x780&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeECm6yL-b-cQ-4QlNav5532evfnMQxDYh569-cxDENiHkG5p0b_9_MX-ghqqvKSDYYi7CA8iwNwO65g57R45q1P&_nc_ohc=N7WWs6Ll1CQQ7kNvwG0cxvH&_nc_oc=AdrBfIzY5vS74NwlifrOtsKNRl3UiaRplZpor-u3hhUeY0Uqjacnej_RYJPtxYo7owI&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=zstm4HSsu4JjlbFwDpHaNA&_nc_ss=7b2a8&oh=00_AQSkZ_gRPo7b82uACxL7My_Ct3zTv_ozkDiKsT0zcL1D9g&oe=6AF88FE6',
    freshLogo: logoMap['Planet Dive Resort'],
    phone: '0916 704 3718',
    website: 'http://planetdive.com.ph/',
    facebook: 'https://www.facebook.com/planetdiveresort'
  },
  {
    name: 'The Philip Ann Resort',
    match: '%Philip Ann%',
    hero: 'https://scontent.fcrk3-3.fna.fbcdn.net/v/t39.30808-6/481480382_657184970165352_5519932722880451621_n.jpg?stp=dst-jpg_tt6&cstp=mx1280x960&ctp=s1280x960&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGuYPzqTyhMdKUGiqH5fJMdmU6NuuMy6CSZTo264zLoJK1U6hMjlbDdTq67aizSQYhkSlnsXHfqJHn_8nMDKgNC&_nc_ohc=oZm-4wP0OzMQ7kNvwFSQboi&_nc_oc=AdrzVZb1R-myLAHsaqf5dU2bf7kOHXypcL3alZR_6uO5jWBE_JxnZxV8zX16zxU6Aqc&_nc_zt=23&_nc_ht=scontent.fcrk3-3.fna&_nc_gid=iMIQiOOnOIJb1WlvUx3b5A&_nc_ss=7b2a8&oh=00_AQTFiaurFPDmvPOl2v53FPGFRZyjMVOpslTMtGcu1NbTTQ&oe=6AF88EAD',
    freshLogo: logoMap['The Philip Ann Resort'],
    phone: '0915 933 5633',
    website: 'https://www.thephilipannresort.com/',
    facebook: 'https://www.facebook.com/1pjhphilipannresort'
  },
  {
    name: 'Bentrina Diving Resort',
    match: '%Bentrina%',
    hero: 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/474624259_999031675580345_8432458935485121518_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1536&ctp=s960x960&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGHYtzZi1NaQ9si2xwHt69su-85NnBlNiy77zk2cGU2LFOYzNdk85gbBdDafJsUFUz6nMdtVTW3Xii0x2Lq3jE8&_nc_ohc=vVyaNrt5-lIQ7kNvwHKmHEF&_nc_oc=AdrdWcfjPE7ZIt6L65SfbtXNz_kwsawKMBZA3qdC0AhnibaloElvGvx_1KcZIO11P9o&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=xRsmMjL0wPcoAfut9Vew3A&_nc_ss=7b2a8&oh=00_AQSXwmz1851o9CAXci91DkeJrO96CjIScVswBKwTsdq6mA&oe=6AF896F4',
    freshLogo: logoMap['Bentrina Diving Resort'],
    phone: '0976 363 2424',
    website: 'https://www.bentrina.com/',
    facebook: 'https://www.facebook.com/bentrinaresort'
  },
  {
    name: 'Amor Laut',
    match: '%Amor Laut%',
    hero: 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-6/615930217_122093499393232519_924081617315974795_n.png?stp=dst-png&cstp=mx820x360&ctp=s820x360&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGVPht9yS8lLcZ2HhtnuLJC93ZhfhBUpJz3dmF-EFSknBlhh4avVSWU6_t76TuyhQskv-Ukjbz3Ijo5LGPENzUm&_nc_ohc=xv8iRNrBMgMQ7kNvwE2o69c&_nc_oc=Adry2BXUpL5IsUCmnysQRIwR46hzf8AOjaocKffWCd5NFIpMWrCtLjKIES9Zmvs3zSg&_nc_zt=23&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=p_WjMkPCSg_DKSp5DQqeig&_nc_ss=7b2a8&oh=00_AQT4lf8XM7SfQlxIgLrdilcElKN9FjDydgAFAXXXwET0aQ&oe=6AF87922',
    freshLogo: logoMap['Amor Laut'],
    phone: '0917 108 7451',
    website: 'https://www.amorlautresort.com/',
    facebook: 'https://www.facebook.com/amorlautresort'
  },
  {
    name: 'Saltitude Dive & Beach Resort',
    match: '%Saltitude%',
    hero: 'https://scontent.fcrk3-3.fna.fbcdn.net/v/t39.30808-6/548258915_1302819038522423_4083472316127921106_n.jpg?stp=dst-jpg_tt6&cstp=mx1600x639&ctp=s1600x639&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEZWZVsF_R8iGwuy_18n9A-tp0V-uCwWte2nRX64LBa18XWMGTXZY2kiCOz-VmxHRwpjyxIaI4PZpuxKIx247sI&_nc_ohc=mI4-I8wEgAYQ7kNvwHnnDrF&_nc_oc=Adqz8MwWvVJ3_VhFFcI3-5OMjOW_xvDuNcXMPvQtOYGiUmMb7jc1vWgSoSZpSN6NiAg&_nc_zt=23&_nc_ht=scontent.fcrk3-3.fna&_nc_gid=4URpifilnEvp2aZ--J5nbA&_nc_ss=7b2a8&oh=00_AQSxpk5MK5SZvVcbh9ZgO1Fic7YSSSiIRgvqFRA0zj9d-A&oe=6AF8966B',
    freshLogo: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100063830172974',
    phone: '0917 109 8812',
    website: null,
    facebook: 'https://www.facebook.com/profile.php?id=100063830172974'
  },
  {
    name: 'Paradiso Rito',
    match: '%Paradiso Rito%',
    hero: 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-6/561919048_1398560852277269_2907266908909172835_n.jpg?stp=dst-jpg_tt6&cstp=mx850x315&ctp=s850x315&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=86c6b0&_nc_eui2=AeFWAyDvikFQpOExuJaQHlfh-8OIC5-d4ab7w4gLn53hpn7eJZ5TE7kly4lxfDy1AgQ2y1ZLvQdurmJ9Mmscz62H&_nc_ohc=JtC0B8gJ-2sQ7kNvwEdhv9r&_nc_oc=AdoniWYD0_ed0mVcv6r7z0rwhfKyqb3tfP7OInQkDqNBAf8NxKGu8Q4BSDQPQZpKsd8&_nc_zt=23&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=IIR9iQIH91jyTUczVufWPQ&_nc_ss=7b2a8&oh=00_AQRaF9UP578cys0fpLPrVhHA_9VDi3fvYsLtewtF7U7VSg&oe=6AF86A26',
    freshLogo: logoMap['Paradiso Rito'],
    phone: '0928 420 5438',
    website: 'https://paradisorito.com/',
    facebook: 'https://www.facebook.com/ParadisoRito'
  },
  {
    name: 'Vivere Azure',
    match: '%Vivere Azure%',
    hero: 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/856939490_1577289474424448_1660928548533681695_n.png?stp=dst-png&cstp=mx1640x924&ctp=s960x960&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEqYe17KvhxBKxODYevxjnESpmPLpL3-KxKmY8ukvf4rN9U3LCmxx4EkYxsTjYMiKJtX25pS04YgmLdrp7rD2As&_nc_ohc=sqZXkPQv0b0Q7kNvwFYY7kh&_nc_oc=Adqh9dDtl84y9qvbUZzo3gwD9EspCjDvdCDUYI9RUq3ibvSsGjjOGkzTmUto8VwOEVs&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=VzNx6jGqZ8yyEAL8m-ybhg&_nc_ss=7b2a8&oh=00_AQQAJZDrP7r2eIbFzD6WLheHulxzNOcsZOrsALB6avkJWQ&oe=6AF873C3',
    freshLogo: logoMap['Vivere Azure'],
    phone: '+63 2 8771 7777',
    website: 'https://vivereazure.com/',
    facebook: 'https://www.facebook.com/vivere.azure'
  },
  {
    name: 'Pier Uno Dive Resort',
    match: '%Pier Uno%',
    hero: 'https://scontent.fcrk3-1.fna.fbcdn.net/v/t39.30808-6/479362634_1093900906085927_7342592545443043606_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1365&ctp=s2048x1365&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHzNrMLNbxuUmFdGErh7tDetuYat53_E-a25hq3nf8T5s4-SKFAj7T4E4v0Jx-ou4T-RckDBd5KxFBGdJm7AEMk&_nc_ohc=DGrxr6Eo6icQ7kNvwFmudfk&_nc_oc=AdoHSoqHCT244LkW09JYprNXdE8dJh08SSKZ-G15w6cyj4qMLixrB7aUBJCyv-dnTJE&_nc_zt=23&_nc_ht=scontent.fcrk3-1.fna&_nc_gid=cfPDmz_23jxoXVkaGJYfow&_nc_ss=7a2a8&oh=00_AQQswNN34oR_gMmdysH4V-EYVgKY5O3VeTCA3EERnv-MdA&oe=6AF886FD',
    freshLogo: logoMap['Pier Uno Dive Resort'],
    phone: '0917 808 1877',
    website: 'https://pierunodiveresort.com/',
    facebook: 'https://www.facebook.com/pierunodiveresort.ph'
  },
  {
    name: "Arthur's Place Dive Resort",
    match: '%Arthur%',
    hero: 'https://scontent.fcrk3-2.fna.fbcdn.net/v/t39.30808-6/292350327_449757850488567_7622841057531360150_n.jpg?stp=dst-jpg_tt6&cstp=mx958x960&ctp=s958x960&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeH3Ul7tSfkpRhWqiA1sCRoVpjCnow9DKUumMKejD0MpSwIESu-YuybFjQPkDWbql00LLAKPanUVe1cR7irtMmwz&_nc_ohc=X1a9EChYQyUQ7kNvwHW-grQ&_nc_oc=AdraaGiY3zH5cV4Mg5xbO1jKvTQM1a5UfSZDDRqCYE83VAhuILXGOR6oh828nc-eQUA&_nc_zt=23&_nc_ht=scontent.fcrk3-2.fna&_nc_gid=hkmRtdnUn2n0Iuc4WHem0Q&_nc_ss=7a2a8&oh=00_AQTZglwc4qHWvPgzDnk3Yo-ZMiStxtkOIZu8Zl5uGrANPw&oe=6AF88AA8',
    freshLogo: logoMap["Arthur's Place Dive Resort"],
    phone: '0917 777 9341',
    website: 'https://www.arthursplacediveresort.com/',
    facebook: 'https://www.facebook.com/arthursplacediveresort'
  },
  {
    name: 'Sea Spring Resort',
    match: '%Sea Spring%',
    hero: 'https://scontent.fcrk3-1.fna.fbcdn.net/v/t39.30808-6/486170778_1079026230930075_421883258370683482_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1536&ctp=s2048x1536&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeE7JL2uXiuYy7Bu-IsS380yq2k6CTd7cleraToJN3tyV1r2vIsQp9c5DT_d0KfnDtRgxeTdOQdUshhajjrKnH8e&_nc_ohc=17rESu_s5G8Q7kNvwHu3xix&_nc_oc=AdokABE66DuFTvwlngvC0gBQyrtq7dpDn5TksBH1XXOSFS0fciVe0ipij1Nifh-inIU&_nc_zt=23&_nc_ht=scontent.fcrk3-1.fna&_nc_gid=_k3chJu_wBGUyDNjqDhLQw&_nc_ss=7b2a8&oh=00_AQSCzgxRIeBnVcnEsOhhmj5jHL84lBGCa5Ntr5BSfpBMuQ&oe=6AF89818',
    freshLogo: logoMap['Sea Spring Resort'],
    phone: '0917 564 8085',
    website: null,
    facebook: 'https://www.facebook.com/seaspring'
  },
  {
    name: 'Blue Ribbon Dive Resort',
    match: '%Blue Ribbon%',
    hero: 'https://scontent.fcrk3-4.fna.fbcdn.net/v/t39.30808-6/486613235_1064232755729385_5573979953265691326_n.jpg?stp=dst-jpg_tt6&cstp=mx960x364&ctp=s960x364&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeFK_dE_UiM2oucoZ9cdzezhezfgNlYwmBp7N-A2VjCYGi764ArDOj5gTtJhCDXzsw6Qbkd-a7O-T9wa7MMPlSta&_nc_ohc=EdNAe4xEixIQ7kNvwGxoTRR&_nc_oc=AdrZOEbrVkS04ZWjkoWz0RUIIC8yVCYtc2kRSEM1a88C2G3Cspwt8aMkMUNtZBnfFuA&_nc_zt=23&_nc_ht=scontent.fcrk3-4.fna&_nc_gid=nDVwsuDju0pABd_YGf-0pw&_nc_ss=7b2a8&oh=00_AQRZJy3_FWmwZ2AgkCcqw9QPvpZFys_3QKnwtdMpax7ROA&oe=6AF89717',
    freshLogo: logoMap['Blue Ribbon Dive Resort'],
    phone: '+63 917 893 2719',
    website: 'https://blueribbondivers.com/',
    facebook: 'https://www.facebook.com/Blueribbonphilippines'
  }
];

let sql = `-- 077_refresh_resort_media_urls.sql
-- Applies verified, active media links and official logos directly to all Mabini dive resorts.
-- Removes Buceo Anilao and renames Eagle Point to official name.

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

-- 4. Update Media URLs & Contacts for all Mabini Dive Resorts
`;

RESORTS_SQL_DATA.forEach((r, idx) => {
  const websiteClause = r.website ? `,\n    website = '${r.website}'` : '';
  const fbClause = r.facebook ? `,\n    facebook = '${r.facebook}'` : '';
  const phoneClause = r.phone ? `,\n    phone = '${r.phone}'` : '';
  const logoClause = r.freshLogo ? `,\n    logo_url = '${r.freshLogo}'` : `,\n    logo_url = null`;
  const primaryUrl = r.freshLogo || r.hero;

  sql += `
-- ${idx + 1}. ${r.name}
update public.establishments
set image_url = '${primaryUrl}',
    photo_url = '${primaryUrl}',
    cover_image_paths = array['${r.hero}'::text]${logoClause}${phoneClause}${websiteClause}${fbClause}
where name ilike '${r.match}';
`;
});

fs.writeFileSync('supabase/migrations/077_refresh_resort_media_urls.sql', sql);
console.log('Successfully wrote supabase/migrations/077_refresh_resort_media_urls.sql');
