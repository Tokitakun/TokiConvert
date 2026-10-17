// Comprehensive P0 Security Verification Suite for TokiConvert
// Tests all 8 requirements specified in the user request

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

async function run() {
  console.log("================================================================================");
  console.log("               TOKICONVERT P0 SECURITY VERIFICATION SUITE                       ");
  console.log("================================================================================\n");

  const results = [];

  // ── TEST 1: Production tanpa PROXY_SECRET ───────────────────────────────────
  console.log("[TEST 1] Production tanpa PROXY_SECRET: Gagal secara aman dan tidak memakai fallback");
  const origEnv = process.env.NODE_ENV;
  const origSecret = process.env.PROXY_SECRET;

  process.env.NODE_ENV = "production";
  delete process.env.PROXY_SECRET;

  const { signProxyUrl, verifyProxyUrl } = await import("../app/lib/proxySignature.ts");

  let t1SignThrown = false;
  let t1SignError = "";
  try {
    signProxyUrl("https://archive.org/media.mp3");
  } catch (err) {
    t1SignThrown = true;
    t1SignError = err instanceof Error ? err.message : String(err);
  }

  const t1Verify = verifyProxyUrl("https://archive.org/media.mp3", "fake_token_hex", Math.floor(Date.now() / 1000) + 3600);

  // Restore env
  process.env.NODE_ENV = origEnv;
  if (origSecret) process.env.PROXY_SECRET = origSecret;

  const t1Pass = t1SignThrown && t1SignError.includes("SERVER_CONFIG_ERROR") && t1Verify === false;
  console.log(`- signProxyUrl thrown in production without secret: ${t1SignThrown} (${t1SignError})`);
  console.log(`- verifyProxyUrl failed closed without crashing: ${t1Verify === false}`);
  results.push({
    test: "1. Production tanpa PROXY_SECRET",
    status: t1Pass ? "PASS" : "FAIL",
    detail: t1Pass ? "Throw SERVER_CONFIG_ERROR pada sign, fail-closed false pada verify." : "Gagal menegakkan fail-closed."
  });

  // ── TEST 2: Dua route dengan secret yang sama ───────────────────────────────
  console.log("\n[TEST 2] Dua route dengan secret yang sama: token sah tetap berfungsi");
  const testSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  process.env.PROXY_SECRET = testSecret;

  const validUrl = "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4";
  const sigSameSecret = signProxyUrl(validUrl);
  const verifySameSecret = verifyProxyUrl(validUrl, sigSameSecret.token, sigSameSecret.expiresAt);

  const t2Pass = verifySameSecret === true;
  console.log(`- Token verifikasi dengan secret identik: ${verifySameSecret}`);
  results.push({
    test: "2. Secret yang sama antar route",
    status: t2Pass ? "PASS" : "FAIL",
    detail: t2Pass ? "Token valid diverifikasi sukses (true)." : "Verifikasi token gagal."
  });

  // ── TEST 3: Dua route dengan secret berbeda ─────────────────────────────────
  console.log("\n[TEST 3] Dua route dengan secret berbeda: verifikasi token gagal");
  const secretA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const secretB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

  process.env.PROXY_SECRET = secretA;
  const sigSecretA = signProxyUrl(validUrl);

  process.env.PROXY_SECRET = secretB;
  const verifySecretB = verifyProxyUrl(validUrl, sigSecretA.token, sigSecretA.expiresAt);

  // Restore testSecret
  process.env.PROXY_SECRET = testSecret;

  const t3Pass = verifySecretB === false;
  console.log(`- Token ditandatangani Secret A diverifikasi dengan Secret B: ${verifySecretB}`);
  results.push({
    test: "3. Secret berbeda antar route",
    status: t3Pass ? "PASS" : "FAIL",
    detail: t3Pass ? "Ditolak (false), tidak cocok." : "Lolos secara keliru (FAIL)."
  });

  // ── TEST 4: Direct media URL dari host allowlist yang sah ───────────────────
  console.log("\n[TEST 4] Direct media URL dari host allowlist yang sah: tetap berfungsi");
  const resolveSah = await postJson("/api/media/resolve", {
    url: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
  });
  console.log(`- Resolve Status: HTTP ${resolveSah.status}`);
  const dlItemSah = resolveSah.json?.result?.downloads?.[0];
  console.log(`- Resolver Token Diterbitkan: ${Boolean(dlItemSah?.proxyToken)}`);

  let t4FetchOk = false;
  let t4FetchDetails = "";
  if (dlItemSah?.proxyToken) {
    const fetchSah = await postJson("/api/audio/fetch-media", {
      url: dlItemSah.url,
      token: dlItemSah.proxyToken,
      expiresAt: dlItemSah.proxyExpiresAt,
    });
    console.log(`- Fetch Media Status: HTTP ${fetchSah.status}`);
    console.log(`- Content-Disposition:`, fetchSah.headers["content-disposition"]);
    t4FetchOk = fetchSah.status === 200 && Boolean(fetchSah.headers["content-disposition"]);
    t4FetchDetails = `HTTP ${fetchSah.status}, Content-Disposition: ${fetchSah.headers["content-disposition"]}`;
  }

  const t4Pass = resolveSah.status === 200 && t4FetchOk;
  results.push({
    test: "4. Direct media URL dari allowlist sah",
    status: t4Pass ? "PASS" : "FAIL",
    detail: t4Pass ? `Berhasil di-resolve dan diunduh via proxy (${t4FetchDetails})` : "Gagal mengunduh direct media sah."
  });

  // ── TEST 5: https://example.com/arbitrary_file.mp3 tidak memperoleh token ──
  console.log("\n[TEST 5] https://example.com/arbitrary_file.mp3: tidak memperoleh token sah");
  const arbitraryUrl = "https://example.com/arbitrary_file.mp3";
  const resolveArbitrary = await postJson("/api/media/resolve", {
    url: arbitraryUrl,
  });
  console.log(`- Resolve Status: HTTP ${resolveArbitrary.status}, Pesan:`, resolveArbitrary.json?.message);
  const dlItemArbitrary = resolveArbitrary.json?.result?.downloads?.[0];
  const hasArbitraryToken = Boolean(dlItemArbitrary?.proxyToken);
  console.log(`- Token Diterbitkan untuk example.com: ${hasArbitraryToken}`);

  // Coba paksa kirim ke fetch-media tanpa token atau token palsu
  const fetchArbitrary = await postJson("/api/audio/fetch-media", {
    url: arbitraryUrl,
  });
  console.log(`- Fetch Media Status tanpa token: HTTP ${fetchArbitrary.status}`);

  const t5Pass = resolveArbitrary.status === 403 && !hasArbitraryToken && fetchArbitrary.status === 403;
  results.push({
    test: "5. URL arbitrer (example.com/file.mp3)",
    status: t5Pass ? "PASS" : "FAIL",
    detail: t5Pass
      ? `Ditolak HTTP 403 oleh resolver & proxy: "${resolveArbitrary.json?.message}"`
      : "Celah terbuka: token diterbitkan untuk domain arbitrer."
  });

  // ── TEST 6: URL hasil scraper dari host yang tidak diizinkan ────────────────
  console.log("\n[TEST 6] URL hasil scraper dari host yang tidak diizinkan: tidak memperoleh token");
  const { isSafeMediaUrlToSign } = await import("../app/lib/mediaAllowlist.ts");

  const unallowedScraperUrls = [
    "https://malicious-cdn.biz/stream.mp4",
    "http://127.0.0.1:8080/exploit.mp3",
    "http://169.254.169.254/latest/meta-data/stream.mp3",
    "https://evil.ru:8443/music.ogg",
  ];

  const allowedScraperUrls = [
    "https://rr1---sn-4g5ednss.googlevideo.com/videoplayback?expire=123",
    "https://v16-webapp-prime.tiktokcdn.com/video/tos/useast2a/tos-useast2a-ve-0068c001/xxx.mp4",
    "https://cf-media.sndcdn.com/preview/0/128/xxx.mp3",
  ];

  let unallowedBlocked = true;
  for (const u of unallowedScraperUrls) {
    const isSafe = isSafeMediaUrlToSign(u);
    console.log(`- Evaluasi URL tidak diizinkan "${u}": safe=${isSafe}`);
    if (isSafe) unallowedBlocked = false;
  }

  let allowedAccepted = true;
  for (const u of allowedScraperUrls) {
    const isSafe = isSafeMediaUrlToSign(u);
    console.log(`- Evaluasi URL sah scraper "${u}": safe=${isSafe}`);
    if (!isSafe) allowedAccepted = false;
  }

  const t6Pass = unallowedBlocked && allowedAccepted;
  results.push({
    test: "6. Scraper URL Allowlist Filtering",
    status: t6Pass ? "PASS" : "FAIL",
    detail: t6Pass ? "Semua host tidak diizinkan/privat ditolak tanda tangannya; CDN sah disetujui." : "Ada URL tidak aman yang lolos filter."
  });

  // ── TEST 7: URL loopback, IP privat, cloud metadata, port nonstandar ────────
  console.log("\n[TEST 7] URL menuju loopback, IP privat, cloud metadata, port nonstandar, atau redirect ke jaringan privat");
  const ssrfCases = [
    { label: "Resolve ke Loopback", endpoint: "/api/media/resolve", body: { url: "http://127.0.0.1/audio.mp3" }, expected: 403 },
    { label: "Resolve Port Nonstandar", endpoint: "/api/media/resolve", body: { url: "https://archive.org:8443/test.mp3" }, expected: 400 },
    { label: "Fetch Redirect ke Loopback", endpoint: "/api/audio/fetch-media", body: { url: "https://httpbin.org/redirect-to?url=http%3A%2F%2F127.0.0.1%2Fsecret.mp3" }, expected: 403 },
    { label: "Fetch Redirect ke Cloud Metadata", endpoint: "/api/audio/fetch-media", body: { url: "https://httpbin.org/redirect-to?url=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data" }, expected: 403 },
  ];

  let t7AllPass = true;
  for (const c of ssrfCases) {
    const res = await postJson(c.endpoint, c.body);
    const pass = res.status === c.expected;
    console.log(`- [${c.label}]: HTTP ${res.status} (diharapkan ${c.expected}) - "${res.json?.message}"`);
    if (!pass) t7AllPass = false;
  }

  results.push({
    test: "7. Proteksi SSRF, Loopback & Redirect",
    status: t7AllPass ? "PASS" : "FAIL",
    detail: t7AllPass ? "Seluruh percobaan loopback, metadata, port nonstandar, dan redirect ditolak (HTTP 400/403)." : "Ada uji SSRF yang gagal."
  });

  // ── TEST 8: Unduhan sah tetap tunduk pada batas ukuran dan validasi token ────
  console.log("\n[TEST 8] Unduhan sah tetap tunduk pada batas ukuran dan validasi token");
  // Coba unduh berkas > 50 MB dari host sah (archive.org 64.7 MB)
  const largeMediaUrl = "https://archive.org/download/ElephantsDream/ed_hd.mp4";
  const resolveLarge = await postJson("/api/media/resolve", { url: largeMediaUrl });
  const dlItemLarge = resolveLarge.json?.result?.downloads?.[0];

  let t8Pass = false;
  let t8Details = "";
  if (dlItemLarge?.proxyToken) {
    const fetchLarge = await postJson("/api/audio/fetch-media", {
      url: dlItemLarge.url,
      token: dlItemLarge.proxyToken,
      expiresAt: dlItemLarge.proxyExpiresAt,
    });
    console.log(`- Fetch Media > 50 MB: HTTP ${fetchLarge.status}, Pesan:`, fetchLarge.json?.message);
    t8Pass = fetchLarge.status === 413 && fetchLarge.json?.message?.includes("50 MB");
    t8Details = `HTTP ${fetchLarge.status}: ${fetchLarge.json?.message}`;
  } else {
    t8Details = "Resolver gagal memberikan token untuk archive.org";
  }

  results.push({
    test: "8. Batas ukuran 50 MB pada unduhan sah",
    status: t8Pass ? "PASS" : "FAIL",
    detail: t8Details
  });

  // ── RINGKASAN FINAL ────────────────────────────────────────────────────────
  console.log("\n================================================================================");
  console.log("                           RINGKASAN HASIL AUDIT P0                             ");
  console.log("================================================================================");
  let allPass = true;
  for (const r of results) {
    console.log(`[${r.status}] ${r.test.padEnd(50)}: ${r.detail}`);
    if (r.status !== "PASS") allPass = false;
  }
  console.log("\nSTATUS FINAL:", allPass ? "100% PASS - SELURUH PERSYARATAN TERPENUHI" : "MASIH ADA KEGAGALAN");
}

run().catch(console.error);
