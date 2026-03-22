import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "@/components/Pagination";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Pagination", () => {
  it("should return null when totalPages <= 1", () => {
    const { container } = render(<Pagination page={1} totalPages={1} total={5} />);
    expect(container.innerHTML).toBe("");
  });

  it("should render total count text", () => {
    render(<Pagination page={1} totalPages={3} total={25} />);
    expect(screen.getByText(/25 лекари намерени/)).toBeInTheDocument();
  });

  it("should render singular form for 1 doctor", () => {
    render(<Pagination page={1} totalPages={2} total={1} />);
    expect(screen.getByText(/1 лекар намерен$/)).toBeInTheDocument();
  });

  it("should disable previous button on first page", () => {
    render(<Pagination page={1} totalPages={3} total={25} />);
    const prevButton = screen.getByLabelText("Предишна страница");
    expect(prevButton).toBeDisabled();
  });

  it("should disable next button on last page", () => {
    render(<Pagination page={3} totalPages={3} total={25} />);
    const nextButton = screen.getByLabelText("Следваща страница");
    expect(nextButton).toBeDisabled();
  });

  it("should render page buttons", () => {
    render(<Pagination page={3} totalPages={5} total={50} />);
    // page-2 to page+2 = pages 1,2,3,4,5
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should call router.push with updated page param on click", async () => {
    const user = userEvent.setup();
    render(<Pagination page={1} totalPages={3} total={25} />);
    const nextButton = screen.getByLabelText("Следваща страница");
    await user.click(nextButton);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });
});
