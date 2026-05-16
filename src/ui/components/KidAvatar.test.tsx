import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KidAvatar } from "./KidAvatar";

describe("KidAvatar", () => {
  it("renders the kid art as the primary visible image", () => {
    render(<KidAvatar kidId="kid-pip" outfitId="outfit-pajamas-moon" label="Pip" />);

    const kidImage = screen.getByRole("img", { name: "Pip" });
    expect(kidImage).toHaveClass("avatar-base");
    expect(kidImage.getAttribute("src")).toContain("kid-pip.png");
  });

  it("renders outfit art as a separate overlay chip instead of covering the kid", () => {
    const { container } = render(
      <KidAvatar kidId="kid-pip" outfitId="outfit-pajamas-moon" label="Pip" size="large" />
    );

    const outfitChip = container.querySelector(".avatar-outfit-chip");
    const outfitImage = outfitChip?.querySelector(".avatar-overlay");

    expect(outfitChip).not.toBeNull();
    expect(outfitImage?.getAttribute("src")).toContain("outfit-pajamas-moon.png");
    expect(container.querySelector(".avatar-stack-large")).not.toBeNull();
  });
});
