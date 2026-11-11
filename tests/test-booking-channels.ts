import {
  BOOKING_PLATFORMS,
  detectTravelPlatform,
  findDuplicateBookingPlatform,
  getAvailableBookingPlatforms,
  getNextAvailableBookingPlatform,
  normalizeTravelUrl,
  sanitizeBookingLinks,
} from "../src/lib/bookingChannels";
import type { BookingLinkItem } from "../src/types/supabase";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const link = (id: string, platform: BookingLinkItem["platform"], url: string, label = "Custom label"): BookingLinkItem => ({ id, platform, url, label });

assert(BOOKING_PLATFORMS.length === 11, "There should be eleven supported booking channels.");
const configured = [link("1", "agoda", "agoda.com/resort")];
assert(!getAvailableBookingPlatforms(configured).includes("agoda"), "Configured platforms should be unavailable to new links.");
assert(getAvailableBookingPlatforms(configured, "1").includes("agoda"), "A link should be able to retain its own platform.");
assert(getNextAvailableBookingPlatform(configured) === "messenger", "Adding should select the first available platform.");
assert(getNextAvailableBookingPlatform(BOOKING_PLATFORMS.map((platform, index) => link(String(index), platform, ""))) === null, "No channel should be available once all eleven are configured.");

const duplicate = [link("1", "whatsapp", "wa.me/123"), link("2", "whatsapp", "wa.me/456")];
assert(findDuplicateBookingPlatform(duplicate) === "whatsapp", "Duplicate platform detection should identify the repeated channel.");
let duplicateRejected = false;
try { sanitizeBookingLinks(duplicate); } catch { duplicateRejected = true; }
assert(duplicateRejected, "Saving duplicate platforms should be rejected.");

const clean = sanitizeBookingLinks([
  link("1", "agoda", "agoda.com/resort", "Book the resort"),
  link("2", "whatsapp", "+63 (912) 345-6789", "Message us"),
  link("3", "instagram", "@sinsay_resort"),
  link("4", "messenger", "@sinsay_resort"),
  link("5", "direct", "   "),
]);
assert(clean.length === 4, "Blank links should be omitted.");
assert(clean[0].label === "Agoda", "Custom labels should be replaced by canonical platform names.");
assert(clean[1].label === "WhatsApp" && clean[1].url === "https://wa.me/639123456789", "WhatsApp labels and URLs should be normalized.");
assert(clean[2].url === "https://instagram.com/sinsay_resort", "Instagram handles should become profile URLs.");
assert(clean[3].platform === "messenger" && clean[3].label === "Facebook" && clean[3].url === "https://www.facebook.com/sinsay_resort", "Facebook labels and handles should use Facebook destinations.");
assert(detectTravelPlatform("https://www.booking.com/hotel/ph/example") === "booking", "Known platform domains should be detected.");
assert(normalizeTravelUrl("example.com") === "https://example.com", "Plain website URLs should receive an HTTPS scheme.");

console.log("booking channel tests passed");
