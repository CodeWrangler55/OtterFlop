import type { UnlockReward } from "../../game/bedtime";

export function RewardBanner({
  reward,
  onDismiss
}: {
  reward: UnlockReward;
  onDismiss: () => void;
}) {
  const message =
    reward.kind === "kid"
      ? `${reward.displayName} joined the bedtime family.`
      : `${reward.displayName} is ready for dress-up time.`;

  return (
    <div className="reward-banner" role="status">
      <div>
        <p className="kicker">{reward.source === "spin" ? "Spin surprise" : "Bedtime surprise"}</p>
        <strong>{message}</strong>
      </div>
      <button type="button" className="secondary-button" onClick={onDismiss}>
        Hide
      </button>
    </div>
  );
}
