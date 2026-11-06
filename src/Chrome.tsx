import { useTranslation } from "react-i18next";
import { EMAIL, PORTFOLIO_URL, TONIQUE_URL } from "./constants";

export const PAGE_URL = "/tonique/";
export const DOWNLOAD_PAGE_URL = "/tonique/download/";

const LINKS = ["listen", "features", "themes", "roadmap"];

export function Nav() {
	const { t, i18n } = useTranslation();
	const next = i18n.resolvedLanguage === "fr" ? "en" : "fr";
	return (
		<header className="sticky top-0 z-20 border-b border-[var(--tq-line)] bg-[#0f1014]/85 backdrop-blur">
			<nav className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
				<a
					href={`${PAGE_URL}#top`}
					className="flex items-center gap-2.5 font-bold text-lg"
				>
					<img
						src="/tonique/logo.svg"
						alt=""
						width={32}
						height={32}
					/>
					Tonique
				</a>
				<div className="hidden md:flex gap-6 text-sm text-[var(--tq-muted)]">
					{LINKS.map((link) => (
						<a
							key={link}
							href={`${PAGE_URL}#${link}`}
							className="hover:text-white transition-colors"
						>
							{t(`nav.${link}`)}
						</a>
					))}
					<a href={TONIQUE_URL} className="hover:text-white transition-colors">
						GitHub
					</a>
				</div>
				<div className="ml-auto flex items-center gap-4">
					<button
						type="button"
						onClick={() => i18n.changeLanguage(next)}
						aria-label={t("nav.language")}
						className="text-sm font-mono text-[var(--tq-muted)] hover:text-white transition-colors uppercase"
					>
						{next}
					</button>
					<a href={DOWNLOAD_PAGE_URL} className="tq-button !py-2 !px-4 text-sm">
						{t("nav.download")}
					</a>
				</div>
			</nav>
		</header>
	);
}

export function Footer() {
	const { t } = useTranslation();
	return (
		<footer className="px-4 py-8 border-t border-[var(--tq-line)] text-sm text-[var(--tq-muted)]">
			<div className="max-w-6xl mx-auto flex flex-wrap gap-x-6 gap-y-2">
				<span>
					{t("footer.madeBy")}{" "}
					<a href={PORTFOLIO_URL} className="tq-link">
						Rémi Ravelli
					</a>
				</span>
				<a href={TONIQUE_URL} className="tq-link sm:ml-auto">
					GitHub
				</a>
				<a href={`mailto:${EMAIL}`} className="tq-link">
					{t("footer.contact")}
				</a>
			</div>
		</footer>
	);
}
