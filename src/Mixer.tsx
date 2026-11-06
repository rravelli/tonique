import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { STEMS } from "./stems";
import { useStems } from "./useStems";

function waveformPath(peaks: readonly number[]) {
	const top = peaks.map((peak, i) => `${i} ${50 - peak / 2}`);
	const bottom = peaks.map(
		(peak, i) => `${peaks.length - 1 - i} ${50 + peaks[peaks.length - 1 - i] / 2}`
	);
	return `M${[...top, ...bottom].join("L")}Z`;
}

function ToggleButton({
	label,
	title,
	pressed,
	onClick,
	color,
}: {
	label: string;
	title: string;
	pressed: boolean;
	onClick: () => void;
	color: string;
}) {
	return (
		<button
			type="button"
			aria-pressed={pressed}
			aria-label={title}
			onClick={onClick}
			className="h-7 w-7 rounded text-xs font-bold transition-colors"
			style={{
				background: pressed ? color : "rgb(255 255 255 / 0.1)",
				color: pressed ? "#101114" : "var(--tq-text)",
			}}
		>
			{label}
		</button>
	);
}

export default function Mixer() {
	const { t } = useTranslation();
	const { status, toggle, position, muted, soloed, toggleMute, toggleSolo } =
		useStems();
	const playhead = useRef<HTMLDivElement>(null);
	const paths = useMemo(
		() => STEMS.map((stem) => waveformPath(stem.peaks)),
		[]
	);
	const anySolo = STEMS.some((stem) => soloed[stem.id]);

	useEffect(() => {
		if (status !== "playing") return;
		let frame = requestAnimationFrame(function draw() {
			if (playhead.current) {
				playhead.current.style.left = `${position() * 100}%`;
			}
			frame = requestAnimationFrame(draw);
		});
		return () => cancelAnimationFrame(frame);
	}, [position, status]);

	const playing = status === "playing";
	return (
		<div className="rounded-xl border border-[var(--tq-line)] bg-[var(--tq-panel)] overflow-hidden">
			<div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-[var(--tq-line)]">
				<button
					type="button"
					onClick={toggle}
					disabled={status === "loading"}
					aria-label={playing ? t("mixer.pause") : t("mixer.play")}
					className="tq-button !p-0 h-11 w-11 shrink-0 disabled:opacity-60"
				>
					<svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
						{playing ? (
							<path d="M3 2h4v12H3zM9 2h4v12H9z" />
						) : (
							<path d="M4 2l10 6-10 6z" />
						)}
					</svg>
				</button>
				<p className="text-sm text-[var(--tq-muted)]" aria-live="polite">
					{status === "loading"
						? t("mixer.loading")
						: status === "error"
							? t("mixer.error")
							: null}
				</p>
				<p className="ml-auto text-sm font-mono text-[var(--tq-muted)]">{t("mixer.key")}</p>
			</div>
			<div className="relative">
				{STEMS.map((stem, index) => {
					const audible = anySolo ? soloed[stem.id] : !muted[stem.id];
					return (
						<div
							key={stem.id}
							className="flex items-stretch border-b border-[var(--tq-line)] last:border-b-0"
						>
							<div className="flex items-center gap-1.5 w-[9.75rem] sm:w-44 shrink-0 px-3 py-2 border-r border-[var(--tq-line)]">
								<span
									className="h-6 w-1 rounded-full shrink-0"
									style={{ background: stem.color }}
								/>
								<span className="text-sm font-semibold flex-1 truncate">
									{stem.name}
								</span>
								<ToggleButton
									label="M"
									title={t("mixer.mute", { name: stem.name })}
									pressed={!!muted[stem.id]}
									onClick={() => toggleMute(stem.id)}
									color="#ec8a3f"
								/>
								<ToggleButton
									label="S"
									title={t("mixer.solo", { name: stem.name })}
									pressed={!!soloed[stem.id]}
									onClick={() => toggleSolo(stem.id)}
									color="#e8b33c"
								/>
							</div>
							<div className="relative flex-1 h-14 min-w-0">
								<svg
									viewBox="0 0 319 100"
									preserveAspectRatio="none"
									aria-hidden="true"
									className="absolute inset-0 h-full w-full transition-opacity duration-150"
									style={{ opacity: audible ? 1 : 0.2 }}
								>
									<path d={paths[index]} fill={stem.color} />
								</svg>
							</div>
						</div>
					);
				})}
				{status !== "idle" && (
					<div
						aria-hidden="true"
						className="absolute inset-y-0 right-0 left-[9.75rem] sm:left-44 pointer-events-none"
					>
						<div
							ref={playhead}
							className="absolute inset-y-0 w-0.5 bg-white"
							style={{ left: 0 }}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
