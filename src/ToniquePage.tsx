import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DOWNLOAD_PAGE_URL, Footer, Nav } from "./Chrome";
import Mixer from "./Mixer";
import Roadmap from "./Roadmap";

const THEMES = [{"id": "dark", "name": "Dark", "bg": "#222529", "accent": "#00c9d4"}, {"id": "light", "name": "Light", "bg": "#eaecf0", "accent": "#00805f"}, {"id": "studio", "name": "Studio", "bg": "#222224", "accent": "#4da3ff"}, {"id": "console", "name": "Console", "bg": "#222634", "accent": "#8c8cff"}, {"id": "session", "name": "Session", "bg": "#bdbdbd", "accent": "#8f3900"}, {"id": "slate", "name": "Slate", "bg": "#28323a", "accent": "#ff9f2e"}, {"id": "tape", "name": "Tape", "bg": "#271f19", "accent": "#f2a93b"}, {"id": "graphite", "name": "Graphite", "bg": "#1d1d1d", "accent": "#ff6a13"}, {"id": "high-contrast", "name": "High contrast", "bg": "#1a1a1a", "accent": "#ffd400"}];

const FEATURES = ["bring", "loop", "mix", "warp"];
const EFFECTS = ["filter", "echo", "spectrum", "utility"];
const ENGINE = ["rust", "cores", "native", "open"];

function Reveal({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.6 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

function SectionHeading({ id }: { id: string }) {
	const { t } = useTranslation();
	return (
		<Reveal className="mb-10 md:mb-14 max-w-3xl">
			<p className="tq-label mb-4">{t(`${id}.label`)}</p>
			<h2 className="tq-display text-5xl md:text-7xl mb-5">
				{t(`${id}.title`)}
			</h2>
			<p className="text-lg md:text-xl text-[var(--tq-muted)]">
				{t(`${id}.description`)}
			</p>
		</Reveal>
	);
}

function Hero() {
	const { t } = useTranslation();
	const screen = useRef<HTMLDivElement>(null);
	const reduced = useReducedMotion();
	const { scrollYProgress } = useScroll({
		target: screen,
		offset: ["start end", "center center"],
	});
	const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
	return (
		<section id="top" className="px-4 pt-16 md:pt-24 pb-16 overflow-hidden">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7 }}
					className="text-center"
				>
					<p className="tq-label mb-5">{t("hero.label")}</p>
					<h1 className="tq-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6">
						{t("hero.title")}
					</h1>
					<p className="text-lg md:text-2xl text-[var(--tq-muted)] max-w-2xl mx-auto mb-8">
						{t("hero.description")}
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 md:mb-16">
						<a href={DOWNLOAD_PAGE_URL} className="tq-button w-full sm:w-auto">
							{t("hero.download")}
						</a>
						<a href="#listen" className="tq-link">
							{t("hero.listen")}
						</a>
					</div>
				</motion.div>
				<motion.div
					ref={screen}
					style={{ scale: reduced ? 1 : scale }}
					className="relative rounded-xl overflow-hidden border border-[var(--tq-line)] shadow-[0_30px_120px_-30px_rgba(0,201,212,0.45)]"
				>
					<img
						src="/tonique/themes/dark.webp"
						alt={t("hero.imageAlt")}
						width={3250}
						height={2025}
						className="block w-full h-auto"
					/>
					<div className="tq-playhead" aria-hidden="true" />
				</motion.div>
			</div>
		</section>
	);
}

