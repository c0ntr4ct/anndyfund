"use client";

import React, { useEffect, useMemo, useState } from "react";

// --- Config ---
const ETHERSCAN_V2_BASE = "https://api.etherscan.io/v2/api";
const CONTRACT_ADDRESS = "0x5AF9Ef13C0b7F82d3a3c52D93F27039bc8A71d63"; // ANNDY
const DEV_WALLET = "0x3da1D16C93CB5Dd30457bD7E2670663026b22E2c";
const START_BLOCK = 41000000;
const TARGET_BNB = 100;

const API_KEY =
  process.env.NEXT_PUBLIC_ETHERSCAN_KEY ||
  "NV1B51YDE2EI7AQR9J3J2X5BQGBCWA9CWH";

type Donation = {
  hash: string;
  timeStamp: number;
  valueWei: string;
  valueBNB: number;
  from: string;
  to: string;
};

function formatBNBFromWei(wei: string): number {
  return Number(wei) / 1e18;
}

function bnbStr(weiOrBNB: string | number, decimals = 4) {
  const n =
    typeof weiOrBNB === "string" ? formatBNBFromWei(weiOrBNB) : Number(weiOrBNB);
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function shortHash(h: string) {
  return `${h.slice(0, 6)}…${h.slice(-4)}`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  return (
    <div className="w-full bg-gray-200 rounded-2xl h-3">
      <div className="h-3 rounded-2xl bg-black" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Page() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalBNB, setTotalBNB] = useState<number>(0);

  const valid = useMemo(() => {
    return (
      /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS) &&
      /^0x[a-fA-F0-9]{40}$/.test(DEV_WALLET) &&
      !!API_KEY
    );
  }, []);

  async function fetchDonations() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const url = new URL(ETHERSCAN_V2_BASE);
      url.searchParams.set("chainid", "56");
      url.searchParams.set("module", "account");
      url.searchParams.set("action", "txlistinternal");
      url.searchParams.set("address", CONTRACT_ADDRESS);
      url.searchParams.set("startblock", String(START_BLOCK || 1));
      url.searchParams.set("endblock", "99999999");
      url.searchParams.set("sort", "asc");
      url.searchParams.set("apikey", API_KEY);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        status?: string;
        message?: string;
        result?: any[];
      };

      if (!(data.status === "1" || data.message === "OK")) {
        throw new Error(
          (data.result as any as string) || data.message || "API Error"
        );
      }

      const rows = (data.result || []).filter((tx: any) => {
        return (
          String(tx.to || "").toLowerCase() === DEV_WALLET.toLowerCase() &&
          tx.isError === "0" &&
          tx.value &&
          tx.value !== "0"
        );
      });

      const mapped: Donation[] = rows.map((tx: any) => ({
        hash: tx.hash,
        timeStamp: Number(tx.timeStamp) * 1000,
        valueWei: tx.value,
        valueBNB: formatBNBFromWei(tx.value),
        from: tx.from,
        to: tx.to,
      }));

      const total = mapped.reduce((acc, r) => acc + r.valueBNB, 0);
      setDonations(mapped.reverse());
      setTotalBNB(total);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDonations();
  }, []);

  const last = donations[0];

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-5xl mx-auto p-6 grid gap-6">

        {/* --- Social Icons (X + DexScreener) --- */}
        <div className="flex items-center justify-end gap-4">
          {/* X (Twitter) */}
          <a
            href="https://x.com/AnndyFund"
            target="_blank"
            rel="noreferrer"
            className="w-14 h-14 flex items-center justify-center rounded-full bg-black hover:bg-neutral-800 transition"
            title="X (Twitter)"
          >
            <img
              src="/xlogo.svg"
              alt="X Logo"
              className="w-8 h-8 invert"
              width={32}
              height={32}
            />
          </a>

          {/* Dexscreener */}
          <a
            href="https://dexscreener.com/bsc/0xa5909b4bcc35515d9f7856a07ee468e71076d0d2"
            target="_blank"
            rel="noreferrer"
            className="w-14 h-14 flex items-center justify-center rounded-full bg-black hover:bg-neutral-800 transition"
            title="DexScreener"
          >
            <img
              src="/dexscreener.svg"
              alt="DexScreener"
              className="w-8 h-8 invert"
              width={32}
              height={32}
            />
          </a>
        </div>

        {/* Contract line */}
        <div className="text-sm md:text-base">
          <span className="font-semibold">$ANNDY Contract:</span>{" "}
          <a
            className="underline"
            href={`https://bscscan.com/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {CONTRACT_ADDRESS}
          </a>
        </div>

        {/* Main metrics */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-2xl p-4">
            <div className="text-sm text-gray-600">Total Donated</div>
            <div className="text-3xl font-semibold">
              {totalBNB.toLocaleString(undefined, { maximumFractionDigits: 4 })} BNB
            </div>
          </div>
          <div className="border rounded-2xl p-4">
            <div className="text-sm text-gray-600">Number of Donations</div>
            <div className="text-3xl font-semibold">{donations.length}</div>
          </div>
          <div className="border rounded-2xl p-4">
            <div className="text-sm text-gray-600">Latest Donation</div>
            <div className="text-lg">
              {last ? (
                <span>
                  {bnbStr(last.valueWei)} BNB on{" "}
                  {new Date(last.timeStamp).toLocaleString()}
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        </section>

        {/* Goal progress */}
        <section className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Goal Progress</div>
            <div className="text-sm font-medium">
              {TARGET_BNB > 0
                ? `${Math.min(100, (totalBNB / TARGET_BNB) * 100).toFixed(1)}%`
                : "—"}
            </div>
          </div>
          <ProgressBar value={totalBNB} max={TARGET_BNB || 1} />
          <div className="text-sm text-gray-600">
            {totalBNB.toLocaleString(undefined, { maximumFractionDigits: 4 })} /{" "}
            {TARGET_BNB} BNB
          </div>
        </section>

        {/* Latest donations */}
        <section className="border rounded-2xl overflow-hidden">
          <div className="p-4 font-medium border-b">Latest Donations</div>
          <div className="divide-y">
            {loading && (
              <div className="p-4 text-sm text-gray-600">Loading…</div>
            )}
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50">
                {error}
              </div>
            )}
            {!loading && donations.length === 0 && !error && (
              <div className="p-4 text-sm text-gray-600">No data available.</div>
            )}
            {donations.slice(0, 12).map((d) => (
              <div key={d.hash} className="p-4 grid md:grid-cols-4 gap-2 text-sm">
                <div className="font-medium">{bnbStr(d.valueWei)} BNB</div>
                <div className="text-gray-600">
                  {new Date(d.timeStamp).toLocaleString()}
                </div>
                <div className="text-gray-600">From: {shortHash(d.from)}</div>
                <div>
                  <a
                    className="underline"
                    href={`https://bscscan.com/tx/${d.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortHash(d.hash)}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
