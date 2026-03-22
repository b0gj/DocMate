import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlotBooking } from "@/components/SlotBooking";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseAuth = vi.fn();
vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

const sampleSlots = [
  { _id: "s1", dateTime: "2025-04-01T09:00:00", durationMinutes: 30 },
  { _id: "s2", dateTime: "2025-04-01T09:30:00", durationMinutes: 30 },
  { _id: "s3", dateTime: "2025-04-02T10:00:00", durationMinutes: 30 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: "u1", name: "Test", email: "t@t.com", role: "patient" } });
  global.fetch = vi.fn();
});

describe("SlotBooking", () => {
  it("should display empty message when no slots", () => {
    render(<SlotBooking slots={[]} doctorName="Doc" />);
    expect(screen.getByText("Няма свободни часове в момента.")).toBeInTheDocument();
  });

  it("should render slot time buttons", () => {
    render(<SlotBooking slots={sampleSlots} doctorName="Doc" />);
    // Should have 3 time buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("should show confirmation panel when a slot is clicked", async () => {
    const user = userEvent.setup();
    render(<SlotBooking slots={sampleSlots} doctorName="Д-р Иванова" />);
    // Click first time slot button
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(screen.getByText("Потвърждение на час")).toBeInTheDocument();
    expect(screen.getByText("Д-р Иванова")).toBeInTheDocument();
  });

  it("should deselect when same slot is clicked again", async () => {
    const user = userEvent.setup();
    render(<SlotBooking slots={sampleSlots} doctorName="Doc" />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(screen.getByText("Потвърждение на час")).toBeInTheDocument();
    await user.click(buttons[0]);
    expect(screen.queryByText("Потвърждение на час")).not.toBeInTheDocument();
  });

  it("should redirect to /login when user is not authenticated", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const user = userEvent.setup();
    render(<SlotBooking slots={sampleSlots} doctorName="Doc" />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    // Click the book button
    const bookButton = screen.getByText("Влезте, за да запазите");
    await user.click(bookButton);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("should call POST /api/bookings on submit", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ booking: { _id: "b1" } }),
    });

    const user = userEvent.setup();
    render(<SlotBooking slots={sampleSlots} doctorName="Doc" />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    const bookButton = screen.getByText("Запази час");
    await user.click(bookButton);

    expect(global.fetch).toHaveBeenCalledWith("/api/bookings", expect.objectContaining({
      method: "POST",
    }));
  });

  it("should show success message after successful booking", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ booking: { _id: "b1" } }),
    });

    const user = userEvent.setup();
    render(<SlotBooking slots={sampleSlots} doctorName="Doc" />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    const bookButton = screen.getByText("Запази час");
    await user.click(bookButton);

    expect(screen.getByText("Часът е запазен успешно!")).toBeInTheDocument();
  });

  it("should show error message on API failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Този час вече е зает." }),
    });

    const user = userEvent.setup();
    render(<SlotBooking slots={sampleSlots} doctorName="Doc" />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    const bookButton = screen.getByText("Запази час");
    await user.click(bookButton);

    expect(screen.getByText("Този час вече е зает.")).toBeInTheDocument();
  });

  it("should update notes on input", async () => {
    const user = userEvent.setup();
    render(<SlotBooking slots={sampleSlots} doctorName="Doc" />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    const notesInput = screen.getByPlaceholderText(/Опишете накратко/);
    await user.type(notesInput, "Главоболие");
    expect(notesInput).toHaveValue("Главоболие");
  });
});
