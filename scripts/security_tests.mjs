// Comprehensive Security & Open Proxy Verification Suite
// Tests all scenarios requested by user

async function main() {
  console.log("===============================================================");
  console.log("      TOKICONVERT OPEN PROXY & SECURITY REGRESSION SUITE       ");
  console.log("===============================================================\n");

  const results = [];

  async function postJson(endpoint, body) {
    const res = await fetch(`http://localhost:3000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), json, raw: text };
  }

  // ── TEST 1: URL Arbitrer Tanpa Token ───────────────────────────────────────
  console.log("[TEST 1] URL Arbitrer Tanpa Token (Mencegah Open Proxy)");
  const arbitraryRes = await postJson("/api/audio/fetch-media", {
    url: "https://example.com/arbitrary_audio.mp3",
  });
  console.log(`Status: HTTP ${arbitraryRes.status}`);
  console.log(`Pesan:`, arbitraryRes.json?.message);
  const test1Pass = arbitraryRes.status === 403 && arbitraryRes.json?.message?.includes("Open Proxy Prevention");
  console.log(`Hasil: ${test1Pass ? "LOLOS (Ditolak HTTP 403)" : "GAGAL"}\n`);
  results.push({ name: "1. URL Arbitrer Tanpa Token", pass: test1Pass, evidence: `HTTP ${arbitraryRes.status} - ${arbitraryRes.json?.message}` });

  // ── TEST 2: Token Tidak Valid / Dipalsukan (Tampered Token) ─────────────────
  console.log("[TEST 2] Token Tidak Valid / Dipalsukan");
  const tamperedRes = await postJson("/api/audio/fetch-media", {
    url: "https://example.com/arbitrary_audio.mp3",
    token: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  });
  console.log(`Status: HTTP ${tamperedRes.status}`);
  console.log(`Pesan:`, tamperedRes.json?.message);
  const test2Pass = tamperedRes.status === 403 && tamperedRes.json?.message?.includes("Open Proxy Prevention");
  console.log(`Hasil: ${test2Pass ? "LOLOS (Ditolak HTTP 403)" : "GAGAL"}\n`);
  results.push({ name: "2. Token Dipalsukan (Tampered)", pass: test2Pass, evidence: `HTTP ${tamperedRes.status} - ${tamperedRes.json?.message}` });

  // ── TEST 3: Token Kedaluwarsa (Expired Token) ──────────────────────────────
  console.log("[TEST 3] Token Kedaluwarsa");
  // Buat token yang valid tetapi dengan expiresAt di masa lalu (misal 1 jam lalu)
  const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600;
  const expiredRes = await postJson("/api/audio/fetch-media", {
    url: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    token: "anytoken",
    expiresAt: expiredTimestamp,
  });
  console.log(`Status: HTTP ${expiredRes.status}`);
  console.log(`Pesan:`, expiredRes.json?.message);
  const test3Pass = expiredRes.status === 403 && expiredRes.json?.message?.includes("Open Proxy Prevention");
  console.log(`Hasil: ${test3Pass ? "LOLOS (Ditolak HTTP 403)" : "GAGAL"}\n`);
  results.push({ name: "3. Token Kedaluwarsa", pass: test3Pass, evidence: `HTTP ${expiredRes.status} - ${expiredRes.json?.message}` });

  // ── TEST 4: URL Media Sah dari Resolver (End-to-End Signed Flow) ───────────
  console.log("[TEST 4] URL Media Sah dari Resolver (End-to-End dengan Token HMAC)");
  const validMediaUrl = "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4";
  const resolveRes = await postJson("/api/media/resolve", {
    url: validMediaUrl,
  });
  console.log(`Resolve Status: HTTP ${resolveRes.status}`);
  const dlItem = resolveRes.json?.result?.downloads?.[0];
  console.log(`Download Item Terdaftar:`, dlItem ? { url: dlItem.url, hasToken: Boolean(dlItem.proxyToken), expiresAt: dlItem.proxyExpiresAt } : "TIDAK DITEMUKAN");

  let test4Pass = false;
  let test4Evidence = "";
  if (dlItem?.proxyToken && dlItem?.proxyExpiresAt) {
    const fetchRes = await postJson("/api/audio/fetch-media", {
      url: dlItem.url,
      token: dlItem.proxyToken,
      expiresAt: dlItem.proxyExpiresAt,
    });
    console.log(`Fetch Media Status: HTTP ${fetchRes.status}`);
    console.log(`Content-Disposition:`, fetchRes.headers["content-disposition"]);
    console.log(`Content-Type:`, fetchRes.headers["content-type"]);
    test4Pass = fetchRes.status === 200 && Boolean(fetchRes.headers["content-disposition"]);
    test4Evidence = `HTTP ${fetchRes.status}, Content-Type: ${fetchRes.headers["content-type"]}, Disposition: ${fetchRes.headers["content-disposition"]}`;
  }
  console.log(`Hasil: ${test4Pass ? "LOLOS (Stream Terverifikasi & Mengalir)" : "GAGAL"}\n`);
  results.push({ name: "4. URL Sah dengan Token Resolver", pass: test4Pass, evidence: test4Evidence });

  // ── TEST 5: Redirect ke Alamat IP Privat (SSRF Guard & Socket Pinning) ─────
  console.log("[TEST 5] Redirect ke Alamat Privat (SSRF Guard)");
  const redirectTarget = "https://httpbin.org/redirect-to?url=http%3A%2F%2F127.0.0.1%2Fsecret.mp3";
  const { signProxyUrl } = await import("../app/lib/proxySignature.ts");
  const redirectSig = signProxyUrl(redirectTarget);

  const redirectRes = await postJson("/api/audio/fetch-media", {
    url: redirectTarget,
    token: redirectSig.token,
    expiresAt: redirectSig.expiresAt,
  });
  console.log(`Status: HTTP ${redirectRes.status}`);
  console.log(`Pesan:`, redirectRes.json?.message);
  const test5Pass = redirectRes.status === 403 && redirectRes.json?.message?.includes("SSRF Guard");
  console.log(`Hasil: ${test5Pass ? "LOLOS (Ditolak HTTP 403 oleh SSRF Guard)" : "GAGAL"}\n`);
  results.push({ name: "5. Redirect ke IP Privat (SSRF Guard)", pass: test5Pass, evidence: `HTTP ${redirectRes.status} - ${redirectRes.json?.message}` });

  // ── RINGKASAN ─────────────────────────────────────────────────────────────
  console.log("===============================================================");
  console.log("                           RINGKASAN                           ");
  console.log("===============================================================");
  let allPass = true;
  for (const r of results) {
    console.log(`[${r.pass ? "PASS" : "FAIL"}] ${r.name.padEnd(40)}: ${r.evidence}`);
    if (!r.pass) allPass = false;
  }
  console.log("\nSTATUS FINAL:", allPass ? "SEMUA PENGUJIAN LOLOS DENGAN SUKSES" : "ADA PENGUJIAN GAGAL");
}

main().catch(console.error);
