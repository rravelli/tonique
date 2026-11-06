import { useTranslation } from "react-i18next";
import { TONIQUE_URL } from "./constants";

const pull = (number: number) => `${TONIQUE_URL}/pull/${number}`;
const issue = (number: number) => `${TONIQUE_URL}/issues/${number}`;

const PHASES = [
	{
		id: "done",
		color: "#4fbf7f",
		items: [
			{ id: "warp", href: pull(64) },
		],
	},
	{
		id: "now",
		color: "#e8b33c",
		items: [
			{ id: "recording", href: issue(37) },
			{ id: "fades", href: issue(58) },
		],
	},
	{
		id: "next",
		color: "#4a9fe0",
		items: [
			{ id: "effects", href: issue(38) },
		],
	},
	{
		id: "later",
		color: "#9a7be6",
		items: [
			{ id: "midi", href: issue(42) },
			{ id: "plugins", href: issue(41) },
			{ id: "automation", href: issue(40) },
		],
	},
];

export default function Roadmap() {
	const { t } = useTranslation();
	return (
		<section id="roadmap" className="py-20 md:py-32 bg-[#14161b] border-t border-[var(--tq-line)]">
			<div className="max-w-6xl mx-auto px-4">
				<div className="mb-10 md:mb-14 max-w-3xl">
					<p className="tq-label mb-4">{t("roadmap.label")}</p>
					<h2 className="tq-display text-5xl md:text-7xl mb-5">
						{t("roadmap.title")}
					</h2>
					<p className="text-lg md:text-xl text-[var(--tq-muted)]">
						{t("roadmap.description")}
					</p>
				</div>

				<div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-y-0 pt-0 lg:pt-8">
					{/* The playhead: everything to its left is already there. */}
					<div
						aria-hidden="true"
						className="hidden lg:block absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
						style={{ left: "calc(25% - 1px - 0.25rem)" }}
					>
						<span className="absolute -top-0.5 -left-1.5 h-0 w-0 border-x-[7px] border-x-transparent border-t-[9px] border-t-white" />
						<span className="absolute -top-1 left-3 font-mono text-xs whitespace-nowrap">
							{t("roadmap.today")}
						</span>
					</div>
					{PHASES.map((phase) => (
						<div key={phase.id}>
							<h3 className="flex items-center gap-2 font-semibold mb-4 lg:pr-4">
								<span
									aria-hidden="true"
									className={`h-2.5 w-2.5 rounded-full ${phase.id === "now" ? "tq-pulse" : ""}`}
									style={{ background: phase.color }}
								/>
								{t(`roadmap.phases.${phase.id}`)}
							</h3>
							<ul className="space-y-3 lg:pr-3">
								{phase.items.map((item) => (
									<li key={item.id}>
										<a
											href={item.href}
											target="_blank"
											rel="noopener noreferrer"
											className="block rounded-md overflow-hidden bg-[#1d2026] border border-transparent hover:border-white/40 transition-colors"
										>
											<span
												className="block px-3 py-1.5 font-mono text-sm font-semibold text-[#101114]"
												style={{ background: phase.color }}
											>
												{t(`roadmap.items.${item.id}.title`)}
											</span>
											<span className="block px-3 py-2.5 text-sm text-[var(--tq-muted)]">
												{t(`roadmap.items.${item.id}.description`)}
											</span>
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--tq-muted)]">
					<a
						href={`${TONIQUE_URL}/milestones`}
						target="_blank"
						rel="noopener noreferrer"
						className="tq-link"
					>
						{t("roadmap.link")}
					</a>
					<span>{t("roadmap.updated")}</span>
				</p>
			</div>
		</section>
	);
}