function Features() {
	const { t } = useTranslation();
	const track = useRef<HTMLDivElement>(null);
	const scroll = (direction: number) => {
		const element = track.current;
		if (!element) return;
		const card = element.firstElementChild as HTMLElement | null;
		element.scrollBy({
			left: direction * ((card?.offsetWidth ?? 400) + 24),
			behavior: "smooth",
		});
	};
	return (
		<section
			id="features"
			className="py-20 md:py-32 bg-[#14161b] border-y border-[var(--tq-line)]"
		>
			<div className="max-w-6xl mx-auto px-4">
				<div className="flex items-end justify-between gap-6">
					<SectionHeading id="features" />
					<div className="hidden md:flex gap-2 mb-14 shrink-0">
						{[-1, 1].map((direction) => (
							<button
								key={direction}
								type="button"
								onClick={() => scroll(direction)}
								aria-label={t(direction < 0 ? "features.previous" : "features.next")}
								className="h-12 w-12 rounded-full border border-[var(--tq-line)] hover:bg-white/10 transition-colors"
							>
								<svg
									viewBox="0 0 16 16"
									aria-hidden="true"
									className="h-4 w-4 mx-auto"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d={direction < 0 ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"} />
								</svg>
							</button>
						))}
					</div>
				</div>
			</div>
			<div
				ref={track}
				tabIndex={0}
				role="region"
				aria-label={t("features.title")}
				className="tq-carousel flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-4 px-4 lg:px-[max(1rem,calc((100vw-72rem)/2+1rem))] lg:scroll-px-[max(1rem,calc((100vw-72rem)/2+1rem))] pb-2"
			>
				{FEATURES.map((feature) => (
					<article
						key={feature}
						className="snap-start shrink-0 w-[85vw] sm:w-[32rem] lg:w-[38rem] rounded-xl border border-[var(--tq-line)] bg-[var(--tq-panel)] overflow-hidden"
					>
						<div className="aspect-[16/9] bg-[#101114] flex items-center justify-center">
							<img
								src={`/tonique/shots/${feature}.webp`}
								alt=""
								loading="lazy"
								className="h-full w-full object-contain"
							/>
						</div>
						<div className="p-6">
							<h3 className="text-xl font-bold mb-2">
								{t(`features.items.${feature}.title`)}
							</h3>
							<p className="text-[var(--tq-muted)]">
								{t(`features.items.${feature}.description`)}
							</p>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}

function Effects() {
	const { t } = useTranslation();
	return (
		<section id="effects" className="py-20 md:py-32 px-4 max-w-6xl mx-auto">
			<SectionHeading id="effects" />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{EFFECTS.map((effect) => (
					<Reveal key={effect}>
						<div className="h-48 rounded-lg bg-[#1d2026] border border-[var(--tq-line)] flex items-center justify-center p-2 mb-4">
							<img
								src={`/tonique/shots/${effect}.webp`}
								alt=""
								loading="lazy"
								className="max-h-full max-w-full object-contain"
							/>
						</div>
						<h3 className="text-lg font-bold mb-1">
							{t(`effects.items.${effect}.title`)}
						</h3>
						<p className="text-[var(--tq-muted)]">
							{t(`effects.items.${effect}.description`)}
						</p>
					</Reveal>
				))}
			</div>
		</section>
	);
}

function Themes() {
	const [active, setActive] = useState(THEMES[0]);
	const { t } = useTranslation();
	const preload = (id: string) => {
		new Image().src = `/tonique/themes/${id}.webp`;
	};
	return (
		<section
			id="themes"
			className="py-20 md:py-32 border-y border-[var(--tq-line)] transition-colors duration-500"
			style={{ background: active.bg }}
		>
			<div className="max-w-6xl mx-auto px-4">
				<div
					className="rounded-2xl p-6 md:p-10 bg-[#0f1014]/90"
				>
					<SectionHeading id="themes" />
					<div
						role="group"
						aria-label={t("themes.title")}
						className="flex flex-wrap gap-2 mb-8"
					>
						{THEMES.map((theme) => (
							<button
								key={theme.id}
								type="button"
								aria-pressed={theme.id === active.id}
								onClick={() => setActive(theme)}
								onPointerEnter={() => preload(theme.id)}
								onFocus={() => preload(theme.id)}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
									theme.id === active.id
										? "bg-white text-black border-white"
										: "border-[var(--tq-line)] hover:bg-white/10"
								}`}
							>
								<span
									aria-hidden="true"
									className="h-3 w-3 rounded-full ring-1 ring-black/30"
									style={{ background: theme.accent }}
								/>
								{theme.name}
							</button>
						))}
					</div>
					<img
						key={active.id}
						src={`/tonique/themes/${active.id}.webp`}
						alt={t("themes.imageAlt", { name: active.name })}
						width={3250}
						height={2025}
						loading="lazy"
						className="block w-full h-auto rounded-lg border border-[var(--tq-line)]"
					/>
				</div>
			</div>
		</section>
	);
}

function Engine() {
	const { t } = useTranslation();
	return (
		<section id="engine" className="py-20 md:py-32 px-4 max-w-6xl mx-auto">
			<SectionHeading id="engine" />
			<Reveal>
				<figure className="mb-14">
					<img
						src="/tonique/shots/graph.webp"
						alt={t("engine.imageAlt")}
						loading="lazy"
						className="w-full h-auto rounded-xl border border-[var(--tq-line)]"
					/>
					<figcaption className="mt-3 text-sm text-[var(--tq-muted)]">
						{t("engine.caption")}
					</figcaption>
				</figure>
			</Reveal>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[var(--tq-line)]">
				{ENGINE.map((item) => (
					<div
						key={item}
						className="py-6 sm:pr-6 lg:border-r last:border-r-0 border-[var(--tq-line)] lg:pl-6 lg:first:pl-0"
					>
						<p className="tq-label !text-xs mb-3">
							{t(`engine.items.${item}.label`)}
						</p>
						<h3 className="tq-display text-3xl mb-3">
							{t(`engine.items.${item}.title`)}
						</h3>
						<p className="text-[var(--tq-muted)]">
							{t(`engine.items.${item}.description`)}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function Download() {
	const { t } = useTranslation();
	return (
		<section
			className="py-20 md:py-32 px-4 bg-[#14161b] border-t border-[var(--tq-line)]"
		>
			<Reveal className="text-center">
				<img
					src="/tonique/logo.svg"
					alt=""
					width={80}
					height={80}
					className="mx-auto mb-6"
				/>
				<h2 className="tq-display text-6xl md:text-8xl mb-5">
					{t("download.title")}
				</h2>
				<p className="text-lg md:text-xl text-[var(--tq-muted)] mb-8">
					{t("download.description")}
				</p>
				<a href={DOWNLOAD_PAGE_URL} className="tq-button w-full sm:w-auto">
					{t("download.cta")}
				</a>
			</Reveal>
		</section>
	);
}

export default function ToniquePage() {
	const { t } = useTranslation();
	return (
		<div className="tq-page min-h-screen">
			<Nav />
			<main>
				<Hero />
				<section id="listen" className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
					<SectionHeading id="listen" />
					<Reveal>
						<Mixer />
					</Reveal>
				</section>
				<Features />
				<Effects />
				<Themes />
				<Engine />
				<Roadmap />
				<Download />
			</main>
			<Footer />
		</div>
	);
}
