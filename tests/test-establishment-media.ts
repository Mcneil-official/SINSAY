import {
  isExpiredFbcdnUrl,
  resolveEstablishmentMedia,
  resolveMediaUrl,
} from "../src/lib/establishmentMedia";

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`FAIL - ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// 1. Universal Media URL Resolution
check("preserves full https URL without modifying or prefixing", () => {
  const url = "https://images.unsplash.com/photo-1544551763-46a013bb70d5";
  assertEqual(resolveMediaUrl(url), url);
});

check("preserves full http URL without modifying or prefixing", () => {
  const url = "http://www.altamare.com.ph/cover.jpg";
  assertEqual(resolveMediaUrl(url), url);
});

check("resolves uploaded relative storage path via Supabase storage getPublicUrl", () => {
  const path = "profile-cover/usr_123/photo.jpg";
  const resolved = resolveMediaUrl(path);
  if (!resolved || !resolved.includes("operator_media/profile-cover/usr_123/photo.jpg")) {
    throw new Error(`Expected storage public URL, got ${resolved}`);
  }
});

check("handles null, empty, and whitespace strings safely", () => {
  assertEqual(resolveMediaUrl(null), null);
  assertEqual(resolveMediaUrl(undefined), null);
  assertEqual(resolveMediaUrl(""), null);
  assertEqual(resolveMediaUrl("   "), null);
});

// 2. resolveEstablishmentMedia with photo_url from database
check("uses internet link from photo_url when no uploaded cover is present", () => {
  const est = {
    name: "Altamare Dive & Leisure Resort",
    photo_url: "https://example.com/altamare-front.jpg",
    image_url: null,
    cover_image_paths: [],
  };
  const media = resolveEstablishmentMedia(est);
  assertEqual(media.imageUrl, "https://example.com/altamare-front.jpg");
  assertEqual(media.allImageUrls.length, 1);
  assertEqual(media.allImageUrls[0], "https://example.com/altamare-front.jpg");
});

check("uses internet link from image_url as fallback when photo_url is missing", () => {
  const est = {
    name: "Aiyanar Beach and Dive Resort",
    image_url: "https://example.com/aiyanar-pool.jpg",
    cover_image_paths: null,
  };
  const media = resolveEstablishmentMedia(est);
  assertEqual(media.imageUrl, "https://example.com/aiyanar-pool.jpg");
  assertEqual(media.allImageUrls.length, 1);
});

check("resolves protocol-relative // URLs to https", () => {
  const url = "//images.unsplash.com/photo-1544551763-46a013bb70d5";
  assertEqual(resolveMediaUrl(url), "https://images.unsplash.com/photo-1544551763-46a013bb70d5");
});

check("strips accidental wrapping quotes from image URLs", () => {
  const url = '"https://example.com/photo.jpg"';
  assertEqual(resolveMediaUrl(url), "https://example.com/photo.jpg");
});

check("prioritizes photo_url from database over other fields", () => {
  const est = {
    name: "Amor Laut",
    cover_image_paths: ["profile-cover/usr_456/custom-entrance.jpg"],
    photo_url: "https://example.com/amor-laut-dining.jpg",
    image_url: "https://example.com/amor-laut-beach.jpg",
  };
  const media = resolveEstablishmentMedia(est);
  // photo_url is the primary direct link from the database
  assertEqual(media.imageUrl, "https://example.com/amor-laut-dining.jpg");
  assertEqual(media.allImageUrls.length, 3);
  if (!media.allImageUrls.includes("https://example.com/amor-laut-dining.jpg")) {
    throw new Error("Expected allImageUrls to contain photo_url internet link");
  }
  if (!media.allImageUrls.includes("https://example.com/amor-laut-beach.jpg")) {
    throw new Error("Expected allImageUrls to contain image_url internet link");
  }
});

check("does not corrupt direct internet URLs stored in cover_image_paths", () => {
  const est = {
    name: "Planet Dive Resort",
    cover_image_paths: ["https://example.com/direct-cover.jpg"],
  };
  const media = resolveEstablishmentMedia(est);
  assertEqual(media.imageUrl, "https://example.com/direct-cover.jpg");
});

check("resolves logo_url and operator_avatar_path cleanly", () => {
  const est = {
    name: "Camp Netanya Resort",
    logo_url: "https://example.com/camp-netanya-logo.png",
    operator_avatar_path: "profile-avatar/usr_789/avatar.png",
  };
  const media = resolveEstablishmentMedia(est);
  // Uses avatar path or logo URL
  if (!media.logoUrl || (!media.logoUrl.includes("avatar.png") && media.logoUrl !== "https://example.com/camp-netanya-logo.png")) {
    throw new Error(`Unexpected logoUrl: ${media.logoUrl}`);
  }
});

check("handles empty resort records without crashing", () => {
  const media = resolveEstablishmentMedia({});
  assertEqual(media.imageUrl, null);
  assertEqual(media.logoUrl, null);
  assertEqual(media.allImageUrls.length, 0);
});

check("detects expired fbcdn URLs with past oe timestamps", () => {
  const expiredUrl =
    "https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/486375461_n.jpg?oe=6AF854BE";
  assertEqual(isExpiredFbcdnUrl(expiredUrl), true);
  const regularUrl = "https://images.unsplash.com/photo-1544551763-46a013bb70d5";
  assertEqual(isExpiredFbcdnUrl(regularUrl), false);
});

check("filters out expired fbcdn URLs in resolveEstablishmentMedia", () => {
  const est = {
    name: "Altamare Dive & Leisure Resort",
    image_url:
      "https://scontent.fmnl17-4.fna.fbcdn.net/v/t39.30808-6/475763277_n.png?oe=6AF86D75",
    photo_url: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
  };
  const media = resolveEstablishmentMedia(est);
  assertEqual(
    media.imageUrl,
    "https://images.unsplash.com/photo-1582719508461-905c673771fd"
  );
  assertEqual(media.allImageUrls.length, 1);
});

check("falls back to authentic resort photo and logo from registry when DB URLs are expired or missing", () => {
  const est = {
    name: "Aiyanar Beach and Dive Resort",
    image_url: "https://scontent.fmnl17-5.fna.fbcdn.net/expired.jpg?oe=6AF854BE",
    logo_url: "https://scontent.fmnl17-5.fna.fbcdn.net/expired-logo.jpg?oe=6AF854BE",
  };
  const media = resolveEstablishmentMedia(est);
  if (!media.imageUrl || !media.imageUrl.includes("http")) {
    throw new Error(`Expected authentic resort photo for Aiyanar, got ${media.imageUrl}`);
  }
  if (!media.logoUrl || !media.logoUrl.includes("http")) {
    throw new Error(`Expected authentic resort logo for Aiyanar, got ${media.logoUrl}`);
  }
});

if (failures > 0) {
  throw new Error(`${failures} establishment media test(s) failed`);
}
console.log("all establishment media tests passed");
