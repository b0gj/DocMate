import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DoctorCard from "@/components/DoctorCard";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const sampleDoctor = {
  _id: "doc123",
  name: "Д-р Мария Иванова",
  specialty: "Кардиолог",
  city: "София",
  hospital: "УМБАЛ Александровска",
  price: 80,
  rating: 4.5,
};

describe("DoctorCard", () => {
  it("should render doctor name", () => {
    render(<DoctorCard doctor={sampleDoctor} />);
    expect(screen.getByText("Д-р Мария Иванова")).toBeInTheDocument();
  });

  it("should render doctor specialty", () => {
    render(<DoctorCard doctor={sampleDoctor} />);
    expect(screen.getByText("Кардиолог")).toBeInTheDocument();
  });

  it("should render hospital and city", () => {
    render(<DoctorCard doctor={sampleDoctor} />);
    expect(screen.getByText("УМБАЛ Александровска, София")).toBeInTheDocument();
  });

  it("should render price with лв. suffix", () => {
    render(<DoctorCard doctor={sampleDoctor} />);
    expect(screen.getByText("80 лв.")).toBeInTheDocument();
  });

  it("should render rating with one decimal", () => {
    render(<DoctorCard doctor={sampleDoctor} />);
    expect(screen.getByText("★ 4.5")).toBeInTheDocument();
  });

  it("should link to /doctors/:id", () => {
    render(<DoctorCard doctor={sampleDoctor} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/doctors/doc123");
  });

  it("should display next available slot when present", () => {
    const doctor = { ...sampleDoctor, nextAvailableSlot: "2025-04-01T10:00:00" };
    render(<DoctorCard doctor={doctor} />);
    expect(screen.getByText(/Свободен:/)).toBeInTheDocument();
  });

  it("should display 'Няма свободни часове' when no next slot", () => {
    const doctor = { ...sampleDoctor, nextAvailableSlot: null };
    render(<DoctorCard doctor={doctor} />);
    expect(screen.getByText("Няма свободни часове")).toBeInTheDocument();
  });
});
