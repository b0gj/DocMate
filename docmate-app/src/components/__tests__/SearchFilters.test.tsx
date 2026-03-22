import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchFilters from "@/components/SearchFilters";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("SearchFilters", () => {
  it("should render search input", () => {
    render(<SearchFilters />);
    expect(screen.getByLabelText("Търсене")).toBeInTheDocument();
  });

  it("should render specialty dropdown", () => {
    render(<SearchFilters />);
    expect(screen.getByLabelText("Специалност")).toBeInTheDocument();
    expect(screen.getByText("Кардиолог")).toBeInTheDocument();
    expect(screen.getByText("Невролог")).toBeInTheDocument();
  });

  it("should render city dropdown", () => {
    render(<SearchFilters />);
    expect(screen.getByLabelText("Град")).toBeInTheDocument();
    expect(screen.getByText("София")).toBeInTheDocument();
    expect(screen.getByText("Пловдив")).toBeInTheDocument();
  });

  it("should render sort dropdown", () => {
    render(<SearchFilters />);
    expect(screen.getByLabelText("Сортиране")).toBeInTheDocument();
    expect(screen.getByText("Рейтинг (↓)")).toBeInTheDocument();
  });

  it("should render maxPrice dropdown", () => {
    render(<SearchFilters />);
    expect(screen.getByLabelText("Максимална цена")).toBeInTheDocument();
    expect(screen.getByText("До 50 лв.")).toBeInTheDocument();
  });

  it("should submit search form", async () => {
    const user = userEvent.setup();
    render(<SearchFilters />);
    const input = screen.getByLabelText("Търсене");
    await user.type(input, "Кардио");
    const submitButton = screen.getByText("Търси");
    await user.click(submitButton);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("search="));
  });

  it("should not show clear button when no filters active", () => {
    render(<SearchFilters />);
    expect(screen.queryByText("Изчисти филтрите")).not.toBeInTheDocument();
  });

  it("should update specialty filter on change", async () => {
    const user = userEvent.setup();
    render(<SearchFilters />);
    const specialtySelect = screen.getByLabelText("Специалност");
    await user.selectOptions(specialtySelect, "Кардиолог");
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("specialty="));
  });
});
