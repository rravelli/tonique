import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TONIQUE_DOWNLOAD_URL, TONIQUE_URL } from "./constants";
import { Footer, Nav } from "./Chrome";

type Os = "windows" | "macos" | "linux";
type Asset = { name: string; size: number; browser_download_url: string };
type Release = { tag_name: string; published_at: string; assets: Asset[] };

const SYSTEMS: { id: Os; name: string; file: RegExp }[] = [
	{ id: "windows", name: "Windows", file: /windows-x86_64\.zip$/ },
	{ id: "macos", name: "macOS", file: /macos-universal\.dmg$/ },
	{ id: "linux", name: "Linux", file: /linux-x86_64\.tar\.gz$/ },
];

const STEPS: Record<Os, string[]> = {
	windows: ["extract", "run", "warning"],
	macos: ["drag", "launch", "allow"],
	linux: ["extract", "install", "open"],
};

function linuxCommands(file?: string): Record<string, string> {
	const archive = file ?? "tonique-*-linux-x86_64.tar.gz";
	const folder = file ? file.replace(/\.tar\.gz$/, "") : "tonique-*-linux-x86_64";
	return {
		extract: `tar -xzf ${archive}`,
		install: `cd ${folder}\n./install.sh`,
		open: "~/.local/bin/tonique",
		uninstall: "./install.sh --uninstall",
	};
}

function detect(): { os: Os; mobile: boolean } {
	const agent = navigator.userAgent;
	const iPad = /Mac/.test(agent) && navigator.maxTouchPoints > 1;
	if (iPad || /Android|iPhone|iPad|iPod/i.test(agent)) {
		return { os: "windows", mobile: true };
	}
	if (/Mac/.test(agent)) return { os: "macos", mobile: false };
	if (/Linux|X11/.test(agent)) return { os: "linux", mobile: false };
	return { os: "windows", mobile: false };
}

function useLatestRelease() {
	const [release, setRelease] = useState<Release | null>(null);
	useEffect(() => {
		const controller = new AbortController();
		fetch("https://api.github.com/repos/rravelli/ToniqueDAW/releases/latest", {
			signal: controller.signal,
		})
			.then((response) => (response.ok ? response.json() : null))
			.then(setRelease)
			// The buttons then lead to the release page, which works just as well.
			.catch(() => setRelease(null));
		return () => controller.abort();
	}, []);
	return release;
}

function Code({ children }: { children: string }) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(children);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Selecting the text by hand still works.
		}
	};
	return (
		<div className="mt-3 flex items-start gap-3 rounded-md bg-black/50 border border-[var(--tq-line)] px-3 py-2.5">
			<pre className="flex-1 min-w-0 overflow-x-auto font-mono text-sm leading-6">
				{children}
			</pre>
			<button
				type="button"
				onClick={copy}
				className="shrink-0 text-xs font-semibold text-[var(--tq-muted)] hover:text-white transition-colors leading-6"
			>
				{copied ? t("get.copied") : t("get.copy")}
			</button>
		</div>
	);
}

export default function DownloadPage() {
	const { t, i18n } = useTranslation();
	const [{ os: detected, mobile }] = useState(detect);
	const [os, setOs] = useState<Os>(detected);
	const release = useLatestRelease();
	const language = i18n.resolvedLanguage ?? "en";

	const system = SYSTEMS.find((candidate) => candidate.id === os)!;
	const asset = release?.assets.find((file) => system.file.test(file.name));
	const commands = linuxCommands(
		release?.assets.find((file) => /linux-x86_64\.tar\.gz$/.test(file.name))?.name
	);
	const size = asset
		? new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(asset.size / 1e6)
		: null;

	return (
		<div className="tq-page min-h-screen flex flex-col">
			<Nav />
			<main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-14 md:pt-20 pb-20">
				<img
					src="/tonique/logo.svg"
					alt=""
					width={64}
					height={64}
					className="mb-6"
				/>
				<h1 className="tq-display text-6xl md:text-8xl mb-4">{t("get.title")}</h1>
				<p className="text-lg text-[var(--tq-muted)] mb-10 min-h-7">
					{release
						? t("get.version", {
								version: release.tag_name.replace(/^v/, ""),
								date: new Intl.DateTimeFormat(language, { dateStyle: "long" }).format(
									new Date(release.published_at)
								),
							})
						: t("get.free")}
				</p>

				{mobile && (
					<p className="mb-8 rounded-md border border-[var(--tq-line)] bg-[var(--tq-panel)] px-4 py-3">
						{t("get.mobile")}
					</p>
				)}

				<div
					role="group"
					aria-label={t("get.system")}
					className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--tq-panel)] mb-8"
				>
					{SYSTEMS.map((candidate) => (
						<button
							key={candidate.id}
							type="button"
							aria-pressed={candidate.id === os}
							onClick={() => setOs(candidate.id)}
							className={`py-2.5 rounded-md font-semibold transition-colors ${
								candidate.id === os
									? "bg-white text-black"
									: "text-[var(--tq-muted)] hover:text-white"
							}`}
						>
							{candidate.name}
						</button>
					))}
				</div>

				<a
					href={asset?.browser_download_url ?? TONIQUE_DOWNLOAD_URL}
					className="tq-button w-full !py-4 text-lg"
				>
					{t("get.button", { system: system.name })}
				</a>
				<p className="mt-3 mb-12 text-sm text-[var(--tq-muted)] min-h-5 break-all">
					{asset && `${asset.name} · ${t("get.size", { size })}`}
				</p>

				<h2 className="text-2xl font-bold mb-6">{t("get.installTitle")}</h2>
				<ol className="space-y-6 mb-6">
					{STEPS[os].map((step, index) => (
						<li key={step} className="flex gap-4">
							<span
								aria-hidden="true"
								className="shrink-0 h-8 w-8 rounded-full bg-[var(--tq-panel)] border border-[var(--tq-line)] flex items-center justify-center font-mono text-sm"
							>
								{index + 1}
							</span>
							<div className="min-w-0 flex-1 pt-0.5">
								<p>{t(`get.${os}.steps.${step}`)}</p>
								{os === "linux" && <Code>{commands[step]}</Code>}
							</div>
						</li>
					))}
				</ol>
				{os === "macos" && (
					<p className="text-sm text-[var(--tq-muted)] mb-6">{t("get.macos.older")}</p>
				)}

				<dl className="mt-10 pt-8 border-t border-[var(--tq-line)] grid grid-cols-1 sm:grid-cols-2 gap-8">
					<div>
						<dt className="font-semibold mb-1">{t("get.requirements")}</dt>
						<dd className="text-[var(--tq-muted)]">{t(`get.${os}.requirements`)}</dd>
					</div>
					<div>
						<dt className="font-semibold mb-1">{t("get.uninstall")}</dt>
						<dd className="text-[var(--tq-muted)]">
							{t(`get.${os}.uninstall`)}
							{os === "linux" && <Code>{commands.uninstall}</Code>}
						</dd>
					</div>
				</dl>

				<p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
					<a href={`${TONIQUE_URL}/releases`} className="tq-link">
						{t("get.allVersions")}
					</a>
					<a href={`${TONIQUE_URL}#build-from-source`} className="tq-link">
						{t("get.fromSource")}
					</a>
				</p>
			</main>
			<Footer />
		</div>
	);
}
