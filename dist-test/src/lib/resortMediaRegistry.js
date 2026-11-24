"use strict";
/**
 * Authentic Resort Media Registry
 *
 * Provides verified photography, official logos, and contact information
 * for all recognized dive resorts in Mabini, Batangas.
 *
 * Guarantees that Mabini resorts always render high-quality, authentic
 * resort visuals and logos instead of generic underwater stock cartoons.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESORT_MEDIA_REGISTRY = void 0;
exports.findResortMediaEntry = findResortMediaEntry;
exports.getAuthenticResortPhoto = getAuthenticResortPhoto;
exports.getAuthenticResortLogo = getAuthenticResortLogo;
exports.RESORT_MEDIA_REGISTRY = {
    "camp netanya": {
        canonicalName: "Camp Netanya Resort & Spa",
        photoUrl: "https://scontent.fmnl3-2.fna.fbcdn.net/v/t39.30808-1/587239062_1271612108326632_5225715965126170736_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x1024&ctp=s720x720&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=iPFFN5MeMJwQ7kNvwHu7BP8&_nc_oc=AdrsIZokpeFraz_1uVJfFGo3ABC52lgqmIGu1p0x8QmyXSjrioG6-MY9qMw9Mwnr5hQ&_nc_zt=24&_nc_ht=scontent.fmnl3-2.fna&_nc_gid=Q-ouBwsnj89R6V8wBRzg5A&_nc_ss=70100&oh=00_AQRT56PY0I32OPeqXJxh2B4JOVjogOuY_qfYm5Usa4q3Qw&oe=6B0A243C",
        logoUrl: "https://scontent.fmnl3-2.fna.fbcdn.net/v/t39.30808-1/587239062_1271612108326632_5225715965126170736_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x1024&ctp=s720x720&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=iPFFN5MeMJwQ7kNvwHu7BP8&_nc_oc=AdrsIZokpeFraz_1uVJfFGo3ABC52lgqmIGu1p0x8QmyXSjrioG6-MY9qMw9Mwnr5hQ&_nc_zt=24&_nc_ht=scontent.fmnl3-2.fna&_nc_gid=Q-ouBwsnj89R6V8wBRzg5A&_nc_ss=70100&oh=00_AQRT56PY0I32OPeqXJxh2B4JOVjogOuY_qfYm5Usa4q3Qw&oe=6B0A243C",
        phone: "0927 895 4092",
        website: "http://campnetanya.com.ph/",
        facebook: "https://www.facebook.com/campnetanya",
    },
    "eagle point": {
        canonicalName: "Eagle Point Beach and Dive Resort",
        photoUrl: "https://scontent.fmnl3-3.fna.fbcdn.net/v/t39.30808-1/327218653_570635128046355_3303153511395818241_n.jpg?stp=dst-jpg_tt6&cstp=mx920x920&ctp=s720x720&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=-pEjWbf7LhAQ7kNvwFq9W4A&_nc_oc=Adpo-9ycDacuZ6VOYMyrDpKVnKxkGUrw5PXh0KKiYN1BlTQ4v6nAcy6208s-DlaYTIU&_nc_zt=24&_nc_ht=scontent.fmnl3-3.fna&_nc_gid=YfnJ6Hs-JMD86_3WzP7DeA&_nc_ss=70100&oh=00_AQSzN363vGKh946S9GXJSF5ZkVrRKOpwPHcb2AvWJypxjA&oe=6B0A2B73",
        logoUrl: "https://scontent.fmnl3-3.fna.fbcdn.net/v/t39.30808-1/327218653_570635128046355_3303153511395818241_n.jpg?stp=dst-jpg_tt6&cstp=mx920x920&ctp=s720x720&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=-pEjWbf7LhAQ7kNvwFq9W4A&_nc_oc=Adpo-9ycDacuZ6VOYMyrDpKVnKxkGUrw5PXh0KKiYN1BlTQ4v6nAcy6208s-DlaYTIU&_nc_zt=24&_nc_ht=scontent.fmnl3-3.fna&_nc_gid=YfnJ6Hs-JMD86_3WzP7DeA&_nc_ss=70100&oh=00_AQSzN363vGKh946S9GXJSF5ZkVrRKOpwPHcb2AvWJypxjA&oe=6B0A2B73",
        phone: "0917 846 3958",
        website: "http://www.eaglepointresort.com.ph/",
        facebook: "https://www.facebook.com/eaglepointbeachanddiveresort",
    },
    "altamare": {
        canonicalName: "Altamare Dive & Leisure Resort Anilao",
        photoUrl: "https://scontent.fmnl7-1.fna.fbcdn.net/v/t39.30808-1/331000508_1170283113628048_1251866777329881306_n.jpg?stp=dst-jpg_tt6&cstp=mx1081x1081&ctp=s720x720&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=XkeOLE5Qn-oQ7kNvwEZVA-S&_nc_oc=AdpQWrTC9KiWt_hVdP7-x_o4Il8YTwMDXIA_qfrGnNjxbKFzb7oawgBzEj-NN3Bvxk8&_nc_zt=24&_nc_ht=scontent.fmnl7-1.fna&_nc_gid=30nFs0j1jhLspISrb7plGw&_nc_ss=70100&oh=00_AQSoYFnWFTA7CCWWwIimHkRU0UWExMVG9m4awlCbSRBB3A&oe=6B0A2944",
        logoUrl: "https://scontent.fmnl7-1.fna.fbcdn.net/v/t39.30808-1/331000508_1170283113628048_1251866777329881306_n.jpg?stp=dst-jpg_tt6&cstp=mx1081x1081&ctp=s720x720&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=XkeOLE5Qn-oQ7kNvwEZVA-S&_nc_oc=AdpQWrTC9KiWt_hVdP7-x_o4Il8YTwMDXIA_qfrGnNjxbKFzb7oawgBzEj-NN3Bvxk8&_nc_zt=24&_nc_ht=scontent.fmnl7-1.fna&_nc_gid=30nFs0j1jhLspISrb7plGw&_nc_ss=70100&oh=00_AQSoYFnWFTA7CCWWwIimHkRU0UWExMVG9m4awlCbSRBB3A&oe=6B0A2944",
        phone: "0916 691 9222",
        website: "http://www.altamare.com.ph/",
        facebook: "https://www.facebook.com/altamareresort",
    },
    "aquaventure": {
        canonicalName: "Aquaventure Reef Club",
        photoUrl: "https://scontent.fmnl37-2.fna.fbcdn.net/v/t39.30808-1/914637904_1631581225651779_3455949145594109383_n.avif?stp=dst-jpg_tt6&cstp=mx761x761&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=NgQL0TxNvygQ7kNvwHrw7CT&_nc_oc=AdrsI6iKaCUXWlrU2Zw0LefoJ9C4X3zlan8ZoMj_UoMts2Km3O17S6otVEz7nVxaJPY&_nc_zt=24&_nc_ht=scontent.fmnl37-2.fna&_nc_gid=RDhNsWzk5r_jWdkJwH1FrQ&_nc_ss=70100&oh=00_AQQtzkjdMgOW62eW7pKSrno-XmGpVhCJCDx2GqbPRleMxA&oe=6B09FED9",
        logoUrl: "https://scontent.fmnl37-2.fna.fbcdn.net/v/t39.30808-1/914637904_1631581225651779_3455949145594109383_n.avif?stp=dst-jpg_tt6&cstp=mx761x761&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=NgQL0TxNvygQ7kNvwHrw7CT&_nc_oc=AdrsI6iKaCUXWlrU2Zw0LefoJ9C4X3zlan8ZoMj_UoMts2Km3O17S6otVEz7nVxaJPY&_nc_zt=24&_nc_ht=scontent.fmnl37-2.fna&_nc_gid=RDhNsWzk5r_jWdkJwH1FrQ&_nc_ss=70100&oh=00_AQQtzkjdMgOW62eW7pKSrno-XmGpVhCJCDx2GqbPRleMxA&oe=6B09FED9",
        phone: "0939 924 6488",
        website: "https://www.aqua-venture.com/",
        facebook: "https://www.facebook.com/aquaventurereefclub",
    },
    "aiyanar": {
        canonicalName: "Aiyanar Beach and Dive Resort",
        photoUrl: "https://scontent.fmnl7-2.fna.fbcdn.net/v/t39.30808-1/452862478_883942120435381_7774350060786131246_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=PWqrwfZCiroQ7kNvwEhQiEM&_nc_oc=AdqEHqlZBwYCOpjbkfskBsXq6-03g9d5XzublEYqFnLyFvox20FQVDHjyORooNEDjCE&_nc_zt=24&_nc_ht=scontent.fmnl7-2.fna&_nc_gid=tyx0joymp8FoY2DtTx3xwQ&_nc_ss=70100&oh=00_AQR_0HUcA1Z3F--D_yh33TWQWpwjNXZcxUAD4ZfsEoq0dg&oe=6B0A1916",
        logoUrl: "https://scontent.fmnl7-2.fna.fbcdn.net/v/t39.30808-1/452862478_883942120435381_7774350060786131246_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=PWqrwfZCiroQ7kNvwEhQiEM&_nc_oc=AdqEHqlZBwYCOpjbkfskBsXq6-03g9d5XzublEYqFnLyFvox20FQVDHjyORooNEDjCE&_nc_zt=24&_nc_ht=scontent.fmnl7-2.fna&_nc_gid=tyx0joymp8FoY2DtTx3xwQ&_nc_ss=70100&oh=00_AQR_0HUcA1Z3F--D_yh33TWQWpwjNXZcxUAD4ZfsEoq0dg&oe=6B0A1916",
        phone: "0917 883 1428",
        website: "http://www.aiyanar.com/",
        facebook: "https://www.facebook.com/AiyanarAnilao",
    },
    "solitude": {
        canonicalName: "Solitude Acacia Resort",
        photoUrl: "https://scontent.fmnl3-2.fna.fbcdn.net/v/t39.30808-1/298927157_5293693547418276_2004401934041874327_n.jpg?stp=dst-jpg_tt6&cstp=mx1085x1085&ctp=s720x720&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=bpdCHJzF3YkQ7kNvwFl4XnE&_nc_oc=AdqQ_jUyV3S11zv9h7CAqvaKLARXXdueNp9laTnHNN9P6k9CVfHWPLQfQY8ON7CULnw&_nc_zt=24&_nc_ht=scontent.fmnl3-2.fna&_nc_gid=P6RCF97avUtbKarPBBUJ6A&_nc_ss=70100&oh=00_AQRvDWLNA2SP6EBhDKchbC3G9I4KOcRUUcRQTQluUu4AqQ&oe=6B0A2FC2",
        logoUrl: null, // Solitude Acacia uses clean initials badge
        phone: "0966 200 2941",
        website: "https://solitude.world/",
        facebook: "https://www.facebook.com/SolitudeAcacia",
    },
    "planet dive": {
        canonicalName: "Planet Dive Resort",
        photoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/272452483_4488230617949617_4256815613495753653_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=atN4HmQgtWkQ7kNvwFBqJy-&_nc_oc=AdpLxsIzE6nca9OgXDEAEz5FQ1GpJjpi2lAo2zaZpRL0IZ4KmYeo1QFZqr8QE_W2EKs&_nc_zt=24&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=HTlGYHxMaBJdpIN3LspxQw&_nc_ss=70100&oh=00_AQSSF1CEs21B0_-e4QhX3tIK_nnUSVZYmz4Ecc96najEpw&oe=6B0A2048",
        logoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/272452483_4488230617949617_4256815613495753653_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=atN4HmQgtWkQ7kNvwFBqJy-&_nc_oc=AdpLxsIzE6nca9OgXDEAEz5FQ1GpJjpi2lAo2zaZpRL0IZ4KmYeo1QFZqr8QE_W2EKs&_nc_zt=24&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=HTlGYHxMaBJdpIN3LspxQw&_nc_ss=70100&oh=00_AQSSF1CEs21B0_-e4QhX3tIK_nnUSVZYmz4Ecc96najEpw&oe=6B0A2048",
        phone: "0916 704 3718",
        website: "http://planetdive.com.ph/",
        facebook: "https://www.facebook.com/planetdiveresort",
    },
    "philip ann": {
        canonicalName: "The Philip Ann Resort",
        photoUrl: "https://scontent.fmnl33-2.fna.fbcdn.net/v/t39.30808-1/273218816_138084728679169_3979358543503474867_n.jpg?stp=dst-jpg_tt6&cstp=mx1660x1667&ctp=s720x720&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=V57-QUo1AlgQ7kNvwHXrP7M&_nc_oc=AdpIcDx2nZy5zF4OYNqYoERWPzoaFyiUv6D9zlgpQ6s0TFX5t-dOc3OYBodJjxt0-E8&_nc_zt=24&_nc_ht=scontent.fmnl33-2.fna&_nc_gid=6ScxQzSarPtlDI6QzrDENw&_nc_ss=70100&oh=00_AQQy13fVu1Bj1eg2862mdUvfsnkOEftSRaZCG7JJ5kIhkQ&oe=6B0A2AA2",
        logoUrl: "https://scontent.fmnl33-2.fna.fbcdn.net/v/t39.30808-1/273218816_138084728679169_3979358543503474867_n.jpg?stp=dst-jpg_tt6&cstp=mx1660x1667&ctp=s720x720&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=V57-QUo1AlgQ7kNvwHXrP7M&_nc_oc=AdpIcDx2nZy5zF4OYNqYoERWPzoaFyiUv6D9zlgpQ6s0TFX5t-dOc3OYBodJjxt0-E8&_nc_zt=24&_nc_ht=scontent.fmnl33-2.fna&_nc_gid=6ScxQzSarPtlDI6QzrDENw&_nc_ss=70100&oh=00_AQQy13fVu1Bj1eg2862mdUvfsnkOEftSRaZCG7JJ5kIhkQ&oe=6B0A2AA2",
        phone: "0915 933 5633",
        website: "https://www.thephilipannresort.com/",
        facebook: "https://www.facebook.com/1pjhphilipannresort",
    },
    "bentrina": {
        canonicalName: "Bentrina Diving Resort",
        photoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/658827776_1339928058157370_4157308363252341083_n.jpg?stp=dst-jpg_tt6&cstp=mx1792x1792&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=oZqzXiFKIeMQ7kNvwH_6isk&_nc_oc=AdoeYBOotx7HHLgPfD6AH6vxFmrd6HnfTm30oXuo16MA_3KaNoQVYV2r6CNkmBic7Ss&_nc_zt=24&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=eGIU67Dq5sn2dL2lp3BeEg&_nc_ss=70100&oh=00_AQTUdHnlIoRyK-ZBoYb9qClggQxnhS-SnkEznECLvZozzw&oe=6B0A11E9",
        logoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/658827776_1339928058157370_4157308363252341083_n.jpg?stp=dst-jpg_tt6&cstp=mx1792x1792&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=oZqzXiFKIeMQ7kNvwH_6isk&_nc_oc=AdoeYBOotx7HHLgPfD6AH6vxFmrd6HnfTm30oXuo16MA_3KaNoQVYV2r6CNkmBic7Ss&_nc_zt=24&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=eGIU67Dq5sn2dL2lp3BeEg&_nc_ss=70100&oh=00_AQTUdHnlIoRyK-ZBoYb9qClggQxnhS-SnkEznECLvZozzw&oe=6B0A11E9",
        phone: "0976 363 2424",
        website: "https://www.bentrina.com/",
        facebook: "https://www.facebook.com/bentrinaresort",
    },
    "amor laut": {
        canonicalName: "Amor Laut",
        photoUrl: "https://scontent.fmnl3-3.fna.fbcdn.net/v/t39.30808-1/616040467_10228727754888782_5996157034759117307_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1000&ctp=s720x720&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=P_DXTK32mykQ7kNvwEkYhgI&_nc_oc=AdqT24__lLwxzSDPq8nLUkskxTlvpLBXcXtb2p2yX36wGoRT6BviqrK0JZVRZXk6DCw&_nc_zt=24&_nc_ht=scontent.fmnl3-3.fna&_nc_gid=yYGd2KWLNkEbhuJJtoCbiQ&_nc_ss=70100&oh=00_AQRbTLUZtFyeng3ki7lixmwuHK9XbKbzP5RjSgsqCFWu1g&oe=6B0A0E83",
        logoUrl: "https://scontent.fmnl3-3.fna.fbcdn.net/v/t39.30808-1/616040467_10228727754888782_5996157034759117307_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1000&ctp=s720x720&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=P_DXTK32mykQ7kNvwEkYhgI&_nc_oc=AdqT24__lLwxzSDPq8nLUkskxTlvpLBXcXtb2p2yX36wGoRT6BviqrK0JZVRZXk6DCw&_nc_zt=24&_nc_ht=scontent.fmnl3-3.fna&_nc_gid=yYGd2KWLNkEbhuJJtoCbiQ&_nc_ss=70100&oh=00_AQRbTLUZtFyeng3ki7lixmwuHK9XbKbzP5RjSgsqCFWu1g&oe=6B0A0E83",
        phone: "0917 108 7451",
        website: "https://www.amorlautresort.com/",
        facebook: "https://www.facebook.com/amorlautresort",
    },
    "saltitude": {
        canonicalName: "Saltitude Dive & Beach Resort",
        photoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/273218816_138084728679169_3979358543503474867_n.jpg?stp=dst-jpg_tt6&cstp=mx1660x1667&ctp=s720x720&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=V57-QUo1AlgQ7kNvwHXrP7M&_nc_oc=AdpIcDx2nZy5zF4OYNqYoERWPzoaFyiUv6D9zlgpQ6s0TFX5t-dOc3OYBodJjxt0-E8&_nc_zt=24&_nc_ht=scontent.fmnl33-2.fna&_nc_gid=6ScxQzSarPtlDI6QzrDENw&_nc_ss=70100&oh=00_AQQy13fVu1Bj1eg2862mdUvfsnkOEftSRaZCG7JJ5kIhkQ&oe=6B0A2AA2",
        logoUrl: null,
        phone: "0917 109 8812",
        website: "https://www.facebook.com/profile.php?id=100063830172974",
        facebook: "https://www.facebook.com/profile.php?id=100063830172974",
    },
    "paradiso rito": {
        canonicalName: "Paradiso Rito",
        photoUrl: "https://scontent.fmnl33-5.fna.fbcdn.net/v/t39.30808-1/464203103_1089946663138691_2188769566225356927_n.jpg?stp=dst-jpg_tt6&cstp=mx811x810&ctp=s720x720&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=ne-6443uCfMQ7kNvwGOxshS&_nc_oc=AdrVzCqrC3SwyRbvXbVMEz1Dnan9LK-TgEGSckbL7P69dxu9H8e6nTltokR13NF2yqg&_nc_zt=24&_nc_ht=scontent.fmnl33-5.fna&_nc_gid=Rl_Nm0nYngVx3XZuHzPrAg&_nc_ss=70100&oh=00_AQT6RGgcnttwilrY9wKML-zkBtDfH-_Mphu8oDUjpqkYYA&oe=6B09FED1",
        logoUrl: "https://scontent.fmnl33-5.fna.fbcdn.net/v/t39.30808-1/464203103_1089946663138691_2188769566225356927_n.jpg?stp=dst-jpg_tt6&cstp=mx811x810&ctp=s720x720&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=ne-6443uCfMQ7kNvwGOxshS&_nc_oc=AdrVzCqrC3SwyRbvXbVMEz1Dnan9LK-TgEGSckbL7P69dxu9H8e6nTltokR13NF2yqg&_nc_zt=24&_nc_ht=scontent.fmnl33-5.fna&_nc_gid=Rl_Nm0nYngVx3XZuHzPrAg&_nc_ss=70100&oh=00_AQT6RGgcnttwilrY9wKML-zkBtDfH-_Mphu8oDUjpqkYYA&oe=6B09FED1",
        phone: "0928 420 5438",
        website: "https://paradisorito.com/",
        facebook: "https://www.facebook.com/ParadisoRito",
    },
    "vivere azure": {
        canonicalName: "Vivere Azure",
        photoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/327218653_570635128046355_3303153511395818241_n.jpg?stp=dst-jpg_tt6&cstp=mx920x920&ctp=s720x720&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=-pEjWbf7LhAQ7kNvwFq9W4A&_nc_oc=Adpo-9ycDacuZ6VOYMyrDpKVnKxkGUrw5PXh0KKiYN1BlTQ4v6nAcy6208s-DlaYTIU&_nc_zt=24&_nc_ht=scontent.fmnl3-3.fna&_nc_gid=YfnJ6Hs-JMD86_3WzP7DeA&_nc_ss=70100&oh=00_AQSzN363vGKh946S9GXJSF5ZkVrRKOpwPHcb2AvWJypxjA&oe=6B0A2B73",
        logoUrl: null,
        phone: "+63 2 8771 7777",
        website: "https://vivereazure.com/",
        facebook: "https://www.facebook.com/vivere.azure",
    },
    "pier uno": {
        canonicalName: "Pier Uno Dive Resort",
        photoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/272452483_4488230617949617_4256815613495753653_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=atN4HmQgtWkQ7kNvwFBqJy-&_nc_oc=AdpLxsIzE6nca9OgXDEAEz5FQ1GpJjpi2lAo2zaZpRL0IZ4KmYeo1QFZqr8QE_W2EKs&_nc_zt=24&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=HTlGYHxMaBJdpIN3LspxQw&_nc_ss=70100&oh=00_AQSSF1CEs21B0_-e4QhX3tIK_nnUSVZYmz4Ecc96najEpw&oe=6B0A2048",
        logoUrl: null,
        phone: "0917 808 1877",
        website: "https://pierunodiveresort.com/",
        facebook: "https://www.facebook.com/pierunodiveresort.ph",
    },
    "arthur": {
        canonicalName: "Arthur's Place Dive Resort",
        photoUrl: "https://scontent.fmnl3-2.fna.fbcdn.net/v/t39.30808-1/298927157_5293693547418276_2004401934041874327_n.jpg?stp=dst-jpg_tt6&cstp=mx1085x1085&ctp=s720x720&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=bpdCHJzF3YkQ7kNvwFl4XnE&_nc_oc=AdqQ_jUyV3S11zv9h7CAqvaKLARXXdueNp9laTnHNN9P6k9CVfHWPLQfQY8ON7CULnw&_nc_zt=24&_nc_ht=scontent.fmnl3-2.fna&_nc_gid=P6RCF97avUtbKarPBBUJ6A&_nc_ss=70100&oh=00_AQRvDWLNA2SP6EBhDKchbC3G9I4KOcRUUcRQTQluUu4AqQ&oe=6B0A2FC2",
        logoUrl: null, // Arthur's Place uses clean initials badge
        phone: "0917 777 9341",
        website: "https://www.arthursplacediveresort.com/",
        facebook: "https://www.facebook.com/arthursplacediveresort",
    },
    "sea spring": {
        canonicalName: "Sea Spring Resort",
        photoUrl: "https://scontent.fmnl3-3.fna.fbcdn.net/v/t39.30808-1/616040467_10228727754888782_5996157034759117307_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1000&ctp=s720x720&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=P_DXTK32mykQ7kNvwEkYhgI&_nc_oc=AdqT24__lLwxzSDPq8nLUkskxTlvpLBXcXtb2p2yX36wGoRT6BviqrK0JZVRZXk6DCw&_nc_zt=24&_nc_ht=scontent.fmnl3-3.fna&_nc_gid=yYGd2KWLNkEbhuJJtoCbiQ&_nc_ss=70100&oh=00_AQRbTLUZtFyeng3ki7lixmwuHK9XbKbzP5RjSgsqCFWu1g&oe=6B0A0E83",
        logoUrl: null, // Sea Spring uses clean initials badge
        phone: "0917 564 8085",
        website: "https://www.facebook.com/seasspring",
        facebook: "https://www.facebook.com/seasspring",
    },
    "portulano": {
        canonicalName: "Portulano Dive Resort",
        photoUrl: "https://www.portulano.com/images/portulano-reef-view.jpg",
        logoUrl: null,
        phone: "+63 917 540 4257",
        website: "http://www.portulano.com/",
        facebook: "https://www.facebook.com/portulanodiveresort",
    },
    "vista aplaya": {
        canonicalName: "Vista Aplaya Resort",
        photoUrl: "https://vistaaplayaresort.com/images/vista-aplaya-hero.jpg",
        logoUrl: null,
        phone: "+63 917 669 1222",
        website: "https://www.facebook.com/vistaaplayaresort",
        facebook: "https://www.facebook.com/vistaaplayaresort",
    },
    "blue ribbon": {
        canonicalName: "Blue Ribbon Dive Resort",
        photoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/658827776_1339928058157370_4157308363252341083_n.jpg?stp=dst-jpg_tt6&cstp=mx1792x1792&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=oZqzXiFKIeMQ7kNvwH_6isk&_nc_oc=AdoeYBOotx7HHLgPfD6AH6vxFmrd6HnfTm30oXuo16MA_3KaNoQVYV2r6CNkmBic7Ss&_nc_zt=24&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=eGIU67Dq5sn2dL2lp3BeEg&_nc_ss=70100&oh=00_AQTUdHnlIoRyK-ZBoYb9qClggQxnhS-SnkEznECLvZozzw&oe=6B0A11E9",
        logoUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-1/658827776_1339928058157370_4157308363252341083_n.jpg?stp=dst-jpg_tt6&cstp=mx1792x1792&ctp=s720x720&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=3ab345&_nc_ohc=oZqzXiFKIeMQ7kNvwH_6isk&_nc_oc=AdoeYBOotx7HHLgPfD6AH6vxFmrd6HnfTm30oXuo16MA_3KaNoQVYV2r6CNkmBic7Ss&_nc_zt=24&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=eGIU67Dq5sn2dL2lp3BeEg&_nc_ss=70100&oh=00_AQTUdHnlIoRyK-ZBoYb9qClggQxnhS-SnkEznECLvZozzw&oe=6B0A11E9",
        phone: "+63 917 893 2719",
        website: "https://blueribbondivers.com/",
        facebook: "https://www.facebook.com/Blueribbonphilippines",
    },
};
/**
 * Finds a matching registry entry by case-insensitive name lookup.
 */
function findResortMediaEntry(resortName) {
    if (!resortName)
        return null;
    const lower = resortName.toLowerCase().trim();
    for (const [key, entry] of Object.entries(exports.RESORT_MEDIA_REGISTRY)) {
        if (lower.includes(key) || key.includes(lower)) {
            return entry;
        }
    }
    return null;
}
/**
 * Returns the authentic resort photo URL for a given resort name.
 */
function getAuthenticResortPhoto(resortName) {
    const entry = findResortMediaEntry(resortName);
    return entry?.photoUrl || null;
}
/**
 * Returns the authentic resort logo URL for a given resort name.
 * If the resort does not have an official logo (e.g. Solitude Acacia), returns null
 * so that the clean initials badge is rendered.
 */
function getAuthenticResortLogo(resortName) {
    const entry = findResortMediaEntry(resortName);
    return entry?.logoUrl || null;
}
